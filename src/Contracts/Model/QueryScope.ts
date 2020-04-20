/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 1:39 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { QueryScopeCallback } from './QueryScopeCallback';

/**
 * Query scope
 */
export type QueryScope<Scope = QueryScopeCallback> = Scope & { readonly isQueryScope: true }
