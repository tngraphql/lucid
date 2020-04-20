/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:36 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { LucidModel } from '../../Model/LucidModel';
import { RelationQueryClientContract } from './RelationQueryClientContract';
import { RelationshipsContract } from './types';

/**
 * Query client for belongs to relationship. Uses `associate` and
 * `dissociate` over save.
 */
export interface BelongsToClientContract<
    Relation extends RelationshipsContract,
    RelatedModel extends LucidModel,
    > extends RelationQueryClientContract<Relation, RelatedModel> {
    /**
     * Associate related instance
     */
    associate (related: InstanceType<RelatedModel>): Promise<void>

    /**
     * Dissociate related instance
     */
    dissociate (): Promise<void>
}
