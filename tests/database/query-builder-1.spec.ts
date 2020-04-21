/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 8:19 PM
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

describe('Query Builder One', () => {
    describe('Query Builder | whereBetween', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add where between clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereBetween('age', [18, 20])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereBetween('age', [18, 20])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereBetween('age', [18, 20])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereBetween('my_age', [18, 20])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add where between clause as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereBetween('age', [
                    getRawQueryBuilder(getQueryClient(connection), 'select min_age from ages;'),
                    getRawQueryBuilder(getQueryClient(connection), 'select max_age from ages;'),
                ])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereBetween('age', [
                    connection.client!.raw('select min_age from ages;'),
                    connection.client!.raw('select max_age from ages;'),
                ])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereBetween('age', [
                    getRawQueryBuilder(getQueryClient(connection), 'select min_age from ages;'),
                    getRawQueryBuilder(getQueryClient(connection), 'select max_age from ages;'),
                ])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereBetween('my_age', [
                    connection.client!.raw('select min_age from ages;'),
                    connection.client!.raw('select max_age from ages;'),
                ])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add or where between clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .orWhereBetween('age', [18, 20])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .orWhereBetween('age', [18, 20])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .orWhereBetween('age', [18, 20])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .orWhereBetween('my_age', [18, 20])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add or where between clause as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .orWhereBetween('age', [
                    getRawQueryBuilder(getQueryClient(connection), 'select min_age from ages;'),
                    getRawQueryBuilder(getQueryClient(connection), 'select max_age from ages;'),
                ])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .orWhereBetween('age', [
                    connection.client!.raw('select min_age from ages;'),
                    connection.client!.raw('select max_age from ages;'),
                ])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .orWhereBetween('age', [
                    getRawQueryBuilder(getQueryClient(connection), 'select min_age from ages;'),
                    getRawQueryBuilder(getQueryClient(connection), 'select max_age from ages;'),
                ])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .orWhereBetween('my_age', [
                    connection.client!.raw('select min_age from ages;'),
                    connection.client!.raw('select max_age from ages;'),
                ])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | whereNotBetween', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add where not between clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNotBetween('age', [18, 20])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNotBetween('age', [18, 20])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNotBetween('age', [18, 20])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNotBetween('my_age', [18, 20])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add where not between clause as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNotBetween('age', [
                    getRawQueryBuilder(getQueryClient(connection), 'select min_age from ages;'),
                    getRawQueryBuilder(getQueryClient(connection), 'select max_age from ages;'),
                ])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNotBetween('age', [
                    connection.client!.raw('select min_age from ages;'),
                    connection.client!.raw('select max_age from ages;'),
                ])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNotBetween('age', [
                    getRawQueryBuilder(getQueryClient(connection), 'select min_age from ages;'),
                    getRawQueryBuilder(getQueryClient(connection), 'select max_age from ages;'),
                ])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNotBetween('my_age', [
                    connection.client!.raw('select min_age from ages;'),
                    connection.client!.raw('select max_age from ages;'),
                ])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add or where not between clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .orWhereNotBetween('age', [18, 20])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .orWhereNotBetween('age', [18, 20])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .orWhereNotBetween('age', [18, 20])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .orWhereNotBetween('my_age', [18, 20])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add or where not between clause as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .orWhereNotBetween('age', [
                    getRawQueryBuilder(getQueryClient(connection), 'select min_age from ages;'),
                    getRawQueryBuilder(getQueryClient(connection), 'select max_age from ages;'),
                ])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .orWhereNotBetween('age', [
                    connection.client!.raw('select min_age from ages;'),
                    connection.client!.raw('select max_age from ages;'),
                ])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .orWhereNotBetween('age', [
                    getRawQueryBuilder(getQueryClient(connection), 'select min_age from ages;'),
                    getRawQueryBuilder(getQueryClient(connection), 'select max_age from ages;'),
                ])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .orWhereNotBetween('my_age', [
                    connection.client!.raw('select min_age from ages;'),
                    connection.client!.raw('select max_age from ages;'),
                ])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | whereRaw', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add where raw clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereRaw('id = ?', [1])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereRaw('id = ?', [1])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add where raw clause without bindings', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereRaw('id = 1')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereRaw('id = 1')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add where raw clause with object of bindings', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereRaw('id = :id', { id: 1 })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereRaw('id = :id', { id: 1 })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
            await connection.disconnect()
        })

        test('add where raw clause from a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereRaw(getRawQueryBuilder(getQueryClient(connection), 'select id from accounts;'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereRaw(connection.client!.raw('select id from accounts;'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add or where raw clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereRaw('id = ?', [1])
                .orWhereRaw('id = ?', [2])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereRaw('id = ?', [1])
                .orWhereRaw('id = ?', [2])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | join', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add query join', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .join('profiles', 'users.id', 'profiles.user_id')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .join('profiles', 'users.id', 'profiles.user_id')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query join with operator', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .join('profiles', 'users.id', '!=', 'profiles.user_id')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .join('profiles', 'users.id', '!=', 'profiles.user_id')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query join using join callback', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .join('profiles', (builder) => {
                    builder.on('users.id', 'profiles.user_id')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .join('profiles', (builder) => {
                    builder.on('users.id', 'profiles.user_id')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query join as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .join('profiles', 'profiles.type', getRawQueryBuilder(getQueryClient(connection), '?', ['social']))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .join('profiles', 'profiles.type', connection.client!.raw('?', ['social']))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query join as a raw builder query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .join('profiles', 'profiles.type', getDb().raw('?', ['social']))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .join('profiles', 'profiles.type', connection.client!.raw('?', ['social']))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | innerJoin', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add query innerJoin', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .innerJoin('profiles', 'users.id', 'profiles.user_id')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .innerJoin('profiles', 'users.id', 'profiles.user_id')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query innerJoin with operator', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .innerJoin('profiles', 'users.id', '!=', 'profiles.user_id')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .innerJoin('profiles', 'users.id', '!=', 'profiles.user_id')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query innerJoin using join callback', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .innerJoin('profiles', (builder) => {
                    builder.on('users.id', 'profiles.user_id')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .innerJoin('profiles', (builder) => {
                    builder.on('users.id', 'profiles.user_id')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query innerJoin as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .innerJoin('profiles', 'profiles.type', getRawQueryBuilder(getQueryClient(connection), '?', ['social']))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .innerJoin('profiles', 'profiles.type', connection.client!.raw('?', ['social']))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query innerJoin as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .innerJoin('profiles', 'profiles.type', getDb().raw('?', ['social']))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .innerJoin('profiles', 'profiles.type', connection.client!.raw('?', ['social']))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | leftJoin', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add query leftJoin', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .leftJoin('profiles', 'users.id', 'profiles.user_id')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .leftJoin('profiles', 'users.id', 'profiles.user_id')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query leftJoin with operator', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .leftJoin('profiles', 'users.id', '!=', 'profiles.user_id')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .leftJoin('profiles', 'users.id', '!=', 'profiles.user_id')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query leftJoin using join callback', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .leftJoin('profiles', (builder) => {
                    builder.on('users.id', 'profiles.user_id')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .leftJoin('profiles', (builder) => {
                    builder.on('users.id', 'profiles.user_id')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query leftJoin as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .leftJoin('profiles', 'profiles.type', getRawQueryBuilder(getQueryClient(connection), '?', ['social']))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .leftJoin('profiles', 'profiles.type', connection.client!.raw('?', ['social']))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | leftOuterJoin', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add query leftOuterJoin', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .leftOuterJoin('profiles', 'users.id', 'profiles.user_id')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .leftOuterJoin('profiles', 'users.id', 'profiles.user_id')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query leftOuterJoin with operator', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .leftOuterJoin('profiles', 'users.id', '!=', 'profiles.user_id')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .leftOuterJoin('profiles', 'users.id', '!=', 'profiles.user_id')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query leftOuterJoin using join callback', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .leftOuterJoin('profiles', (builder) => {
                    builder.on('users.id', 'profiles.user_id')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .leftOuterJoin('profiles', (builder) => {
                    builder.on('users.id', 'profiles.user_id')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query leftOuterJoin as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .leftOuterJoin('profiles', 'profiles.type', getRawQueryBuilder(getQueryClient(connection), '?', ['social']))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .leftOuterJoin('profiles', 'profiles.type', connection.client!.raw('?', ['social']))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | rightJoin', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add query rightJoin', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .rightJoin('profiles', 'users.id', 'profiles.user_id')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .rightJoin('profiles', 'users.id', 'profiles.user_id')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query rightJoin with operator', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .rightJoin('profiles', 'users.id', '!=', 'profiles.user_id')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .rightJoin('profiles', 'users.id', '!=', 'profiles.user_id')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query rightJoin using join callback', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .rightJoin('profiles', (builder) => {
                    builder.on('users.id', 'profiles.user_id')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .rightJoin('profiles', (builder) => {
                    builder.on('users.id', 'profiles.user_id')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query rightJoin as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .rightJoin('profiles', 'profiles.type', getRawQueryBuilder(getQueryClient(connection), '?', ['social']))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .rightJoin('profiles', 'profiles.type', connection.client!.raw('?', ['social']))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | rightOuterJoin', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add query rightOuterJoin', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .rightOuterJoin('profiles', 'users.id', 'profiles.user_id')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .rightOuterJoin('profiles', 'users.id', 'profiles.user_id')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query rightOuterJoin with operator', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .rightOuterJoin('profiles', 'users.id', '!=', 'profiles.user_id')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .rightOuterJoin('profiles', 'users.id', '!=', 'profiles.user_id')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query rightOuterJoin using join callback', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .rightOuterJoin('profiles', (builder) => {
                    builder.on('users.id', 'profiles.user_id')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .rightOuterJoin('profiles', (builder) => {
                    builder.on('users.id', 'profiles.user_id')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query rightOuterJoin as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .rightOuterJoin('profiles', 'profiles.type', getRawQueryBuilder(getQueryClient(connection), '?', ['social']))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .rightOuterJoin('profiles', 'profiles.type', connection.client!.raw('?', ['social']))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | fullOuterJoin', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add query fullOuterJoin', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .fullOuterJoin('profiles', 'users.id', 'profiles.user_id')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .fullOuterJoin('profiles', 'users.id', 'profiles.user_id')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query fullOuterJoin with operator', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .fullOuterJoin('profiles', 'users.id', '!=', 'profiles.user_id')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .fullOuterJoin('profiles', 'users.id', '!=', 'profiles.user_id')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query fullOuterJoin using join callback', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .fullOuterJoin('profiles', (builder) => {
                    builder.on('users.id', 'profiles.user_id')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .fullOuterJoin('profiles', (builder) => {
                    builder.on('users.id', 'profiles.user_id')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query fullOuterJoin as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .fullOuterJoin('profiles', 'profiles.type', getRawQueryBuilder(getQueryClient(connection), '?', ['social']))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .fullOuterJoin('profiles', 'profiles.type', connection.client!.raw('?', ['social']))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | crossJoin', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add query crossJoin', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .crossJoin('profiles', 'users.id', 'profiles.user_id')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .crossJoin('profiles', 'users.id', 'profiles.user_id')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query crossJoin with operator', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .crossJoin('profiles', 'users.id', '!=', 'profiles.user_id')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .crossJoin('profiles', 'users.id', '!=', 'profiles.user_id')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query crossJoin using join callback', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .crossJoin('profiles', (builder) => {
                    builder.on('users.id', 'profiles.user_id')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .crossJoin('profiles', (builder) => {
                    builder.on('users.id', 'profiles.user_id')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add query crossJoin as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .crossJoin('profiles', 'profiles.type', getRawQueryBuilder(getQueryClient(connection), '?', ['social']))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .crossJoin('profiles', 'profiles.type', connection.client!.raw('?', ['social']))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | joinRaw', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add join as a raw join', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .joinRaw('natural full join table1')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .joinRaw('natural full join table1')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add join as a raw join by passing the raw query output', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .joinRaw(getRawQueryBuilder(getQueryClient(connection), 'natural full join table1'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .joinRaw('natural full join table1')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | distinct', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('define distinct columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .distinct('name', 'age')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .distinct('name', 'age')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .distinct('name', 'age')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .distinct('my_name', 'my_age')
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | groupBy', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('define group by columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .groupBy('name', 'age')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .groupBy('name', 'age')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .groupBy('name', 'age')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .groupBy('my_name', 'my_age')
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | groupByRaw', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('define group by columns as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .groupByRaw('select (age) from user_profiles')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .groupByRaw('select (age) from user_profiles')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | orderBy', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('define order by columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .orderBy('name')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .orderBy('name')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .orderBy('name')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .orderBy('my_name')
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('define order by columns with explicit direction', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .orderBy('name', 'desc')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .orderBy('name', 'desc')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .orderBy('name', 'desc')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .orderBy('my_name', 'desc')
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('define order by columns as an array of objects', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .orderBy([{ column: 'name', order: 'desc' }, { column: 'age', order: 'desc' }])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .orderBy([{ column: 'name', order: 'desc' }, { column: 'age', order: 'desc' }])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .orderBy([{ column: 'name', order: 'desc' }, { column: 'age', order: 'desc' }])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .orderBy([{ column: 'name', order: 'desc' }, { column: 'age', order: 'desc' }])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | orderByRaw', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('define order by columns as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .orderByRaw('col DESC NULLS LAST')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .orderByRaw('col DESC NULLS LAST')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })

    describe('Query Builder | offset', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('define select offset', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .offset(10)
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .offset(10)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | limit', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('define results limit', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .limit(10)
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .limit(10)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | union', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        afterEach(async () => {
            await resetTables()
        })

        test('define union query as a callback', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .union((builder) => {
                    builder.select('*').from('users').whereNull('first_name')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .union((builder) => {
                    builder.select('*').from('users').whereNull('first_name')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('define union query as a subquery', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .union(getQueryBuilder(getQueryClient(connection)).from('users').whereNull('first_name'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .union(connection.client!.from('users').whereNull('first_name'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('define union query as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .union(getRawQueryBuilder(getQueryClient(connection), 'select * from users where first_name is null'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .union(connection.client!.raw('select * from users where first_name is null'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('define union query as an array of callbacks', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .union([(builder) => {
                    builder.select('*').from('users').whereNull('first_name')
                }])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .union([(builder) => {
                    builder.select('*').from('users').whereNull('first_name')
                }])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('define union query as an array of subqueries', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .union([getQueryBuilder(getQueryClient(connection)).from('users').whereNull('first_name')])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .union([connection.client!.from('users').whereNull('first_name')])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('define union query as an array of raw queries', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .union([getRawQueryBuilder(getQueryClient(connection), 'select * from users where first_name is null')])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .union([connection.client!.raw('select * from users where first_name is null')])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add limit to union set', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            await getInsertBuilder(getQueryClient(connection)).table('users').multiInsert([
                {
                    username: 'virk',
                    email: 'virk@adonisjs.com',
                },
                {
                    username: 'romain',
                    email: 'romain@adonisjs.com',
                },
                {
                    username: 'nikk',
                    email: 'nikk@adonisjs.com',
                },
            ])

            await getInsertBuilder(getQueryClient(connection)).table('friends').multiInsert([
                {
                    username: 'john',
                },
                {
                    username: 'joe',
                },
                {
                    username: 'virk',
                },
            ])

            const users = await db
                .from((builder) => {
                    builder.select('username').from('users').as('u').union((unionQuery) => {
                        unionQuery.select('username').from('friends')
                    })
                })
                .orderBy('u.username')
                .limit(2)

            expect(users).toHaveLength(2)
            expect(users[0].username).toBe('joe')
            expect(users[1].username).toBe('john')
            await connection.disconnect()
        })

        test('add limit to union subquery', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            await getInsertBuilder(getQueryClient(connection)).table('users').multiInsert([
                {
                    username: 'virk',
                    email: 'virk@adonisjs.com',
                },
                {
                    username: 'romain',
                    email: 'romain@adonisjs.com',
                },
                {
                    username: 'nikk',
                    email: 'nikk@adonisjs.com',
                },
            ])

            await getInsertBuilder(getQueryClient(connection)).table('friends').multiInsert([
                {
                    username: 'john',
                },
                {
                    username: 'joe',
                },
                {
                    username: 'virk',
                },
            ])

            const users = await db
                .from((builder) => {
                    builder.select('username').from('users').as('u').union((unionQuery) => {
                        unionQuery.from((fromBuilder) => {
                            fromBuilder.select('username').from('friends').as('f').orderBy('id', 'asc').limit(2)
                        })
                    })
                })
                .orderBy('u.username')

            expect(users).toHaveLength(5)
            expect(users[0].username).toBe('joe')
            expect(users[1].username).toBe('john')
            expect(users[2].username).toBe('nikk')
            expect(users[3].username).toBe('romain')
            expect(users[4].username).toBe('virk')
            await connection.disconnect()
        })

        test('count union set', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            await getInsertBuilder(getQueryClient(connection)).table('users').multiInsert([
                {
                    username: 'virk',
                    email: 'virk@adonisjs.com',
                },
                {
                    username: 'romain',
                    email: 'romain@adonisjs.com',
                },
                {
                    username: 'nikk',
                    email: 'nikk@adonisjs.com',
                },
            ])

            await getInsertBuilder(getQueryClient(connection)).table('friends').multiInsert([
                {
                    username: 'john',
                },
                {
                    username: 'joe',
                },
                {
                    username: 'virk',
                },
            ])

            const users = await db
                .count('u.username as total')
                .from((builder) => {
                    builder.select('username').from('users').as('u').union((unionQuery) => {
                        unionQuery.select('username').from('friends')
                    })
                })

            expect(Number(users[0].total)).toBe(5)
            await connection.disconnect()
        })

        test('count union set with limit on subquery', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            await getInsertBuilder(getQueryClient(connection)).table('users').multiInsert([
                {
                    username: 'virk',
                    email: 'virk@adonisjs.com',
                },
                {
                    username: 'romain',
                    email: 'romain@adonisjs.com',
                },
                {
                    username: 'nikk',
                    email: 'nikk@adonisjs.com',
                },
            ])

            await getInsertBuilder(getQueryClient(connection)).table('friends').multiInsert([
                {
                    username: 'john',
                },
                {
                    username: 'joe',
                },
                {
                    username: 'virk',
                },
            ])

            const users = await db
                .count('f.username as total')
                .from((builder) => {
                    builder.select('username').from('friends').as('f').union((unionQuery) => {
                        unionQuery.from((fromBuilder) => {
                            fromBuilder.select('username').from('users').as('u').orderBy('id', 'asc').limit(2)
                        })
                    })
                })

            expect(Number(users[0].total)).toBe(4)
            await connection.disconnect()
        })
    })

    describe('Query Builder | unionAll', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('define unionAll query as a callback', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .unionAll((builder) => {
                    builder.select('*').from('users').whereNull('first_name')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .unionAll((builder) => {
                    builder.select('*').from('users').whereNull('first_name')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('define unionAll query as a subquery', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .unionAll(getQueryBuilder(getQueryClient(connection)).from('users').whereNull('first_name'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .unionAll(connection.client!.from('users').whereNull('first_name'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('define unionAll query as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .unionAll(getRawQueryBuilder(getQueryClient(connection), 'select * from users where first_name is null'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .unionAll(connection.client!.raw('select * from users where first_name is null'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('define unionAll query as an array of callbacks', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .unionAll([(builder) => {
                    builder.select('*').from('users').whereNull('first_name')
                }])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .unionAll([(builder) => {
                    builder.select('*').from('users').whereNull('first_name')
                }])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('define unionAll query as an array of subqueries', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .unionAll([getQueryBuilder(getQueryClient(connection)).from('users').whereNull('first_name')])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .unionAll([connection.client!.from('users').whereNull('first_name')])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('define unionAll query as an array of raw queries', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .unionAll([getRawQueryBuilder(getQueryClient(connection), 'select * from users where first_name is null')])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .unionAll([connection.client!.raw('select * from users where first_name is null')])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })

    describe('Query Builder | forUpdate', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('define FOR UPDATE lock', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .forUpdate()
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .forUpdate()
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('define FOR UPDATE lock with additional tables (pg only)', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .forUpdate('profiles')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .forUpdate('profiles')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | forShare', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('define FOR SHARE lock', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .forShare()
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .forShare()
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('define FOR SHARE lock with additional tables (pg only)', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .forShare('profiles')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .forShare('profiles')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    if (['pg', 'mysql'].includes(process.env.DB!)) {
        describe('Query Builder | noWait', () => {
            beforeAll(async () => {
                await setup()
            })

            afterAll(async () => {
                await cleanup()
            })

            test('add no wait instruction to the query', async () => {
                const connection = new Connection('primary', getConfig(), getLogger())
                connection.connect()

                const db = getQueryBuilder(getQueryClient(connection))
                const { sql, bindings } = db
                    .from('users')
                    .forShare()
                    .noWait()
                    .toSQL()

                const { sql: knexSql, bindings: knexBindings } = connection.client!
                    .from('users')
                    .forShare()
                    .noWait()
                    .toSQL()

                expect(sql).toBe(knexSql)
                expect(bindings).toEqual(knexBindings)

                await connection.disconnect()
            })
        })

        describe('Query Builder | skipLocked', () => {
            beforeAll(async () => {
                await setup()
            })

            afterAll(async () => {
                await cleanup()
            })

            test('add skip locked instruction to the query', async () => {
                const connection = new Connection('primary', getConfig(), getLogger())
                connection.connect()

                const db = getQueryBuilder(getQueryClient(connection))
                const { sql, bindings } = db
                    .from('users')
                    .forShare()
                    .skipLocked()
                    .toSQL()

                const { sql: knexSql, bindings: knexBindings } = connection.client!
                    .from('users')
                    .forShare()
                    .skipLocked()
                    .toSQL()

                expect(sql).toBe(knexSql)
                expect(bindings).toEqual(knexBindings)

                await connection.disconnect()
            })
        })
    }

    describe('Query Builder | having', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add having clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .having('count', '>', 10)
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .having('count', '>', 10)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .having('count', '>', 10)
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .having('my_count', '>', 10)
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add having clause as a callback', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .having((builder) => {
                    builder.where('id', '>', 10)
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .having((builder) => {
                    builder.where('id', '>', 10)
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .having((builder) => {
                    builder.where('id', '>', 10)
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .having((builder) => {
                    builder.where('my_id', '>', 10)
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add having clause value being a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()
            const ref = connection.client!.ref.bind(connection.client!)

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .having(
                    'user_id',
                    '=',
                    getRawQueryBuilder(getQueryClient(connection), `(select ${ref('user_id')} from ${ref('accounts')})`),
                )
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .having(
                    'user_id',
                    '=',
                    connection.client!.raw(`(select ${ref('user_id')} from ${ref('accounts')})`),
                )
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .having(
                    'user_id',
                    '=',
                    getRawQueryBuilder(getQueryClient(connection), `(select ${ref('user_id')} from ${ref('accounts')})`),
                )
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .having(
                    'my_user_id',
                    '=',
                    connection.client!.raw(`(select ${ref('user_id')} from ${ref('accounts')})`),
                )
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add having clause value being a sub query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .having(
                    'user_id',
                    '=',
                    getQueryBuilder(getQueryClient(connection)).from('accounts').select('id'),
                )
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .having(
                    'user_id',
                    '=',
                    connection.client!.select('id').from('accounts'),
                )
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .having(
                    'user_id',
                    '=',
                    getQueryBuilder(getQueryClient(connection)).from('accounts').select('id'),
                )
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .having(
                    'my_user_id',
                    '=',
                    connection.client!.select('id').from('accounts'),
                )
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add having clause as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingRaw(getRawQueryBuilder(getQueryClient(connection), 'sum(likes) > ?', [200]))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .having(connection.client!.raw('sum(likes) > ?', [200]))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add having clause as a raw builder query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingRaw(getDb().raw('sum(likes) > ?', [200]))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .having(connection.client!.raw('sum(likes) > ?', [200]))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add or having clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .having('count', '>', 10)
                .orHaving('total', '>', 10)
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .having('count', '>', 10)
                .orHaving('total', '>', 10)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .having('count', '>', 10)
                .orHaving('total', '>', 10)
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .having('my_count', '>', 10)
                .orHaving('my_total', '>', 10)
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | havingIn', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add having in clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingIn('id', [10, 20])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingIn('id', [10, 20])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingIn('id', [10, 20])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .havingIn('my_id', [10, 20])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add having in clause values as subqueries', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingIn('id', [getQueryBuilder(getQueryClient(connection)).select('id').from('accounts')])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingIn('id', [connection.client!.select('id').from('accounts') as any])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingIn('id', [getQueryBuilder(getQueryClient(connection)).select('id').from('accounts')])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .havingIn('my_id', [connection.client!.select('id').from('accounts') as any])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add having in clause values as raw queries', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingIn('id', [getRawQueryBuilder(getQueryClient(connection), 'select id from accounts')])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingIn('id', [connection.client!.raw('select id from accounts')])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingIn('id', [getRawQueryBuilder(getQueryClient(connection), 'select id from accounts')])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .havingIn('my_id', [connection.client!.raw('select id from accounts')])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add having in clause values as query callbacks', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const fn = (builder) => {
                builder.select('id').from('accounts')
            }

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingIn('id', fn)
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingIn('id', fn as any)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingIn('id', fn)
                .toSQL()

            const fnKnex = (builder) => {
                builder.select('my_id').from('accounts')
            }
            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .havingIn('my_id', fnKnex as any)
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add or having in clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingIn('id', [10, 20])
                .orHavingIn('id', [10, 30])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .havingIn('id', [10, 20])
                ['orHavingIn']('id', [10, 30])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingIn('id', [10, 20])
                .orHavingIn('id', [10, 30])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .havingIn('my_id', [10, 20])
                ['orHavingIn']('my_id', [10, 30])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | havingNotIn', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add not having in clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingNotIn('id', [10, 20])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                ['havingNotIn']('id', [10, 20])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingNotIn('id', [10, 20])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                ['havingNotIn']('my_id', [10, 20])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add having in clause values as subqueries', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingNotIn('id', [getQueryBuilder(getQueryClient(connection)).select('id').from('accounts')])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                ['havingNotIn']('id', [connection.client!.select('id').from('accounts') as any])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingNotIn('id', [getQueryBuilder(getQueryClient(connection)).select('id').from('accounts')])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                ['havingNotIn']('my_id', [connection.client!.select('id').from('accounts') as any])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add having in clause values as raw queries', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingNotIn('id', [getRawQueryBuilder(getQueryClient(connection), 'select id from accounts')])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                ['havingNotIn']('id', [connection.client!.raw('select id from accounts')])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingNotIn('id', [getRawQueryBuilder(getQueryClient(connection), 'select id from accounts')])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                ['havingNotIn']('my_id', [connection.client!.raw('select id from accounts')])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add having in clause values as query callbacks', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const fn = (builder) => {
                builder.select('id').from('accounts')
            }

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingNotIn('id', fn)
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                ['havingNotIn']('id', fn as any)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingNotIn('id', fn)
                .toSQL()

            const fnKnex = (builder) => {
                builder.select('my_id').from('accounts')
            }

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                ['havingNotIn']('my_id', fnKnex as any)
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add or having in clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .havingNotIn('id', [10, 20])
                .orHavingNotIn('id', [10, 30])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                ['havingNotIn']('id', [10, 20])
                ['orHavingNotIn']('id', [10, 30])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${key}`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .havingNotIn('id', [10, 20])
                .orHavingNotIn('id', [10, 30])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                ['havingNotIn']('my_id', [10, 20])
                ['orHavingNotIn']('my_id', [10, 30])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)
            await connection.disconnect()
        })
    })
})
