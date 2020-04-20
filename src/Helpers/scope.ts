/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:57 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */


import { LucidModel } from '../Contracts/Model/LucidModel';
import { QueryScope } from '../Contracts/Model/QueryScope';
import { QueryScopeCallback } from '../Contracts/Model/QueryScopeCallback';

/**
 * Helper to mark a function as query scope
 */
export function scope<Model extends LucidModel,
    Callback extends QueryScopeCallback<Model>>(callback: Callback): QueryScope<Callback> {
    return callback as QueryScope<Callback>
}
