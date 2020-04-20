/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:21 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { LucidRow } from './LucidRow';

/**
 * Options for defining a column
 */
export type ColumnOptions = {
    columnName: string, // database column name
    serializeAs: string | null, // null means do not serialize column
    isPrimary: boolean,
    meta?: any,

    /**
     * Invoked before serializing process happens
     */
    serialize?: (
        value: any,
        attribute: string,
        model: LucidRow,
    ) => any,

    /**
     * Invoked before create or update happens
     */
    prepare?: (
        value: any,
        attribute: string,
        model: LucidRow,
    ) => any,

    /**
     * Invoked when row is fetched from the database
     */
    consume?: (
        value: any,
        attribute: string,
        model: LucidRow,
    ) => any,
}
