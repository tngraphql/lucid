/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:52 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { QueryClientContract } from '../../Database/QueryClientContract';
import { LucidModel } from '../../Model/LucidModel';
import { ManyToManyClientContract } from './ManyToManyClientContract';
import { ManyToManyQueryBuilderContract } from './ManyToManyQueryBuilderContract';
import { OneOrMany } from '../../Model/types';
import { BaseRelationContract } from './BaseRelationContract';

/**
 * Many to many relationship interface
 */
export interface ManyToManyRelationContract<ParentModel extends LucidModel,
    RelatedModel extends LucidModel> extends BaseRelationContract<ParentModel, RelatedModel> {
    type: 'manyToMany'

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
     */
    setRelatedForMany(
        parent: InstanceType<ParentModel>[],
        related: InstanceType<RelatedModel>[]
    ): void

    /**
     * Returns the query client for one model instance
     */
    client(
        parent: InstanceType<ParentModel>,
        client: QueryClientContract
    ): ManyToManyClientContract<this, RelatedModel>

    /**
     * Get eager query for the relationship
     */
    eagerQuery(
        parent: OneOrMany<InstanceType<ParentModel>>,
        client: QueryClientContract
    ): ManyToManyQueryBuilderContract<RelatedModel, InstanceType<RelatedModel>>
}
