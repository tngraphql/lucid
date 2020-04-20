/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 7:51 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Connection } from '../../src/Connection/Connection';
import { cleanup, getConfig, getInsertBuilder, getLogger, getQueryClient, setup } from '../helpers';

describe('insert-query-builder', () => {
    beforeAll(async () => {
        await setup()
    })

    afterAll(async () => {
        await cleanup()
    })

    test('perform insert', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = getInsertBuilder(getQueryClient(connection))
        const { sql, bindings } = db.table('users').insert({ username: 'virk' }).toSQL()

        const { sql: knexSql, bindings: knexBindings } = connection.client!
            .from('users')
            .insert({ username: 'virk' })
            .toSQL()

        expect(sql).toBe(knexSql)
        expect(bindings).toEqual(knexBindings)

        await connection.disconnect()
    })

    test('perform multi insert', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = getInsertBuilder(getQueryClient(connection))
        const { sql, bindings } = db
            .table('users')
            .multiInsert([{ username: 'virk' }, { username: 'nikk' }])
            .toSQL()

        const { sql: knexSql, bindings: knexBindings } = connection.client!
            .from('users')
            .insert([{ username: 'virk' }, { username: 'nikk' }])
            .toSQL()

        expect(sql).toBe(knexSql)
        expect(bindings).toEqual(knexBindings)

        await connection.disconnect()
    })

    test('define returning columns', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = getInsertBuilder(getQueryClient(connection))
        const { sql, bindings } = db
            .table('users')
            .returning(['id', 'username'])
            .multiInsert([{ username: 'virk' }, { username: 'nikk' }])
            .toSQL()

        const { sql: knexSql, bindings: knexBindings } = connection.client!
            .from('users')
            .returning(['id', 'username'])
            .insert([{ username: 'virk' }, { username: 'nikk' }])
            .toSQL()

        expect(sql).toBe(knexSql)
        expect(bindings).toEqual(knexBindings)
        await connection.disconnect()
    })
})
