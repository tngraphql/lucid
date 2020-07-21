/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:43 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { RelationQueryClientContract } from './RelationQueryClientContract';
import { RelationshipsContract } from './types';
import { LucidModel } from '../../Model/LucidModel';
import { ModelAttributes } from '../../Model/LucidRow';

/**
 * Query client for has one relationship
 */
export interface MorphToClientContract<Relation extends RelationshipsContract,
    RelatedModel extends LucidModel,
    > extends RelationQueryClientContract<Relation, RelatedModel> {
    /**
     * Save related instance. Sets up the FK automatically
     */
    save(related: InstanceType<RelatedModel>): Promise<void>

    /**
     * Create related instance. Sets up the FK automatically
     */
    create(
        values: Partial<ModelAttributes<InstanceType<RelatedModel>>>
    ): Promise<InstanceType<RelatedModel>>

    /**
     * Return first or create related instance
     */
    firstOrCreate(
        search: Partial<ModelAttributes<InstanceType<RelatedModel>>>,
        savePayload?: Partial<ModelAttributes<InstanceType<RelatedModel>>>
    ): Promise<InstanceType<RelatedModel>>

    /**
     * Update or create related instance
     */
    updateOrCreate(
        search: Partial<ModelAttributes<InstanceType<RelatedModel>>>,
        updatePayload: Partial<ModelAttributes<InstanceType<RelatedModel>>>
    ): Promise<InstanceType<RelatedModel>>
}
