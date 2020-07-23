/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:42 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { RelationshipsContract } from './types';
import { HasOneClientContract } from './HasOneClientContract';
import { LucidModel } from '../../Model/LucidModel';
import { ModelAttributes } from '../../Model/LucidRow';

/**
 * Query client for has many relationship. Extends hasOne and
 * adds support for saving many relations
 */
export interface HasManyClientContract<
    Relation extends RelationshipsContract,
    RelatedModel extends LucidModel,
    > extends HasOneClientContract<Relation, RelatedModel> {
    /**
     * Save many of related instances. Sets up FK automatically
     */
    saveMany (related: InstanceType<RelatedModel>[]): Promise<void>

    /**
     * Create many of related instances. Sets up FK automatically
     */
    createMany (
        values: Partial<ModelAttributes<InstanceType<RelatedModel>>>[],
    ): Promise<InstanceType<RelatedModel>[]>
}
