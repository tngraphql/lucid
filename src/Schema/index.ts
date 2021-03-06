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
import { SchemaBuilder, Sql } from 'knex'
import { QueryClientContract } from '../Contracts/Database/QueryClientContract';
import { DeferCallback, SchemaContract } from '../Contracts/SchemaConstructorContract';
import { QueryReporter } from '../QueryReporter/QueryReporter'
import { getDDLMethod } from '../utils/index';

/**
 * Exposes the API to define table schema using deferred database
 * calls.
 */
export class Schema implements SchemaContract {
    /**
     * All calls to `schema` and `defer` are tracked to be
     * executed later
     */
    private trackedCalls: (SchemaBuilder | DeferCallback)[] = []

    /**
     * The state of the schema. It cannot be re-executed after completion
     */
    private state: 'pending' | 'completed' = 'pending'

    /**
     * Enable/disable transactions for this schema
     */
    public static disableTransactions = false;

    /**
     * Returns the schema to build database tables
     */
    public get schema() {
        const schema = this.db.schema
        this.trackedCalls.push(schema)
        return schema
    }

    /**
     * Control whether to debug the query or not. The initial
     * value is inherited from the query client
     */
    public debug: boolean = this.db.debug;

    constructor(
        public db: QueryClientContract,
        public file: string,
        public dryRun: boolean = false
    ) {
    }

    /**
     * Returns schema queries sql without executing them
     */
    private getQueries(): string[] {
        return this.trackedCalls
                   .filter((schema) => typeof (schema['toQuery']) === 'function')
                   .map((schema) => (schema as SchemaBuilder).toQuery())
    }

    /**
     * Returns reporter instance
     */
    private getReporter () {
        return new QueryReporter(this.db, this.debug, {})
    }

    /**
     * Returns the log data
     */
    private getQueryData (sql: Sql) {
        return {
            connection: this.db.connectionName,
            inTransaction: this.db.isTransaction,
            method: getDDLMethod(sql.sql),
            ddl: true,
            ...sql,
        }
    }

    /**
     * Executes schema queries and defer calls in sequence
     */
    private async executeQueries() {
        for( let trackedCall of this.trackedCalls ) {
            if ( typeof (trackedCall) === 'function' ) {
                await trackedCall(this.db)
            } else {
                const reporter = this.getReporter()
                try {
                    trackedCall['once']('query', (sql) => reporter.begin(this.getQueryData(sql)));

                    await trackedCall;

                    if (!reporter.isReady()) {
                        reporter.begin(this.getQueryData({} as any));
                    }

                    reporter.end();
                } catch (error) {
                    if (!reporter.isReady()) {
                        reporter.begin(this.getQueryData({} as any));
                    }

                    reporter.end(error)
                    throw error
                }
            }
        }
    }

    /**
     * Returns raw query for `now`
     */
    public now(precision?: number) {
        return precision
            ? this.db.knexRawQuery(`CURRENT_TIMESTAMP(${ precision })`)
            : this.db.knexRawQuery('CURRENT_TIMESTAMP')
    }

    /**
     * Instance of raw Knex query builder
     */
    public raw(query: string, bindings?: any[]) {
        return this.db.knexRawQuery(query, bindings)
    }

    /**
     * Wrapping database calls inside defer ensures that they run
     * in the right order and also they won't be executed when
     * schema is invoked to return the SQL queries
     */
    public defer(cb: DeferCallback): void {
        this.trackedCalls.push(cb)
    }

    /**
     * Invokes schema `up` method. Returns an array of queries
     * when `dryRun` is set to true
     */
    public async execUp() {
        if ( this.state === 'completed' ) {
            throw new Exception('Cannot execute a given schema twice')
        }

        await this.up()
        this.state = 'completed'

        if ( this.dryRun ) {
            return this.getQueries()
        }

        await this.executeQueries()
        return true
    }

    /**
     * Invokes schema `down` method. Returns an array of queries
     * when `dryRun` is set to true
     */
    public async execDown() {
        if ( this.state === 'completed' ) {
            throw new Exception('Cannot execute a given schema twice')
        }

        await this.down()
        this.state = 'completed'

        if ( this.dryRun ) {
            return this.getQueries()
        }

        await this.executeQueries()
        return true
    }

    public async up() {
    }

    public async down() {
    }
}
