/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:00 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */


import { Exception } from '@poppinss/utils/build'
import * as Knex from 'knex'
import { QueryClientContract } from '../../Contracts/Database/QueryClientContract';
import { TransactionClientContract } from '../../Contracts/Database/TransactionClientContract';
import { DBQueryCallback } from '../../Contracts/Database/types';
import { LucidModel } from '../../Contracts/Model/LucidModel';
import { ModelAdapterOptions, ModelObject } from '../../Contracts/Model/LucidRow';
import { ModelQueryBuilderContract } from '../../Contracts/Model/ModelQueryBuilderContract';
import { GlobalScope } from '../../Contracts/Model/types';
import { SimplePaginator } from '../../Database/Paginator/SimplePaginator'
import { Chainable } from '../../Database/QueryBuilder/Chainable'
import { QueryRunner } from '../../QueryRunner/QueryRunner'
import { isObject } from '../../utils';

import { Preloader } from '../Preloader/Preloader'
import _ = require('lodash');
import {DATE_TIME_TYPES} from "../Decorators/date";
import {DateTime} from "luxon";

/**
 * A wrapper to invoke scope methods on the query builder
 * underlying model
 */
class ModelScopes {
    constructor(protected builder: ModelQueryBuilder) {
        return new Proxy(this, {
            get(target, key) {
                if ( typeof (target.builder.model[key]) === 'function' ) {
                    return (...args: any[]) => {
                        return target.builder.model[key](target.builder, ...args)
                    }
                }

                /**
                 * Unknown keys are not allowed
                 */
                throw new Error(
                    `"${ String(key) }" is not defined as a query scope on "${ target.builder.model.name }" model`
                )
            }
        })
    }
}

/**
 * Database query builder exposes the API to construct and run queries for selecting,
 * updating and deleting records.
 */
export class ModelQueryBuilder extends Chainable implements ModelQueryBuilderContract<LucidModel> {
    /**
     * Sideloaded attributes that will be passed to the model instances
     */
    private sideloaded: ModelObject = {}

    /**
     * A copy of defined preloads on the model instance
     */
    private preloader = new Preloader(this.model)

    /**
     * Required by macroable
     */
    protected static macros = {}
    protected static getters = {}

    /**
     * A references to model scopes wrapper. It is lazily initialized
     * only when the `apply` method is invoked
     */
    private scopesWrapper: ModelScopes | undefined = undefined

    /**
     * Control whether or not to wrap adapter result to model
     * instances or not
     */
    protected wrapResultsToModelInstances: boolean = true

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
     * Options that must be passed to all new model instances
     */
    public clientOptions: ModelAdapterOptions = {
        client: this.client,
        connection: this.client.connectionName,
        profiler: this.client.profiler
    }

    /**
     * Whether or not query is a subquery for `.where` callback
     */
    public isSubQuery = false;

    protected _scopes: GlobalScope[] = [];

    protected _applyScope = false;

    /**
     * The methods that should be returned from query builder.
     */
    protected _passthru = [
        'toSQL'
    ];

    protected _removedScopes = [];

    protected _onDelete;

    constructor(
        builder: Knex.QueryBuilder,
        public model: LucidModel,
        public client: QueryClientContract,
        customFn: DBQueryCallback = (userFn) => {
            return ($builder) => {
                const subQuery = new ModelQueryBuilder($builder, this.model, this.client)
                subQuery.isSubQuery = true
                userFn(subQuery)
            }
        }
    ) {
        super(builder, customFn, (key: string) => {
            if (key.includes('.')) {
                let [table, column] = key.split('.');

                return [table, f(model, column)].join('.');
            }
            return f(model, key);
        });

        function f(model, key) {
            let [column, as, alias] = key.split(' ').map(x => x.trim());
            column = model.$keys.attributesToColumns.resolve.bind(model.$keys.attributesToColumns)(column);
            if (alias) {
                return [column, alias].join(' as ');
            }
            return column;
        }

        builder.table(model.getTable());

        const p = new Proxy(this, {
            get(target: any, key: string | number, receiver: any): any {
                if ( typeof key === 'symbol' ) {
                    return Reflect.get(target, key, receiver);
                }

                if ( ! Reflect.has(target, key) ) {
                    const scope = `scope${ _.upperFirst(key as string) }`;

                    if ( typeof model[scope] === 'function' ) {
                        return model[scope].bind(model, p);
                    }
                }

                if ( target._passthru.includes(key as string) ) {
                    return Reflect.get(target.toBase(), key, receiver);
                }

                return Reflect.get(target, key, receiver);
            }
        });

        return p;
    }

