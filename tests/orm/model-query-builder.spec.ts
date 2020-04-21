/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 9:48 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { scope } from '../../src/Helpers/scope';
import { column } from '../../src/Orm/Decorators';
import { ModelQueryBuilder } from '../../src/Orm/QueryBuilder/ModelQueryBuilder';
import { cleanup, getBaseModel, getDb, getProfiler, ormAdapter, resetTables, setup } from '../helpers';

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Model query builder', () => {
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

    test('get instance of query builder for the given model', async () => {
        class User extends BaseModel {
            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }


        expect(User.query()).toBeInstanceOf(ModelQueryBuilder)
    })

    test('pre select the table for the query builder instance', async () => {
        class User extends BaseModel {
            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }


        expect(User.query().knexQuery['_single'].table).toBe('users')
    })

    test('execute select queries', async () => {
        class User extends BaseModel {
            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }


        await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

        const users = await User.query().where('username', 'virk')
        expect(users).toHaveLength(1)
        expect(users[0]).toBeInstanceOf(User)
        expect(users[0].$attributes).toEqual({ id: 1, username: 'virk' })
    })

    test('pass custom connection to the model instance', async () => {
        class User extends BaseModel {
            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }


        await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

        const users = await User.query({ connection: 'secondary' }).where('username', 'virk')
        expect(users).toHaveLength(1)
        expect(users[0]).toBeInstanceOf(User)
        expect(users[0].$attributes).toEqual({ id: 1, username: 'virk' })
        expect(users[0].$options!.connection).toEqual('secondary')
    })

    test('pass sideloaded attributes to the model instance', async () => {
        class User extends BaseModel {
            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }


        await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

        const users = await User
            .query({ connection: 'secondary' })
            .where('username', 'virk')
            .sideload({ loggedInUser: { id: 1 } })

        expect(users).toHaveLength(1)
        expect(users[0]).toBeInstanceOf(User)
        expect(users[0].$attributes).toEqual({ id: 1, username: 'virk' })
        expect(users[0].$sideloaded).toEqual({ loggedInUser: { id: 1 } })
    })

    test('pass custom profiler to the model instance', async () => {
        class User extends BaseModel {
            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }


        await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

        const profiler = getProfiler()
        const users = await User.query({ profiler }).where('username', 'virk')
        expect(users).toHaveLength(1)
        expect(users[0]).toBeInstanceOf(User)
        expect(users[0].$attributes).toEqual({ id: 1, username: 'virk' })
        expect(users[0].$options!.profiler).toEqual(profiler)
    })

    test('perform update using model query builder', async () => {
        class User extends BaseModel {
            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }


        await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

        const rows = await User.query().where('username', 'virk').update({ username: 'hvirk' })
        expect(rows).toHaveLength(1)
        expect(rows).toEqual([1])

        const user = await db.from('users').where('username', 'hvirk').first()
        expect(user!.username).toBe('hvirk')
    })

    test('perform increment using model query builder', async () => {
        class User extends BaseModel {
            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }


        await db.insertQuery().table('users').insert([{ username: 'virk', points: 1 }])

        const rows = await User.query().where('username', 'virk').increment('points', 1)
        expect(rows).toHaveLength(1)
        expect(rows).toEqual([1])

        const user = await db.from('users').where('username', 'virk').first()
        expect(user!.points).toBe(2)
    })

    test('perform decrement using model query builder', async () => {
        class User extends BaseModel {
            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }


        await db.insertQuery().table('users').insert([{ username: 'virk', points: 3 }])

        const rows = await User.query().where('username', 'virk').decrement('points', 1)
        expect(rows).toHaveLength(1)
        expect(rows).toEqual([1])

        const user = await db.from('users').where('username', 'virk').first()
        expect(user!.points).toBe(2)
    })

    test('delete in bulk', async () => {
        class User extends BaseModel {
            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }


        await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

        const rows = await User.query().where('username', 'virk').del()
        expect(rows).toHaveLength(1)
        expect(rows).toEqual([1])

        const user = await db.from('users').where('username', 'virk').first()
        expect(user).toBeNull()
    })

    test('clone query builder', async () => {
        class User extends BaseModel {
            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }



        const query = User.query()
        const clonedQuery = query.clone()
        expect(clonedQuery).toBeInstanceOf(ModelQueryBuilder)
    })

    test('clone query builder with internal flags', async () => {
        class User extends BaseModel {
            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }



        const query = User.query().groupBy('id')
        const clonedQuery = query.clone()
        expect(clonedQuery.hasGroupBy).toBeTruthy()
    })

    test('pass sideloaded data to cloned query', async () => {
        class User extends BaseModel {
            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }


        await db.insertQuery().table('users').insert([{ username: 'virk', points: 3 }])

        const query = User.query().sideload({ username: 'virk' })
        const user = await query.clone().firstOrFail()
        expect(user.$sideloaded).toEqual({ username: 'virk' })
    })

    test('apply scopes', async () => {
        class User extends BaseModel {
            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string

            public static active = scope((query) => {
                query.where('is_active', true)
            })
        }


        const { sql, bindings } = User.query().apply((scopes) => {
            scopes.active()
        }).toSQL()

        const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                           .getWriteClient()
                                                           .from('users')
                                                           .where('is_active', true)
                                                           .toSQL()

        expect(sql).toBe(knexSql)
        expect(bindings).toEqual(knexBindings)
    })

    test('apply scopes inside a sub query', async () => {
        class User extends BaseModel {
            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string

            public static active = scope((query) => {
                query.where('is_active', true)
            })
        }


        const { sql, bindings } = User.query().where((builder) => {
            builder.apply((scopes) => scopes.active())
        }).toSQL()

        const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                           .getWriteClient()
                                                           .from('users')
                                                           .where((builder) => builder.where('is_active', true))
                                                           .toSQL()

        expect(sql).toBe(knexSql)
        expect(bindings).toEqual(knexBindings)
    })

    test('make aggregate queries with the model query builder', async () => {
        class User extends BaseModel {
            @column({ isPrimary: true })
            public id: number

            @column()
            public username: string
        }


        await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

        const users = await User.query().count('* as total')
        expect(Number(users[0].total)).toBe(2)
    })
})
