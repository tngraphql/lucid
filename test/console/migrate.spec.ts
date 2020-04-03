/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 3/24/2020
 * Time: 9:21 AM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { Filesystem } from '@poppinss/dev-utils/build'
import { join } from 'path'
import { Application, ConsoleKernel } from '@tngraphql/illuminate'
import { cleanup, getDb, setup } from '../../test-helpers'
import { ResetCommand } from '../../console/migration/ResetCommand'
import { RunCommand } from '../../console/migration/RunCommand'
import { RollbackCommand } from '../../console/migration/RollbackCommand'
import { FreshCommand } from '../../console/migration/FreshCommand'
import { Kernel } from '@tngraphql/console'
import { SeedCommand } from '../../console/seed/SeedCommand'
import { Facade } from '@tngraphql/illuminate/dist/Support/Facade'
import { RefreshCommand } from '../../console/migration/RefreshCommand'
import { StatusCommand } from '../../console/migration/StatusCommand'

let db: ReturnType<typeof getDb>
const fs = new Filesystem(join(__dirname, 'app'))

test.group('Migrate | Fresh', group => {
  group.beforeEach(async () => {
    await setup()
    db = getDb()
  })
  group.afterEach(async () => {
    await fs.cleanup()
    await db.manager.closeAll()
    await cleanup()
    await cleanup(['adonis_schema', 'schema_users', 'schema_users2', 'schema_accounts'])
  })
  test('Reset and re-run all migrations', async (assert) => {
    await fs.add('database/migrations/users.ts', `
import { Schema } from '../../../../../src/Schema'

module.exports = class User extends Schema {
  public async up () {
    this.schema.createTable('schema_users', (table) => {
      table.increments()
    })
  }

  public async down () {
    this.schema.dropTable('schema_users')
  }
}
`)

    const app = new Application(fs.basePath)
    app.singleton('db', () => db)
    app.environment = 'test'
    const kernel: any = await app.make<ConsoleKernel>(ConsoleKernel)

    const migrate = new RunCommand(app, kernel.getAce(), db)
    migrate.keepAlive = true
    await migrate.handle()

    await fs.add('database/migrations/users2.ts', `
import { Schema } from '../../../../../src/Schema'
module.exports = class User2 extends Schema {
  public async up () {
    this.schema.createTable('schema_users2', (table) => {
      table.increments()
    })
  }
  public async down () {
    this.schema.dropTable('schema_users2')
  }
}
`)
    await migrate.handle()

    kernel.registerCommand([ResetCommand, RunCommand, RollbackCommand])

    const refresh: FreshCommand = new FreshCommand(app, kernel.getAce())

    await refresh.handle()

    db = getDb()

    const migrated = await db.connection().from('adonis_schema').select('*')
    assert.equal(migrated[0].batch, 1)
    assert.equal(migrated[1].batch, 1)
  })
})

