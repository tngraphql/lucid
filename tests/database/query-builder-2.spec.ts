/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 8:20 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Connection } from '../../src/Connection/Connection';
import {
    cleanup,
    getBaseModel,
    getConfig,
    getDb, getInsertBuilder,
    getLogger,
    getQueryBuilder,
    getQueryClient, getRawQueryBuilder,
    resetTables,
    setup
} from '../helpers';

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Query Builder Two', () => {
    describe('Query Builder | havingNull', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add having null clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingNull('deleted_at')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                ['havingNull']('deleted_at')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingNull('deleted_at')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                ['havingNull']('my_deleted_at')
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add or having null clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingNull('deleted_at')
                .orHavingNull('updated_at')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                ['havingNull']('deleted_at')
                .orHavingNull('updated_at')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingNull('deleted_at')
                .orHavingNull('updated_at')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                ['havingNull']('my_deleted_at')
                .orHavingNull('my_updated_at')
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | havingNotNull', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add having null clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingNotNull('deleted_at')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                ['havingNotNull']('deleted_at')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingNotNull('deleted_at')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                ['havingNotNull']('my_deleted_at')
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add or having not null clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingNotNull('deleted_at')
                .orHavingNotNull('updated_at')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                ['havingNotNull']('deleted_at')
                .orHavingNotNull('updated_at')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingNotNull('deleted_at')
                .orHavingNotNull('updated_at')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                ['havingNotNull']('my_deleted_at')
                .orHavingNotNull('my_updated_at')
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | havingExists', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add having exists clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingExists((builder) => {
                    builder.select('*').from('accounts').whereRaw('users.account_id = accounts.id')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                ['havingExists']((builder) => {
                builder.select('*').from('accounts').whereRaw('users.account_id = accounts.id')
            })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
            await connection.disconnect()
        })

        test('add having exists clause as a subquery', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingExists(getQueryBuilder(getQueryClient(connection)).select('*').from('accounts'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                ['havingExists'](connection.client!.select('*').from('accounts'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add or having exists clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingExists((builder) => {
                    builder.select('*').from('accounts')
                })
                .orHavingExists((builder) => {
                    builder.select('*').from('profiles')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                ['havingExists']((builder) => {
                builder.select('*').from('accounts')
            })
                .orHavingExists((builder) => {
                    builder.select('*').from('profiles')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | havingNotExists', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add having not exists clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingNotExists((builder) => {
                    builder.select('*').from('accounts').whereRaw('users.account_id = accounts.id')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                ['havingNotExists']((builder) => {
                builder.select('*').from('accounts').whereRaw('users.account_id = accounts.id')
            })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add having not exists clause as a subquery', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingNotExists(getQueryBuilder(getQueryClient(connection)).select('*').from('accounts'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                ['havingNotExists'](connection.client!.select('*').from('accounts'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add or having not exists clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingNotExists((builder) => {
                    builder.select('*').from('accounts')
                })
                .orHavingNotExists((builder) => {
                    builder.select('*').from('profiles')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                ['havingNotExists']((builder) => {
                builder.select('*').from('accounts')
            })
                .orHavingNotExists((builder) => {
                    builder.select('*').from('profiles')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | havingBetween', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add having between clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingBetween('id', [5, 10])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingBetween('id', [5, 10])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingBetween('id', [5, 10])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .havingBetween('my_id', [5, 10])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add having between clause with raw values', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingBetween('id', [
                    getRawQueryBuilder(getQueryClient(connection), 'select min(id) from users;'),
                    getRawQueryBuilder(getQueryClient(connection), 'select max(id) from users;'),
                ])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingBetween('id', [
                    connection.client!.raw('select min(id) from users;'),
                    connection.client!.raw('select max(id) from users;'),
                ])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingBetween('id', [
                    getRawQueryBuilder(getQueryClient(connection), 'select min(id) from users;'),
                    getRawQueryBuilder(getQueryClient(connection), 'select max(id) from users;'),
                ])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .havingBetween('my_id', [
                    connection.client!.raw('select min(id) from users;'),
                    connection.client!.raw('select max(id) from users;'),
                ])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add having between clause with subqueries', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingBetween('id', [
                    getQueryBuilder(getQueryClient(connection)).select('id'),
                    getQueryBuilder(getQueryClient(connection)).select('id'),
                ])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingBetween('id', [
                    connection.client!.select('id') as any,
                    connection.client!.select('id') as any,
                ])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingBetween('id', [
                    getQueryBuilder(getQueryClient(connection)).select('id'),
                    getQueryBuilder(getQueryClient(connection)).select('id'),
                ])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .havingBetween('my_id', [
                    connection.client!.select('id') as any,
                    connection.client!.select('id') as any,
                ])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add or having between clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingBetween('id', [5, 10])
                .orHavingBetween('id', [18, 23])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingBetween('id', [5, 10])
                .orHavingBetween('id', [18, 23])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingBetween('id', [5, 10])
                .orHavingBetween('id', [18, 23])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .havingBetween('my_id', [5, 10])
                .orHavingBetween('my_id', [18, 23])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | havingNotBetween', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add having not between clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingNotBetween('id', [5, 10])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingNotBetween('id', [5, 10])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingNotBetween('id', [5, 10])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .havingNotBetween('my_id', [5, 10])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add having not between clause with raw values', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingNotBetween('id', [
                    getRawQueryBuilder(getQueryClient(connection), 'select min(id) from users;'),
                    getRawQueryBuilder(getQueryClient(connection), 'select max(id) from users;'),
                ])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingNotBetween('id', [
                    connection.client!.raw('select min(id) from users;'),
                    connection.client!.raw('select max(id) from users;'),
                ])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingNotBetween('id', [
                    getRawQueryBuilder(getQueryClient(connection), 'select min(id) from users;'),
                    getRawQueryBuilder(getQueryClient(connection), 'select max(id) from users;'),
                ])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .havingNotBetween('my_id', [
                    connection.client!.raw('select min(id) from users;'),
                    connection.client!.raw('select max(id) from users;'),
                ])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add having not between clause with subqueries', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingNotBetween('id', [
                    getQueryBuilder(getQueryClient(connection)).select('id'),
                    getQueryBuilder(getQueryClient(connection)).select('id'),
                ])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingNotBetween('id', [
                    connection.client!.select('id') as any,
                    connection.client!.select('id') as any,
                ])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingNotBetween('id', [
                    getQueryBuilder(getQueryClient(connection)).select('id'),
                    getQueryBuilder(getQueryClient(connection)).select('id'),
                ])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .havingNotBetween('my_id', [
                    connection.client!.select('id') as any,
                    connection.client!.select('id') as any,
                ])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add or having not between clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingNotBetween('id', [5, 10])
                .orHavingNotBetween('id', [18, 23])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingNotBetween('id', [5, 10])
                .orHavingNotBetween('id', [18, 23])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingNotBetween('id', [5, 10])
                .orHavingNotBetween('id', [18, 23])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .havingNotBetween('my_id', [5, 10])
                .orHavingNotBetween('my_id', [18, 23])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | havingRaw', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add having raw clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingRaw('id = ?', [1])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingRaw('id = ?', [1])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add having raw clause without bindings', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingRaw('id = 1')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingRaw('id = 1')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
            await connection.disconnect()
        })

        test('add having raw clause with object of bindings', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingRaw('id = :id', { id: 1 })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingRaw('id = :id', { id: 1 })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add having raw clause from a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingRaw(getRawQueryBuilder(getQueryClient(connection), 'select id from accounts;'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingRaw(connection.client!.raw('select id from accounts;'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add or having raw clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingRaw('id = ?', [1])
                .orHavingRaw('id = ?', [2])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingRaw('id = ?', [1])
                .orHavingRaw('id = ?', [2])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | clearSelect', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('clear selected columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .select('id', 'username')
                .clearSelect()
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .select('id', 'username')
                .clearSelect()
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | clearWhere', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('clear where clauses', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .where('username', 'virk')
                .clearWhere()
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .where('username', 'virk')
                .clearWhere()
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | clearOrder', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('clear order by columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .orderBy('id', 'desc')
                .clearOrder()
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .orderBy('id', 'desc')
                .clearOrder()
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | clearHaving', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('clear having clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .having('id', '>', 10)
                .clearHaving()
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .having('id', '>', 10)
                .clearHaving()
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | clearLimit', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('clear limit', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .limit(10)
                .clearLimit()
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | clearOffset', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('clear offset', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .offset(1)
                .clearOffset()
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | count', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('count all rows', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .count('*', 'total')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .count('*', { as: 'total' })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .count('*', 'total')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .count('*', { as: 'total' })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('count multiple rows', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .count({ u: 'username', e: 'email' })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .count({ u: 'username', e: 'email' })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .count({ u: 'username', e: 'email' })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .count({ u: 'my_username', e: 'my_email' })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('count by raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .count(getRawQueryBuilder(
                    getQueryClient(connection),
                    'select * from profiles where is_verified = ?', [true],
                ), 'u')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .count({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .count(getRawQueryBuilder(
                    getQueryClient(connection),
                    'select * from profiles where is_verified = ?', [true],
                ), 'u')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .count({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('count by subquery', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .count(getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'), 'u')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .count({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .count(getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'), 'u')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .count({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('count by raw query on multiple columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .count({
                    u: getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    e: 'email',
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .count({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                    e: 'email',
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .count({
                    u: getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    e: 'email',
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .count({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                    e: 'my_email',
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('count by subquery on multiple columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .count({
                    u: getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'),
                    e: 'email',
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .count({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                    e: 'email',
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .count({
                    u: getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'),
                    e: 'email',
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .count({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                    e: 'my_email',
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | countDistinct', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('count all rows', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .countDistinct('*', 'total')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .countDistinct('*', { as: 'total' })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .countDistinct('*', 'total')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .countDistinct('*', { as: 'total' })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('count multiple rows', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .countDistinct({ u: 'username', e: 'email' })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .countDistinct({ u: 'username', e: 'email' })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .countDistinct({ u: 'username', e: 'email' })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .countDistinct({ u: 'my_username', e: 'my_email' })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('count by raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .countDistinct(
                    getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    'u',
                )
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .countDistinct({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .countDistinct(
                    getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    'u',
                )
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .countDistinct({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('count by subquery', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .countDistinct(getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'), 'u')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .countDistinct({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .countDistinct(getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'), 'u')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .countDistinct({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('count by raw query on multiple columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .countDistinct({
                    u: getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    e: 'email',
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .countDistinct({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                    e: 'email',
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .countDistinct({
                    u: getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    e: 'email',
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .countDistinct({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                    e: 'my_email',
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('count by subquery on multiple columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .countDistinct({
                    u: getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'),
                    e: 'email',
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .countDistinct({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                    e: 'email',
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .countDistinct({
                    u: getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'),
                    e: 'email',
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .countDistinct({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                    e: 'my_email',
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })
})