    public withGlobalScope(scope, callback): this {
        if ( ! this._scopes ) {
            this._scopes = [];
        }

        if (isObject(callback) && Reflect.has(callback, 'extend')) {
            callback.extend(this);
        }

        this._scopes.push({ scope, callback });

        return this;
    }

    public withoutGlobalScopes(scopes: any[] = null): this {
        if ( scopes === null ) {
            scopes = this._scopes.slice();

            for( let scope of scopes ) {
                this.withoutGlobalScope(scope.scope);
            }
        } else {
            if ( Array.isArray(scopes) ) {
                for( let scope of scopes ) {
                    this.withoutGlobalScope(scope);
                }
            }
        }

        return this;
    }

    public withoutGlobalScope(scope: string | Function): this {
        let index = this._scopes.findIndex(x => x.scope === scope);

        if ( index !== -1 ) {
            this._scopes.splice(index, 1);
        }

        this._removedScopes.push(scope);

        return this;
    }

    /**
     * Get an array of global scopes that were removed from the query.
     *
     */
    public removedScopes(): any[] {
        return this._removedScopes;
    }

    public applyScopes(): ModelQueryBuilder {
        if ( ! this._scopes ) {
            return this;
        }

        if (this._applyScope) {
            return;
        }

        for( let item of this._scopes ) {
            if ( ! this._scopes.includes(item) ) {
                continue;
            }

            const scope: any = item.callback;

            if ( isObject(scope) && Reflect.has(scope, 'apply') ) {
                scope.apply(this, this.model);
            }

            if ( typeof scope === 'function' ) {
                scope(this);
            }
        }

        this._applyScope = true;

        return this;
    }

