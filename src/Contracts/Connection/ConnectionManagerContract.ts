/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:39 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { HealthReportEntry } from '@ioc:Adonis/Core/HealthCheck';
import { ConnectionConfig, ConnectionNode, ReportNode } from './types';

/**
 * Connection manager to manage one or more database
 * connections.
 */
export interface ConnectionManagerContract {
    /**
     * List of registered connection. You must check the connection state
     * to understand, if it is connected or not
     */
    connections: Map<string, ConnectionNode>

    /**
     * Add a new connection to the list of managed connection. You must call
     * connect seperately to instantiate a connection instance
     */
    add(connectionName: string, config: ConnectionConfig): void

    /**
     * Instantiate a connection. It is a noop, when connection for the given
     * name is already instantiated
     */
    connect(connectionName: string): void

    /**
     * Get connection node
     */
    get(connectionName: string): ConnectionNode | undefined

    /**
     * Find if a connection name is managed by the manager or not
     */
    has(connectionName: string): boolean

    /**
     * Patch the existing connection config. This triggers the disconnect on the
     * old connection
     */
    patch(connectionName: string, config: ConnectionConfig): void

    /**
     * Find if a managed connection is instantiated or not
     */
    isConnected(connectionName: string): boolean

    /**
     * Close a given connection. This is also kill the underlying Knex connection
     * pool
     */
    close(connectionName: string, release?: boolean): Promise<void>

    /**
     * Close all managed connections
     */
    closeAll(release?: boolean): Promise<void>

    /**
     * Release a given connection. Releasing a connection means, you will have to
     * re-add it using the `add` method
     */
    release(connectionName: string): Promise<void>

    /**
     * Returns the health check report for registered connections
     */
    report(): Promise<HealthReportEntry & { meta: ReportNode[] }>
}
