/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 1:19 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ExcutableQueryBuilderContract } from '../ExcutableQueryBuilderContract';
import { Aggregate, Counter, Dictionary, Update } from '../querybuilder';
import { ChainableContract } from './ChainableContract';
import { QueryClientContract } from './QueryClientContract';
import { SimplePaginatorContract } from './SimplePaginatorContract';

/**
 * Database query builder interface. It will use the `Executable` trait
 * and hence must be typed properly for that.
 */
export interface DatabaseQueryBuilderContract<Result extends any = Dictionary<any, string>,
    > extends ChainableContract, ExcutableQueryBuilderContract<Result[]> {
    client: QueryClientContract,

    /**
     * Clone current query
     */
    clone<ClonedResult = Result>(): DatabaseQueryBuilderContract<ClonedResult>

    /**
     * Execute and get first result
     */
    first(): Promise<Result | null>

    /**
     * Perform delete operation
     */
    del(): this
    delete(): this

    /**
     * A shorthand to define limit and offset based upon the
     * current page
     */
    forPage(page: number, perPage?: number): this

    /**
     * Execute query with pagination
     */
    paginate(page: number, perPage?: number): Promise<SimplePaginatorContract<Result[]>>

    /**
     * Mutations (update and increment can be one query aswell)
     */
    update: Update<this>
    increment: Counter<this>
    decrement: Counter<this>

    /**
     * Aggregates
     */
    count: Aggregate<this>
    countDistinct: Aggregate<this>
    min: Aggregate<this>
    max: Aggregate<this>
    sum: Aggregate<this>
    avg: Aggregate<this>
    avgDistinct: Aggregate<this>
}
