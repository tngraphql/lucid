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
import { OneOrMany } from '../../Model/types';
import { RelationQueryBuilderContract } from './RelationQueryBuilderContract';
import { ModelRelations } from './types';

/**
 * Interface to be implemented by all relationship types
 */
export interface BaseRelationContract<ParentModel extends LucidModel,
    RelatedModel extends LucidModel> {
    readonly type: ModelRelations['type']
    readonly relationName: string
    readonly serializeAs: string | null
    readonly booted: boolean
    readonly model: ParentModel

    relatedModel(): RelatedModel

    boot(): void

    /**
     * Get client
     */
    client(parent: InstanceType<ParentModel>, client: QueryClientContract): unknown

    /**
     * Get eager query for the relationship
     */
    eagerQuery(
        parent: OneOrMany<InstanceType<ParentModel>>,
        client: QueryClientContract
    ): RelationQueryBuilderContract<RelatedModel, InstanceType<RelatedModel>>
}
