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
import { QueryClient } from '../../src/QueryClient'
import { TransactionClient } from '../../src/TransactionClient'
import { getConfig, setup, cleanup, resetTables, getLogger } from '../../test-helpers'

test.group('Transaction | query', (group) => {
  group.before(async () => {
    await setup()
  })

  group.after(async () => {
    await cleanup()
  })

  group.afterEach(async () => {
    await resetTables()
  })

  test('perform select query under a transaction', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()

    const db = await new QueryClient('dual', connection).transaction()
    const results = await db.query().from('users')
    await db.commit()

    assert.isArray(results)
    assert.lengthOf(results, 0)

    await connection.disconnect()
  })

  test('commit insert', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()

    const db = await new QueryClient('dual', connection).transaction()
    await db.insertQuery().table('users').insert({ username: 'virk' })
    await db.commit()

    const results = await new QueryClient('dual', connection).query().from('users')
    assert.isArray(results)
    assert.lengthOf(results, 1)
    assert.equal(results[0].username, 'virk')

    await connection.disconnect()
  })

  test('rollback insert', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()

    const db = await new QueryClient('dual', connection).transaction()
    await db.insertQuery().table('users').insert({ username: 'virk' })
    await db.rollback()

    const results = await new QueryClient('dual', connection).query().from('users')
    assert.isArray(results)
    assert.lengthOf(results, 0)

    await connection.disconnect()
  })

  test('perform nested transactions with save points', async (assert) => {
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()

    /**
     * Transaction 1
     */
    const db = await new QueryClient('dual', connection).transaction()
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

    const results = await new QueryClient('dual', connection).query().from('users')
    assert.isArray(results)
    assert.lengthOf(results, 1)
    assert.equal(results[0].username, 'virk')

    await connection.disconnect()
  })

  test('emit after commit event', async (assert) => {
    const stack: string[] = []
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()

    const db = await new QueryClient('dual', connection).transaction()

    db.on('commit', (trx) => {
      stack.push('commit')
      assert.instanceOf(trx, TransactionClient)
    })

    await db.insertQuery().table('users').insert({ username: 'virk' })
    await db.commit()

    assert.deepEqual(db.listenerCount('commit'), 0)
    assert.deepEqual(db.listenerCount('rollback'), 0)
    assert.deepEqual(stack, ['commit'])

    await connection.disconnect()
  })

  test('execute before and after rollback hooks', async (assert) => {
    const stack: string[] = []
    const connection = new Connection('primary', getConfig(), getLogger())
    connection.connect()

    const db = await new QueryClient('dual', connection).transaction()

    db.on('rollback', (trx) => {
      stack.push('rollback')
      assert.instanceOf(trx, TransactionClient)
    })

    await db.insertQuery().table('users').insert({ username: 'virk' })
    await db.rollback()
    assert.deepEqual(db.listenerCount('commit'), 0)
    assert.deepEqual(db.listenerCount('rollback'), 0)
    assert.deepEqual(stack, ['rollback'])

    await connection.disconnect()
  })
})
