/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 3/22/2020
 * Time: 10:27 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import test from 'japa'
import { DBFactory } from '../../src/Factory/DBFactory'
import { ModelFactory } from '../../src/Factory/ModelFactory'
import { DatabaseFactory } from '../../src/Factory/DatabaseFactory'
import { cleanup, getDb, setup } from '../../test-helpers'
import { Container } from '../../src/Factory/Container'
import { BaseModel } from '../../src/Orm/BaseModel'
import { Adapter } from '../../src/Orm/Adapter'
import { column } from '../../src/Orm/Decorators'

let db: ReturnType<typeof getDb>
let app
test.group('Database | Factory', () => {
  test('Register a new blueprint with model or table name', async (assert) => {
    const fact: any = new DBFactory()
    fact.blueprint('user', () => {})

    assert.lengthOf(fact._blueprints, 1)
    assert.equal(fact._blueprints[0].name, 'user')
    assert.isNotNull(fact.getBlueprint('user'))
  })

  test('should clear all the registered blueprints.', async (assert) => {
    const fact: any = new DBFactory()
    fact.blueprint('user', () => {})
    fact.clear()
    assert.lengthOf(fact._blueprints, 0)
  })

  test('Get model factory for a registered blueprint.', async (assert) => {
    const fact = new DBFactory()
    fact.blueprint('user', () => {})

    assert.instanceOf(fact.model('user'), ModelFactory)
  })

  test('Get database factory instance for a registered blueprint', async (assert) => {
    const fact = new DBFactory()
    fact.blueprint('user', () => {})
    assert.instanceOf(fact.get('user'), DatabaseFactory)
  })
})

test.group('Factory | database', (group) => {
  group.beforeEach(async () => {
    await setup()

    db = getDb()
    app = new Container()
    app.singleton('db', () => db)
    BaseModel.$adapter = new Adapter(db)

    class User extends BaseModel {
      public static table = 'factory'

      @column({ isPrimary: true })
      public id: string

      @column()
      public name: string
    }

    app.singleton('App/Models/User', () => User)
  })

  group.afterEach(async () => {
    await db.manager.closeAll()
    await cleanup()
  })

  test('Make a single model instance with attributes from blueprint fake values', async (assert) => {
    const factory = new DatabaseFactory(app, 'factory', () => {
      return {
        name: 'user',
      }
    })

    const user: any = await factory.make()

    assert.equal(user.name, 'user')
  })

  test('make many data', async (assert) => {
    const factory = new DatabaseFactory(app, 'factory', (faker, index, data) => {
      return {
        name: data[index as number].name || faker.username(),
      }
    })

    const users: any = await factory.makeMany(2, [{ name: 'user' }, { name: 'user2' }])

    assert.equal(users[0].name, 'user')
    assert.equal(users[1].name, 'user2')
  })

  test('Create model instance and persist to database and then return it back', async (assert) => {
    const factory = new DatabaseFactory(app, 'factory', () => {
      return {
        name: 'user',
      }
    })

    const user: any = await factory.create()

    assert.lengthOf(user, 1)
  })

  test('Persist multiple model instances to database and get them back as an array', async (assert) => {
    const factory = new DatabaseFactory(app, 'factory', () => {
      return {
        name: 'user',
      }
    })

    const user: any = await factory.createMany(2)

    assert.lengthOf(user, 2)
  })

  test('Set table to used for the database', async (assert) => {
    const factory = new DatabaseFactory(app, 'user', () => {
      return {
        name: 'user',
      }
    })

    const user: any = await factory.table('factory').createMany(2)

    assert.lengthOf(user, 2)
  })

  test('Specify the connection to be used on the query builder', async (assert) => {
    const factory = new DatabaseFactory(app, 'user', () => {
      return {
        name: 'user',
      }
    })

    const user: any = await factory.connection('primary').table('factory').createMany(2)
    assert.lengthOf(user, 2)
  })

  test('Truncate the database table', async (assert) => {
    const factory = new DatabaseFactory(app, 'factory', () => {
      return {
        name: 'user',
      }
    })

    await factory.createMany(2)

    await factory.reset()

    const users = await db.connection().from('factory').select('*')
    assert.lengthOf(users, 0)
  })
})

test.group('Factory | Model', (group) => {
  group.beforeEach(async () => {
    await setup()

    app = new Container()
    db = getDb()
    app.singleton('db', () => db)
    BaseModel.$adapter = new Adapter(db)

    class User extends BaseModel {
      public static table = 'factory'

      @column({ isPrimary: true })
      public id: string

      @column()
      public name: string
    }

    app.singleton('App/Models/User', () => User)
  })
  group.afterEach(async () => {
    await db.manager.closeAll()
    await cleanup()
  })

  test('Create model instance and persist to database and then return it back', async (assert) => {
    const model = new ModelFactory(app, 'App/Models/User', () => {
      return {
        name: 'nguyen23',
      }
    })

    const user = await model.create()

    const created = await db.connection().from('factory').select('*')

    assert.equal(user.name, 'nguyen23')
    assert.lengthOf(created, 1)
  })

  test('Persist multiple model instances to database and get them back as an array', async (assert) => {
    const model = new ModelFactory(app, 'App/Models/User', () => {
      return {
        name: 'nguyen23',
      }
    })

    const users: any = await model.createMany(2)

    const created = await db.connection().from('factory').select('*')

    assert.lengthOf(users, 2)
    assert.equal(users[0].name, 'nguyen23')
    assert.lengthOf(created, 2)
  })

  test('Make a single model instance with attributes from blueprint fake values', async (assert) => {
    const model = new ModelFactory(app, 'App/Models/User', () => {
      return {
        name: 'nguyen23',
      }
    })

    const user = await model.make()

    assert.deepEqual(user.toJSON(), { name: 'nguyen23' })
  })

  test('Make x number of model instances with fake data', async (assert) => {
    const model = new ModelFactory(app, 'App/Models/User', () => {
      return {
        name: 'nguyen23',
      }
    })

    const users: any = await model.makeMany(2)

    assert.equal(users[0].name, 'nguyen23')
    assert.equal(users[1].name, 'nguyen23')
  })

  test('make a custom data', async (assert) => {
    const model = new ModelFactory(app, 'App/Models/User', (faker, i, data) => {
      return {
        name: data.name || 'nguyen23' || faker.username() || i,
      }
    })

    const user = await model.make({ name: 'user' })

    assert.deepEqual(user.toJSON(), { name: 'user' })
  })

  test('make a faker data', async (assert) => {
    const model = new ModelFactory(app, 'App/Models/User', (faker, i, data) => {
      return {
        name: faker.username() || data.name || i,
      }
    })

    const user = await model.make({ name: 'user' })

    assert.isNotNull(user.name)
  })

  test('make many custom data', async (assert) => {
    const model = new ModelFactory(app, 'App/Models/User', (faker, i, data) => {
      return {
        name: data[i as number].name || 'nguyen23' || faker.username(),
      }
    })

    const users: any = await model.makeMany(2, [{ name: 'user' }, { name: 'user2' }])

    assert.equal(users[0].name, 'user')
    assert.equal(users[1].name, 'user2')
  })

  test('Truncate the database table', async (assert) => {
    const model = new ModelFactory(app, 'App/Models/User', () => {
      return {
        name: 'nguyen23',
      }
    })

    await model.create()

    await model.reset()

    const users = await db.connection().from('factory').select('*')

    assert.lengthOf(users, 0)
  })
})
