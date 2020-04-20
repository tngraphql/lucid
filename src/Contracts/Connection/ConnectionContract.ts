/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:39 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { EventEmitter } from 'events';
import * as Knex from 'knex';
import { Pool } from 'tarn'
import { ConnectionConfig, ReportNode } from './types';

/**
 * Connection represents a single Knex instance with inbuilt
 * pooling capabilities.
 */
export interface ConnectionContract extends EventEmitter {
    client?: Knex,
    readClient?: Knex,

    /**
     * Property to find if explicit read/write is enabled
     */
    readonly hasReadWriteReplicas: boolean,

    /**
     * Read/write connection pools
     */
    pool: null | Pool<any>,
    readPool: null | Pool<any>,

    /**
     * Name of the connection
     */
    readonly name: string,

    /**
     * Untouched config
     */
    config: ConnectionConfig,

    /**
     * List of emitted events
     */
    on(event: 'connect', callback: (connection: ConnectionContract) => void): this

    on(event: 'error', callback: (error: Error, connection: ConnectionContract) => void): this

    on(event: 'disconnect', callback: (connection: ConnectionContract) => void): this

    on(event: 'disconnect:error', callback: (error: Error, connection: ConnectionContract) => void): this

    /**
     * Make Knex connection
     */
    connect(): void,

    /**
     * Disconnect Knex
     */
    disconnect(): Promise<void>,

    /**
     * Returns the connection report
     */
    getReport(): Promise<ReportNode>
}
