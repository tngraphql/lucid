/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 1:23 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as Knex from 'knex';

/**
 * Static raw builder
 */
export interface RawBuilderContract {
    wrap (before: string, after: string): this
    toKnex (client: Knex.Client): Knex.Raw
}
