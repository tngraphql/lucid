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

import { MorphTo } from './index'

/**
 * Extends the model query builder for executing queries in scope
 * to the current relationship
 */
export class MorphToQueryBuilder extends BaseQueryBuilder {
    protected appliedConstraints: boolean = false

    constructor(
        builder: Knex.QueryBuilder,
        client: QueryClientContract,
        private parent: LucidRow | LucidRow[],
        private relation: MorphTo
    ) {
        super(builder, client, relation, (userFn) => {
            return ($builder) => {
                const subQuery = new MorphToQueryBuilder($builder, this.client, this.parent, this.relation)
                subQuery.isSubQuery = true
                subQuery.isEagerQuery = this.isEagerQuery
                userFn(subQuery)
            }
        })
    }

    /**
     * Profiler data for MorphTo relationship
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
        return [this.relation.localKey]
    }

    /**
     * Clones the current query
     */
    public clone() {
        const clonedQuery = new MorphToQueryBuilder(
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

        this.appliedConstraints = true
        const queryAction = this.queryAction()
        if (!this.parent) {
            return;
        }

        /**
         * Eager query contraints
         */
        if ( Array.isArray(this.parent) ) {
            this.whereIn(this.relation.localKey, unique(this.parent.map((model) => {
                return getValue(model, this.relation.foreignKey, this.relation, queryAction)
            })));
            return;
        }

        /**
         * Query constraints
         */
        const value = getValue(this.parent, this.relation.foreignKey, this.relation, queryAction)
        this.where(this.relation.localKey, value)

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
        throw new Error(`Cannot paginate a hasOne relationship "(${ this.relation.relationName })"`)
    }

    public update(columns: any): any {
        return super.update(columns);
    }
}
