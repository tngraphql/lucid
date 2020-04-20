/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:47 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { QueryClientContract } from '../../Database/QueryClientContract';
import { LucidModel } from '../../Model/LucidModel';
import { BaseRelationContract } from './BaseRelationContract';
import { RelationQueryClientContract } from './RelationQueryClientContract';

/**
 * Has many through relationship interface
 */
export interface HasManyThroughRelationContract<ParentModel extends LucidModel,
    RelatedModel extends LucidModel> extends BaseRelationContract<ParentModel, RelatedModel> {
    type: 'hasManyThrough'

    /**
     * Set related models as a relationship on the parent model
     */
    setRelated(
        parent: InstanceType<ParentModel>,
        related: InstanceType<RelatedModel>[]
    ): void

    /**
     * Push related model(s) as a relationship on the parent model
     */
    pushRelated(
        parent: InstanceType<ParentModel>,
        related: InstanceType<RelatedModel> | InstanceType<RelatedModel>[]
    ): void

    /**
     * Set multiple related instances on the multiple parent models.
     * This method is generally invoked during eager load.
     */
    setRelatedForMany(
        parent: InstanceType<ParentModel>[],
        related: InstanceType<RelatedModel>[]
    ): void

    /**
     * Returns the query client for a model instance
     */
    client(
        model: InstanceType<ParentModel>,
        client: QueryClientContract
    ): RelationQueryClientContract<this, RelatedModel>
}