test.group('Migrate', (group) => {
  group.beforeEach(async () => {
    await setup()
    db = getDb()
  })

  group.afterEach(async () => {
    await fs.cleanup()
    await db.manager.closeAll(true)
    await cleanup()
    await cleanup(['adonis_schema', 'schema_users', 'schema_accounts'])
  })

  test('run migrations from default directory', async (assert) => {
    await fs.add('database/migrations/users.ts', `
import { Schema } from '../../../../../src/Schema'

module.exports = class User extends Schema {
  public async up () {
    this.schema.createTable('schema_users', (table) => {
      table.increments()
    })
  }
}
`)

    const app = new Application(fs.basePath)
    const migrate = new RunCommand(app, new Kernel(app), db)

    await migrate.handle()
    db = getDb()

    const migrated = await db.connection().from('adonis_schema').select('*')
    const hasUsersTable = await db.connection().schema.hasTable('schema_users')

    assert.lengthOf(migrated, 1)
    assert.isTrue(hasUsersTable)
    assert.equal(migrated[0].name.replace(/\\/g, '/'), 'database/migrations/users')
    assert.equal(migrated[0].batch, 1)
  })

  test('skip migrations when already upto date', async (assert) => {
    await fs.fsExtra.ensureDir(join(fs.basePath, 'database/migrations'))

    const app = new Application(fs.basePath)
    const migrate = new RunCommand(app, new Kernel(app), db)

    await migrate.handle()

    db = getDb()
    const migrated = await db.connection().from('adonis_schema').select('*')
    assert.lengthOf(migrated, 0)
  })

  test('print sql queries in dryRun', async (assert) => {
    await fs.add('database/migrations/users.ts', `
import { Schema } from '../../../../../src/Schema'
module.exports = class User extends Schema {
public async up () {
  this.schema.createTable('schema_users', (table) => {
    table.increments()
  })
}
}
`)

    const app = new Application(fs.basePath)
    const migrate = new RunCommand(app, new Kernel(app), db)
    migrate.dryRun = true

    await migrate.handle()

    db = getDb()
    const migrated = await db.connection().from('adonis_schema').select('*')
    assert.lengthOf(migrated, 0)
  })

  test('prompt during migrations in production without force flag', async (assert) => {
    assert.plan(1)

    await fs.add('database/migrations/users.ts', `
import { Schema } from '../../../../../src/Schema'
module.exports = class User extends Schema {
public async up () {
  this.schema.createTable('schema_users', (table) => {
    table.increments()
  })
}
}
`)

    const app: any = new Application(fs.basePath)
    app.inProduction = true
    app.environment = 'test'

    const migrate = new RunCommand(app, new Kernel(app), db)
    migrate.prompt.on('prompt', (prompt) => {
      assert.equal(prompt.message, 'You are in production environment. Want to continue running migrations?')
      prompt.accept()
    })
    await migrate.handle()
  })

  test('prompt during migrations in seed without force flag', async (assert) => {
    assert.plan(2)

    await fs.add('database/migrations/users.ts', `
import { Schema } from '../../../../../src/Schema'

module.exports = class User extends Schema {
  public async up () {
    this.schema.createTable('schema_users', (table) => {
      table.increments()
    })
  }
}
`)
    await fs.add('database/seeds/UserSeeder.ts', `
import { Facade } from '@tngraphql/illuminate/dist/Support/Facade'
import { DBFactory } from '../../../../../src/Factory/DBFactory'

const Factory: DBFactory = Facade.create('factory')

Factory.blueprint('factory', () => {
  return {
    name: 'username43254',
  }
})

export class UserSeeder {
  public async run () {
    Factory.get('factory').create({
      name: 'nguyenpl117',
    })
  }
}
`)

    const app: any = new Application(fs.basePath)
    app.inProduction = true
    app.environment = 'test'
    const kernel = new Kernel(app)
    kernel.register([SeedCommand as any])

    app.singleton('db', () => db)

    app.singleton('factory', () => {
      const { DBFactory } = require('../../src/Factory/DBFactory')
      return new DBFactory(app)
    })

    Facade.setFacadeApplication(app)

    const migrate = new RunCommand(app, kernel, db)
    migrate.prompt.on('prompt', (prompt) => {
      assert.equal(prompt.message, 'You are in production environment. Want to continue running migrations?')
      prompt.accept()
    })
    migrate.seed = true
    // migrate.keepAlive = true;
    await migrate.handle()
    db = getDb()

    const migrated = await db.connection().from('factory').where('name', 'username43254').select('*')
    assert.lengthOf(migrated, 1)
  }).timeout(6000)

  test('prompt during migrations in keepAlive without force flag', async (assert) => {
    assert.plan(2)

    await fs.add('database/migrations/users.ts', `
import { Schema } from '../../../../../src/Schema'
module.exports = class User extends Schema {
public async up () {
  this.schema.createTable('schema_users', (table) => {
    table.increments()
  })
}
}
`)

    const app: any = new Application(fs.basePath)
    app.inProduction = true
    app.environment = 'test'

    const migrate = new RunCommand(app, new Kernel(app), db)
    migrate.keepAlive = true
    migrate.prompt.on('prompt', (prompt) => {
      assert.equal(prompt.message, 'You are in production environment. Want to continue running migrations?')
      prompt.accept()
    })
    await migrate.handle()
    assert.doesNotThrow(() => db.connection())
  })

  test('do not prompt during migration when force flag is defined', async () => {
    await fs.add('database/migrations/users.ts', `
import { Schema } from '../../../../../src/Schema'
module.exports = class User extends Schema {
public async up () {
  this.schema.createTable('schema_users', (table) => {
    table.increments()
  })
}
}
`)

    const app: any = new Application(fs.basePath)
    app.inProduction = true
    app.environment = 'test'

    const migrate = new RunCommand(app, new Kernel(app), db)
    migrate.force = true
    migrate.prompt.on('prompt', () => {
      throw new Error('Never expected to be here')
    })
    await migrate.handle()
  })

  test('prompt during rollback in production without force flag', async (assert) => {
    assert.plan(1)

    await fs.add('database/migrations/users.ts', `
import { Schema } from '../../../../../src/Schema'
module.exports = class User extends Schema {
 public async down () {
 }
}
`)

    const app: any = new Application(fs.basePath)
    app.inProduction = true
    app.environment = 'test'

    const rollback = new RollbackCommand(app, new Kernel(app), db)
    rollback.prompt.on('prompt', (prompt) => {
      assert.equal(prompt.message, 'You are in production environment. Want to continue running migrations?')
      prompt.accept()
    })
    await rollback.handle()
  })

  test('do not prompt during rollback in production when force flag is defined', async () => {
    await fs.add('database/migrations/users.ts', `
import { Schema } from '../../../../../src/Schema'
module.exports = class User extends Schema {
  public async down () {
  }
}
`)

    const app: any = new Application(fs.basePath)
    app.inProduction = true
    app.environment = 'test'

    const rollback = new RollbackCommand(app, new Kernel(app), db)
    rollback.force = true
    rollback.prompt.on('prompt', () => {
      throw new Error('Never expected to be here')
    })
    await rollback.handle()
  })
})

