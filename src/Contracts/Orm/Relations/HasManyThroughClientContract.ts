/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:49 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { LucidModel } from '../../Model/LucidModel';
import { RelationQueryClientContract } from './RelationQueryClientContract';
import { RelationshipsContract } from './types';

/**
 * HasMany through client contract. HasMany through doesn't
 * allow persisting relationships. Use the direct relation
 * for that.
 */
export interface HasManyThroughClientContract<Relation extends RelationshipsContract,
    RelatedModel extends LucidModel,
    > extends RelationQueryClientContract<Relation, RelatedModel> {
}
