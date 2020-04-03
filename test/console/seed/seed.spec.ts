/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 3/22/2020
 * Time: 10:02 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import test from 'japa'
import { Kernel } from 'tn-console'
import { Filesystem } from '@poppinss/dev-utils/build'
import { join } from 'path'
import { cleanup, getDb, setup } from '../../../test-helpers'
import { Application } from 'tn-illuminate'
import { Facade } from 'tn-illuminate/dist/Support/Facade'
import { SeedCommand } from '../../../console/seed/SeedCommand'

let db: ReturnType<typeof getDb>
const fs = new Filesystem(join(__dirname, 'app'))

test.group('Seed', (group) => {
  group.beforeEach(async () => {
    await setup()
    db = getDb()
  })
  group.afterEach(async () => {
    await fs.cleanup()
    await cleanup()
    await db.manager.closeAll()
  })

  test('Seed database using seed files', async (assert) => {
    await fs.add('database/seeds/UserSeeder.ts', `
import { Facade } from 'tn-illuminate/dist/Support/Facade'
import { DBFactory } from '../../../../../../src/Factory/DBFactory'

const Factory: DBFactory = Facade.create('factory')

Factory.blueprint('factory', () => {
  return {
    name: 'username',
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

    const app = new Application(fs.basePath)
    app.inProduction = false
    app.environment = 'test'
    const kernel = new Kernel(app)

    app.singleton('db', () => db)

    app.singleton('factory', () => {
      const { DBFactory } = require('../../../src/Factory/DBFactory')
      return new DBFactory(app)
    })

    Facade.setFacadeApplication(app)

    const seed = new SeedCommand(app, kernel)
    await seed.handle()
    db = getDb()

    const seeded = await db.connection().from('factory').select('*')

    assert.lengthOf(seeded, 1)
  })

  test('Seed database using Factory files', async (assert) => {
    await fs.add('database/factories/UserFactory.ts',`
import { Facade } from 'tn-illuminate/dist/Support/Facade'
import { DBFactory } from '../../../../../../src/Factory/DBFactory'

const Factory: DBFactory = Facade.create('factory')

Factory.blueprint('factory', () => {
  return {
    name: 'username',
  }
})
    `)
    await fs.add('database/seeds/UserSeeder.ts', `
import { Facade } from 'tn-illuminate/dist/Support/Facade'
import { DBFactory } from '../../../../../../src/Factory/DBFactory'

const Factory: DBFactory = Facade.create('factory')

export class UserSeeder {
  public async run () {
    Factory.get('factory').create({
      name: 'nguyenpl117',
    })
  }
}
    `)

    const app = new Application(fs.basePath)
    app.inProduction = false
    app.environment = 'test'
    const kernel = new Kernel(app)

    app.singleton('db', () => db)

    app.singleton('factory', () => {
      const { DBFactory } = require('../../../src/Factory/DBFactory')
      return new DBFactory(app)
    })

    Facade.setFacadeApplication(app)

    const seed = new SeedCommand(app, kernel)
    await seed.handle()
    db = getDb()

    const seeded = await db.connection().from('factory').select('*')

    assert.lengthOf(seeded, 1)
  })
})
