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
import { LucidRow } from '../../../Contracts/Model/LucidRow';
import { SimplePaginator } from '../../../Database/Paginator/SimplePaginator'
import { getValue, isObject, unique } from '../../../utils'
import { BaseQueryBuilder } from '../Base/QueryBuilder'

import { HasManyThrough } from './index'
import {ModelQueryBuilderContract} from "../../../Contracts/Model/ModelQueryBuilderContract";
import {LucidModel} from "../../../Contracts/Model/LucidModel";
import {Relation} from "../Base/Relation";

/**
 * Extends the model query builder for executing queries in scope
 * to the current relationship
 */
export class HasManyThroughQueryBuilder extends BaseQueryBuilder {
    protected cherryPickingKeys: boolean = false
    protected appliedConstraints: boolean = false

    constructor(
        builder: Knex.QueryBuilder,
        client: QueryClientContract,
        private parent: LucidRow | LucidRow[],
        private relation: HasManyThrough
    ) {
        super(builder, client, relation, (userFn) => {
            return ($builder) => {
                const subQuery = new HasManyThroughQueryBuilder($builder, this.client, this.parent, this.relation)
                subQuery.isSubQuery = true
                subQuery.isEagerQuery = this.isEagerQuery
                userFn(subQuery)
            }
        })
    }

    /**
     * Profiler data for HasManyThrough relationship
     */
    protected profilerData() {
        return {
            type: this.relation.type,
            model: this.relation.model.name,
            throughModel: this.relation.throughModel().name,
            relatedModel: this.relation.relatedModel().name
        }
    }

    /**
     * The keys for constructing the join query
     */
    protected getRelationKeys(): string[] {
        return [this.relation.throughForeignKeyColumnName]
    }

    /**
     * Adds where constraint to the pivot table
     */
    private addWhereConstraints(builder: HasManyThroughQueryBuilder) {
        const queryAction = this.queryAction()
        const throughTable = this.relation.throughModel().getTable()
        if (!this.parent) {
            return;
        }

        /**
         * Eager query contraints
         */
        if ( Array.isArray(this.parent) ) {
            builder.whereIn(
                `${ throughTable }.${ this.relation.foreignKeyColumnName }`,
                unique(this.parent.map((model) => {
                    return getValue(model, this.relation.localKey, this.relation, queryAction)
                }))
            );
            return;
        }

        /**
         * Query constraints
         */
        const value = getValue(this.parent, this.relation.localKey, this.relation, queryAction)
        builder.where(`${ throughTable }.${ this.relation.foreignKeyColumnName }`, value)
    }

    /**
     * Transforms the selected column names by prefixing the
     * table name
     */
    private transformRelatedTableColumns(columns: any[]) {
        if (Array.isArray(columns[0])) {
            return this.transformRelatedTableColumns(columns[0]);
        }

        const relatedTable = this.relation.relatedModel().getTable()

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
        this.knexQuery.select(this.transformRelatedTableColumns(args))
        return this
    }

    /**
     * Applies constraint to limit rows to the current relationship
     * only.
     */
    protected applyConstraints() {
        if ( this.appliedConstraints ) {
            return
        }

        this.appliedConstraints = true

        const throughTable = this.relation.throughModel().getTable()
        const relatedTable = this.relation.relatedModel().getTable()

        if ( ['delete', 'update'].includes(this.queryAction()) ) {
            this.whereIn(`${ relatedTable }.${ this.relation.throughForeignKeyColumnName }`, (subQuery) => {
                subQuery.from(throughTable)
                this.addWhereConstraints(subQuery)
            })
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
             * Selecting all from the related table, along with the foreign key of the
             * through table.
             */
            this.knexQuery.select(
                `${ throughTable }.${ this.relation.foreignKeyColumnName } as ${ this.relation.throughAlias(this.relation.foreignKeyColumnName) }`
            )
        }

        /**
         * Inner join
         */
        this.innerJoin(
            throughTable,
            `${ throughTable }.${ this.relation.throughLocalKeyColumnName }`,
            `${ relatedTable }.${ this.relation.throughForeignKeyColumnName }`
        )

        /**
         * Adding where constraints
         */
        this.addWhereConstraints(this)
    }

    /**
     * Clones the current query
     */
    public clone() {
        const clonedQuery = new HasManyThroughQueryBuilder(
            this.knexQuery.clone(),
            this.client,
            this.parent,
            this.relation
        )

        this.applyQueryFlags(clonedQuery)
        clonedQuery.appliedConstraints = this.appliedConstraints
        clonedQuery.cherryPickingKeys = this.cherryPickingKeys
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

        if (parentQuery.getTable() === query.getTable()) {
            return this.getRelationExistenceQueryForSelfRelation(query, parentQuery, column);
        }

        if (parentQuery.getTable() === this.relation.throughModel().getTable()) {
            return this.getRelationExistenceQueryForThroughSelfRelation(query, parentQuery, column);
        }

        this.applyConstraints();

        this.whereColumn(
            parentQuery.resolveKey(parentQuery.qualifyColumn(this.relation.localKey)),
            '=',
            this.getQualifiedFirstKeyName()
        );

        return this;
    }

    protected getRelationExistenceQueryForThroughSelfRelation(query: ModelQueryBuilderContract<LucidModel, number>, parentQuery, column = '*') {
        const hash = this.getRelationCountHash();

        const table = `${this.relation.throughModel().getTable()} as ${hash}`;

        this.innerJoin(
            table,
            `${hash}.${this.relation.throughLocalKeyColumnName}`,
            this.getExistenceCompareKey()
        );

        this.whereColumn(
            parentQuery.resolveKey(parentQuery.qualifyColumn(this.relation.localKey)),
            '=',
            this.resolveKey(hash + '.' + this.relation.foreignKeyColumnName)
        );

        return this;
    }

    protected getQualifiedFirstKeyName() {
        return this.relation.throughModel().qualifyColumn(this.relation.foreignKeyColumnName);
    }

    protected getRelationExistenceQueryForSelfRelation(query: ModelQueryBuilderContract<LucidModel, number>, parentQuery, column = '*') {
        const hash = this.getRelationCountHash();

        query.knexQuery.table(`${query.model.getTable()} as ${hash}`);

        query.setTable(hash);

        const throughTable = this.relation.throughModel().getTable()
        const relatedTable = hash

        this.innerJoin(
            throughTable,
            `${ throughTable }.${ this.relation.throughLocalKeyColumnName }`,
            `${ relatedTable }.${ this.relation.throughForeignKeyColumnName }`
        )

        this.whereColumn(
            parentQuery.resolveKey(parentQuery.qualifyColumn(this.relation.localKey)),
            '=',
            this.resolveKey(hash + '.' + this.relation.foreignKeyColumnName)
        );

        return this;
    }

    public getRelationCountHash() {
        return 'lucid_reserved_' + Relation.$selfJoinCount++;
    }

    public getExistenceCompareKey() {
        return this.relation.relatedModel().qualifyColumn(this.relation.foreignKeyColumnName);
    }
}
