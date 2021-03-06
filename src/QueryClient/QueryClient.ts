/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:57 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ProfilerContract, ProfilerRowContract } from '@ioc:Adonis/Core/Profiler'
import { Exception } from '@poppinss/utils/build';
import { EmitterContract } from '@tngraphql/illuminate/dist/Contracts/Events/EmitterContract';
import * as Knex from 'knex';

import { resolveClientNameWithAliases } from 'knex/lib/helpers'
import { ConnectionContract } from '../Contracts/Connection/ConnectionContract';
import { DialectContract } from '../Contracts/Database/DialectContract';
import { QueryClientContract } from '../Contracts/Database/QueryClientContract';
import { TransactionClientContract } from '../Contracts/Database/TransactionClientContract';
import { DatabaseQueryBuilder } from '../Database/QueryBuilder/DatabaseQueryBuilder'
import { InsertQueryBuilder } from '../Database/QueryBuilder/InsertQueryBuilder'
import { RawQueryBuilder } from '../Database/QueryBuilder/RawQueryBuilder'
import { RawBuilder } from '../Database/StaticBuilder/RawBuilder'
import { ReferenceBuilder } from '../Database/StaticBuilder/ReferenceBuilder'

import { dialects } from '../Dialects'
import { ModelQueryBuilder } from '../Orm/QueryBuilder/ModelQueryBuilder'
import { TransactionClient } from '../TransactionClient/TransactionClient'
import {TransactionOptions} from "../Contracts/Database/TransactionOptions";

const Bluebird = require('bluebird').getNewLibraryCopy();

/**
 * Query client exposes the API to fetch instance of different query builders
 * to perform queries on a selecte connection.
 */
export class QueryClient implements QueryClientContract {
    /**
     * Not a transaction client
     */
    public readonly isTransaction = false

    /**
     * The dialect in use
     */
    public dialect: DialectContract = new (
        dialects[resolveClientNameWithAliases(this.connection.config.client)]
    )(this)

    /**
     * The profiler to be used for profiling queries
     */
    public profiler?: ProfilerRowContract | ProfilerContract

    /**
     * Name of the connection in use
     */
    public readonly connectionName = this.connection.name;

    /**
     * Is debugging enabled
     */
    public debug = !!this.connection.config.debug

    constructor(
        public readonly mode: 'dual' | 'write' | 'read',
        private connection: ConnectionContract,
        public emitter: EmitterContract
    ) {
    }

    /**
     * Returns schema instance for the write client
     */
    public get schema() {
        return this.getWriteClient().schema
    }

    /**
     * Returns the read client. The readClient is optional, since we can get
     * an instance of [[QueryClient]] with a sticky write client.
     */
    public getReadClient(): Knex {
        if ( this.mode === 'read' || this.mode === 'dual' ) {
            return this.connection.readClient!
        }

        return this.connection.client!
    }

    /**
     * Returns the write client
     */
    public getWriteClient(): Knex {
        if ( this.mode === 'write' || this.mode === 'dual' ) {
            return this.connection.client!
        }

        throw new Exception(
            'Write client is not available for query client instantiated in read mode',
            500,
            'E_RUNTIME_EXCEPTION'
        )
    }

    /**
     * Truncate table
     */
    public async truncate(table: string, cascade: boolean = false): Promise<void> {
        await this.dialect.truncate(table, cascade)
    }

    /**
     * Get information for a table columns
     */
    public async columnsInfo(table: string, column?: string): Promise<any> {
        const result = await this
            .getWriteClient()
            .table(table)
            .columnInfo(column ? column as never : undefined as never)

        return result
    }

    /**
     * Returns an array of table names
     */
    public async getAllTables(schemas?: string[]): Promise<string[]> {
        return this.dialect.getAllTables(schemas)
    }

    /**
     * Returns an instance of a transaction. Each transaction will
     * query and hold a single connection for all queries.
     */
    public async transaction<T = TransactionClientContract>(options?, callback?: (trx: TransactionClientContract) => Promise<T> | T): Promise<T> {
        if (typeof options === 'function') {
            callback = options;
            options = undefined;
        }

        const client = this.getWriteClient();
        const trx: any = await client.transaction(null, {
            userParams: {},
            doNotRejectOnRollback: true,
            dialect: this.dialect,
            ...options
        })
        trx.parent = client;

        const transaction = new TransactionClient(trx, this.connection.config.client, this.connectionName, this.debug, this.emitter);

        /**
         * Always make sure to pass the profiler and emitter down to the transaction
         * client as well
         */
        transaction.profiler = this.profiler?.create('trx:begin', { state: 'begin' });

        return transaction.runTransaction(options, callback);
    }

    /**
     * Returns the Knex query builder instance. The query builder is always
     * created from the `write` client, so before executing the query, you
     * may want to decide which client to use.
     */
    public knexQuery(): Knex.QueryBuilder {
        return this.connection.client!.queryBuilder()
    }

    /**
     * Returns the Knex raw query builder instance. The query builder is always
     * created from the `write` client, so before executing the query, you
     * may want to decide which client to use.
     */
    public knexRawQuery(sql: string, bindings?: any): Knex.Raw {
        return bindings ? this.connection.client!.raw(sql, bindings) : this.connection.client!.raw(sql)
    }

    /**
     * Returns a query builder instance for a given model.
     */
    public modelQuery(model: any): any {
        return new ModelQueryBuilder(this.knexQuery(), model, this)
    }

    /**
     * Returns instance of a query builder for selecting, updating
     * or deleting rows
     */
    public query(): any {
        return new DatabaseQueryBuilder(this.knexQuery(), this)
    }

    /**
     * Returns instance of a query builder for inserting rows
     */
    public insertQuery(): any {
        return new InsertQueryBuilder(this.getWriteClient().queryBuilder(), this)
    }

    /**
     * Returns instance of raw query builder
     */
    public rawQuery(sql: any, bindings?: any): any {
        return new RawQueryBuilder(this.connection.client!.raw(sql, bindings), this)
    }

    /**
     * Returns an instance of raw builder. This raw builder queries
     * cannot be executed. Use `rawQuery`, if you want to execute
     * queries raw queries.
     */
    public raw(sql: string, bindings?: any) {
        return new RawBuilder(sql, bindings)
    }

    /**
     * Returns reference builder.
     */
    public ref(reference: string) {
        return new ReferenceBuilder(reference)
    }

    /**
     * Returns instance of a query builder and selects the table
     */
    public from(table: any): any {
        return this.query().from(table)
    }

    /**
     * Returns instance of a query builder and selects the table
     * for an insert query
     */
    public table(table: any): any {
        return this.insertQuery().table(table)
    }

    /**
     * Get advisory lock on the selected connection
     */
    public getAdvisoryLock(key: string| number, timeout?: number): any {
        return this.dialect.getAdvisoryLock(key, timeout)
    }

    /**
     * Release advisory lock
     */
    public releaseAdvisoryLock(key: string| number): any {
        return this.dialect.releaseAdvisoryLock(key)
    }
}
