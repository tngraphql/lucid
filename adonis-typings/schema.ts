/*
 * @adonisjs/lucid
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

declare module '@ioc:Adonis/Lucid/Schema' {
  import { SchemaBuilder, Raw } from 'knex'
  import { QueryClientContract } from '@ioc:Adonis/Lucid/Database'

  /**
   * Shape of callback to defer database calls
   */
  export type DeferCallback = (client: QueryClientContract) => void | Promise<void>

  /**
   * Shape of schema class constructor
   */
  export interface SchemaConstructorContract {
    disableTransactions: boolean
    new (db: QueryClientContract, file: string, dryRun: boolean): SchemaContract
  }

  /**
   * Shape of schema class
   */
  export interface SchemaContract {
    dryRun: boolean
    db: QueryClientContract
    schema: SchemaBuilder
    file: string

    now (precision?: number): Raw
    defer: (cb: DeferCallback) => void
    up (): Promise<void> | void
    down (): Promise<void> | void
    execUp (): Promise<string [] | boolean>
    execDown (): Promise<string [] | boolean>
  }

  const Schema: SchemaConstructorContract
  export default Schema
}
