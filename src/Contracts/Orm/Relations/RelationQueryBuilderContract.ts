/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:33 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { LucidModel } from '../../Model/LucidModel';
import { ModelQueryBuilderContract } from '../../Model/ModelQueryBuilderContract';

/**
 * Base query builder for all relations
 */
export interface RelationQueryBuilderContract<
    Related extends LucidModel,
    Result extends any
    > extends ModelQueryBuilderContract<Related, Result> {
    isEagerQuery: boolean
    selectRelationKeys (): this
}
