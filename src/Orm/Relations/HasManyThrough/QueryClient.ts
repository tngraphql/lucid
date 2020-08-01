/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:00 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { QueryClientContract } from '../../../Contracts/Database/QueryClientContract';
import { LucidModel } from '../../../Contracts/Model/LucidModel';
import { LucidRow } from '../../../Contracts/Model/LucidRow';
import { OneOrMany } from '../../../Contracts/Model/types';
import { HasManyThroughClientContract } from '../../../Contracts/Orm/Relations/HasManyThroughClientContract';
import { HasManyThrough } from './index'
import { HasManyThroughQueryBuilder } from './QueryBuilder'

/**
 * Query client for executing queries in scope to the defined
 * relationship
 */
export class HasManyThroughClient implements HasManyThroughClientContract<HasManyThrough, LucidModel> {
    constructor(
        public relation: HasManyThrough,
        private parent: LucidRow,
        private client: QueryClientContract
    ) {
    }

    /**
     * Generate a related query builder
     */
    public static query(client: QueryClientContract, relation: HasManyThrough, rows: OneOrMany<LucidRow>, isEagerQuery = false) {
        const model = relation.relatedModel();

        let query = new HasManyThroughQueryBuilder(client.knexQuery(), client, rows, relation)

        query = model.registerGlobalScopes(query);

        query.isEagerQuery = isEagerQuery;

        typeof (relation.onQueryHook) === 'function' && relation.onQueryHook(query)

        return query
    }

    /**
     * Generate a related eager query builder
     */
    public static eagerQuery(client: QueryClientContract, relation: HasManyThrough, rows: OneOrMany<LucidRow>) {
        return this.query(client, relation, rows, true);
    }

    /**
     * Returns an instance of has many through query builder
     */
    public query(): any {
        return HasManyThroughClient.query(this.client, this.relation, this.parent)
    }
}
