/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 1:38 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import { ChainableContract } from '../Database/ChainableContract';
import { QueryClientContract } from '../Database/QueryClientContract';
import { SimplePaginatorContract } from '../Database/SimplePaginatorContract';
import { ExcutableQueryBuilderContract } from '../ExcutableQueryBuilderContract';
import { QueryBuilderPreloadFn } from '../Orm/Relations/types';
import { Aggregate, Counter, Update } from '../querybuilder';
import { LucidModel } from './LucidModel';
import { ModelAdapterOptions, ModelObject } from './LucidRow';
import { ExtractScopes } from './types';

/**
 * Model query builder will have extras methods on top of the Database query builder
 */
export interface ModelQueryBuilderContract<Model extends LucidModel,
    Result extends any = InstanceType<Model>>
    extends ChainableContract, ExcutableQueryBuilderContract<Result[]> {

    model: Model

    /**
     * Whether or not the query is a subquery generated for `.where`
     * callbacks
     */
    isSubQuery: boolean

    /**
     * Apply user defined query scopes
     */
    apply<Scopes extends ExtractScopes<Model>>(
        callback: (scopes: Scopes) => void
    ): this;

    applyScopes(): this;

    removedScopes(): any[];

    withGlobalScope(id, scope);

    withoutGlobalScope(scope: any): this;

    withoutGlobalScopes(scope: any): this;

    /**
     * A copy of client options.
     */
    readonly clientOptions: ModelAdapterOptions

    /**
     * Reference to query client used for making queries
     */
    client: QueryClientContract

    /**
     * Clone query builder instance
     */
    clone<ClonedResult = Result>(): ModelQueryBuilderContract<Model, ClonedResult>

    /**
     * A custom set of sideloaded properties defined on the query
     * builder, this will be passed to the model instance created
     * by the query builder
     */
    sideload(value: ModelObject): this

    /**
     * Execute and get first result
     */
    first(): Promise<Result | null>

    /**
     * Return the first matching row or fail
     */
    firstOrFail(): Promise<Result>

    onDelete(callback: (builder: this) => any): void;

    /**
     * Perform delete operation
     */
    del(): ModelQueryBuilderContract<Model, number>
    delete(): ModelQueryBuilderContract<Model, number>

    /**
     * Execute query with pagination
     */
    paginate(page: number, perPage?: number): Promise<SimplePaginatorContract<Result[]>>

    /**
     * Mutations (update and increment can be one query aswell)
     */
    update: Update<ModelQueryBuilderContract<Model, number>>
    increment: Counter<ModelQueryBuilderContract<Model, number>>
    decrement: Counter<ModelQueryBuilderContract<Model, number>>

    /**
     * Define relationships to be preloaded
     */
    preload: QueryBuilderPreloadFn<InstanceType<Model>, this>

    /**
     * Aggregates
     */
    count: Aggregate<ModelQueryBuilderContract<Model, any>>;
    countDistinct: Aggregate<ModelQueryBuilderContract<Model, any>>;
    min: Aggregate<ModelQueryBuilderContract<Model, any>>;
    max: Aggregate<ModelQueryBuilderContract<Model, any>>;
    sum: Aggregate<ModelQueryBuilderContract<Model, any>>;
    avg: Aggregate<ModelQueryBuilderContract<Model, any>>;
    avgDistinct: Aggregate<ModelQueryBuilderContract<Model, any>>;
}
