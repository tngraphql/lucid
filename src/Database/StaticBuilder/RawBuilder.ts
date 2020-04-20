/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:57 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */


import * as Knex from 'knex';
import { RawBuilderContract } from '../../Contracts/Database/RawBuilderContract';

/**
 * Exposes the API to construct raw queries. If you want to execute
 * raw queries, you can use the RawQueryBuilder
 */
export class RawBuilder implements RawBuilderContract {
    private wrapBefore: string
    private wrapAfter: string

    constructor(private sql: string, private bindings?: any) {
    }

    /**
     * Wrap the query with before/after strings.
     */
    public wrap(before: string, after: string): this {
        this.wrapAfter = after
        this.wrapBefore = before
        return this
    }

    /**
     * Converts the raw query to Knex raw query instance
     */
    public toKnex(client: Knex.Client): Knex.Raw {
        const rawQuery = client.raw(this.sql, this.bindings)

        if ( this.wrapBefore && this.wrapAfter ) {
            rawQuery.wrap(this.wrapBefore, this.wrapAfter)
        }

        return rawQuery
    }
}
