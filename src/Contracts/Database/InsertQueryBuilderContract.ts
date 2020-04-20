/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 1:20 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as Knex from 'knex';
import { ExcutableQueryBuilderContract } from '../ExcutableQueryBuilderContract';
import { Insert, MultiInsert, Returning } from '../querybuilder';
import { QueryClientContract } from './QueryClientContract';

/**
 * Insert query builder to perform database inserts.
 */
export interface InsertQueryBuilderContract<Result extends any = any,
    > extends ExcutableQueryBuilderContract<Result> {
    knexQuery: Knex.QueryBuilder,
    client: QueryClientContract,

    /**
     * Table for the insert query
     */
    table(table: string): this

    /**
     * Define returning columns
     */
    returning: Returning<this>

    /**
     * Inserting a single record.
     */
    insert: Insert<this>

    /**
     * Inserting multiple columns at once
     */
    multiInsert: MultiInsert<this>
}
