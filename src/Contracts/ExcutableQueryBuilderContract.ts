/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 3:21 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */


import * as Knex from 'knex';
import { TransactionClientContract } from './Database/TransactionClientContract';

/**
 * A executable query builder will always have these methods on it.
 */
export interface ExcutableQueryBuilderContract<Result extends any> extends Promise<Result> {
    debug(debug: boolean): this

    timeout(time: number, options?: { cancel: boolean }): this

    useTransaction(trx: TransactionClientContract): this

    reporterData(data: any): this

    toQuery(): string

    exec(): Promise<Result>

    toSQL(): Knex.Sql
}
