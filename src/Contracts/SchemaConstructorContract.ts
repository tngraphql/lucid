/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:00 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Raw, SchemaBuilder } from 'knex';
import { QueryClientContract } from './Database/QueryClientContract';
import { RawQueryBindings } from './querybuilder';

/**
 * Shape of callback to defer database calls
 */
export type DeferCallback = (client: QueryClientContract) => void | Promise<void>

/**
 * Shape of schema class constructor
 */
export interface SchemaConstructorContract {
    disableTransactions: boolean

    new(db: QueryClientContract, file: string, dryRun: boolean): SchemaContract
}

/**
 * Shape of schema class
 */
export interface SchemaContract {
    readonly file: string
    dryRun: boolean
    debug: boolean
    db: QueryClientContract
    schema: SchemaBuilder

    now(precision?: number): Raw

    raw(sql: string, bindings?: RawQueryBindings): Raw

    defer: (cb: DeferCallback) => void

    up(): Promise<void> | void

    down(): Promise<void> | void

    execUp(): Promise<string [] | boolean>

    execDown(): Promise<string [] | boolean>
}