    /**
     * Executes the current query
     */
    private async execQuery() {
        this.applyScopes();

        const isWriteQuery = ['update', 'del', 'insert'].includes(this.knexQuery['_method'])
        const queryData = Object.assign(this.getQueryData(), this.customReporterData)
        const rows = await new QueryRunner(this.client, this.debugQueries, queryData).run(this.knexQuery)

        /**
         * Return the rows as it is when query is a write query
         */
        if ( isWriteQuery || this.hasAggregates || ! this.wrapResultsToModelInstances ) {
            return Array.isArray(rows) ? rows : [rows]
        }

        /**
         * Convert fetch results to an array of model instances
         */
        const modelInstances = this.model.$createMultipleFromAdapterResult(
            rows,
            this.sideloaded,
            this.clientOptions
        )

        /**
         * Preload for model instances
         */
        await this.preloader.sideload(this.sideloaded).processAllForMany(modelInstances, this.client);

        this._applyScope = false;

        return modelInstances
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
     * Returns the profiler action. Protected, since the class is extended
     * by relationships
     */
    protected getQueryData() {
        return {
            connection: this.client.connectionName,
            inTransaction: this.client.isTransaction,
            model: this.model.name
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
     * Clone the current query builder
     */
    public clone(): ModelQueryBuilder {
        const clonedQuery = new ModelQueryBuilder(this.knexQuery.clone(), this.model, this.client);

        this.applyQueryFlags(clonedQuery)
        clonedQuery.sideloaded = Object.assign({}, this.sideloaded)
        return clonedQuery
    }

    protected applyQueryFlags(query) {
        this.registerGlobalScopes(query);

        return super.applyQueryFlags(query);
    }

    protected registerGlobalScopes(builder) {
        for (let scope of this._scopes) {
            builder.withGlobalScope(scope.scope, scope.callback);
        }

        return builder;
    }

    public newQuery(){
        return this.model.query() as any;
    }

    /**
     * Applies the query scopes on the current query builder
     * instance
     */
    public apply(callback: (scopes: any) => void): this {
        this.scopesWrapper = this.scopesWrapper || new ModelScopes(this)
        callback(this.scopesWrapper)
        return this
    }

    /**
     * Set sideloaded properties to be passed to the model instance
     */
    public sideload(value: ModelObject) {
        this.sideloaded = value
        return this
    }

    /**
     * Fetch and return first results from the results set. This method
     * will implicitly set a `limit` on the query
     */
    public async first(): Promise<any> {
        await this.model.$hooks.exec('before', 'find', this)

        const result = await this.limit(1).execQuery()
        if ( result[0] ) {
            await this.model.$hooks.exec('after', 'find', result[0])
        }

        return result[0] || null
    }

    public toBase(): this {
        this.applyScopes();
        return this;
    }

    /**
     * Fetch and return first results from the results set. This method
     * will implicitly set a `limit` on the query
     */
    public async firstOrFail(): Promise<any> {
        const row = await this.first()
        if ( ! row ) {
            throw new Exception('Row not found', 404, 'E_ROW_NOT_FOUND')
        }

        return row
    }

    /**
     * Define a relationship to be preloaded
     */
    public preload(relationName: any, userCallback?: any): this {
        this.preloader.preload(relationName, userCallback)
        return this
    }

    /**
     * Perform update by incrementing value for a given column. Increments
     * can be clubbed with `update` as well
     */
    public increment(column: any, counter?: any): any {
        this.ensureCanPerformWrites()
        this.knexQuery.increment(this.resolveKey(column, true), counter)
        return this
    }

    /**
     * Perform update by decrementing value for a given column. Decrements
     * can be clubbed with `update` as well
     */
    public decrement(column: any, counter?: any): any {
        this.ensureCanPerformWrites()
        this.knexQuery.decrement(this.resolveKey(column, true), counter)
        return this
    }

    /**
     * Perform update
     */
    public update(columns: any): any {
        this.ensureCanPerformWrites()

        this.model.$columnsDefinitions.forEach((column, attributeName) => {
            const columnType = column.meta?.type

            /**
             * Return early when not dealing with date time columns
             */
            if (!columnType || !DATE_TIME_TYPES[columnType] || !column.meta.autoUpdate) {
                return
            }

            const time = DateTime.local()

            columns[attributeName] = time;
        });

        this.knexQuery.update(this.resolveKey(this.model.prepareForAdapter(columns), true))
        return this
    }

    public onDelete(callback: (builder: this) => any) {
        this._onDelete = callback;
    }

    /**
     * Delete rows under the current query
     */
    public del(): any {
        this.ensureCanPerformWrites()

        this._onDelete ? this._onDelete(this) : this.knexQuery.del();

        return this
    }

    /**
     * Alias for [[del]]
     */
    public delete (): this {
        return this.del()
    }

    /**
     * Run the default delete function on the builder.
     *
     * Since we do not apply scopes here, the row will actually be deleted.
     */
    public forceDelete() {
        this._scopes = [];
        this.knexQuery.del();
        return this;
    }

    /**
     * Turn on/off debugging for this query
     */
    public debug(debug: boolean): this {
        this.debugQueries = debug;
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
    public async exec(): Promise<any[]> {
        /**
         * Only execute when we are wrapping result to model
         * instances
         */
        if ( this.wrapResultsToModelInstances ) {
            await this.model.$hooks.exec('before', 'fetch', this)
        }

        const result = await this.execQuery()

        /**
         * Only execute when we are wrapping result to model
         * instances
         */
        if ( this.wrapResultsToModelInstances ) {
            await this.model.$hooks.exec('after', 'fetch', result)
        }

        return result
    }

    /**
     * Paginate through rows inside a given table
     */
    public async paginate(page: number, perPage: number = 20) {
        const countQuery = this.clone().clearOrder().clearLimit().clearOffset().clearSelect().count('* as total');

        /**
         * We pass both the counts query and the main query to the
         * paginate hook
         */
        await this.model.$hooks.exec('before', 'paginate', [countQuery, this]);
        await this.model.$hooks.exec('before', 'fetch', this);

        const aggregateResult = await countQuery.execQuery()
        const total = this.hasGroupBy ? aggregateResult.length : aggregateResult[0].total

        const results = total > 0 ? await this.forPage(page, perPage).execQuery() : []
        const paginator = new SimplePaginator(results, total, perPage, page);

        await this.model.$hooks.exec('after', 'paginate', paginator);
        await this.model.$hooks.exec('after', 'fetch', results);

        return paginator;
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
