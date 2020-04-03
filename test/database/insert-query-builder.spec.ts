/*
* @adonisjs/lucid
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

/// <reference path="../../adonis-typings/index.ts" />

import test from 'japa'

import { Connection } from '../../src/Connection'
import { getConfig, setup, cleanup, getInsertBuilder, getLogger, getQueryClient } from '../../test-helpers'

test.group('Query Builder | insert', (group) => {
  group.before(async () => {
    await setup()
  })

  group.after(async () => {
    await cleanup()
  })

  test('perform insert', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()

    const db = getInsertBuilder(getQueryClient(connection))
    const { sql, bindings } = db.table('users').insert({ username: 'virk' }).toSQL()

    const { sql: knexSql, bindings: knexBindings } = connection.client!
      .from('users')
      .insert({ username: 'virk' })
      .toSQL()

    assert.equal(sql, knexSql)
    assert.deepEqual(bindings, knexBindings)

    await connection.disconnect()
  })

  test('perform multi insert', async (assert) => {
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

    assert.equal(sql, knexSql)
    assert.deepEqual(bindings, knexBindings)

    await connection.disconnect()
  })

  test('define returning columns', async (assert) => {
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

    assert.equal(sql, knexSql)
    assert.deepEqual(bindings, knexBindings)
    await connection.disconnect()
  })
})
