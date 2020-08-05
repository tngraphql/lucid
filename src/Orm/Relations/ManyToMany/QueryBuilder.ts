/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:00 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as Knex from 'knex';
import { QueryClientContract } from '../../../Contracts/Database/QueryClientContract';
import { LucidModel } from '../../../Contracts/Model/LucidModel';
import { LucidRow } from '../../../Contracts/Model/LucidRow';
import { ManyToManyQueryBuilderContract } from '../../../Contracts/Orm/Relations/ManyToManyQueryBuilderContract';
import { SimplePaginator } from '../../../Database/Paginator/SimplePaginator'
import { getValue, isObject, unique } from '../../../utils'
import { BaseQueryBuilder } from '../Base/QueryBuilder'

import { ManyToMany } from './index'
import {ModelQueryBuilderContract} from "../../../Contracts/Model/ModelQueryBuilderContract";
import {Relation} from "../Base/Relation";

/**
 * Extends the model query builder for executing queries in scope
 * to the current relationship
 */
export class ManyToManyQueryBuilder extends BaseQueryBuilder implements ManyToManyQueryBuilderContract<LucidModel,
    LucidModel> {
    private pivotQuery = false
    protected cherryPickingKeys: boolean = false
    protected appliedConstraints: boolean = false

    /**
     * A boolean to know if query build targets only the pivot
     * table or not
     */
    public get isPivotOnlyQuery() {
        return this.pivotQuery
    }

    public set isPivotOnlyQuery(pivotOnly) {
        this.pivotQuery = pivotOnly
        this.wrapResultsToModelInstances = ! this.pivotQuery
    }

    constructor(
        builder: Knex.QueryBuilder,
        client: QueryClientContract,
        private parent: LucidRow | LucidRow[],
        private relation: ManyToMany
    ) {
        super(builder, client, relation, (userFn) => {
            return ($builder) => {
                const subQuery = new ManyToManyQueryBuilder($builder, this.client, this.parent, this.relation)
                subQuery.isSubQuery = true
                subQuery.isPivotOnlyQuery = this.isPivotOnlyQuery
                subQuery.isEagerQuery = this.isEagerQuery
                userFn(subQuery)
            }
        })
    }

    /**
     * Profiler data for ManyToMany relationship
     */
    protected profilerData() {
        return {
            type: this.relation.type,
            model: this.relation.model.name,
            pivotTable: this.relation.pivotTable,
            relatedModel: this.relation.relatedModel().name
        }
    }

    /**
     * The keys for constructing the join query
     */
    protected getRelationKeys(): string[] {
        return [
            `${ this.relation.relatedModel().getTable() }.${ this.relation.relatedKeyColumnName }`
        ]
    }

    /**
     * Prefixes the pivot table name to the key
     */
    private prefixPivotTable(key: string) {
        return this.isPivotOnlyQuery ? key : `${ this.relation.pivotTable }.${ key }`
    }

    /**
     * Adds where constraint to the pivot table
     */
    private addWhereConstraints() {
        if (!this.parent) {
            return;
        }

        const queryAction = this.queryAction()

        /**
         * Eager query contraints
         */
        if ( Array.isArray(this.parent) ) {
            this.whereInPivot(this.relation.pivotForeignKey, unique(this.parent.map((model) => {
                return getValue(model, this.relation.localKey, this.relation, queryAction)
            })))
            return
        }

        /**
         * Query constraints
         */
        const value = getValue(this.parent, this.relation.localKey, this.relation, queryAction)
        this.wherePivot(this.relation.pivotForeignKey, value)
    }

    /**
     * Transforms the selected column names by prefixing the
     * table name
     */
    private transformRelatedTableColumns(columns: any[]) {
        if ( this.isPivotOnlyQuery ) {
            return columns
        }

        if (Array.isArray(columns[0])) {
            return this.transformRelatedTableColumns(columns[0]);
        }

        const relatedTable = this.getTable();
        return columns.map((column) => {
            if ( typeof (column) === 'string' ) {
                return `${ relatedTable }.${ this.resolveKey(column) }`
            }

            if ( column.constructor === Object ) {
                return Object.keys(column).reduce((result, alias) => {
                    result[alias] = `${ relatedTable }.${ this.resolveKey(column[alias]) }`
                    return result
                }, {})
            }

            return this.transformValue(column)
        })
    }

    /**
     * Executes the pagination query for the relationship
     */
    private async paginateRelated(page: number, perPage: number) {
        const countQuery = this.clone().clearOrder().clearLimit().clearOffset().clearSelect().count('* as total')

        const aggregateQuery = await countQuery.exec()
        const total = this.hasGroupBy ? aggregateQuery.length : aggregateQuery[0].total

        const results = total > 0 ? await this.forPage(page, perPage).exec() : []
        return new SimplePaginator(results, total, perPage, page)
    }

    /**
     * Select keys from the related table
     */
    public select(...args: any): this {
        this.cherryPickingKeys = true
        super.select(this.transformRelatedTableColumns(args))
        return this
    }

    /**
     * Add where clause with pivot table prefix
     */
    public wherePivot(key: any, operator?: any, value?: any): this {
        if ( value !== undefined ) {
            this.knexQuery.where(this.prefixPivotTable(key), operator, this.transformValue(value))
        } else if ( operator !== undefined ) {
            this.knexQuery.where(this.prefixPivotTable(key), this.transformValue(operator))
        } else {
            this.knexQuery.where(this.transformCallback(key))
        }

        return this
    }

    /**
     * Add or where clause with pivot table prefix
     */
    public orWherePivot(key: any, operator?: any, value?: any): this {
        if ( value !== undefined ) {
            this.knexQuery.orWhere(this.prefixPivotTable(key), operator, this.transformValue(value))
        } else if ( operator !== undefined ) {
            this.knexQuery.orWhere(this.prefixPivotTable(key), this.transformValue(operator))
        } else {
            this.knexQuery.orWhere(this.transformCallback(key))
        }

        return this
    }

    /**
     * Alias for wherePivot
     */
    public andWherePivot(key: any, operator?: any, value?: any): this {
        return this.wherePivot(key, operator, value)
    }

    /**
     * Add where not pivot
     */
    public whereNotPivot(key: any, operator?: any, value?: any): this {
        if ( value !== undefined ) {
            this.knexQuery.whereNot(this.prefixPivotTable(key), operator, this.transformValue(value))
        } else if ( operator !== undefined ) {
            this.knexQuery.whereNot(this.prefixPivotTable(key), this.transformValue(operator))
        } else {
            this.knexQuery.whereNot(this.transformCallback(key))
        }

        return this
    }

    /**
     * Add or where not pivot
     */
    public orWhereNotPivot(key: any, operator?: any, value?: any): this {
        if ( value !== undefined ) {
            this.knexQuery.orWhereNot(this.prefixPivotTable(key), operator, this.transformValue(value))
        } else if ( operator !== undefined ) {
            this.knexQuery.orWhereNot(this.prefixPivotTable(key), this.transformValue(operator))
        } else {
            this.knexQuery.orWhereNot(this.transformCallback(key))
        }

        return this
    }

    /**
     * Alias for `whereNotPivot`
     */
    public andWhereNotPivot(key: any, operator?: any, value?: any): this {
        return this.whereNotPivot(key, operator, value)
    }

    /**
     * Adds where in clause
     */
    public whereInPivot(key: any, value: any) {
        value = Array.isArray(value)
            ? value.map((one) => this.transformValue(one))
            : this.transformValue(value)

        key = Array.isArray(key)
            ? key.map((one) => this.prefixPivotTable(one))
            : this.prefixPivotTable(key)

        this.knexQuery.whereIn(key, value)
        return this
    }

    /**
     * Adds or where in clause
     */
    public orWhereInPivot(key: any, value: any) {
        value = Array.isArray(value)
            ? value.map((one) => this.transformValue(one))
            : this.transformValue(value)

        key = Array.isArray(key)
            ? key.map((one) => this.prefixPivotTable(one))
            : this.prefixPivotTable(key)

        this.knexQuery.orWhereIn(key, value)
        return this
    }

    /**
     * Alias from `whereInPivot`
     */
    public andWhereInPivot(key: any, value: any): this {
        return this.whereInPivot(key, value)
    }

    /**
     * Adds where not in clause
     */
    public whereNotInPivot(key: any, value: any) {
        value = Array.isArray(value)
            ? value.map((one) => this.transformValue(one))
            : this.transformValue(value)

        key = Array.isArray(key)
            ? key.map((one) => this.prefixPivotTable(one))
            : this.prefixPivotTable(key)

        this.knexQuery.whereNotIn(key, value)
        return this
    }

    /**
     * Adds or where not in clause
     */
    public orWhereNotInPivot(key: any, value: any) {
        value = Array.isArray(value)
            ? value.map((one) => this.transformValue(one))
            : this.transformValue(value)

        key = Array.isArray(key)
            ? key.map((one) => this.prefixPivotTable(one))
            : this.prefixPivotTable(key)

        this.knexQuery.orWhereNotIn(key, value)
        return this
    }

    /**
     * Alias from `whereNotInPivot`
     */
    public andWhereNotInPivot(key: any, value: any): this {
        return this.whereNotInPivot(key, value)
    }

    /**
     * Select pivot columns
     */
    public pivotColumns(columns: string[]): this {
        this.knexQuery.select(columns.map((column) => {
            return `${ this.prefixPivotTable(column) } as ${ this.relation.pivotAlias(column) }`
        }))
        return this
    }

    /**
     * Applying query constraints to scope them to relationship
     * only.
     */
    protected applyConstraints() {
        if ( this.appliedConstraints ) {
            return
        }

        this.appliedConstraints = true

        if ( this.isPivotOnlyQuery || ['delete', 'update'].includes(this.queryAction()) ) {
            this.from(this.relation.pivotTable)
            this.addWhereConstraints()
            return
        }

        /**
         * Add select statements only when not running aggregate
         * queries. The end user can still select columns
         */
        if ( ! this.hasAggregates ) {
            /**
             * Select * from related model when user is not cherry picking
             * keys
             */
            if ( ! this.cherryPickingKeys ) {
                this.select('*')
            }

            /**
             * Select columns from the pivot table
             */
            this.pivotColumns(
                [
                    this.relation.pivotForeignKey,
                    this.relation.pivotRelatedForeignKey
                ].concat(this.relation.extrasPivotColumns)
            )
        }

        /**
         * Add inner join between related model and pivot table
         */
        this.innerJoin(
            this.relation.pivotTable,
            `${ this.getTable() }.${ this.relation.relatedKeyColumnName }`,
            `${ this.relation.pivotTable }.${ this.relation.pivotRelatedForeignKey }`
        )

        this.addWhereConstraints()
        return
    }

    /**
     * Clones query
     */
    public clone() {
        this.applyConstraints()
        const clonedQuery = new ManyToManyQueryBuilder(
            this.knexQuery.clone(),
            this.client,
            this.parent,
            this.relation
        )

        this.applyQueryFlags(clonedQuery)
        clonedQuery.cherryPickingKeys = this.cherryPickingKeys
        clonedQuery.appliedConstraints = this.appliedConstraints
        clonedQuery.isPivotOnlyQuery = this.isPivotOnlyQuery
        clonedQuery.isEagerQuery = this.isEagerQuery
        return clonedQuery
    }

    /**
     * Paginate through rows inside a given table
     */
    public paginate(page: number, perPage: number = 20) {
        if ( this.isEagerQuery ) {
            throw new Error(`Cannot paginate relationship "${ this.relation.relationName }" during preload`)
        }
        return this.paginateRelated(page, perPage)
    }

    public getRelationExistenceQuery(query, parentQuery, column = '*') {
        // this.hasAggregates = true;

        if (query.getTable() === parentQuery.getTable()) {
            return this.getRelationExistenceQueryForSelfRelation(query, parentQuery, column);
        }

        this.applyConstraints();

        super.getRelationExistenceQuery(query, parentQuery, column = '*');

        return this;
    }

    protected getParentKeyName() {
        return this.relation.localKey;
    }

    protected getRelationExistenceQueryForSelfRelation(query: ModelQueryBuilderContract<LucidModel, number>, parentQuery, column = '*') {
        const hash = this.getRelationCountHash();

        query.knexQuery.table(`${query.model.getTable()} as ${hash}`);

        query.setTable(hash);

        this.applyConstraints();

        super.getRelationExistenceQuery(query, parentQuery, column = '*');

        return this;
    }

    public getRelationCountHash() {
        return 'lucid_reserved_' + Relation.$selfJoinCount++;
    }

    public getExistenceCompareKey() {
        return this.relation.pivotTable + '.' + this.relation.pivotForeignKey;
    }
}
