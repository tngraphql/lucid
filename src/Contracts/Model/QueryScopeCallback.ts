/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 1:38 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { LucidModel } from './LucidModel';
import { ModelQueryBuilderContract } from './ModelQueryBuilderContract';

/**
 * Generic query scope callback
 */
export type QueryScopeCallback<Model extends LucidModel = LucidModel> = (
    query: ModelQueryBuilderContract<Model>,
    ...args: any[]
) => void
