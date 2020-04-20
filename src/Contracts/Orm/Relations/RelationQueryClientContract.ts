/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:37 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { LucidModel } from '../../Model/LucidModel';
import { RelationQueryBuilderContract } from './RelationQueryBuilderContract';
import { RelationshipsContract } from './types';

/**
 * ------------------------------------------------------
 * Relationships query client
 * ------------------------------------------------------
 */
export interface RelationQueryClientContract<Relation extends RelationshipsContract,
    RelatedModel extends LucidModel> {
    relation: Relation,

    /**
     * Return a query builder instance of the relationship
     */
    query<Result extends any = InstanceType<RelatedModel>>(): RelationQueryBuilderContract<RelatedModel, Result>
}
