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
import { DBQueryCallback } from '../../../Contracts/Database/types';
import { LucidModel } from '../../../Contracts/Model/LucidModel';
import { LucidRow } from '../../../Contracts/Model/LucidRow';
import { RelationQueryBuilderContract } from '../../../Contracts/Orm/Relations/RelationQueryBuilderContract';
import { RelationshipsContract } from '../../../Contracts/Orm/Relations/types';
import { ModelQueryBuilder } from '../../QueryBuilder/ModelQueryBuilder'

/**
 * Base query builder for ORM Relationships
 */
export abstract class BaseQueryBuilder extends ModelQueryBuilder implements RelationQueryBuilderContract<LucidModel,
    LucidRow> {
    /**
     * A flag to know, if query builder is instantiated for
     * eager loading or not.
     */
    public isEagerQuery: boolean = false

    constructor(
        builder: Knex.QueryBuilder,
        client: QueryClientContract,
        relation: RelationshipsContract,
        dbCallback: DBQueryCallback
    ) {
        super(builder, relation.relatedModel(), client, dbCallback)
    }

    /**
     * Returns the profiler action. Protected, since the class is extended
     * by relationships
     */
    protected getQueryData() {
        return Object.assign(this.toSQL(), {
            connection: this.client.connectionName,
            inTransaction: this.client.isTransaction,
            model: this.model.name,
            eagerLoading: this.isEagerQuery,
            relation: this.profilerData()
        })
    }

    /**
     * Profiler data for the relationship
     */
    protected abstract profilerData(): any

    /**
     * Returns the sql query keys for the join query
     */
    protected abstract getRelationKeys(): string[]

    /**
     * The relationship query builder must implement this method
     * to apply relationship related constraints
     */
    protected abstract applyConstraints(): void

    /**
     * Returns the name of the query action. Used mainly for
     * raising descriptive errors
     */
    protected queryAction(): string {
        let action = this.knexQuery['_method']
        if ( action === 'del' ) {
            action = 'delete'
        }

        if ( action === 'select' && this.isEagerQuery ) {
            action = 'preload'
        }

        return action
    }

    /**
     * Selects the relation keys. Invoked by the preloader
     */
    public selectRelationKeys(): this {
        const knexQuery = this.knexQuery
        const columns = knexQuery['_statements'].find(({ grouping }) => grouping === 'columns')

        /**
         * No columns have been defined, we will let Knex do it's job by
         * adding `select *`
         */
        if ( ! columns ) {
            return this
        }

        /**
         * Finally push relation columns to existing selected columns
         */
        this.getRelationKeys().forEach((key) => {
            key = this.resolveKey(key)
            if (key && ! columns.value.includes(key) ) {
                columns.value.push(key)
            }
        })

        return this
    }

    /**
     * Get query sql
     */
    public toSQL() {
        this.applyConstraints()
        return super.toSQL()
    }

    /**
     * Execute query
     */
    public exec() {
        this.applyConstraints()
        return super.exec()
    }

    public mergeConstraintsFrom(query) {
        const cloneQuery = query.knexQuery['_statements'];
        this.knexQuery['_statements'].push.apply(this.knexQuery['_statements'], cloneQuery);
        this.sideload(Object.assign({}, query.sideloaded));
        return this;
    }

    public getRelationExistenceQuery(query, parentQuery, column = '*') {
        this.whereColumn(
            parentQuery.resolveKey(parentQuery.qualifyColumn(this.getParentKeyName())),
            '=',
            this.resolveKey(this.getExistenceCompareKey())
        )
    }

    public getRelationExistenceCountQuery(query, parentQuery) {
        this.getRelationExistenceQuery(query, parentQuery);

        query.knexQuery['_statements'] = query.knexQuery['_statements'].filter(x => x.grouping !== 'columns');

        query.count('*');
    }

    abstract getExistenceCompareKey();

    protected getParentKeyName() {
        // @ts-ignore
        return this.relation.model.primaryKey;
    }
}
