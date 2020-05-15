/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:49 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { HealthReportEntry } from '@ioc:Adonis/Core/HealthCheck';
import * as Knex from 'knex';
import { MacroableConstructorContract } from 'macroable/build';
import { ConnectionManagerContract } from '../Connection/ConnectionManagerContract';
import { DatabaseClientOptions, ReportNode } from '../Connection/types';
import { LucidModel } from '../Model/LucidModel';
import { ModelQueryBuilderContract } from '../Model/ModelQueryBuilderContract';
import { RawQueryBindings } from '../querybuilder';
import { DatabaseQueryBuilderContract } from './DatabaseQueryBuilderContract';
import { InsertQueryBuilderContract } from './InsertQueryBuilderContract';
import { QueryClientContract } from './QueryClientContract';
import { RawBuilderContract } from './RawBuilderContract';
import { RawQueryBuilderContract } from './RawQueryBuilderContract';
import { ReferenceBuilderContract } from './ReferenceBuilderContract';
import { SimplePaginatorContract } from './SimplePaginatorContract';
import { TransactionClientContract } from './TransactionClientContract';
import { TransactionFn } from './TransactionFn';

/**
 * Database contract serves as the main API to interact with multiple
 * database connections
 */
export interface DatabaseContract {
    DatabaseQueryBuilder: MacroableConstructorContract<DatabaseQueryBuilderContract>,
    InsertQueryBuilder: MacroableConstructorContract<InsertQueryBuilderContract>,
    ModelQueryBuilder: MacroableConstructorContract<ModelQueryBuilderContract<any, any>>,
    SimplePaginator: {
        new<Row extends any>(
            rows: Row[],
            total: number,
            perPage: number,
            currentPage: number
        ): SimplePaginatorContract<Row[]>
    },

    /**
     * Pretty print query logs
     */
    prettyPrint: (queryLog: any) => void

    /**
     * Name of the primary connection defined inside `config/database.ts`
     * file
     */
    primaryConnectionName: string,

    /**
     * Reference to the connection manager
     */
    manager: ConnectionManagerContract,

    /**
     * Returns the raw connection instance
     */
    getRawConnection: ConnectionManagerContract['get'],

    /**
     * Get query client for a given connection. Optionally one can also define
     * the mode of the connection and profiler row
     */
    connection(connectionName?: string, options?: DatabaseClientOptions): QueryClientContract

    /**
     * Returns the Knex query builder instance
     */
    knexQuery(): Knex.QueryBuilder

    /**
     * Returns the Knex raw query builder instance
     */
    knexRawQuery(sql: string, bindings?: RawQueryBindings): Knex.Raw

    /**
     * Returns the query builder for a given model
     */
    modelQuery<T extends LucidModel, Result extends any = T>(
        model: T,
        options?: DatabaseClientOptions
    ): ModelQueryBuilderContract<T, Result>

    /**
     * Get query builder instance for a given connection.
     */
    query<Result extends any = any>(
        options?: DatabaseClientOptions
    ): DatabaseQueryBuilderContract<Result>,

    /**
     * Get insert query builder instance for a given connection.
     */
    insertQuery<ReturnColumns extends any = any>(
        options?: DatabaseClientOptions
    ): InsertQueryBuilderContract<ReturnColumns[]>,

    /**
     * Get raw query builder instance
     */
    rawQuery<Result extends any = any>(
        sql: string,
        bindings?: RawQueryBindings,
        options?: DatabaseClientOptions
    ): RawQueryBuilderContract<Result>

    /**
     * Returns instance of reference builder
     */
    ref(reference: string): ReferenceBuilderContract

    /**
     * Returns instance of raw builder
     */
    raw(sql: string, bindings?: RawQueryBindings): RawBuilderContract

    /**
     * Selects a table on the default connection by instantiating a new query
     * builder instance. This method provides no control over the client
     * mode and one must use `query` for that
     */
    from: QueryClientContract['from']

    /**
     * Selects a table on the default connection by instantiating a new query
     * builder instance. This method provides no control over the client
     * mode and one must use `insertQuery` for that
     */
    table: QueryClientContract['table']

    /**
     * Start a new transaction
     */
    // transaction: TransactionFn,
    transaction<T = TransactionClientContract>(options?, callback?: (trx: TransactionClientContract) => Promise<T> | T): Promise<T>
    transaction<T = TransactionClientContract>(callback?: (trx: TransactionClientContract) => Promise<T> | T): Promise<T>

    /**
     * Returns the health check report for registered connections
     */
    report(): Promise<HealthReportEntry & { meta: ReportNode[] }>

    /**
     * Begin a new global transaction. Multiple calls to this
     * method is a noop
     */
    // beginGlobalTransaction(
    //     connectionName?: string,
    //     options?: Exclude<DatabaseClientOptions, 'mode'>
    // ): Promise<TransactionClientContract>
    //
    // /**
    //  * Commit an existing global transaction
    //  */
    // commitGlobalTransaction(connectionName?: string): Promise<void>
    //
    // /**
    //  * Rollback an existing global transaction
    //  */
    // rollbackGlobalTransaction(connectionName?: string): Promise<void>
}
