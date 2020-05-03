/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:53 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ProfilerContract, ProfilerRowContract } from '@ioc:Adonis/Core/Profiler';
import { EmitterContract } from '@tngraphql/illuminate/dist/Contracts/Events/EmitterContract';
import * as Knex from 'knex';
import { LucidModel } from '../Model/LucidModel';
import { ModelQueryBuilderContract } from '../Model/ModelQueryBuilderContract';
import { FromTable, RawQueryBindings } from '../querybuilder';
import { DatabaseQueryBuilderContract } from './DatabaseQueryBuilderContract';
import { DialectContract } from './DialectContract';
import { InsertQueryBuilderContract } from './InsertQueryBuilderContract';
import { RawBuilderContract } from './RawBuilderContract';
import { RawQueryBuilderContract } from './RawQueryBuilderContract';
import { ReferenceBuilderContract } from './ReferenceBuilderContract';
import { TransactionClientContract } from './TransactionClientContract';
import { TransactionFn } from './TransactionFn';

/**
 * Shape of the query client, that is used to retrive instances
 * of query builder
 */
export interface QueryClientContract {
    emitter: EmitterContract,

    /**
     * Custom profiler to time queries
     */
    profiler?: ProfilerRowContract | ProfilerContract

    /**
     * Tells if client is a transaction client or not
     */
    readonly isTransaction: boolean

    /**
     * The database dialect in use
     */
    readonly dialect: DialectContract

    /**
     * The client mode in which it is execute queries
     */
    readonly mode: 'dual' | 'write' | 'read'

    /**
     * The name of the connnection from which the client
     * was originated
     */
    readonly connectionName: string

    /**
     * Returns schema instance for the write client
     */
    schema: Knex.SchemaBuilder

    /**
     * Returns the read and write clients
     */
    getReadClient(): Knex<any, any>

    getWriteClient(): Knex<any, any>

    /**
     * Returns the query builder for a given model
     */
    modelQuery<T extends LucidModel, Result extends any = T>(
        model: T
    ): ModelQueryBuilderContract<T, Result>

    /**
     * Returns the Knex query builder instance
     */
    knexQuery(): Knex.QueryBuilder

    /**
     * Returns the Knex raw query builder instance
     */
    knexRawQuery(sql: string, bindings?: RawQueryBindings): Knex.Raw

    /**
     * Get new query builder instance for select, update and
     * delete calls
     */
    query<Result extends any = any>(): DatabaseQueryBuilderContract<Result>,

    /**
     * Get new query builder instance inserts
     */
    insertQuery<ReturnColumns extends any = any>(): InsertQueryBuilderContract<ReturnColumns[]>,

    /**
     * Get raw query builder instance
     */
    rawQuery<Result extends any = any>(
        sql: string,
        bindings?: RawQueryBindings
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
     * Truncate a given table
     */
    truncate(table: string, cascade?: boolean): Promise<void>

    /**
     * Returns columns info for a given table
     */
    columnsInfo(table: string): Promise<{ [column: string]: Knex.ColumnInfo }>

    columnsInfo(table: string, column: string): Promise<Knex.ColumnInfo>

    /**
     * Get all tables of the database
     */
    getAllTables(schemas?: string[]): Promise<string[]>

    /**
     * Same as `query()`, but also selects the table for the query. The `from` method
     * doesn't allow defining the return type and one must use `query` to define
     * that.
     */
    from: FromTable<DatabaseQueryBuilderContract<any>>,

    /**
     * Same as `insertQuery()`, but also selects the table for the query.
     * The `table` method doesn't allow defining the return type and
     * one must use `insertQuery` to define that.
     */
    table: (table: string) => InsertQueryBuilderContract<any>,

    /**
     * Get instance of transaction client
     */
    // transaction: TransactionFn,
    transaction<T = TransactionClientContract>(options?, callback?: (trx: TransactionClientContract) => Promise<T>): Promise<T>
    transaction<T = TransactionClientContract>(callback?: (trx: TransactionClientContract) => Promise<T>): Promise<T>

    /**
     * Work with advisory locks
     */
    getAdvisoryLock(key: string | number, timeout?: number): Promise<boolean>

    releaseAdvisoryLock(key: string | number): Promise<boolean>
}