test.group('Migrate | Refresh', (group) => {
  group.beforeEach(async () => {
    await setup()
    db = getDb()
  })
  group.afterEach(async () => {
    await fs.cleanup()
    await db.manager.closeAll()
    await cleanup()
    await cleanup(['adonis_schema', 'schema_users', 'schema_users2', 'schema_accounts'])
  })
  test('Reset and re-run all migrations', async (assert) => {
    await fs.add('database/migrations/users.ts', `
import { Schema } from '../../../../../src/Schema'

module.exports = class User extends Schema {
  public async up () {
    this.schema.createTable('schema_users', (table) => {
      table.increments()
    })
  }
  public async down () {
    this.schema.dropTable('schema_users')
  }
}
`)

    const app = new Application(fs.basePath)
    app.singleton('db', () => db)
    app.environment = 'test'
    const kernel: any = await app.make<ConsoleKernel>(ConsoleKernel)

    const migrate = new RunCommand(app, kernel.getAce(), db)
    migrate.keepAlive = true
    await migrate.handle()

    await fs.add('database/migrations/users2.ts', `
import { Schema } from '../../../../../src/Schema'

module.exports = class User2 extends Schema {
  public async up () {
    this.schema.createTable('schema_users2', (table) => {
      table.increments()
    })
  }
  public async down () {
    this.schema.dropTable('schema_users2')
  }
}
`)
    await migrate.handle()

    kernel.registerCommand([RunCommand, ResetCommand, RollbackCommand])

    const refresh: RefreshCommand = new RefreshCommand(app, kernel.getAce())

    await refresh.handle()
    db = getDb()

    const migrated = await db.connection().from('adonis_schema').select('*')
    await db.manager.closeAll()
    assert.equal(migrated[0].batch, 1)
    assert.equal(migrated[1].batch, 1)
  })
})

