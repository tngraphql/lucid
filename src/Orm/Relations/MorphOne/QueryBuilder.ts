/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:00 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as Knex from 'knex'
import { QueryClientContract } from '../../../Contracts/Database/QueryClientContract';
import { LucidRow } from '../../../Contracts/Model/LucidRow';
import { getValue, unique } from '../../../utils'
import { BaseQueryBuilder } from '../Base/QueryBuilder'

import { MorphOne } from './index'
import {ModelQueryBuilderContract} from "../../../Contracts/Model/ModelQueryBuilderContract";
import {LucidModel} from "../../../Contracts/Model/LucidModel";
import {Relation} from "../Base/Relation";

/**
 * Extends the model query builder for executing queries in scope
 * to the current relationship
 */
export class MorphOneQueryBuilder extends BaseQueryBuilder {
    protected appliedConstraints: boolean = false

    constructor(
        builder: Knex.QueryBuilder,
        client: QueryClientContract,
        private parent: LucidRow | LucidRow[],
        private relation: MorphOne
    ) {
        super(builder, client, relation, (userFn) => {
            return ($builder) => {
                const subQuery = new MorphOneQueryBuilder($builder, this.client, this.parent, this.relation)
                subQuery.isSubQuery = true
                subQuery.isEagerQuery = this.isEagerQuery
                userFn(subQuery)
            }
        })
    }

    /**
     * Profiler data for MorphOne relationship
     */
    protected profilerData() {
        return {
            type: this.relation.type,
            model: this.relation.model.name,
            relatedModel: this.relation.relatedModel().name
        }
    }

    /**
     * The keys for constructing the join query
     */
    protected getRelationKeys(): string[] {
        return [this.relation.foreignKey]
    }

    /**
     * Clones the current query
     */
    public clone() {
        const clonedQuery = new MorphOneQueryBuilder(
            this.knexQuery.clone(),
            this.client,
            this.parent,
            this.relation
        )

        this.applyQueryFlags(clonedQuery)
        clonedQuery.appliedConstraints = this.appliedConstraints
        clonedQuery.isEagerQuery = this.isEagerQuery
        return clonedQuery
    }

    /**
     * Applies constraint to limit rows to the current relationship
     * only.
     */
    protected applyConstraints() {
        if ( this.appliedConstraints ) {
            return
        }
        if (!this.parent) {
            return;
        }

        this.appliedConstraints = true;
        const queryAction = this.queryAction()

        const type = this.relation.getMorphClass(this.relation.model);
        this.where(this.relation.morphType, type);

        /**
         * Eager query contraints
         */
        if ( Array.isArray(this.parent) ) {
            this.whereIn(this.relation.foreignKey, unique(this.parent.map((model) => {
                return getValue(model, this.relation.localKey, this.relation, queryAction)
            })))
            return
        }

        /**
         * Query constraints
         */
        const value = getValue(this.parent, this.relation.localKey, this.relation, queryAction)
        this.where(this.relation.foreignKey, value)

        /**
         * Do not add limit when updating or deleting
         */
        if ( ! ['update', 'delete'].includes(queryAction) ) {
            this.limit(1)
        }
    }

    /**
     * Dis-allow hasOne pagination
     */
    public paginate(): Promise<any> {
        throw new Error(`Cannot paginate a morphOne relationship "(${ this.relation.relationName })"`)
    }

    public getRelationExistenceQuery(query, parentQuery, column = '*') {
        if (query.getTable() === parentQuery.getTable()) {
            return this.getRelationExistenceQueryForSelfRelation(query, parentQuery, column);
        }

        const type = this.relation.getMorphClass(this.relation.model);
        this.where(this.relation.morphType, type);

        super.getRelationExistenceQuery(query, parentQuery, column);

        return this;
    }

    protected getRelationExistenceQueryForSelfRelation(query: ModelQueryBuilderContract<LucidModel, number>, parentQuery, column = '*') {
        const hash = this.getRelationCountHash();

        query.knexQuery.table(`${query.model.getTable()} as ${hash}`);

        query.setTable(hash);

        const type = this.relation.getMorphClass(this.relation.model);
        this.where(this.relation.morphType, type);

        this.whereColumn(
            parentQuery.resolveKey(parentQuery.qualifyColumn(this.getParentKeyName())),
            '=',
            this.resolveKey(hash + '.' + this.relation.foreignKey)
        );

        return this;
    }

    protected getParentKeyName() {
        // @ts-ignore
        return this.relation.localKey;
    }

    public getRelationCountHash() {
        return 'lucid_reserved_' + Relation.$selfJoinCount++;
    }

    public getExistenceCompareKey() {
        return this.relation.relatedModel().qualifyColumn(this.relation.foreignKey);
    }
}
