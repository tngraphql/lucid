/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:16 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { QueryClientContract } from '../Database/QueryClientContract';
import { LucidModel } from '../Model/LucidModel';
import { LucidRow, ModelAdapterOptions, ModelObject } from '../Model/LucidRow';
import { ModelQueryBuilderContract } from '../Model/ModelQueryBuilderContract';
import {DatabaseQueryBuilderContract} from "../Database/DatabaseQueryBuilderContract";
import { InsertQueryBuilderContract } from '../Database/InsertQueryBuilderContract';

/**
 * Every adapter must adhere to the Adapter contract
 */
export interface AdapterContract {
    /**
     * Returns query client for a model instance by inspecting it's options
     */
    modelClient(instance: LucidRow): QueryClientContract

    /**
     * Returns query client for a model constructor
     */
    modelConstructorClient(
        modelConstructor: LucidModel,
        options?: ModelAdapterOptions
    ): QueryClientContract

    /**
     * Delete model instance
     */
    delete(instance: LucidRow): DatabaseQueryBuilderContract<number>

    /**
     * Perform insert
     */
    insert(instance: LucidRow, attributes: ModelObject): InsertQueryBuilderContract<number[]>

    /**
     * Perform update
     */
    update(instance: LucidRow, attributes: ModelObject): DatabaseQueryBuilderContract<number>

    /**
     * Must return the query builder for the model
     */
    query(
        modelConstructor: LucidModel,
        options?: ModelAdapterOptions
    ): ModelQueryBuilderContract<LucidModel, LucidRow>
}
