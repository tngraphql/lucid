/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 9:31 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { HasOne } from '../../src/Contracts/Orm/Relations/types';
import { column, hasOne } from '../../src/Orm/Decorators';
import { cleanup, getBaseModel, getDb, getProfiler, ormAdapter, resetTables, setup } from '../helpers';
import { Profiler } from '@adonisjs/profiler/build/standalone';

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Model options', () => {
    describe('Model options | QueryBuilder', () => {
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

        test('query builder set model options from the query client', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })

            const users = await User.query().exec()
            expect(users).toHaveLength(1)

            expect(users[0].$options!.connection).toBe('primary')
            expect(users[0].$options!.profiler).toBeInstanceOf(Profiler)
        })

        test('query builder set model options when only one row is fetched', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })

            const user = await User.query().first()

            expect(user!.$options!.connection).toBe('primary')
            expect(user!.$options!.profiler).toBeInstanceOf(Profiler)
        })

        test('query builder use transaction when updating rows', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const trx = await db.transaction()

            const users = await User.query({ client: trx }).exec()
            expect(users).toHaveLength(1)

            users[0].username = 'nikk'
            await users[0].save()

            await trx.rollback()

            const usersFresh = await User.query().exec()
            expect(usersFresh[0].username).toBe('virk')
        })

        test('cleanup transaction reference after commit or rollback', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const trx = await db.transaction()

            const users = await User.query({ client: trx }).exec()
            expect(users).toHaveLength(1)
            await trx.commit()

            expect(users[0].$trx).toBeUndefined()
            users[0].username = 'nikk'
            await users[0].save()

            const usersFresh = await User.query().exec()
            expect(usersFresh[0].username).toBe('nikk')
        })
    })

    describe('Model options | Adapter', () => {
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

        test('use correct client when custom connection is defined', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })

            const user = await User.query({ connection: 'secondary' }).first()
            expect(user!.$options!.connection).toBe('secondary')
            expect(user!.$options!.profiler).toBeInstanceOf(Profiler)
        })

        test('pass profiler to the client when defined explicitly', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const profiler = getProfiler()

            const user = await User.query({ profiler }).first()
            expect(user!.$options!.connection).toBe('primary')
            expect(user!.$options!.profiler).toEqual(profiler)
        })

        test('pass custom client to query builder', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })

            const client = db.connection()

            const user = await User.query({ client }).first()
            expect(user!.$options!.connection).toBe('primary')
        })

        test('pass transaction client to query builder', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })

            const trx = await db.connection('secondary').transaction()
            const user = await User.query({ client: trx }).first()
            await trx.rollback()

            expect(user!.$options!.connection).toBe('secondary')
        })
    })

    describe('Model options | Model.find', () => {
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

        test('define custom connection', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })

            const user = await User.find(1, { connection: 'secondary' })
            expect(user!.$options!.connection).toBe('secondary')
            expect(user!.$options!.profiler).toBeInstanceOf(Profiler)
        })

        test('define custom profiler', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const profiler = getProfiler()

            const user = await User.find(1, { profiler })
            expect(user!.$options!.profiler).toEqual(profiler)
        })

        test('define custom query client', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const client = db.connection()

            const user = await User.find(1, { client })
            expect(user!.$options!.profiler).toEqual(client.profiler)
            expect(user!.$options!.connection).toEqual(client.connectionName)
        })
    })

    describe('Model options | Model.findOrFail', () => {
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

        test('define custom connection', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })

            const user = await User.findOrFail(1, { connection: 'secondary' })
            expect(user.$options!.connection).toBe('secondary')
            expect(user.$options!.profiler).toBeInstanceOf(Profiler)
        })

        test('define custom profiler', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            const customDb = getDb()
            await customDb.insertQuery().table('users').insert({ username: 'virk' })
            const profiler = getProfiler()

            const user = await User.findOrFail(1, { profiler })
            expect(user.$options!.profiler).toEqual(profiler)
        })

        test('define custom query client', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const client = db.connection('secondary')

            const user = await User.findOrFail(1, { client })
            expect(user.$options!.profiler).toEqual(client.profiler)
            expect(user.$options!.connection).toEqual(client.connectionName)
        })
    })

    describe('Model options | Model.findMany', () => {
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

        test('define custom connection', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })

            const users = await User.findMany([1], { connection: 'secondary' })
            expect(users[0].$options!.connection).toBe('secondary')
            expect(users[0].$options!.profiler).toBeInstanceOf(Profiler)
        })

        test('define custom profiler', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const profiler = getProfiler()

            const users = await User.findMany([1], { profiler })
            expect(users[0].$options!.profiler).toEqual(profiler)
        })

        test('define custom query client', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const client = db.connection('secondary')

            const users = await User.findMany([1], { client })
            expect(users[0].$options!.profiler).toEqual(client.profiler)
            expect(users[0].$options!.connection).toEqual(client.connectionName)
        })
    })

    describe('Model options | Model.firstOrCreate', () => {
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

        test('define custom connection', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })

            const user = await User.firstOrCreate({ username: 'virk' }, undefined, { connection: 'secondary' })
            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(1)
            expect(user.$options!.connection).toBe('secondary')
            expect(user.$options!.profiler).toBeInstanceOf(Profiler)
        })

        test('define custom connection when search fails', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })

            const user = await User.firstOrCreate({ username: 'nikk' }, undefined, { connection: 'secondary' })
            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(2)
            expect(user.$options!.connection).toBe('secondary')
            expect(user.$options!.profiler).toBeInstanceOf(Profiler)
        })

        test('define custom profiler', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const profiler = getProfiler()

            const user = await User.firstOrCreate({ username: 'virk' }, undefined, { profiler })
            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(1)
            expect(user.$options!.connection).toBe('primary')
            expect(user.$options!.profiler).toEqual(profiler)
        })

        test('define custom profiler when search fails', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const profiler = getProfiler()

            const user = await User.firstOrCreate({ username: 'nikk' }, undefined, { profiler })
            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(2)
            expect(user.$options!.profiler).toEqual(profiler)
        })

        test('define custom client', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const client = db.connection('secondary')

            const user = await User.firstOrCreate({ username: 'virk' }, undefined, { client })
            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(1)
            expect(user.$options!.profiler).toEqual(client.profiler)
            expect(user.$options!.connection).toEqual(client.connectionName)
        })

        test('define custom client when search fails', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const client = db.connection('secondary')

            const user = await User.firstOrCreate({ username: 'nikk' }, undefined, { client })
            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(2)
            expect(user.$options!.profiler).toEqual(client.profiler)
            expect(user.$options!.connection).toEqual(client.connectionName)
        })

        test('use transaction', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const client = await db.connection('secondary').transaction()

            const user = await User.firstOrCreate({ username: 'virk' }, undefined, { client })
            await client.commit()

            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(1)
            expect(user.$options!.profiler).toEqual(client.profiler)
            expect(user.$options!.connection).toEqual(client.connectionName)
        })

        test('use transaction to save when search fails', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            const client = await db.connection('secondary').transaction()

            const user = await User.firstOrCreate({ username: 'virk' }, undefined, { client })
            await client.rollback()

            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(0)
            expect(user.$options!.profiler).toEqual(client.profiler)
            expect(user.$options!.connection).toEqual(client.connectionName)
        })
    })

    describe('Model options | Model.fetchOrCreateMany', () => {
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

        test('define custom connection', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })

            const [user] = await User.fetchOrCreateMany(
                'username',
                [{ username: 'virk' }],
                { connection: 'secondary' },
            )

            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(1)
            expect(user.$options!.connection).toBe('secondary')
            expect(user.$options!.profiler).toBeInstanceOf(Profiler)
        })

        test('define custom connection when search fails', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            const [user] = await User.fetchOrCreateMany(
                'username',
                [{ username: 'virk' }],
                { connection: 'secondary' },
            )

            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(1)
            expect(user.$options!.connection).toBe('secondary')
            expect(user.$options!.profiler).toBeInstanceOf(Profiler)
        })

        test('define custom profiler', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const profiler = getProfiler()

            const [user] = await User.fetchOrCreateMany(
                'username',
                [{ username: 'virk' }],
                { profiler },
            )

            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(1)
            expect(user.$options!.connection).toBe('primary')
            expect(user.$options!.profiler).toEqual(profiler)
        })

        test('define custom profiler when search fails', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            const profiler = getProfiler()
            const [user] = await User.fetchOrCreateMany(
                'username',
                [{ username: 'virk' }],
                { profiler },
            )

            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(1)
            expect(user.$options!.connection).toBe('primary')
            expect(user.$options!.profiler).toEqual(profiler)
        })

        test('define custom client', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const client = db.connection('secondary')

            const [user] = await User.fetchOrCreateMany(
                'username',
                [{ username: 'virk' }],
                { client },
            )

            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(1)
            expect(user.$options!.profiler).toEqual(client.profiler)
            expect(user.$options!.connection).toEqual(client.connectionName)
        })

        test('define custom client when search fails', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            const client = db.connection('secondary')

            const [user] = await User.fetchOrCreateMany(
                'username',
                [{ username: 'virk' }],
                { client },
            )

            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(1)
            expect(user.$options!.profiler).toEqual(client.profiler)
            expect(user.$options!.connection).toEqual(client.connectionName)
        })

        test('wrap create many calls inside a transaction', async () => {
            expect.assertions(2)

            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string
            }

            try {
                await User.fetchOrCreateMany(
                    'username',
                    [
                        { username: 'virk', email: 'foo@bar.com' },
                        { username: 'nikk', email: 'foo@bar.com' },
                        { username: 'romain', email: 'foo@bar.com' },
                    ],
                )
            } catch (error) {
                expect(error).toBeDefined()
            }

            const total = await db.from('users').count('*', 'total')
            expect(Number(total[0].total)).toBe(0)
        })

        test('use existing transaction when passed', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string
            }

            const trx = await db.transaction()
            trx.transaction = async function () {
                throw new Error('Never expected to be invoked')
            }

            await User.fetchOrCreateMany(
                'username',
                [
                    { username: 'virk', email: 'foo@bar.com' },
                ],
                { client: trx },
            )

            expect(trx.isCompleted).toBeFalsy()
            await trx.rollback()

            const total = await db.from('users').count('*', 'total')
            expect(Number(total[0].total)).toBe(0)
        })
    })

    describe('Model options | Model.updateOrCreateMany', () => {
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

        test('define custom connection', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })

            const [user] = await User.updateOrCreateMany(
                'username',
                [{ username: 'virk' }],
                { connection: 'secondary' },
            )

            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(1)
            expect(user.$options!.connection).toBe('secondary')
            expect(user.$options!.profiler).toBeDefined();
            expect(user.$trx).toBeUndefined();
        })

        test('define custom connection when search fails', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            const [user] = await User.updateOrCreateMany(
                'username',
                [{ username: 'virk' }],
                { connection: 'secondary' },
            )

            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(1)
            expect(user.$options!.connection).toBe('secondary')
            expect(user.$options!.profiler).toBeDefined()
            expect(user.$trx).toBeUndefined();
        })

        test('define custom profiler', async () => {
            expect.assertions(4);

            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const profiler = getProfiler()
            const originalCreate = profiler.create.bind(profiler)
            profiler.create = function (label): any {
                expect(label).toEqual('trx:begin');
                return originalCreate(label)
            }

            const [user] = await User.updateOrCreateMany(
                'username',
                [{ username: 'virk' }],
                { profiler },
            )

            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(1)
            expect(user.$options!.connection).toBe('primary')
            expect(user.$trx).toBeUndefined();
        })

        test('define custom profiler when search fails', async () => {
            expect.assertions(4);

            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            const profiler = getProfiler()
            const originalCreate = profiler.create.bind(profiler)
            profiler.create = function (label): any {
                expect(label).toBe('trx:begin');
                return originalCreate(label)
            }

            const [user] = await User.updateOrCreateMany(
                'username',
                [{ username: 'virk' }],
                { profiler },
            )

            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(1)
            expect(user.$options!.connection).toBe('primary')
            expect(user.$trx).toBeUndefined();
        })

        test('define custom client', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const client = db.connection('secondary')

            const [user] = await User.updateOrCreateMany(
                'username',
                [{ username: 'virk' }],
                { client },
            )

            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(1)
            expect(user.$options!.profiler).toBeDefined();
            expect(user.$options!.connection).toEqual(client.connectionName)
        })

        test('define custom client when search fails', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            const client = db.connection('secondary')

            const [user] = await User.updateOrCreateMany(
                'username',
                [{ username: 'virk' }],
                { client },
            )

            const total = await db.from('users').count('*', 'total')

            expect(Number(total[0].total)).toBe(1)
            expect(user.$options!.profiler).toBeDefined();
            expect(user.$options!.connection).toEqual(client.connectionName)
        })

        test('wrap update many calls inside a transaction', async () => {
            expect.assertions(2)

            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string
            }

            try {
                await User.updateOrCreateMany(
                    'username',
                    [
                        { username: 'virk', email: 'foo@bar.com' },
                        { username: 'nikk', email: 'foo@bar.com' },
                        { username: 'romain', email: 'foo@bar.com' },
                    ],
                )
            } catch (error) {
                expect(error).toBeDefined()
            }

            const total = await db.from('users').count('*', 'total')
            expect(Number(total[0].total)).toBe(0)
        })

        test('use existing transaction when passed', async () => {
            class User extends BaseModel {
                public static $table = 'users'

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string
            }

            const trx = await db.transaction()
            trx.transaction = async function () {
                throw new Error('Never expected to be invoked')
            }

            await User.updateOrCreateMany(
                'username',
                [
                    { username: 'virk', email: 'foo@bar.com' },
                ],
                { client: trx },
            )

            expect(trx.isCompleted).toBeFalsy()
            await trx.rollback()

            const total = await db.from('users').count('*', 'total')
            expect(Number(total[0].total)).toBe(0)
        })
    })

    describe('Model options | Query Builder Preloads', () => {
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

        test('pass query options to preloaded models', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ user_id: 1, display_name: 'Virk' })

            const users = await User.query({ connection: 'secondary' }).preload('profile').exec()
            expect(users).toHaveLength(1)

            expect(users[0].$options!.connection).toBe('secondary')
            expect(users[0].$options!.profiler).toBeInstanceOf(Profiler)

            expect(users[0].profile.$options!.connection).toBe('secondary')
            expect(users[0].profile.$options!.profiler).toBeInstanceOf(Profiler)
        })

        test('use transaction client to execute preload queries', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ user_id: 1, display_name: 'Virk' })

            const trx = await db.transaction()
            const users = await User.query({ client: trx }).preload('profile').exec()
            await trx.commit()

            expect(users).toHaveLength(1)

            expect(users[0].$options!.connection).toBe('primary')
            expect(users[0].$options!.profiler).toEqual(trx.profiler)

            expect(users[0].profile.$options!.connection).toBe('primary')
            expect(users[0].profile.$options!.profiler).toEqual(trx.profiler)
        })

        test('pass profiler to preload models', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ user_id: 1, display_name: 'Virk' })

            const profiler = getProfiler()
            const users = await User.query({ profiler }).preload('profile').exec()

            expect(users).toHaveLength(1)

            expect(users[0].$options!.connection).toBe('primary')
            expect(users[0].$options!.profiler).toEqual(profiler)

            expect(users[0].profile.$options!.connection).toBe('primary')
            expect(users[0].profile.$options!.profiler).toEqual(profiler)
        })

        test('pass sideloaded data to preloads', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ user_id: 1, display_name: 'Virk' })

            const users = await User.query().sideload({ id: 1 }).preload('profile').exec()

            expect(users).toHaveLength(1)

            expect(users[0].$options!.connection).toBe('primary')
            expect(users[0].$sideloaded).toEqual({ id: 1 })
            expect(users[0].profile.$sideloaded).toEqual({ id: 1 })
        })

        test('custom sideloaded data on preload query must win', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ user_id: 1, display_name: 'Virk' })

            const users = await User.query().sideload({ id: 1 }).preload('profile', (builder) => {
                builder.sideload({ id: 2 })
            }).exec()

            expect(users).toHaveLength(1)

            expect(users[0].$options!.connection).toBe('primary')
            expect(users[0].$sideloaded).toEqual({ id: 1 })
            expect(users[0].profile.$sideloaded).toEqual({ id: 2 })
        })

        test('use transaction client to update preloaded rows', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ user_id: 1, display_name: 'Virk' })

            const trx = await db.transaction()
            const users = await User.query({ client: trx }).preload('profile').exec()

            expect(users).toHaveLength(1)

            users[0].profile.displayName = 'Nikk'
            await users[0].profile.save()

            await trx.rollback()

            const profiles = await Profile.all()
            expect(profiles).toHaveLength(1)
            expect(profiles[0].displayName).toBe('Virk')
        })

        test('cleanup transaction reference after commit or rollback', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ user_id: 1, display_name: 'Virk' })

            const trx = await db.transaction()
            const users = await User.query({ client: trx }).preload('profile').exec()

            expect(users).toHaveLength(1)
            await trx.commit()

            expect(users[0].$trx).toBeUndefined()
            expect(users[0].profile.$trx).toBeUndefined()

            users[0].profile.displayName = 'Nikk'
            await users[0].profile.save()

            const profiles = await Profile.all()
            expect(profiles).toHaveLength(1)
            expect(profiles[0].displayName).toBe('Nikk')
        })
    })

    describe('Model options | Model Preloads', () => {
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

        test('pass query options to preloaded models', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ user_id: 1, display_name: 'Virk' })

            const user = await User.query({ connection: 'secondary' }).firstOrFail()
            expect(user.$options!.connection).toBe('secondary')

            await user.preload('profile')

            expect(user.profile.$options!.connection).toBe('secondary')
            expect(user.profile.$options!.profiler).toBeInstanceOf(Profiler)
        })

        test('pass profiler to preload models', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ user_id: 1, display_name: 'Virk' })

            const profiler = getProfiler()
            const user = await User.query({ profiler }).firstOrFail()

            expect(user.$options!.connection).toBe('primary')
            expect(user.$options!.profiler).toEqual(profiler)

            await user.preload('profile')

            expect(user.profile.$options!.connection).toBe('primary')
            expect(user.profile.$options!.profiler).toEqual(profiler)
        })

        test('pass sideloaded data to preloads', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ user_id: 1, display_name: 'Virk' })

            const user = await User.query().sideload({ id: 1 }).firstOrFail()
            expect(user.$sideloaded).toEqual({ id: 1 })

            await user.preload('profile')
            expect(user.profile.$sideloaded).toEqual({ id: 1 })
        })

        test('custom sideloaded data on preload query must win', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ user_id: 1, display_name: 'Virk' })

            const user = await User.query().sideload({ id: 1 }).firstOrFail()
            expect(user.$sideloaded).toEqual({ id: 1 })

            await user.preload('profile', (query) => query.sideload({ id: 2 }))
            expect(user.profile.$sideloaded).toEqual({ id: 2 })
        })
    })
})
