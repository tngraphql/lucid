/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 8:34 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */


import { resolveClientNameWithAliases } from 'knex/lib/helpers'
import { Connection } from '../../src/Connection/Connection';
import { QueryClient } from '../../src/QueryClient/QueryClient';
import { cleanup, getConfig, getEmitter, getLogger, resetTables, setup } from '../helpers';

describe('Query client', () => {
    describe('Query client', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        afterEach(async () => {
            await resetTables()
        })

        test('get query client in dual mode', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const client = new QueryClient('dual', connection, getEmitter())
            expect(client.mode).toBe('dual')
            await connection.disconnect()
        })

        test('get query client in read only mode', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const client = new QueryClient('read', connection, getEmitter())
            expect(client.mode).toBe('read')
            await connection.disconnect()
        })

        test('get query client in write only mode', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const client = new QueryClient('write', connection, getEmitter())
            expect(client.mode).toBe('write')
            await connection.disconnect()
        })

        test('get columns info', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const client = new QueryClient('write', connection, getEmitter())
            const columns = await client.columnsInfo('users')
            expect(Object.keys(columns)).toEqual([
                'id',
                'country_id',
                'username',
                'email',
                'points',
                'joined_at',
                'created_at',
                'updated_at'
            ])
        })

        test('get single column info', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const client = new QueryClient('write', connection, getEmitter())
            const column = await client.columnsInfo('users', 'id')

            expect(['integer', 'int'].includes(column.type)).toBeTruthy();
        })

        if ( process.env.DB !== 'mssql' ) {
            test('truncate table with cascade', async () => {
                const connection = new Connection('primary', getConfig(), getLogger())
                connection.connect()

                /**
                 * Create tables
                 */
                await connection.client?.schema.createTableIfNotExists('test_users', (table) => {
                    table.increments('id').primary()
                    table.string('username')
                })
                await connection.client?.schema.createTableIfNotExists('test_profiles', (table) => {
                    table.increments('id').primary()
                    table.integer('user_id').unsigned().references('test_users.id').onDelete('CASCADE')
                })

                /**
                 * Insert table
                 */
                const returnValues = await connection.client?.table('test_users').insert({ username: 'virk' })
                await connection.client?.table('test_profiles').insert({ user_id: returnValues![0] })

                /**
                 * Truncate
                 */
                const client = new QueryClient('write', connection, getEmitter())
                await client.truncate('test_users', true)

                /**
                 * Drop tables
                 */
                await connection.client?.schema.dropTable('test_profiles')
                await connection.client?.schema.dropTable('test_users')
            })
        }
    })

    describe('Query client | dual mode', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        afterEach(async () => {
            await resetTables()
        })

        test('perform select queries in dual mode', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()
            const client = new QueryClient('dual', connection, getEmitter())

            const results = await client.query().from('users')
            expect(Array.isArray(results)).toBeTruthy();
            expect(results).toHaveLength(0)

            await connection.disconnect()
        })

        test('perform insert queries in dual mode', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()
            const client = new QueryClient('dual', connection, getEmitter())

            await client.insertQuery().table('users').insert({ username: 'virk' })
            const results = await client.query().from('users')

            expect(Array.isArray(results)).toBeTruthy();
            expect(results).toHaveLength(1)
            expect(results[0].username).toBe('virk')

            await connection.disconnect()
        })

        test('perform raw queries in dual mode', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()
            const client = new QueryClient('dual', connection, getEmitter())

            const command = process.env.DB === 'sqlite' ? 'DELETE FROM users;' : (
                process.env.DB === 'mssql' ? 'TRUNCATE table users;' : 'TRUNCATE users;'
            )

            await client.insertQuery().table('users').insert({ username: 'virk' })
            await client.rawQuery(command).exec()
            const results = await client.query().from('users')

            expect(Array.isArray(results)).toBeTruthy();
            expect(results).toHaveLength(0)

            await connection.disconnect()
        })

        test('perform queries inside a transaction in dual mode', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()
            const client = new QueryClient('dual', connection, getEmitter())

            const trx = await client.transaction()
            await trx.insertQuery().table('users').insert({ username: 'virk' })
            await trx.rollback()

            const results = await client.query().from('users')

            expect(Array.isArray(results)).toBeTruthy();
            expect(results).toHaveLength(0)

            await connection.disconnect()
        })
    })

    describe('Query client | read mode', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        afterEach(async () => {
            await resetTables()
        })

        test('perform select queries in read mode', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()
            const client = new QueryClient('read', connection, getEmitter())

            const results = await client.query().from('users')
            expect(Array.isArray(results)).toBeTruthy();
            expect(results).toHaveLength(0)

            await connection.disconnect()
        })

        test('raise error when attempting to perform insert in read mode', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()
            const client = new QueryClient('read', connection, getEmitter())

            const fn = () => client.insertQuery()
            expect(fn).toThrow('Write client is not available for query client instantiated in read mode')

            await connection.disconnect()
        })

        test('perform raw queries in read mode', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()
            const client = new QueryClient('read', connection, getEmitter())

            const result = await client.rawQuery('SELECT 1 + 1').exec()
            expect(result).toBeDefined();

            await connection.disconnect()
        })

        test('raise error when attempting to get transaction in read mode', async () => {
            expect.assertions(1)

            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()
            const client = new QueryClient('read', connection, getEmitter())

            try {
                await client.transaction()
            } catch ({ message }) {
                expect(
                    message).toBe('E_RUNTIME_EXCEPTION: Write client is not available for query client instantiated in read mode'
                )
            }

            await connection.disconnect()
        })
    })

    describe('Query client | write mode', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        afterEach(async () => {
            await resetTables()
        })

        test('perform select queries in write mode', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()
            const client = new QueryClient('write', connection, getEmitter())

            const results = await client.query().from('users')
            expect(Array.isArray(results)).toBeTruthy();
            expect(results).toHaveLength(0)

            await connection.disconnect()
        })

        test('perform insert queries in write mode', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()
            const client = new QueryClient('write', connection, getEmitter())

            await client.insertQuery().table('users').insert({ username: 'virk' })
            const results = await client.query().from('users')

            expect(Array.isArray(results)).toBeTruthy();
            expect(results).toHaveLength(1)
            expect(results[0].username).toBe('virk')

            await connection.disconnect()
        })

        test('perform raw queries in write mode', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()
            const client = new QueryClient('write', connection, getEmitter())

            const command = process.env.DB === 'sqlite' ? 'DELETE FROM users;' : (
                process.env.DB === 'mssql' ? 'TRUNCATE table users;' : 'TRUNCATE users;'
            )

            await client.insertQuery().table('users').insert({ username: 'virk' })
            await client.rawQuery(command).exec()
            const results = await client.query().from('users')

            expect(Array.isArray(results)).toBeTruthy();
            expect(results).toHaveLength(0)

            await connection.disconnect()
        })

        test('perform queries inside a transaction in write mode', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()
            const client = new QueryClient('write', connection, getEmitter())

            const trx = await client.transaction()
            await trx.insertQuery().table('users').insert({ username: 'virk' })
            await trx.rollback()

            const results = await client.query().from('users')

            expect(Array.isArray(results)).toBeTruthy();
            expect(results).toHaveLength(0)

            await connection.disconnect()
        })
    })

    if ( ! ['sqlite', 'mssql'].includes(process.env.DB as string) ) {
        describe('Query client | advisory locks', () => {
            beforeAll(async () => {
                await setup()
            })

            afterAll(async () => {
                await cleanup()
            })

            afterEach(async () => {
                await resetTables()
            })

            test('get advisory lock', async () => {
                const connection = new Connection('primary', getConfig(), getLogger())
                connection.connect()

                const client = new QueryClient('dual', connection, getEmitter())
                const lock = await client.dialect.getAdvisoryLock(1)

                expect(lock).toBeTruthy()
                expect(client.dialect.name).toBe(resolveClientNameWithAliases(connection.config.client))

                await client.dialect.releaseAdvisoryLock(1)
                await connection.disconnect()
            })

            test('release advisory lock', async () => {
                const connection = new Connection('primary', getConfig(), getLogger())
                connection.connect()

                const client = new QueryClient('dual', connection, getEmitter())
                if ( client.dialect.name === 'sqlite3' ) {
                    await connection.disconnect()
                    return
                }

                await client.dialect.getAdvisoryLock(1)
                const released = await client.dialect.releaseAdvisoryLock(1)
                expect(released).toBeTruthy()

                await connection.disconnect()
            })
        })
    }

    describe('Query client | get tables', () => {
        beforeAll(async () => {
            await setup()
        })

        afterAll(async () => {
            await cleanup()
        })

        afterEach(async () => {
            await resetTables()
        })

        test('get an array of tables', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const client = new QueryClient('dual', connection, getEmitter())
            const tables = await client.getAllTables(['public'])
            if ( process.env.DB !== 'mysql' ) {
                expect(tables).toEqual([
                    'comments',
                    'countries',
                    'friends',
                    'identities',
                    'posts',
                    'profiles',
                    'skill_user',
                    'skills',
                    'users'
                ])
            } else {
                expect(tables).toEqual([
                    'comments',
                    'countries',
                    'friends',
                    'identities',
                    'posts',
                    'profiles',
                    'skills',
                    'skill_user',
                    'users'
                ])
            }
        })
    })
});
