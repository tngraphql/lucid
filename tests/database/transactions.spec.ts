/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 8:42 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Connection } from '../../src/Connection/Connection';
import { QueryClient } from '../../src/QueryClient/QueryClient';
import { TransactionClient } from '../../src/TransactionClient/TransactionClient';
import { cleanup, getConfig, getEmitter, getLogger, getProfiler, resetTables, setup } from '../helpers';


describe('Transaction | query', () => {
    beforeAll(async () => {
        await setup()
    })

    afterAll(async () => {
        await cleanup()
    })

    afterEach(async () => {
        await resetTables()
    })

    test('perform select query under a transaction', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter()).transaction()
        const results = await db.query().from('users')
        await db.commit()

        expect(Array.isArray(results)).toBeTruthy();
        expect(results).toHaveLength(0)

        await connection.disconnect()
    })

    test('commit insert', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter()).transaction()
        await db.insertQuery().table('users').insert({ username: 'virk' })
        await db.commit()

        const results = await new QueryClient('dual', connection, getEmitter()).query().from('users')
        expect(Array.isArray(results)).toBeTruthy();
        expect(results).toHaveLength(1)
        expect(results[0].username).toBe('virk')

        await connection.disconnect()
    })

    test('rollback insert', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter()).transaction()
        await db.insertQuery().table('users').insert({ username: 'virk' })
        await db.rollback()

        const results = await new QueryClient('dual', connection, getEmitter()).query().from('users')
        expect(Array.isArray(results)).toBeTruthy();
        expect(results).toHaveLength(0)

        await connection.disconnect()
    })

    test('perform nested transactions with save points', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        /**
         * Transaction 1
         */
        const db = await new QueryClient('dual', connection, getEmitter()).transaction()
        await db.insertQuery().table('users').insert({ username: 'virk' })

        /**
         * Transaction 2: Save point
         */
        const db1 = await db.transaction()
        await db1.insertQuery().table('users').insert({ username: 'nikk' })

        /**
         * Rollback 2
         */
        await db1.rollback()

        /**
         * Commit first
         */
        await db.commit()

        const results = await new QueryClient('dual', connection, getEmitter()).query().from('users')
        expect(Array.isArray(results)).toBeTruthy();
        expect(results).toHaveLength(1)
        expect(results[0].username).toBe('virk')

        await connection.disconnect()
    })

    test('emit after commit event', async () => {
        const stack: string[] = []
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter()).transaction()

        db.on('commit', (trx) => {
            stack.push('commit')
            expect(trx).toBeInstanceOf(TransactionClient)
        })

        await db.insertQuery().table('users').insert({ username: 'virk' })
        await db.commit()

        expect(db.listenerCount('commit')).toEqual(0)
        expect(db.listenerCount('rollback')).toEqual(0)
        expect(stack).toEqual(['commit'])

        await connection.disconnect()
    })

    test('execute before and after rollback hooks', async () => {
        const stack: string[] = []
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter()).transaction()

        db.on('rollback', (trx) => {
            stack.push('rollback')
            expect(trx).toBeInstanceOf(TransactionClient)
        })

        await db.insertQuery().table('users').insert({ username: 'virk' })
        await db.rollback()
        expect(db.listenerCount('commit')).toEqual(0)
        expect(db.listenerCount('rollback')).toEqual(0)
        expect(stack).toEqual(['rollback'])

        await connection.disconnect()
    })

    test('commit insert inside a self managed transaction', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        await new QueryClient('dual', connection, getEmitter()).transaction(async (db) => {
            await db.insertQuery().table('users').insert({ username: 'virk' })
        })

        const results = await new QueryClient('dual', connection, getEmitter()).query().from('users')
        expect(Array.isArray(results)).toBeTruthy();
        expect(results).toHaveLength(1)
        expect(results[0].username).toBe('virk')

        await connection.disconnect()
    })

    test('rollback insert inside a self managed transaction', async () => {
        expect.assertions(3)

        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        try {
            await new QueryClient('dual', connection, getEmitter()).transaction(async (db) => {
                await db.insertQuery().table('users').insert({ username: 'virk' })
                throw new Error('should rollback')
            })
        } catch (error) {
            expect(error.message).toBe('should rollback')
        }

        const results = await new QueryClient('dual', connection, getEmitter()).query().from('users')
        expect(Array.isArray(results)).toBeTruthy();
        expect(results).toHaveLength(0)

        await connection.disconnect()
    })

    test('perform nested managed transactions', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        /**
         * Transaction 1
         */
        await new QueryClient('dual', connection, getEmitter()).transaction(async (db) => {
            await db.insertQuery().table('users').insert({ username: 'virk' })

            /**
             * Transaction 2: Save point
             */
            await db.transaction(async (db1) => {
                await db1.insertQuery().table('users').insert({ username: 'nikk' })

                /**
                 * Manual callback, should work fine
                 */
                await db1.rollback()
            })
        })

        const results = await new QueryClient('dual', connection, getEmitter()).query().from('users')
        expect(Array.isArray(results)).toBeTruthy();
        expect(results).toHaveLength(1)
        expect(results[0].username).toBe('virk')

        await connection.disconnect()
    })

    test('nest transaction queries inside profiler row', async () => {
        const stack: { id: string, parentId: string | undefined, label: string, data: any }[] = []
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const profiler = getProfiler(true)
        const client = new QueryClient('dual', connection, getEmitter())
        client.profiler = profiler

        profiler.process((log) => {
            stack.push({ id: log['id'], parentId: log.parent_id, label: log.label, data: log.data })
        })

        const db = await client.transaction()
        await db.insertQuery().table('users').insert({ username: 'virk' })
        await db.commit()

        expect(stack).toHaveLength(2)
        expect(stack[0].label).toBe('db:query')
        expect(stack[1].label).toBe('trx:begin')
        expect(stack[0].parentId).toBe(stack[1].id)
        expect(stack[1].data).toEqual({ state: 'commit' })

        await connection.disconnect()
    })

    test('nest save points queries inside profiler row', async () => {
        const stack: { id: string, parentId: string | undefined, label: string, data: any }[] = []
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const profiler = getProfiler(true)
        const client = new QueryClient('dual', connection, getEmitter())
        client.profiler = profiler

        profiler.process((log) => {
            stack.push({ id: log['id'], parentId: log.parent_id, label: log.label, data: log.data })
        })

        const db = await client.transaction()
        const nested = await db.transaction()
        await nested.insertQuery().table('users').insert({ username: 'virk' })
        await nested.rollback()
        await db.commit()

        expect(stack).toHaveLength(3)
        expect(stack[0].label).toBe('db:query')
        expect(stack[1].label).toBe('trx:begin')
        expect(stack[2].label).toBe('trx:begin')
        expect(stack[0].parentId).toBe(stack[1].id)
        expect(stack[1].data).toEqual({ state: 'rollback' })
        expect(stack[2].data).toEqual({ state: 'commit' })
        expect(stack[1].parentId).toBe(stack[2].id)

        await connection.disconnect()
    })

    test('nest transaction queries inside managed transaction', async () => {
        const stack: { id: string, parentId: string | undefined, label: string, data: any }[] = []
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const profiler = getProfiler(true)
        const client = new QueryClient('dual', connection, getEmitter())
        client.profiler = profiler

        profiler.process((log) => {
            stack.push({ id: log['id'], parentId: log.parent_id, label: log.label, data: log.data })
        })

        await client.transaction(async (db) => {
            await db.insertQuery().table('users').insert({ username: 'virk' })
        })

        expect(stack).toHaveLength(2)
        expect(stack[0].label).toBe('db:query')
        expect(stack[1].label).toBe('trx:begin')
        expect(stack[0].parentId).toBe(stack[1].id)
        expect(stack[1].data).toEqual({ state: 'commit' })

        await connection.disconnect()
    })
});
