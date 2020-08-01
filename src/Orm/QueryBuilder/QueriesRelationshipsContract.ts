/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 7/27/2020
 * Time: 9:28 PM
 */
import {LucidModel} from "../../Contracts/Model/LucidModel";
import {ModelQueryBuilderContract} from "../../Contracts/Model/ModelQueryBuilderContract";
import {Where} from "../../Contracts/querybuilder";

export interface QueriesRelationshipsContract {
    /**
     * Add a relationship count / exists condition to the query.
     *
     * @param relation
     * @param operator
     * @param count
     * @param boolean
     * @param callback
     */
    has?: (relation, operator?: string, count?: number, boolean?: string, callback?) => ModelQueryBuilderContract<LucidModel, any>

    whereColumn?: (first, operator, second, boolean?: string) => Where<ModelQueryBuilderContract<LucidModel, any>>

    /**
     * Add a relationship count / exists condition to the query with where clauses.
     *
     * @param relation
     * @param callback
     * @param operator
     * @param count
     * @param boolean
     */
    whereHas?: (relation, callback?, operator?: string, count?: number) => ModelQueryBuilderContract<LucidModel, any>

    /**
     * Add a relationship count / exists condition to the query with where clauses and an "or".
     *
     * @param relation
     * @param callback
     * @param operator
     * @param count
     */
    orWhereHas?: (relation, callback?, operator?: string, count?: number) => ModelQueryBuilderContract<LucidModel, any>

    /**
     * Add a relationship count / exists condition to the query with an "or".
     *
     * @param relation
     * @param operator
     * @param count
     */
    orHas?: (relation, operator?: string, count?: number) => ModelQueryBuilderContract<LucidModel, any>

    /**
     * Add a relationship count / exists condition to the query.
     *
     * @param relation
     * @param boolean
     * @param callback
     */
    doesntHave?: (relation, boolean?: string, callback?) => ModelQueryBuilderContract<LucidModel, any>

    /**
     * Add a relationship count / exists condition to the query with an "or".
     *
     * @param relation
     */
    orDoesntHave?: (relation) => ModelQueryBuilderContract<LucidModel, any>

    /**
     * Add a relationship count / exists condition to the query with where clauses.
     *
     * @param relation
     * @param callback
     */
    whereDoesntHave?: (relation, callback?) => ModelQueryBuilderContract<LucidModel, any>

    /**
     * Add a relationship count / exists condition to the query with where clauses and an "or".
     *
     * @param relation
     * @param callback
     */
    orWhereDoesntHave?: (relation, callback?) => ModelQueryBuilderContract<LucidModel, any>

    /**
     * Add subselect queries to count the relations.
     *
     * @param relations
     */
    withCount?: (relation: string, callback?) => ModelQueryBuilderContract<LucidModel, any>
}