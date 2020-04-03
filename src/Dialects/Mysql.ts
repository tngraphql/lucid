/*
 * @adonisjs/lucid
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

/// <reference path="../../adonis-typings/index.ts" />

import { DialectContract, QueryClientContract } from '@ioc:Adonis/Lucid/Database'

export class MysqlDialect implements DialectContract {
  public readonly name = 'mysql'
  public readonly supportsAdvisoryLocks = true

  /**
   * The default format for datetime column. The date formats is
   * valid for luxon date parsing library
   */
  public readonly dateTimeFormat = 'yyyy-MM-dd HH:mm:ss'

  constructor (private client: QueryClientContract) {
  }

  /**
   * Truncate mysql table with option to cascade
   */
  public async truncate (table: string, cascade: boolean = false) {
    if (!cascade) {
      return this.client.knexQuery().table(table).truncate()
    }

    /**
     * Cascade and truncate
     */
    const trx = await this.client.transaction()
    try {
      await trx.rawQuery('SET FOREIGN_KEY_CHECKS=0;')
      await trx.knexQuery().table(table).truncate()
      await trx.rawQuery('SET FOREIGN_KEY_CHECKS=1;')
      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * Attempts to add advisory lock to the database and
   * returns it's status.
   */
  public async getAdvisoryLock (key: string, timeout: number = 0): Promise<boolean> {
    const response = await this.client.rawQuery(`SELECT GET_LOCK('${key}', ${timeout}) as lock_status;`)
    return response[0] && response[0][0] && response[0][0].lock_status === 1
  }

  /**
   * Releases the advisory lock
   */
  public async releaseAdvisoryLock (key: string): Promise<boolean> {
    const response = await this.client.rawQuery(`SELECT RELEASE_LOCK('${key}') as lock_status;`)
    return response[0] && response[0][0] && response[0][0].lock_status === 1
  }
}
