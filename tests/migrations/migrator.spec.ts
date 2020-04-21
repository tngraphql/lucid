/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 8:45 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Filesystem } from '@poppinss/dev-utils/build';
import { Application } from '@tngraphql/illuminate';
import { join } from "path";
import { cleanup, getDb, getMigrator, resetTables, setup } from '../helpers';

let db: ReturnType<typeof getDb>
const fs = new Filesystem(join(__dirname, 'app'))

describe('Migrator', () => {
    beforeAll(async () => {
        db = getDb()
        await setup()
    })

    afterAll(async () => {
        await cleanup()
        await db.manager.closeAll()
    })

    afterEach(async () => {
        await resetTables()
        await cleanup(['tngraphql_schema', 'schema_users', 'schema_accounts'])
        await fs.cleanup();
        jest.resetModules();
    })

    test('create the schema table when there are no migrations', async () => {
        const app = new Application(fs.basePath)
        await fs.fsExtra.ensureDir(join(fs.basePath, 'database/migrations'))

        const migrator = getMigrator(db, app, {
            direction: 'up',
            connectionName: 'primary',
        })

        await migrator.run()
        const hasSchemaTable = await db.connection().schema.hasTable('tngraphql_schema')
        expect(hasSchemaTable).toBeTruthy()
        expect(migrator.migratedFiles).toEqual({})
        expect(migrator.status).toBe('skipped')
    })

    test('migrate database using schema files', async () => {
        const app = new Application(fs.basePath)

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

        const migrator = getMigrator(db, app, {
            direction: 'up',
            connectionName: 'primary',
        })

        await migrator.run()

        const migrated = await db.connection().from('tngraphql_schema').select('*')
        const hasUsersTable = await db.connection().schema.hasTable('schema_users')
        const migratedFiles = Object.keys(migrator.migratedFiles).map((file) => {
            return {
                status: migrator.migratedFiles[file].status,
                file: file,
                queries: migrator.migratedFiles[file].queries,
            }
        })

        expect(migrated).toHaveLength(1)
        expect(migrated[0].name).toBe(join('database/migrations/users'))
        expect(migrated[0].batch).toBe(1)
        expect(hasUsersTable).toBeTruthy()
        expect(migratedFiles).toEqual([{
            status: 'completed',
            file: join('database/migrations/users'),
            queries: [],
        }])
        expect(migrator.status).toBe('completed')
    })

    test('do not migrate when schema up action fails', async () => {
        expect.assertions(8)
        const app = new Application(fs.basePath)

        await fs.add('database/migrations/users.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class User extends Schema {
        public async up () {
          this.schema.createTable('schema_users', (table) => {
            table.increments()
            table['badMethod']('account_id')
          })
        }
      }
    `)

        await fs.add('database/migrations/accounts.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class Accounts extends Schema {
        public async up () {
          this.schema.createTable('schema_accounts', (table) => {
            table.increments()
          })
        }
      }
    `)

        const migrator = getMigrator(db, app, {
            direction: 'up',
            connectionName: 'primary',
        })

        await migrator.run()

        const migrated = await db.connection().from('tngraphql_schema').select('*')
        const hasUsersTable = await db.connection().schema.hasTable('schema_users')
        const hasAccountsTable = await db.connection().schema.hasTable('schema_accounts')
        const migratedFiles = Object.keys(migrator.migratedFiles).map((file) => {
            return {
                status: migrator.migratedFiles[file].status,
                file: file,
                queries: migrator.migratedFiles[file].queries,
            }
        })

        expect(migrated).toHaveLength(1)
        expect(migrated[0].name).toBe(join('database/migrations/accounts'))
        expect(migrated[0].batch).toBe(1)

        expect(hasUsersTable).toBeFalsy();
        expect(hasAccountsTable).toBeTruthy();
        expect(migratedFiles).toEqual([
            {
                status: 'completed',
                file: join('database/migrations/accounts'),
                queries: [],
            },
            {
                status: 'error',
                file: join('database/migrations/users'),
                queries: [],
            },
        ])

        expect(migrator.status).toBe('error')
        expect(migrator.error!.message).toBe('table.badMethod is not a function')
    })

    test('do not migrate when dryRun is true', async () => {
        const app = new Application(fs.basePath)

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

        await fs.add('database/migrations/accounts.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class Accounts extends Schema {
        public async up () {
          this.schema.createTable('schema_accounts', (table) => {
            table.increments()
          })
        }
      }
    `)

        const migrator = getMigrator(db, app, {
            direction: 'up',
            connectionName: 'primary',
            dryRun: true,
        })

        await migrator.run()

        const migrated = await db.connection().from('tngraphql_schema').select('*')
        const hasUsersTable = await db.connection().schema.hasTable('schema_users')
        const hasAccountsTable = await db.connection().schema.hasTable('schema_accounts')
        const migratedFiles = Object.keys(migrator.migratedFiles).map((file) => {
            return {
                status: migrator.migratedFiles[file].status,
                file: file,
                queries: migrator.migratedFiles[file].queries,
            }
        })

        expect(migrated).toHaveLength(0)
        expect(hasUsersTable).toBeFalsy();
        expect(hasAccountsTable).toBeFalsy();

        expect(migratedFiles).toEqual([
            {
                status: 'completed',
                file: join('database/migrations/accounts'),
                queries: [
                    db.connection().schema.createTable('schema_accounts', (table) => {
                        table.increments()
                    }).toQuery(),
                ],
            },
            {
                status: 'completed',
                file: join('database/migrations/users'),
                queries: [
                    db.connection().schema.createTable('schema_users', (table) => {
                        table.increments()
                    }).toQuery(),
                ],
            },
        ])

        expect(migrator.status).toBe('completed')
    })

    test('catch and report errors in dryRun', async () => {
        const app = new Application(fs.basePath)

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

        await fs.add('database/migrations/accounts.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class Accounts extends Schema {
        public async up () {
          this.schema.createTable('schema_accounts', (table) => {
            table.increments()
            table['badMethod']('account_id')
          })
        }
      }
    `)

        const migrator = getMigrator(db, app, {
            direction: 'up',
            connectionName: 'primary',
            dryRun: true,
        })

        await migrator.run()

        const migrated = await db.connection().from('tngraphql_schema').select('*')
        const hasUsersTable = await db.connection().schema.hasTable('schema_users')
        const hasAccountsTable = await db.connection().schema.hasTable('schema_accounts')
        const migratedFiles = Object.keys(migrator.migratedFiles).map((file) => {
            return {
                status: migrator.migratedFiles[file].status,
                file: file,
                queries: migrator.migratedFiles[file].queries,
            }
        })

        expect(migrated).toHaveLength(0)

        expect(hasUsersTable).toBeFalsy();
        expect(hasAccountsTable).toBeFalsy();

        expect(migratedFiles).toEqual([
            {
                status: 'error',
                file: join('database/migrations/accounts'),
                queries: [],
            },
            {
                status: 'pending',
                file: join('database/migrations/users'),
                queries: [],
            },
        ])

        expect(migrator.status).toBe('error')
    })

    test('do not migrate a schema file twice', async () => {
        const app = new Application(fs.basePath)

        await fs.add('database/migrations/accounts.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class Accounts extends Schema {
        public async up () {
          this.schema.createTable('schema_accounts', (table) => {
            table.increments()
          })
        }
      }
    `)

        const migrator = getMigrator(db, app, { direction: 'up', connectionName: 'primary' })
        await migrator.run()

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

        const migrator1 = getMigrator(db, app, { direction: 'up', connectionName: 'primary' })
        await migrator1.run()

        const migrator2 = getMigrator(db, app, { direction: 'up', connectionName: 'primary' })
        await migrator2.run()

        expect(migrator2.status).toBe('skipped')

        const migrated = await db.connection().from('tngraphql_schema').select('*')
        const hasUsersTable = await db.connection().schema.hasTable('schema_users')
        const hasAccountsTable = await db.connection().schema.hasTable('schema_accounts')

        expect(migrated).toHaveLength(2)
        expect(migrated[0].name).toBe(join('database/migrations/accounts'))
        expect(migrated[0].batch).toBe(1)

        expect(migrated[1].name).toBe(join('database/migrations/users'))
        expect(migrated[1].batch).toBe(2)

        expect(hasUsersTable).toBeTruthy()
        expect(hasAccountsTable).toBeTruthy()
    })

    test('rollback database using schema files to a given batch', async () => {
        const app = new Application(fs.basePath)

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

        const migrator = getMigrator(db, app, { direction: 'up', connectionName: 'primary' })
        await migrator.run()

        await fs.add('database/migrations/accounts.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class User extends Schema {
        public async up () {
          this.schema.createTable('schema_accounts', (table) => {
            table.increments()
          })
        }

        public async down () {
          this.schema.dropTable('schema_accounts')
        }
      }
    `)

        const migrator1 = getMigrator(db, app, { direction: 'up', connectionName: 'primary' })
        await migrator1.run()

        const migrator2 = getMigrator(db, app, { direction: 'down', batch: 1, connectionName: 'primary' })
        await migrator2.run()

        const migrated = await db.connection().from('tngraphql_schema').select('*')
        const hasUsersTable = await db.connection().schema.hasTable('schema_users')
        const hasAccountsTable = await db.connection().schema.hasTable('schema_accounts')
        const migratedFiles = Object.keys(migrator2.migratedFiles).map((file) => {
            return {
                status: migrator2.migratedFiles[file].status,
                file: file,
                queries: migrator2.migratedFiles[file].queries,
            }
        })

        expect(migrated).toHaveLength(1)
        expect(hasUsersTable).toBeTruthy()
        expect(hasAccountsTable).toBeFalsy()
        expect(migratedFiles).toEqual([{
            status: 'completed',
            file: join('database/migrations/accounts'),
            queries: [],
        }])
    })

    test('rollback database to the latest batch', async () => {
        const app = new Application(fs.basePath)

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

        const migrator = getMigrator(db, app, { direction: 'up', connectionName: 'primary' })
        await migrator.run()

        await fs.add('database/migrations/accounts.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class User extends Schema {
        public async up () {
          this.schema.createTable('schema_accounts', (table) => {
            table.increments()
          })
        }

        public async down () {
          this.schema.dropTable('schema_accounts')
        }
      }
    `)

        const migrator1 = getMigrator(db, app, { direction: 'up', connectionName: 'primary' })
        await migrator1.run()

        const migrator2 = getMigrator(db, app, { direction: 'down', connectionName: 'primary' })
        await migrator2.run()

        const migrated = await db.connection().from('tngraphql_schema').select('*')
        const hasUsersTable = await db.connection().schema.hasTable('schema_users')
        const hasAccountsTable = await db.connection().schema.hasTable('schema_accounts')
        const migratedFiles = Object.keys(migrator2.migratedFiles).map((file) => {
            return {
                status: migrator2.migratedFiles[file].status,
                file: file,
                queries: migrator2.migratedFiles[file].queries,
            }
        })

        expect(migrated).toHaveLength(1)
        expect(hasUsersTable).toBeTruthy()
        expect(hasAccountsTable).toBeFalsy()
        expect(migratedFiles).toEqual([{
            status: 'completed',
            file: join('database/migrations/accounts'),
            queries: [],
        }])
    })

    test('rollback all down to batch 0', async () => {
        const app = new Application(fs.basePath)

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

        const migrator = getMigrator(db, app, { direction: 'up', connectionName: 'primary' })
        await migrator.run()

        await fs.add('database/migrations/accounts.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class User extends Schema {
        public async up () {
          this.schema.createTable('schema_accounts', (table) => {
            table.increments()
          })
        }

        public async down () {
          this.schema.dropTable('schema_accounts')
        }
      }
    `)

        const migrator1 = getMigrator(db, app, { direction: 'up', connectionName: 'primary' })
        await migrator1.run()

        const migrator2 = getMigrator(db, app, { direction: 'down', batch: 0, connectionName: 'primary' })
        await migrator2.run()

        const migrated = await db.connection().from('tngraphql_schema').select('*')
        const hasUsersTable = await db.connection().schema.hasTable('schema_users')
        const hasAccountsTable = await db.connection().schema.hasTable('schema_accounts')
        const migratedFiles = Object.keys(migrator2.migratedFiles).map((file) => {
            return {
                status: migrator2.migratedFiles[file].status,
                file: file,
                queries: migrator2.migratedFiles[file].queries,
            }
        })

        expect(migrated).toHaveLength(0)
        expect(hasUsersTable).toBeFalsy()
        expect(hasAccountsTable).toBeFalsy()

        expect(migrator2.status).toBe('completed')
        expect(migratedFiles).toEqual([
            {
                status: 'completed',
                file: join('database/migrations/accounts'),
                queries: [],
            },
            {
                status: 'completed',
                file: join('database/migrations/users'),
                queries: [],
            },
        ])
    })

    test('rollback multiple times must be a noop', async () => {
        const app = new Application(fs.basePath)

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

        const migrator = getMigrator(db, app, { direction: 'up', connectionName: 'primary' })
        await migrator.run()

        await fs.add('database/migrations/accounts.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class User extends Schema {
        public async up () {
          this.schema.createTable('schema_accounts', (table) => {
            table.increments()
          })
        }

        public async down () {
          this.schema.dropTable('schema_accounts')
        }
      }
    `)

        const migrator1 = getMigrator(db, app, { direction: 'up', connectionName: 'primary' })
        await migrator1.run()

        const migrator2 = getMigrator(db, app, { direction: 'down', batch: 0, connectionName: 'primary' })
        await migrator2.run()

        const migrator3 = getMigrator(db, app, { direction: 'down', batch: 0, connectionName: 'primary' })
        await migrator3.run()

        const migrated = await db.connection().from('tngraphql_schema').select('*')
        const hasUsersTable = await db.connection().schema.hasTable('schema_users')
        const hasAccountsTable = await db.connection().schema.hasTable('schema_accounts')

        const migrator2Files = Object.keys(migrator2.migratedFiles).map((file) => {
            return {
                status: migrator2.migratedFiles[file].status,
                file: file,
                queries: migrator2.migratedFiles[file].queries,
            }
        })

        const migrator3Files = Object.keys(migrator3.migratedFiles).map((file) => {
            return {
                status: migrator3.migratedFiles[file].status,
                file: file,
                queries: migrator3.migratedFiles[file].queries,
            }
        })

        expect(migrated).toHaveLength(0)
        expect(hasUsersTable).toBeFalsy()
        expect(hasAccountsTable).toBeFalsy()

        expect(migrator2.status).toBe('completed')
        expect(migrator3.status).toBe('skipped')
        expect(migrator2Files).toEqual([
            {
                status: 'completed',
                file: join('database/migrations/accounts'),
                queries: [],
            },
            {
                status: 'completed',
                file: join('database/migrations/users'),
                queries: [],
            },
        ])
        expect(migrator3Files).toEqual([])
    })

    test('do not rollback in dryRun', async () => {
        const app = new Application(fs.basePath)

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

        const migrator = getMigrator(db, app, { direction: 'up', connectionName: 'primary' })
        await migrator.run()

        await fs.add('database/migrations/accounts.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class User extends Schema {
        public async up () {
          this.schema.createTable('schema_accounts', (table) => {
            table.increments()
          })
        }

        public async down () {
          this.schema.dropTable('schema_accounts')
        }
      }
    `)

        const migrator1 = getMigrator(db, app, { direction: 'up', connectionName: 'primary' })
        await migrator1.run()

        const migrator2 = getMigrator(db, app, {
            batch: 0,
            dryRun: true,
            direction: 'down',
            connectionName: 'primary',
        })
        await migrator2.run()

        const migrated = await db.connection().from('tngraphql_schema').select('*')
        const hasUsersTable = await db.connection().schema.hasTable('schema_users')
        const hasAccountsTable = await db.connection().schema.hasTable('schema_accounts')
        const migrator2Files = Object.keys(migrator2.migratedFiles).map((file) => {
            return {
                status: migrator2.migratedFiles[file].status,
                file: file,
                queries: migrator2.migratedFiles[file].queries,
            }
        })

        expect(migrated).toHaveLength(2)
        expect(hasUsersTable).toBeTruthy()
        expect(hasAccountsTable).toBeTruthy()

        expect(migrator2.status).toBe('completed')
        expect(migrator2Files).toEqual([
            {
                status: 'completed',
                file: join('database/migrations/accounts'),
                queries: [
                    db.connection().schema.dropTable('schema_accounts').toQuery(),
                ],
            },
            {
                status: 'completed',
                file: join('database/migrations/users'),
                queries: [
                    db.connection().schema.dropTable('schema_users').toQuery(),
                ],
            },
        ])
    })

    test('do not rollback when a schema file goes missing', async () => {
        expect.assertions(4)
        const app = new Application(fs.basePath)

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

        await fs.add('database/migrations/accounts.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class User extends Schema {
        public async up () {
          this.schema.createTable('schema_accounts', (table) => {
            table.increments()
          })
        }

        public async down () {
          this.schema.dropTable('schema_accounts')
        }
      }
    `)

        const migrator = getMigrator(db, app, { direction: 'up', connectionName: 'primary' })
        await migrator.run()

        await fs.remove('database/migrations/accounts.ts')

        const migrator1 = getMigrator(db, app, {
            batch: 0,
            direction: 'down',
            connectionName: 'primary',
        })

        await migrator1.run()

        const migrated = await db.connection().from('tngraphql_schema').select('*')
        const hasUsersTable = await db.connection().schema.hasTable('schema_users')
        const hasAccountsTable = await db.connection().schema.hasTable('schema_accounts')

        expect(migrated).toHaveLength(2)
        expect(hasUsersTable).toBeTruthy()
        expect(hasAccountsTable).toBeTruthy()
        expect(migrator1.error!.message).toBe(            `E_MISSING_SCHEMA_FILES: Cannot perform rollback. Schema file {${join('database/migrations/accounts')}} is missing`,)
    })

    test('get list of migrated files', async () => {
        const app = new Application(fs.basePath)

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

        await fs.add('database/migrations/accounts.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class User extends Schema {
        public async up () {
          this.schema.createTable('schema_accounts', (table) => {
            table.increments()
          })
        }

        public async down () {
          this.schema.dropTable('schema_accounts')
        }
      }
    `)

        const migrator = getMigrator(db, app, { direction: 'up', connectionName: 'primary' })
        await migrator.run()
        const files = await migrator.getList()

        expect(files).toHaveLength(2)
        expect(files[0].name).toBe(join('database/migrations/accounts'))
        expect(files[0].batch).toBe(1)

        expect(files[1].name).toBe(join('database/migrations/users'))
        expect(files[1].batch).toBe(1)
    })

    test('skip upcoming migrations after failure', async () => {
        const app = new Application(fs.basePath)

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

        await fs.add('database/migrations/accounts.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class Accounts extends Schema {
        public async up () {
          this.schema.createTable('schema_accounts', (table) => {
            table.increments()
            table['badMethod']('account_id')
          })
        }
      }
    `)

        const migrator = getMigrator(db, app, {
            direction: 'up',
            connectionName: 'primary',
        })

        try {
            await migrator.run()
        } catch (error) {
            expect(error).toBeDefined();
        }

        const migrated = await db.connection().from('tngraphql_schema').select('*')
        const hasUsersTable = await db.connection().schema.hasTable('schema_users')
        const hasAccountsTable = await db.connection().schema.hasTable('schema_accounts')
        const migratedFiles = Object.keys(migrator.migratedFiles).map((file) => {
            return {
                status: migrator.migratedFiles[file].status,
                file: file,
                queries: migrator.migratedFiles[file].queries,
            }
        })

        expect(migrated).toHaveLength(0)
        expect(hasUsersTable).toBeFalsy();
        expect(hasAccountsTable).toBeFalsy();
        expect(migratedFiles).toEqual([
            {
                status: 'error',
                file: join('database/migrations/accounts'),
                queries: [],
            },
            {
                status: 'pending',
                file: join('database/migrations/users'),
                queries: [],
            },
        ])

        expect(migrator.status).toBe('error')
    })

    test('raise exception when rollbacks in production are disabled', async () => {
        const app = new Application(fs.basePath)
        app.inProduction = true
        const originalConfig = Object.assign({}, db.getRawConnection('primary')!.config)

        db.getRawConnection('primary')!.config.migrations = {
            disableRollbacksInProduction: true,
        }

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

        const migrator = getMigrator(db, app, { direction: 'up', connectionName: 'primary' })
        await migrator.run()

        await fs.add('database/migrations/accounts.ts', `
      import { Schema } from '../../../../../src/Schema'
      module.exports = class User extends Schema {
        public async up () {
          this.schema.createTable('schema_accounts', (table) => {
            table.increments()
          })
        }

        public async down () {
          this.schema.dropTable('schema_accounts')
        }
      }
    `)

        const migrator1 = getMigrator(db, app, { direction: 'up', connectionName: 'primary' })
        await migrator1.run()

        const migrator2 = getMigrator(db, app, { direction: 'down', connectionName: 'primary' })
        await migrator2.run()

        expect(
            migrator2.error!.message).toBe(            'Rollback in production environment is disabled. Check "config/database" file for options.',
        )

        const migrated = await db.connection().from('tngraphql_schema').select('*')
        const hasUsersTable = await db.connection().schema.hasTable('schema_users')
        const hasAccountsTable = await db.connection().schema.hasTable('schema_accounts')

        expect(migrated).toHaveLength(2)
        expect(hasUsersTable).toBeTruthy()
        expect(hasAccountsTable).toBeTruthy()
        db.getRawConnection('primary')!.config = originalConfig
    })
});
