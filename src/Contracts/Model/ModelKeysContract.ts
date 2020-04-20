/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:28 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */


import { ModelObject } from './LucidRow';

/**
 * Shape of model keys
 */
export interface ModelKeysContract {
    add (key: string, value: string): void
    get (key: string, defaultValue: string): string
    get (key: string, defaultValue?: string): string | undefined
    resolve (key: string): string
    all (): ModelObject
}
