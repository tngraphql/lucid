/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:42 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */


import { QueryClientContract } from '../../Database/QueryClientContract';
import { HasManyClientContract } from '../../Model/HasManyClientContract';
import { LucidModel } from '../../Model/LucidModel';
import { OneOrMany } from '../../Model/types';
import { BaseRelationContract } from './BaseRelationContract';

/**
 * Has many relationship interface
 */
export interface HasManyRelationContract<ParentModel extends LucidModel,
    RelatedModel extends LucidModel> extends BaseRelationContract<ParentModel, RelatedModel> {
    readonly type: 'hasMany'

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
        related: OneOrMany<InstanceType<RelatedModel>>
    ): void

    /**
     * Set multiple related instances on the multiple parent models.
     * This method is generally invoked during eager load.
     *
     * Fetch 10 users and then all posts for all 10 users and then
     * call this method to set related instances
     */
    setRelatedForMany(
        parent: InstanceType<ParentModel>[],
        related: InstanceType<RelatedModel>[]
    ): void

    /**
     * Returns the query client for one or many model instances. The query
     * client then be used to fetch and persist relationships.
     */
    client(
        parent: InstanceType<ParentModel>,
        client: QueryClientContract
    ): HasManyClientContract<this, RelatedModel>
}
