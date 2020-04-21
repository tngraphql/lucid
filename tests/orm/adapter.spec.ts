/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 9:30 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import { column } from '../../src/Orm/Decorators';
import { cleanup, getBaseModel, getDb, ormAdapter, resetTables, setup } from '../helpers';

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Adapter', () => {
    beforeAll(async () => {
        db = getDb()
        BaseModel = getBaseModel(ormAdapter(db))
        await setup()
    })

    afterAll(async () => {
        await cleanup()
        await db.manager.closeAll()
    })

    afterEach(async () => {
        await resetTables()
    })

    test('make insert call using a model', async () => {
        class User extends BaseModel {
            public static $table = 'users'

            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }

        User.boot()

        const user = new User()
        user.username = 'virk'
        await user.save()

        expect(user.id).toBeDefined()
        expect(user.$attributes).toEqual({ username: 'virk', id: user.id })
        expect(user.$isDirty).toBeFalsy()
        expect(user.$isPersisted).toBeTruthy()
    })

    test('make update call using a model', async () => {
        class User extends BaseModel {
            public static $table = 'users'

            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }

        User.boot()

        const user = new User()
        user.username = 'virk'
        await user.save()

        expect(user.id).toBeDefined()
        expect(user.$attributes).toEqual({ username: 'virk', id: user.id })
        expect(user.$isDirty).toBeFalsy()
        expect(user.$isPersisted).toBeTruthy()

        user.username = 'nikk'
        expect(user.$isDirty).toBeTruthy()
        expect(user.$dirty).toEqual({ username: 'nikk' })

        await user.save()
    })

    test('make delete call using a model', async () => {
        class User extends BaseModel {
            public static $table = 'users'

            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }

        User.boot()

        const user = new User()
        user.username = 'virk'
        await user.save()

        expect(user.id).toBeDefined()
        expect(user.$attributes).toEqual({ username: 'virk', id: user.id })
        expect(user.$isDirty).toBeFalsy()
        expect(user.$isPersisted).toBeTruthy()

        await user.delete()
        expect(user.$isDeleted).toBeTruthy()

        const users = await db.from('users').select('*')
        expect(users).toHaveLength(0)
    })

    test('get array of model instances using the all call', async () => {
        class User extends BaseModel {
            public static $table = 'users'

            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }

        User.boot()

        await db.table('users').returning('id').multiInsert(
            [{ username: 'virk' }, { username: 'nikk' }]
        )

        const users = await User.all()

        expect(users).toHaveLength(2)
        expect(users[0]).toBeInstanceOf(User)
        expect(users[1]).toBeInstanceOf(User)

        expect(users[0].$isDirty).toBeFalsy()
        expect(users[1].$isDirty).toBeFalsy()

        expect(users[0].$attributes).toEqual({ id: 2, username: 'nikk' })
        expect(users[1].$attributes).toEqual({ id: 1, username: 'virk' })
    })

    test('use transaction client set on the model for the insert', async () => {
        class User extends BaseModel {
            public static $table = 'users'

            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }

        User.boot()
        const trx = await db.transaction()

        const user = new User()
        user.$trx = trx
        user.username = 'virk'
        await user.save()
        await trx.commit()

        const totalUsers = await db.from('users').count('*', 'total')

        expect(Number(totalUsers[0].total)).toBe(1)
        expect(user.id).toBeDefined()
        expect(user.$trx).toBeUndefined()
        expect(user.$attributes).toEqual({ username: 'virk', id: user.id })
        expect(user.$isDirty).toBeFalsy()
        expect(user.$isPersisted).toBeTruthy()
    })

    test('do not insert when transaction rollbacks', async () => {
        class User extends BaseModel {
            public static $table = 'users'

            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }

        User.boot()
        const trx = await db.transaction()

        const user = new User()
        user.$trx = trx
        user.username = 'virk'
        await user.save()
        await trx.rollback()

        const totalUsers = await db.from('users').count('*', 'total')

        expect(Number(totalUsers[0].total)).toBe(0)
        expect(user.id).toBeDefined()
        expect(user.$trx).toBeUndefined()
        expect(user.$attributes).toEqual({ username: 'virk', id: user.id })
        expect(user.$isDirty).toBeFalsy()
        expect(user.$isPersisted).toBeTruthy()
    })

    test('cleanup old trx event listeners when transaction is updated', async () => {
        class User extends BaseModel {
            public static $table = 'users'

            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }

        User.boot()
        const trx = await db.transaction()
        const trx1 = await trx.transaction()

        const user = new User()
        user.$trx = trx1
        user.$trx = trx
        user.username = 'virk'

        await trx1.rollback()
        expect(user.$trx).toEqual(trx)
        await trx.rollback()
    })

    test('use transaction client set on the model for the update', async () => {
        class User extends BaseModel {
            public static $table = 'users'

            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }

        User.boot()

        const user = new User()
        user.username = 'virk'
        await user.save()

        expect(user.id).toBeDefined()
        expect(user.$attributes).toEqual({ username: 'virk', id: user.id })
        expect(user.$isDirty).toBeFalsy()
        expect(user.$isPersisted).toBeTruthy()

        const trx = await db.transaction()
        user.$trx = trx
        user.username = 'nikk'
        await user.save()
        await trx.rollback()

        const users = await db.from('users')
        expect(users).toHaveLength(1)
        expect(users[0].username).toBe('virk')
    })

    test('use transaction client set on the model for the delete', async () => {
        class User extends BaseModel {
            public static $table = 'users'

            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }

        User.boot()

        const user = new User()
        user.username = 'virk'
        await user.save()

        expect(user.id).toBeDefined()
        expect(user.$attributes).toEqual({ username: 'virk', id: user.id })
        expect(user.$isDirty).toBeFalsy()
        expect(user.$isPersisted).toBeTruthy()

        const trx = await db.transaction()
        user.$trx = trx

        await user.delete()
        await trx.rollback()

        const users = await db.from('users').select('*')
        expect(users).toHaveLength(1)
    })

    test('set primary key value when colun name is different from attribute name', async () => {
        class User extends BaseModel {
            public static $table = 'users'

            @column({ isPrimary: true, columnName: 'id' })
            public userId: number

            @column()
            public username: string
        }

        User.boot()

        const user = new User()
        user.username = 'virk'
        await user.save()

        expect(user.userId).toBeDefined()
        expect(user.$attributes).toEqual({ username: 'virk', userId: user.userId })
        expect(user.$isDirty).toBeFalsy()
        expect(user.$isPersisted).toBeTruthy()
    })
})
