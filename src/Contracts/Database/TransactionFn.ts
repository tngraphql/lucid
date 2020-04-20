/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:52 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { TransactionClientContract } from './TransactionClientContract';

/**
 * Shape of the transaction function to create a new transaction
 */
export interface TransactionFn {
    <T extends any>(callback: (trx: TransactionClientContract) => Promise<T>): Promise<T>,

    (): Promise<TransactionClientContract>,
}
