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
import { ReferenceBuilderContract } from '../../Contracts/Database/ReferenceBuilderContract';

/**
 * Reference builder to create SQL reference values
 */
export class ReferenceBuilder implements ReferenceBuilderContract {
    private schema: string
    private alias: string

    constructor(private ref: string) {
    }

    /**
     * Define schema
     */
    public withSchema(schema: string): this {
        this.schema = schema
        return this
    }

    /**
     * Define alias
     */
    public as(alias: string): this {
        this.alias = alias
        return this
    }

    /**
     * Converts reference to Knex
     */
    public toKnex(client: Knex.Client) {
        const ref = client.ref(this.ref)
        this.schema && ref.withSchema(this.schema)
        this.alias && ref.as(this.alias)

        return ref
    }
}
