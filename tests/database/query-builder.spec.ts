/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 7:58 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Connection } from '../../src/Connection/Connection';
import { DatabaseQueryBuilder } from '../../src/Database/QueryBuilder/DatabaseQueryBuilder';
import { QueryRunner } from '../../src/QueryRunner/QueryRunner';
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

describe('Query Builder', () => {
    if ( process.env.DB !== 'sqlite' ) {
        describe('Query Builder | client', () => {
            beforeAll(async () => {
                await setup()
            })

            afterAll(async () => {
                await cleanup()
            })

            afterEach(async () => {
                await resetTables()
            })

            test('use read client when making select query', async () => {
                expect.assertions(1)
                const connection = new Connection('primary', getConfig(), getLogger())
                connection.connect()

                const client = getQueryClient(connection)
                const db = getQueryBuilder(client)

                client.getReadClient = function getReadClient() {
                    expect(true).toBeTruthy()
                    return this.connection.client
                }

                await new QueryRunner(client, null).run(db.select('*').from('users').knexQuery)
                await connection.disconnect()
            })

            test('use write client for update', async () => {
                expect.assertions(1)
                const connection = new Connection('primary', getConfig(), getLogger())
                connection.connect()

                const client = getQueryClient(connection)
                const db = getQueryBuilder(client)

                client.getWriteClient = function getWriteClient() {
                    expect(true).toBeTruthy()
                    return this.connection.client
                }

                await new QueryRunner(client, null).run(db.from('users').update('username', 'virk').knexQuery)
                await connection.disconnect()
            })

            test('use write client for delete', async () => {
                expect.assertions(1)
                const connection = new Connection('primary', getConfig(), getLogger())
                connection.connect()

                const client = getQueryClient(connection)
                const db = getQueryBuilder(client)

                client.getWriteClient = function getWriteClient() {
                    expect(true).toBeTruthy()
                    return this.connection.client
                }

                await new QueryRunner(client, null).run(db.from('users').del().knexQuery)
                await connection.disconnect()
            })

            test('use write client for inserts', async () => {
                expect.assertions(1)
                const connection = new Connection('primary', getConfig(), getLogger())
                connection.connect()

                const client = getQueryClient(connection)
                const db = getInsertBuilder(client)

                client.getWriteClient = function getWriteClient() {
                    expect(true).toBeTruthy()
                    return this.connection.client
                }

                await new QueryRunner(client, null).run(db.table('users').insert({ username: 'virk' }).knexQuery)
                await connection.disconnect()
            })

            test('use transaction client when query is used inside a transaction', async () => {
                const connection = new Connection('primary', getConfig(), getLogger())
                connection.connect()

                const client = getQueryClient(connection)
                const db = getQueryBuilder(client)

                client.getReadClient = function getReadClient() {
                    throw new Error('Never expected to reach here')
                }

                const trx = await client.transaction()
                await new QueryRunner(client, null).run(db.select('*').from('users').useTransaction(trx).knexQuery)
                await trx.commit()
                await connection.disconnect()
            })

            test('use transaction client when insert query is used inside a transaction', async () => {
                const connection = new Connection('primary', getConfig(), getLogger())
                connection.connect()

                const client = getQueryClient(connection)
                const db = getInsertBuilder(client)

                client.getReadClient = function getReadClient() {
                    throw new Error('Never expected to reach here')
                }

                const trx = await client.transaction()

                await new QueryRunner(client, null)
                    .run(db.table('users').useTransaction(trx).insert({ username: 'virk' }).knexQuery)

                await trx.rollback()
                await connection.disconnect()
            })

            test('use transaction client when query is issued from transaction client', async () => {
                const connection = new Connection('primary', getConfig(), getLogger())
                connection.connect()

                const client = getQueryClient(connection)

                client.getReadClient = function getReadClient() {
                    throw new Error('Never expected to reach here')
                }

                const trx = await client.transaction()
                await new QueryRunner(client, null).run(trx.query().select('*').from('users').knexQuery)
                await trx.commit()
                await connection.disconnect()
            })

            test('use transaction client when insert query is issued from transaction client', async () => {
                const connection = new Connection('primary', getConfig(), getLogger())
                connection.connect()

                const client = getQueryClient(connection)

                const trx = await client.transaction()
                trx.getReadClient = function getReadClient() {
                    throw new Error('Never expected to reach here')
                }

                await new QueryRunner(trx, null)
                    .run(trx.insertQuery().table('users').insert({ username: 'virk' }).knexQuery)
                await trx.commit()
            })
        })
    }

    describe('Query Builder | from', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('define query table', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db.from('users').toSQL()
            const { sql: knexSql, bindings: knexBindings } = connection.client!.from('users').toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
            await connection.disconnect()
        })

        test('define table alias', () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db.from({ u: 'users' }).toSQL()
            const { sql: knexSql, bindings: knexBindings } = connection.client!.from({ u: 'users' }).toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })

    describe('Query Builder | select', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('define columns as array', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db.from('users').select(['username']).toSQL()
            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .select('username')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
            await connection.disconnect()
        })

        test('define columns with aliases', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db.from('users').select(['username as u']).toSQL()
            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .select('username as u')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
            await connection.disconnect()
        })

        test('define columns as multiple arguments', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db.from('users').select(
                'username',
                'email'
            ).toSQL()
            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .select('username', 'email')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
            await connection.disconnect()
        })

        test('define columns as multiple arguments with aliases', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db.from('users').select(
                'username as u',
                'email as e'
            ).toSQL()
            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .select('username as u', 'email as e')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
            await connection.disconnect()
        })

        test('define columns as subqueries', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const db1 = getQueryBuilder(getQueryClient(connection))

            const { sql, bindings } = db.from('users').select(
                db1.from('addresses').count('* as total').as('addresses_total')
            ).toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .select(
                    connection.client!.from('addresses').count('* as total').as('addresses_total')
                )
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
            await connection.disconnect()
        })

        test('define columns as subqueries inside an array', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const db1 = getQueryBuilder(getQueryClient(connection))

            const { sql, bindings } = db.from('users').select([
                db1.from('addresses').count('* as total').as('addresses_total')
            ]).toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .select(
                    connection.client!.from('addresses').count('* as total').as('addresses_total')
                )
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
            await connection.disconnect()
        })
    })

    describe('Query Builder | where', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add where clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .where('username', 'virk')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .where('username', 'virk')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            /**
             * Using keys resolver
             */
            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`
            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .where('username', 'virk')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .where('my_username', 'virk')
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)
            await connection.disconnect()
        })

        test('add where clause as an object', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .where({ username: 'virk', age: 22 })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .where({ username: 'virk', age: 22 })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .where({ username: 'virk', age: 22 })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .where({ my_username: 'virk', my_age: 22 })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)
            await connection.disconnect()
        })

        test('add where wrapped clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .where((builder) => builder.where('username', 'virk'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .where((builder) => builder.where('username', 'virk'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .where((builder) => builder.where('username', 'virk'))
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .where((builder) => builder.where('my_username', 'virk'))
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)
            await connection.disconnect()
        })

        test('add where clause with operator', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .where('age', '>', 22)
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .where('age', '>', 22)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .where('age', '>', 22)
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .where('my_age', '>', 22)
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)
            await connection.disconnect()
        })

        test('add where clause as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .where('age', '>', getRawQueryBuilder(getQueryClient(connection), 'select min_age from ages limit 1;'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .where('age', '>', connection.client!.raw('select min_age from ages limit 1;'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
            await connection.disconnect()
        })

        test('add where clause as a raw builder query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .where('age', '>', getDb().raw('select min_age from ages limit 1;'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .where('age', '>', connection.client!.raw('select min_age from ages limit 1;'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
            await connection.disconnect()
        })

        test('add orWhere clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .where('age', '>', 22)
                .orWhere('age', 18)
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .where('age', '>', 22)
                .orWhere('age', 18)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .where('age', '>', 22)
                .orWhere('age', 18)
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .where('my_age', '>', 22)
                .orWhere('my_age', 18)
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add orWhere wrapped clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .where('age', '>', 22)
                .orWhere((builder) => {
                    expect(builder).toBeInstanceOf(DatabaseQueryBuilder)
                    builder.where('age', 18)
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .where('age', '>', 22)
                .orWhere((builder) => {
                    builder.where('age', 18)
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .where('age', '>', 22)
                .orWhere((builder) => {
                    expect(builder).toBeInstanceOf(DatabaseQueryBuilder)
                    builder.where('age', 18)
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .where('my_age', '>', 22)
                .orWhere((builder) => {
                    builder.where('my_age', 18)
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add where clause using ref', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .where('username', 'virk')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .where('username', 'virk')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            /**
             * Using keys resolver
             */
            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`
            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .where('username', getDb().ref('foo.username'))
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .where('my_username', connection.client!.ref('foo.username'))
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)
            await connection.disconnect()
        })
    })

    describe('Query Builder | whereNot', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add where not clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNot('username', 'virk')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNot('username', 'virk')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNot('username', 'virk')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNot('my_username', 'virk')
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add where not clause as an object', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNot({ username: 'virk', age: 22 })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNot({ username: 'virk', age: 22 })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNot({ username: 'virk', age: 22 })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNot({ my_username: 'virk', my_age: 22 })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)
            await connection.disconnect()
        })

        test('add where not wrapped clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNot((builder) => builder.where('username', 'virk'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNot((builder) => builder.where('username', 'virk'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNot((builder) => builder.where('username', 'virk'))
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNot((builder) => builder.where('my_username', 'virk'))
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add where not clause with operator', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNot('age', '>', 22)
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNot('age', '>', 22)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNot('age', '>', 22)
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNot('my_age', '>', 22)
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add where not clause as a raw query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNot('age', '>', getRawQueryBuilder(getQueryClient(connection), 'select min_age from ages limit 1;'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNot('age', '>', connection.client!.raw('select min_age from ages limit 1;'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNot(
                    'age', '>', getRawQueryBuilder(getQueryClient(connection), 'select min_age from ages limit 1;')
                )
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNot('my_age', '>', connection.client!.raw('select min_age from ages limit 1;'))
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add where not clause as a raw builder query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNot('age', '>', getDb().raw('select min_age from ages limit 1;'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNot('age', '>', connection.client!.raw('select min_age from ages limit 1;'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNot(
                    'age', '>', getDb().raw('select min_age from ages limit 1;')
                )
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNot('my_age', '>', connection.client!.raw('select min_age from ages limit 1;'))
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add orWhereNot clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNot('age', '>', 22)
                .orWhereNot('age', 18)
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNot('age', '>', 22)
                .orWhereNot('age', 18)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNot('age', '>', 22)
                .orWhereNot('age', 18)
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNot('my_age', '>', 22)
                .orWhereNot('my_age', 18)
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add orWhereNot wrapped clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .where('age', '>', 22)
                .orWhereNot((builder) => {
                    expect(builder).toBeInstanceOf(DatabaseQueryBuilder)
                    builder.where('age', 18)
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .where('age', '>', 22)
                .orWhereNot((builder) => {
                    builder.where('age', 18)
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .where('age', '>', 22)
                .orWhereNot((builder) => {
                    expect(builder).toBeInstanceOf(DatabaseQueryBuilder)
                    builder.where('age', 18)
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .where('my_age', '>', 22)
                .orWhereNot((builder) => {
                    builder.where('my_age', 18)
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | whereIn', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add whereIn clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereIn('username', ['virk', 'nikk'])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereIn('username', ['virk', 'nikk'])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereIn('username', ['virk', 'nikk'])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereIn('my_username', ['virk', 'nikk'])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)
            await connection.disconnect()
        })

        test('add whereIn as a query callback', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereIn('username', (builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereIn('username', (builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereIn('username', (builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereIn('my_username', (builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)
            await connection.disconnect()
        })

        test('add whereIn as a subquery', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereIn('username', getQueryBuilder(getQueryClient(connection)).select('id').from('accounts'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereIn('username', connection.client!.select('id').from('accounts'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereIn('username', getQueryBuilder(getQueryClient(connection)).select('id').from('accounts'))
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereIn('my_username', connection.client!.select('id').from('accounts'))
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)
            await connection.disconnect()
        })

        test('add whereIn as a rawquery', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const ref = connection.client!.ref.bind(connection.client!)

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereIn('username', [
                    getRawQueryBuilder(getQueryClient(connection), `select ${ ref('id') } from ${ ref('accounts') }`)
                ])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereIn('username', [
                    connection.client!.raw(`select ${ ref('id') } from ${ ref('accounts') }`)
                ])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereIn('username', [
                    getRawQueryBuilder(getQueryClient(connection), `select ${ ref('id') } from ${ ref('accounts') }`)
                ])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereIn('my_username', [
                    connection.client!.raw(`select ${ ref('id') } from ${ ref('accounts') }`)
                ])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add whereIn as a raw builder query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const ref = connection.client!.ref.bind(connection.client!)

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereIn('username', [
                    getDb().raw(`select ${ ref('id') } from ${ ref('accounts') }`)
                ])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereIn('username', [
                    connection.client!.raw(`select ${ ref('id') } from ${ ref('accounts') }`)
                ])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereIn('username', [
                    getDb().raw(`select ${ ref('id') } from ${ ref('accounts') }`)
                ])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereIn('my_username', [
                    connection.client!.raw(`select ${ ref('id') } from ${ ref('accounts') }`)
                ])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add whereIn as a subquery with array of keys', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereIn(
                    ['username', 'email'],
                    getQueryBuilder(getQueryClient(connection)).select('username', 'email').from('accounts')
                )
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereIn(['username', 'email'], connection.client!.select('username', 'email').from('accounts'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereIn(
                    ['username', 'email'],
                    getQueryBuilder(getQueryClient(connection)).select('username', 'email').from('accounts')
                )
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereIn(
                    ['my_username', 'my_email'], connection.client!.select('username', 'email').from('accounts')
                )
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add whereIn as a 2d array', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereIn(['username', 'email'], [['foo', 'bar']])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereIn(['username', 'email'], [['foo', 'bar']])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereIn(['username', 'email'], [['foo', 'bar']])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereIn(['my_username', 'my_email'], [['foo', 'bar']])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add orWhereIn clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereIn('username', ['virk', 'nikk'])
                .orWhereIn('username', ['foo'])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereIn('username', ['virk', 'nikk'])
                .orWhereIn('username', ['foo'])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereIn('username', ['virk', 'nikk'])
                .orWhereIn('username', ['foo'])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereIn('my_username', ['virk', 'nikk'])
                .orWhereIn('my_username', ['foo'])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add orWhereIn as a query callback', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereIn('username', (builder) => {
                    builder.from('accounts')
                })
                .orWhereIn('username', (builder) => {
                    builder.from('employees')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereIn('username', (builder) => {
                    builder.from('accounts')
                })
                .orWhereIn('username', (builder) => {
                    builder.from('employees')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereIn('username', (builder) => {
                    builder.from('accounts')
                })
                .orWhereIn('username', (builder) => {
                    builder.from('employees')
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereIn('my_username', (builder) => {
                    builder.from('accounts')
                })
                .orWhereIn('my_username', (builder) => {
                    builder.from('employees')
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | whereNotIn', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add whereNotIn clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNotIn('username', ['virk', 'nikk'])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNotIn('username', ['virk', 'nikk'])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNotIn('username', ['virk', 'nikk'])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNotIn('my_username', ['virk', 'nikk'])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)
            await connection.disconnect()
        })

        test('add whereNotIn as a query callback', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNotIn('username', (builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNotIn('username', (builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNotIn('username', (builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNotIn('my_username', (builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)
            await connection.disconnect()
        })

        test('add whereNotIn as a sub query', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNotIn('username', getQueryBuilder(getQueryClient(connection)).select('username').from('accounts'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNotIn('username', connection.client!.select('username').from('accounts'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNotIn('username', getQueryBuilder(getQueryClient(connection)).select('username').from('accounts'))
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNotIn('my_username', connection.client!.select('username').from('accounts'))
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)
            await connection.disconnect()
        })

        test('add whereNotIn as a 2d array', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNotIn(['username', 'email'], [['foo', 'bar']])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNotIn(['username', 'email'], [['foo', 'bar']])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNotIn(['username', 'email'], [['foo', 'bar']])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNotIn(['my_username', 'my_email'], [['foo', 'bar']])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add orWhereNotIn clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNotIn('username', ['virk', 'nikk'])
                .orWhereNotIn('username', ['foo'])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNotIn('username', ['virk', 'nikk'])
                .orWhereNotIn('username', ['foo'])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNotIn('username', ['virk', 'nikk'])
                .orWhereNotIn('username', ['foo'])
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNotIn('my_username', ['virk', 'nikk'])
                .orWhereNotIn('my_username', ['foo'])
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add orWhereNotIn as a subquery', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNotIn('username', (builder) => {
                    builder.from('accounts')
                })
                .orWhereNotIn('username', (builder) => {
                    builder.from('employees')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNotIn('username', (builder) => {
                    builder.from('accounts')
                })
                .orWhereNotIn('username', (builder) => {
                    builder.from('employees')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNotIn('username', (builder) => {
                    builder.from('accounts')
                })
                .orWhereNotIn('username', (builder) => {
                    builder.from('employees')
                })
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNotIn('my_username', (builder) => {
                    builder.from('accounts')
                })
                .orWhereNotIn('my_username', (builder) => {
                    builder.from('employees')
                })
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | whereNull', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add where null clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNull('deleted_at')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNull('deleted_at')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNull('deleted_at')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNull('my_deleted_at')
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add or where null clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNull('deleted_at')
                .orWhereNull('updated_at')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNull('deleted_at')
                .orWhereNull('updated_at')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNull('deleted_at')
                .orWhereNull('updated_at')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNull('my_deleted_at')
                .orWhereNull('my_updated_at')
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | whereNotNull', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add where not null clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNotNull('deleted_at')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNotNull('deleted_at')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNotNull('deleted_at')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNotNull('my_deleted_at')
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })

        test('add or where not null clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            let db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNotNull('deleted_at')
                .orWhereNotNull('updated_at')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNotNull('deleted_at')
                .orWhereNotNull('updated_at')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            db = getQueryBuilder(getQueryClient(connection))
            db.keysResolver = (key) => `my_${ key }`

            const { sql: resolverSql, bindings: resolverBindings } = db
                .from('users')
                .whereNotNull('deleted_at')
                .orWhereNotNull('updated_at')
                .toSQL()

            const { sql: knexResolverSql, bindings: knexResolverBindings } = connection.client!
                .from('users')
                .whereNotNull('my_deleted_at')
                .orWhereNotNull('my_updated_at')
                .toSQL()

            expect(resolverSql).toBe(knexResolverSql)
            expect(resolverBindings).toEqual(knexResolverBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | whereExists', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add where exists clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereExists((builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereExists((builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
            await connection.disconnect()
        })

        test('add where exists clause as a subquery', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereExists(getQueryBuilder(getQueryClient(connection)).from('accounts'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereExists(connection.client!.from('accounts'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add or where exists clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .orWhereExists((builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .orWhereExists((builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add or where exists clause as a subquery', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .orWhereExists(getQueryBuilder(getQueryClient(connection)).from('accounts'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .orWhereExists(connection.client!.from('accounts'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })

    describe('Query Builder | whereNotExists', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        test('add where exists clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNotExists((builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNotExists((builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add where exists clause as a subquery', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .whereNotExists(getQueryBuilder(getQueryClient(connection)).from('accounts'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .whereNotExists(connection.client!.from('accounts'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add or where exists clause', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .orWhereNotExists((builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .orWhereNotExists((builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })

        test('add or where exists clause as a subquery', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db = getQueryBuilder(getQueryClient(connection))
            const { sql, bindings } = db
                .from('users')
                .orWhereNotExists(getQueryBuilder(getQueryClient(connection)).from('accounts'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = connection.client!
                .from('users')
                .orWhereNotExists(connection.client!.from('accounts'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            await connection.disconnect()
        })
    })
})
