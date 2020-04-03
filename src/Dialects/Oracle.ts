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

export class OracleDialect implements DialectContract {
  public readonly name = 'oracledb'
  public readonly supportsAdvisoryLocks = false

  /**
   * The default format for datetime column. The date formats is
   * valid for luxon date parsing library
   */
  public readonly dateTimeFormat = 'yyyy-MM-dd HH:mm:ss'

  constructor (private client: QueryClientContract) {
  }

  /**
   * Truncate pg table with option to cascade and restart identity
   */
  public async truncate (table: string, cascade: boolean = false) {
    return cascade
      ? this.client.rawQuery(`TRUNCATE ${table} CASCADE;`)
      : this.client.rawQuery(`TRUNCATE ${table};`)
  }

  public getAdvisoryLock (): Promise<boolean> {
    throw new Error('Support for advisory locks is not implemented for oracledb. Create a PR to add the feature')
  }

  public releaseAdvisoryLock (): Promise<boolean> {
    throw new Error('Support for advisory locks is not implemented for oracledb. Create a PR to add the feature')
  }
}
