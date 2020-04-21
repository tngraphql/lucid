/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:52 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ProfilerRowContract } from '@ioc:Adonis/Core/Profiler';
import { EventEmitter } from 'events';
import * as Knex from 'knex';
import { QueryClientContract } from './QueryClientContract';

/**
 * The shape of transaction client to run queries under a given
 * transaction on a single connection
 */
export interface TransactionClientContract extends QueryClientContract, EventEmitter {
    knexClient: Knex.Transaction,

    /**
     * Custom profiler to time queries
     */
    profiler?: ProfilerRowContract

    /**
     * Is transaction completed or not
     */
    isCompleted: boolean,

    /**
     * Commit transaction
     */
    commit(): Promise<void>,

    /**
     * Rollback transaction
     */
    rollback(): Promise<void>

    /**
     * Returns the read and write transaction clients
     */
    getReadClient(): Knex.Transaction<any, any>

    getWriteClient(): Knex.Transaction<any, any>

    /**
     * Transaction named events
     */
    on(event: 'commit', handler: (client: this) => void): this

    on(event: 'rollback', handler: (client: this) => void): this

    once(event: 'commit', handler: (client: this) => void): this

    once(event: 'rollback', handler: (client: this) => void): this
}
