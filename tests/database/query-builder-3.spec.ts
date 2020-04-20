/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 8:17 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import { Connection } from '../../src/Connection/Connection';
import {
    cleanup,
    getBaseModel,
    getConfig,
    getDb,
    getInsertBuilder,
    getLogger,
    getQueryBuilder,
    getQueryClient,
    getRawQueryBuilder,
    getUsers,
    resetTables,
    setup
} from '../helpers';

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Query Builder Three', () => {
    describe('Query Builder | min', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('use min function', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .min('*', 'smallest')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .min('*', { as: 'smallest' })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .min('*', 'smallest')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .min('*', { as: 'smallest' })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use min function for multiple times', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .min({ u: 'username', e: 'email' })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .min({ u: 'username', e: 'email' })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .min({ u: 'username', e: 'email' })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .min({ u: 'my_username', e: 'my_email' })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use raw queries to compute min', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .min(
                    getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    'u'
                )
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .min({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true])
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .min(
                    getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    'u'
                )
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .min({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true])
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use subqueries to compute min', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .min(getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'), 'u')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .min({
                    u: connection.client!.where('is_verified', true).from('profiles')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .min(getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'), 'u')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .min({
                    u: connection.client!.where('is_verified', true).from('profiles')
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use raw query to compute min with multiple columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .min({
                    u: getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .min({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                    e: 'email'
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .min({
                    u: getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .min({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                    e: 'my_email'
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use subquery to compute min with multiple columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .min({
                    u: getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .min({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                    e: 'email'
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .min({
                    u: getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .min({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                    e: 'my_email'
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)
            await connection.disconnect()
        })
    })

    describe('Query Builder | max', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('use max function', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .max('*', 'biggest')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .max('*', { as: 'biggest' })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .max('*', 'biggest')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .max('*', { as: 'biggest' })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use max function for multiple times', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .max({ u: 'username', e: 'email' })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .max({ u: 'username', e: 'email' })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .max({ u: 'username', e: 'email' })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .max({ u: 'my_username', e: 'my_email' })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use raw queries to compute max', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .max(
                    getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    'u'
                )
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .max({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true])
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .max(
                    getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    'u'
                )
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .max({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true])
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use subqueries to compute max', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .max(getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'), 'u')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .max({
                    u: connection.client!.where('is_verified', true).from('profiles')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .max(getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'), 'u')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .max({
                    u: connection.client!.where('is_verified', true).from('profiles')
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use raw query to compute max with multiple columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .max({
                    u: getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .max({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                    e: 'email'
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .max({
                    u: getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .max({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                    e: 'my_email'
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use subquery to compute max with multiple columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .max({
                    u: getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .max({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                    e: 'email'
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .max({
                    u: getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .max({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                    e: 'my_email'
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | sum', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('use sum function', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .sum('*', 'total')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .sum('*', { as: 'total' })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .sum('*', 'total')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .sum('*', { as: 'total' })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use sum function for multiple times', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .sum({ u: 'username', e: 'email' })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .sum({ u: 'username', e: 'email' })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .sum({ u: 'username', e: 'email' })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .sum({ u: 'my_username', e: 'my_email' })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use raw queries to compute sum', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .sum(
                    getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    'u'
                )
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .sum({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true])
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .sum(
                    getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    'u'
                )
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .sum({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true])
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use subqueries to compute sum', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .sum(getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'), 'u')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .sum({
                    u: connection.client!.where('is_verified', true).from('profiles')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .sum(getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'), 'u')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .sum({
                    u: connection.client!.where('is_verified', true).from('profiles')
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use raw query to compute sum with multiple columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .sum({
                    u: getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .sum({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                    e: 'email'
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .sum({
                    u: getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .sum({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                    e: 'my_email'
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use subquery to compute sum with multiple columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .sum({
                    u: getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .sum({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                    e: 'email'
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .sum({
                    u: getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .sum({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                    e: 'my_email'
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)
            await connection.disconnect()
        })
    })

    describe('Query Builder | avg', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('use avg function', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .avg('*', 'avg')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .avg('*', { as: 'avg' })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .avg('*', 'avg')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .avg('*', { as: 'avg' })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use avg function for multiple fields', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .avg({ u: 'username', e: 'email' })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .avg({ u: 'username', e: 'email' })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .avg({ u: 'username', e: 'email' })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .avg({ u: 'my_username', e: 'my_email' })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use raw queries to compute avg', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .avg(
                    getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    'u'
                )
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .avg({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true])
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .avg(
                    getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    'u'
                )
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .avg({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true])
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use subqueries to compute avg', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .avg(getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'), 'u')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .avg({
                    u: connection.client!.where('is_verified', true).from('profiles')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .avg(getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'), 'u')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .avg({
                    u: connection.client!.where('is_verified', true).from('profiles')
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use raw query to compute avg with multiple columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .avg({
                    u: getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .avg({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                    e: 'email'
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .avg({
                    u: getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .avg({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                    e: 'my_email'
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use subquery to compute avg with multiple columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .avg({
                    u: getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .avg({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                    e: 'email'
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .avg({
                    u: getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .avg({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                    e: 'my_email'
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | avgDistinct', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('use avgDistinct function', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .avgDistinct('*', 'avgDistinct')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .avgDistinct('*', { as: 'avgDistinct' })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .avgDistinct('*', 'avgDistinct')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .avgDistinct('*', { as: 'avgDistinct' })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use avgDistinct function for multiple times', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .avgDistinct({ u: 'username', e: 'email' })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .avgDistinct({ u: 'username', e: 'email' })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .avgDistinct({ u: 'username', e: 'email' })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .avgDistinct({ u: 'my_username', e: 'my_email' })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use raw queries to compute avgDistinct', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .avgDistinct(
                    getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    'u'
                )
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .avgDistinct({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true])
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .avgDistinct(
                    getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    'u'
                )
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .avgDistinct({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true])
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use subqueries to compute avgDistinct', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .avgDistinct(getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'), 'u')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .avgDistinct({
                    u: connection.client!.where('is_verified', true).from('profiles')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .avgDistinct(getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'), 'u')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .avgDistinct({
                    u: connection.client!.where('is_verified', true).from('profiles')
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use raw query to compute avgDistinct with multiple columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .avgDistinct({
                    u: getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .avgDistinct({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                    e: 'email'
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .avgDistinct({
                    u: getRawQueryBuilder(getQueryClient(connection), 'select * from profiles where is_verified = ?', [true]),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .avgDistinct({
                    u: connection.client!.raw('select * from profiles where is_verified = ?', [true]),
                    e: 'my_email'
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('use subquery to compute avgDistinct with multiple columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .avgDistinct({
                    u: getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .avgDistinct({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                    e: 'email'
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .avgDistinct({
                    u: getQueryBuilder(getQueryClient(connection)).where('is_verified', true).from('profiles'),
                    e: 'email'
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .avgDistinct({
                    u: connection.client!.where('is_verified', true).from('profiles'),
                    e: 'my_email'
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | paginate', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        afterEach(async () => {
            await resetTables()
        })

        test('paginate through rows', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            await getInsertBuilder(getQueryClient(connection)).table('users').multiInsert(getUsers(18))

            const users = await db.from('users').paginate(1, 5)
            users.baseUrl('/users')

            expect(users.all()).toHaveLength(5)
            expect(users.perPage).toBe(5)
            expect(users.currentPage).toBe(1)
            expect(users.lastPage).toBe(4)
            expect(users.hasPages).toBeTruthy()
            expect(users.hasMorePages).toBeTruthy()
            expect(users.isEmpty).toBeFalsy()
            expect(users.total).toBe(18)
            expect(users.hasTotal).toBeTruthy()

            expect(users.getMeta()).toEqual({
                total: 18,
                per_page: 5,
                current_page: 1,
                last_page: 4,
                first_page: 1,
                first_page_url: '/users?page=1',
                last_page_url: '/users?page=4',
                next_page_url: '/users?page=2',
                previous_page_url: null
            })

            await connection.disconnect()
        })

        test('paginate through rows and select columns', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            await getInsertBuilder(getQueryClient(connection)).table('users').multiInsert(getUsers(18))

            const users = await db.from('users').select('username').paginate(1, 5)
            users.baseUrl('/users')

            expect(users.all()).toHaveLength(5)
            // assert.notProperty(users.all()[0], 'id')
            expect(users.all()[0]).not.toHaveProperty('id');
            expect(users.perPage).toBe(5)
            expect(users.currentPage).toBe(1)
            expect(users.lastPage).toBe(4)
            expect(users.hasPages).toBeTruthy()
            expect(users.hasMorePages).toBeTruthy()
            expect(users.isEmpty).toBeFalsy()
            expect(users.total).toBe(18)
            expect(users.hasTotal).toBeTruthy()
            expect(users.getMeta()).toEqual({
                total: 18,
                per_page: 5,
                current_page: 1,
                last_page: 4,
                first_page: 1,
                first_page_url: '/users?page=1',
                last_page_url: '/users?page=4',
                next_page_url: '/users?page=2',
                previous_page_url: null
            })

            await connection.disconnect()
        })

        test('paginate through rows when there is orderBy clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            await getInsertBuilder(getQueryClient(connection)).table('users').multiInsert(getUsers(18))

            const users = await db.from('users').orderBy('username').paginate(1, 5)
            users.baseUrl('/users')

            expect(users.all()).toHaveLength(5)
            expect(users.perPage).toBe(5)
            expect(users.currentPage).toBe(1)
            expect(users.lastPage).toBe(4)
            expect(users.hasPages).toBeTruthy()
            expect(users.hasMorePages).toBeTruthy()
            expect(users.isEmpty).toBeFalsy()
            expect(users.total).toBe(18)
            expect(users.hasTotal).toBeTruthy()
            expect(users.getMeta()).toEqual({
                total: 18,
                per_page: 5,
                current_page: 1,
                last_page: 4,
                first_page: 1,
                first_page_url: '/users?page=1',
                last_page_url: '/users?page=4',
                next_page_url: '/users?page=2',
                previous_page_url: null
            })

            await connection.disconnect()
        })

        test('paginate through rows for the last page', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            await getInsertBuilder(getQueryClient(connection)).table('users').multiInsert(getUsers(18))

            const users = await db.from('users').orderBy('username').paginate(4, 5)
            users.baseUrl('/users')

            expect(users.all()).toHaveLength(3)
            expect(users.perPage).toBe(5)
            expect(users.currentPage).toBe(4)
            expect(users.lastPage).toBe(4)
            expect(users.hasPages).toBeTruthy()
            expect(users.hasMorePages).toBeFalsy()
            expect(users.isEmpty).toBeFalsy()
            expect(users.total).toBe(18)
            expect(users.hasTotal).toBeTruthy()

            expect(users.getMeta()).toEqual({
                total: 18,
                per_page: 5,
                current_page: 4,
                last_page: 4,
                first_page: 1,
                first_page_url: '/users?page=1',
                last_page_url: '/users?page=4',
                next_page_url: null,
                previous_page_url: '/users?page=3'
            })

            await connection.disconnect()
        })

        test('paginate through rows with group by clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            await getInsertBuilder(getQueryClient(connection)).table('users').multiInsert(getUsers(18))

            const users = await db
                .from('users')
                .select('username')
                .orderBy('username')
                .groupBy('username')
                .paginate(1, 5)

            users.baseUrl('/users')

            expect(users.all()).toHaveLength(5)
            expect(users.perPage).toBe(5)
            expect(users.currentPage).toBe(1)
            expect(users.lastPage).toBe(4)
            expect(users.hasPages).toBeTruthy()
            expect(users.hasMorePages).toBeTruthy()
            expect(users.isEmpty).toBeFalsy()
            expect(users.total).toBe(18)
            expect(users.hasTotal).toBeTruthy()
            expect(users.getMeta()).toEqual({
                total: 18,
                per_page: 5,
                current_page: 1,
                last_page: 4,
                first_page: 1,
                first_page_url: '/users?page=1',
                last_page_url: '/users?page=4',
                next_page_url: '/users?page=2',
                previous_page_url: null
            })

            await connection.disconnect()
        })

        test('generate range of pagination urls', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            await getInsertBuilder(getQueryClient(connection)).table('users').multiInsert(getUsers(18))

            const users = await db.from('users').paginate(1, 5)
            users.baseUrl('/users')

            expect(users.getUrlsForRange(1, 4)).toEqual([
                {
                    url: '/users?page=1',
                    page: 1
                },
                {
                    url: '/users?page=2',
                    page: 2
                },
                {
                    url: '/users?page=3',
                    page: 3
                },
                {
                    url: '/users?page=4',
                    page: 4
                }
            ])

            await connection.disconnect()
        })
    })

    describe('Query Builder | clone', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        afterEach(async () => {
            await resetTables()
        })

        test('clone query builder', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))

            const clonedQuery = db.from('users').clone()
            expect(clonedQuery).toEqual(db)
            await connection.disconnect()
        })

        test('copy internal to the cloned query builder', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))

            const clonedQuery = db.from('users').groupBy('id').clone()
            expect(clonedQuery.hasGroupBy).toBeTruthy()
            await connection.disconnect()
        })
    })
})
