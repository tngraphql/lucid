/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:35 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { QueryClientContract } from '../../Database/QueryClientContract';
import { LucidModel } from '../../Model/LucidModel';
import { BaseRelationContract } from './BaseRelationContract';
import { BelongsToClientContract } from './BelongsToClientContract';

/**
 * Belongs to relationship interface
 */
export interface BelongsToRelationContract<ParentModel extends LucidModel,
    RelatedModel extends LucidModel> extends BaseRelationContract<ParentModel, RelatedModel> {
    readonly type: 'belongsTo'

    /**
     * Set related model as a relationship on the parent model
     */
    setRelated(
        parent: InstanceType<ParentModel>,
        related: InstanceType<RelatedModel> | null
    ): void

    /**
     * Push related model as a relationship on the parent model
     */
    pushRelated(
        parent: InstanceType<ParentModel>,
        related: InstanceType<RelatedModel> | null
    ): void

    /**
     * Set multiple related instances on the multiple parent models.
     * This method is generally invoked during eager load.
     *
     * Fetch 10 profiles and then users for all 10 profiles and then
     * call this method to set related instances
     */
    setRelatedForMany(
        parent: InstanceType<ParentModel>[],
        related: InstanceType<RelatedModel>[]
    ): void

    /**
     * Returns the query client for a model instance
     */
    client(
        parent: InstanceType<ParentModel>,
        client: QueryClientContract
    ): BelongsToClientContract<this, RelatedModel>
}
