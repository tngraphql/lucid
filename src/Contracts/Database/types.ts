/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:41 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as Knex from 'knex';
import { ChainableContract } from './ChainableContract';

/**
 * Query callback is used to write wrapped queries. We get rid of `this` from
 * knex, since it makes everything confusing.
 */
export type QueryCallback<Builder extends ChainableContract> = ((builder: Builder) => void);

/**
 * Shape of the function accepted by the chainable query builder to
 * pass lucid query builder to wrapped callbacks like
 * `.where(function () {})`.
 *
 * - This method will accept the wrapped callback
 * - Return a new method, that is accepted by knex.
 * - When knex calls that method, this method will invoke the user wrapped
 *   callback, but instead of passing the knex query builder, it will
 *   pass the appropriate lucid query builder.
 */
export type DBQueryCallback = (
    userFn: QueryCallback<ChainableContract>,
    keysResolver?: (columnName: string) => string
) => ((builder: Knex.QueryBuilder) => void)
