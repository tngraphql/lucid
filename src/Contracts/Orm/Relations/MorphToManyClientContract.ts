/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:53 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { TransactionClientContract } from '../../Database/TransactionClientContract';
import { RelationQueryClientContract } from './RelationQueryClientContract';
import { RelationshipsContract } from './types';
import { LucidModel } from '../../Model/LucidModel';
import { ModelAttributes, ModelObject } from '../../Model/LucidRow';
import { MorphToManyQueryBuilderContract } from './MorphToManyQueryBuilderContract';

/**
 * Query client for many to many relationship.
 */
export interface MorphToManyClientContract<Relation extends RelationshipsContract,
    RelatedModel extends LucidModel,
    > extends RelationQueryClientContract<Relation, RelatedModel> {
    /**
     * Returns related model query builder instance
     */
    query<Result extends any = InstanceType<RelatedModel>>(): MorphToManyQueryBuilderContract<RelatedModel,
        Result>

    /**
     * Pivot query just targets the pivot table without any joins
     */
    pivotQuery<Result extends any = any>(): MorphToManyQueryBuilderContract<RelatedModel, Result>

    /**
     * Save related model instance. Sets up FK automatically
     */
    save(related: InstanceType<RelatedModel>, checkExisting?: boolean): Promise<void>

    /**
     * Save many of related model instance. Sets up FK automatically
     */
    saveMany(related: InstanceType<RelatedModel>[], checkExisting?: boolean): Promise<void>

    /**
     * Create related model instance. Sets up FK automatically
     */
    create(
        values: Partial<ModelAttributes<InstanceType<RelatedModel>>>,
        checkExisting?: boolean
    ): Promise<InstanceType<RelatedModel>>

    /**
     * Create many of related model instances. Sets up FK automatically
     */
    createMany(
        values: Partial<ModelAttributes<InstanceType<RelatedModel>>>[],
        checkExisting?: boolean
    ): Promise<InstanceType<RelatedModel>[]>

    /**
     * Attach new pivot rows
     */
    attach(
        ids: (string | number)[] | { [key: string]: ModelObject },
        trx?: TransactionClientContract
    ): Promise<void>

    /**
     * Detach existing pivot rows
     */
    detach(
        ids?: (string | number)[],
        trx?: TransactionClientContract
    ): Promise<void>

    /**
     * Sync pivot rows.
     */
    sync(
        ids: (string | number)[] | { [key: string]: ModelObject },
        detach?: boolean,
        trx?: TransactionClientContract
    ): Promise<void>
}
