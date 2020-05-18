/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:57 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Exception } from '@poppinss/utils'

import * as Knex from 'knex';
import { DatabaseQueryBuilderContract } from '../../Contracts/Database/DatabaseQueryBuilderContract';
import { QueryClientContract } from '../../Contracts/Database/QueryClientContract';
import { TransactionClientContract } from '../../Contracts/Database/TransactionClientContract';
import { DBQueryCallback } from '../../Contracts/Database/types';
import { Dictionary } from '../../Contracts/querybuilder';
import { QueryRunner } from '../../QueryRunner/QueryRunner'
import { SimplePaginator } from '../Paginator/SimplePaginator'

import { Chainable } from './Chainable'

/**
 * Wrapping the user function for a query callback and give them
 * a new instance of the `DatabaseQueryBuilder` and not
 * Knex.QueryBuilder
 */
const queryCallback: DBQueryCallback = (userFn, keysResolver) => {
    return (builder: Knex.QueryBuilder) => {
        /**
         * Sub queries don't need the client, since client is used to execute the query
         * and subqueries are not executed seperately. That's why we just pass
         * an empty object.
         *
         * Other option is to have this method for each instance of the class, but this
         * is waste of resources.
         */
        userFn(new DatabaseQueryBuilder(builder, {} as any, keysResolver))
    }
}

/**
 * Database query builder exposes the API to construct and run queries for selecting,
 * updating and deleting records.
 */
export class DatabaseQueryBuilder extends Chainable implements DatabaseQueryBuilderContract {
    /**
     * Custom data someone want to send to the profiler and the
     * query event
     */
    private customReporterData: any

    /**
     * Control whether to debug the query or not. The initial
     * value is inherited from the query client
     */
    private debugQueries: boolean = this.client.debug

    /**
     * Required by macroable
     */
    protected static macros = {}
    protected static getters = {}

    constructor(
        builder: Knex.QueryBuilder,
        public client: QueryClientContract,
        public keysResolver?: (columnName: string) => string
    ) {
        super(builder, queryCallback, keysResolver)
    }

    /**
     * Ensures that we are not executing `update` or `del` when using read only
     * client
     */
    private ensureCanPerformWrites() {
        if ( this.client && this.client.mode === 'read' ) {
            throw new Exception('Updates and deletes cannot be performed in read mode')
        }
    }

    /**
     * Returns the log data
     */
    private getQueryData() {
        return {
            connection: this.client.connectionName,
            inTransaction: this.client.isTransaction,
            ...this.customReporterData
        }
    }

    /**
     * Define custom reporter data. It will be merged with
     * the existing data
     */
    public reporterData(data: any) {
        this.customReporterData = data
        return this
    }

    /**
     * Delete rows under the current query
     */
    public del(): this {
        this.ensureCanPerformWrites()
        this.knexQuery.del()
        return this
    }

    /**
     * Alias for [[del]]
     */
    public delete (): this {
        return this.del()
    }

    /**
     * Clone the current query builder
     */
    public clone<Result = Dictionary<any, string>>(): DatabaseQueryBuilderContract<Result> {
        const clonedQuery = new DatabaseQueryBuilder(this.knexQuery.clone(), this.client)
        this.applyQueryFlags(clonedQuery)
        return clonedQuery as DatabaseQueryBuilderContract<Result>;
    }

    /**
     * Define returning columns
     */
    public returning(columns: any): this {
        /**
         * Do not chain `returning` in sqlite3 to avoid Knex warnings
         */
        if ( this.client && ['sqlite3', 'mysql'].includes(this.client.dialect.name) ) {
            return this
        }

        columns = Array.isArray(columns)
            ? columns.map((column) => this.resolveKey(column))
            : this.resolveKey(columns)

        this.knexQuery.returning(columns)
        return this
    }

    /**
     * Perform update by incrementing value for a given column. Increments
     * can be clubbed with `update` as well
     */
    public increment(column: any, counter?: any): this {
        this.knexQuery.increment(this.resolveKey(column, true), counter)
        return this
    }

    /**
     * Perform update by decrementing value for a given column. Decrements
     * can be clubbed with `update` as well
     */
    public decrement(column: any, counter?: any): this {
        this.knexQuery.decrement(this.resolveKey(column, true), counter)
        return this
    }

    /**
     * Perform update
     */
    // @ts-ignore
    public update(column: any, value?: any, returning?: string[]): this {
        this.ensureCanPerformWrites()
        if ( ! value && ! returning ) {
            this.knexQuery.update(this.resolveKey(column, true))
        } else if ( ! returning ) {
            this.knexQuery.update(this.resolveKey(column, true), value)
        } else {
            this.knexQuery.update(this.resolveKey(column), value, returning)
        }

        return this
    }

    /**
     * Fetch and return first results from the results set. This method
     * will implicitly set a `limit` on the query
     */
    public async first(): Promise<any> {
        const result = await this.limit(1)['exec']()
        return result[0] || null
    }

    /**
     * Turn on/off debugging for this query
     */
    public debug(debug: boolean): this {
        this.debugQueries = debug
        return this
    }

    /**
     * Define query timeout
     */
    public timeout(time: number, options?: { cancel: boolean }): this {
        this.knexQuery['timeout'](time, options)
        return this
    }

    /**
     * Returns SQL query as a string
     */
    public toQuery(): string {
        return this.knexQuery.toQuery()
    }

    /**
     * Run query inside the given transaction
     */
    public useTransaction(transaction: TransactionClientContract) {
        this.knexQuery.transacting(transaction.knexClient)
        return this
    }

    /**
     * Executes the query
     */
    public async exec(): Promise<any> {
        return new QueryRunner(this.client, this.debugQueries, this.getQueryData()).run(this.knexQuery)
    }

    /**
     * Paginate through rows inside a given table
     */
    public async paginate(page: number, perPage: number = 20) {
        const countQuery = this.clone().clearOrder().clearLimit().clearOffset().clearSelect().count('* as total')
        const aggregates = await countQuery.exec()

        const total = this.hasGroupBy ? aggregates.length : aggregates[0].total
        const results = total > 0 ? await this.forPage(page, perPage).exec() : []

        return new SimplePaginator(results, total, perPage, page)
    }

    /**
     * Get sql representation of the query
     */
    public toSQL(): Knex.Sql {
        return this.knexQuery.toSQL()
    }

    /**
     * Implementation of `then` for the promise API
     */
    public then(resolve: any, reject?: any): any {
        return this.exec().then(resolve, reject)
    }

    /**
     * Implementation of `catch` for the promise API
     */
    public catch(reject: any): any {
        return this.exec().catch(reject)
    }

    /**
     * Implementation of `finally` for the promise API
     */
    public finally(fullfilled: any) {
        return this.exec().finally(fullfilled)
    }

    /**
     * Required when Promises are extended
     */
    public get [Symbol.toStringTag]() {
        return this.constructor.name
    }
}