test.group('Migrate | Reset', (group) => {
  group.beforeEach(async () => {
    await setup()
    db = getDb()
  })
  group.afterEach(async () => {
    await fs.cleanup()
    await cleanup()
    await cleanup(['adonis_schema', 'schema_users', 'schema_users2', 'schema_accounts'])
  })
  test('Rollback all database migrations', async (assert) => {
    await fs.add('database/migrations/users.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class User extends Schema {
        public async up () {
          this.schema.createTable('schema_users', (table) => {
            table.increments()
          })
        }
        public async down () {
        this.schema.dropTable('schema_users')
    }
      }
    `)

    const app = new Application(fs.basePath)
    app.singleton('db', () => db)
    app.environment = 'test'
    const kernel: any = await app.make<ConsoleKernel>(ConsoleKernel)

    const migrate = new RunCommand(app, kernel.getAce(), db)
    migrate.keepAlive = true
    await migrate.handle()

    await fs.add('database/migrations/users2.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class User2 extends Schema {
        public async up () {
          this.schema.createTable('schema_users2', (table) => {
            table.increments()
          })
        }
        public async down () {
        this.schema.dropTable('schema_users2')
    }
      }
    `)
    await migrate.handle()

    kernel.registerCommand([RollbackCommand])

    const reset = new ResetCommand(app, kernel.getAce())

    // reset.keepAlive = true;

    await reset.handle()

    db = getDb()
    const migrated = await db.connection().from('adonis_schema').select('*')
    await db.manager.closeAll()
    assert.lengthOf(migrated, 0)
  })
})

test.group('Migrate | Rollback', (group) => {
  group.beforeEach(async () => {
    await setup()
    db = getDb()
  })
  group.afterEach(async () => {
    await fs.cleanup()
    await db.manager.closeAll()
    await cleanup()
    await cleanup(['adonis_schema', 'schema_users', 'schema_users2', 'schema_accounts'])
  })

  test('Rollback all database migrations', async (assert) => {
    await fs.add('database/migrations/users.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class User extends Schema {
        public async up () {
          this.schema.createTable('schema_users', (table) => {
            table.increments()
          })
        }
        public async down () {
        this.schema.dropTable('schema_users')
    }
      }
    `)

    const app = new Application(fs.basePath)
    app.singleton('db', () => db)
    app.environment = 'test'
    const kernel: ConsoleKernel = await app.make<ConsoleKernel>(ConsoleKernel)

    const migrate = new RunCommand(app, kernel.getAce(), db)
    migrate.keepAlive = true
    await migrate.handle()

    await fs.add('database/migrations/users2.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class User2 extends Schema {
        public async up () {
          this.schema.createTable('schema_users2', (table) => {
            table.increments()
          })
        }
        public async down () {
        this.schema.dropTable('schema_users2')
    }
      }
    `)
    await migrate.handle()

    const reset = new RollbackCommand(app, kernel.getAce(), db)

    reset.keepAlive = true

    reset.batch = 1

    await reset.handle()

    const migrated = await db.connection().from('adonis_schema').select('*')
    await db.manager.closeAll()
    assert.lengthOf(migrated, 1)
  })
})

test.group('Migration | Status', (group) => {
  group.beforeEach(async () => {
    await setup()
    db = getDb()
  })

  group.afterEach(async () => {
    await fs.cleanup()
    await db.manager.closeAll()
    await cleanup()
    await cleanup(['adonis_schema', 'schema_users', 'schema_accounts'])
  })
  test('list migrations current status', async (assert) => {
    await fs.add('database/migrations/users.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class User extends Schema {
        public async up () {
          this.schema.createTable('schema_users', (table) => {
            table.increments()
          })
        }
      }
    `)

    const app = new Application(fs.basePath)
    app.environment = 'test'
    const kernel: any = await app.make<ConsoleKernel>(ConsoleKernel)

    const migrate = new RunCommand(app, kernel.getAce(), db)
    migrate.keepAlive = true
    await migrate.handle()

    await fs.add('database/migrations/users2.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class User2 extends Schema {

      }
    `)

    const status: StatusCommand = new StatusCommand(app, kernel.getAce(), db)

    status.json = true
    await status.handle()

    const log = JSON.parse(status.logger.logs[0])

    assert.equal(log[0].name.replace(/\\/g, '/'), 'database/migrations/users')
    assert.equal(log[0].status, 'migrated')
    assert.equal(log[1].name.replace(/\\/g, '/'), ('database/migrations/users2'))
    assert.equal(log[1].status, 'pending')
  })
})

