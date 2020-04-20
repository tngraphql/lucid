/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 1:21 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as Knex from 'knex';
import { ExcutableQueryBuilderContract } from '../ExcutableQueryBuilderContract';
import { QueryClientContract } from './QueryClientContract';

/**
 * Shape of the raw query that can also be passed as a value to
 * other queries
 */
export interface RawQueryBuilderContract<Result extends any = any> extends ExcutableQueryBuilderContract<Result> {
    knexQuery: Knex.Raw,
    client: QueryClientContract,

    wrap(before: string, after: string): this
}
