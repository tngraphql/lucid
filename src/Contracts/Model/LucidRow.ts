/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:07 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ProfilerContract, ProfilerRowContract } from '@ioc:Adonis/Core/Profiler';
import { QueryClientContract } from '../Database/QueryClientContract';
import { TransactionClientContract } from '../Database/TransactionClientContract';
import {
    ExtractModelRelations,
    ModelRelations,
    ModelRelationTypes,
    PreloaderContract,
    QueryBuilderPreloadFn
} from '../Orm/Relations/types';
import { OneOrMany } from './types';

/**
 * Reusable interface to define an object.
 */
export interface ModelObject {
    [key: string]: any
}

/**
 * Model options to be used when making queries
 */
export type ModelOptions = {
    connection?: string,
    profiler?: ProfilerContract | ProfilerRowContract,
}

/**
 * Adapter also accepts a client directly
 */
export type ModelAdapterOptions = ModelOptions & {
    client?: QueryClientContract,
}

/**
 * A complex type that filters out functions and relationships from the
 * model attributes and consider all other properties as database
 * columns. Alternatively, the user can self define a `$columns`
 * property.
 */
export type ModelAttributes<Model extends LucidRow> = Model['$columns'] extends undefined
    ? {
        [Filtered in {
            [P in keyof Model]: P extends keyof LucidRow
                ? never
                : Model[P] extends Function | ModelRelationTypes ? never : P
        }[keyof Model]]: Model[Filtered]
    }
    : Model['$columns']

/**
 * Shape of cache node to keep getters optimized
 */
export type CacheNode = {
    original: any,
    resolved: any,
    getter: (value: any) => any,
}

/**
 * Shape for cherry picking fields
 */
export type CherryPickFields = string[] | {
    pick?: string[],
    omit?: string[],
}

/**
 * Shape for cherry picking fields on nested relationships
 */
export type CherryPick = {
    fields?: CherryPickFields,
    relations?: { [relation: string]: CherryPick }
}

/**
 * Preload function on a model instance
 */
interface ModelBuilderPreloadFn<Model extends LucidRow,
    > extends QueryBuilderPreloadFn<Model, Promise<void>> {
    (callback: (preloader: PreloaderContract<Model>) => void): Promise<void>
}

/**
 * Shape of the model instance. We prefix the properties with a `$` to
 * differentiate between special properties provided by the base
 * model but with exception to `save`, `delete`, `fill`, `merge`
 * and `toJSON`.
 *
 * @note: Since the interface name appears next to the inherited model
 *        methods, we have to choose a sunnict name
 */
export interface LucidRow {
    $attributes: ModelObject
    $extras: ModelObject
    $original: ModelObject
    $preloaded: { [relation: string]: LucidRow | LucidRow[] }

    /**
     * Columns is a property to get type information for model
     * attributes. This must be declared by the end user
     */
    $columns: undefined

    $sideloaded: ModelObject
    $primaryKeyValue?: number | string
    $isPersisted: boolean
    $isNew: boolean
    $isLocal: boolean
    $dirty: ModelObject
    $isDirty: boolean
    $isDeleted: boolean

    $options?: ModelOptions
    $trx?: TransactionClientContract,

    $setOptionsAndTrx(options?: ModelAdapterOptions): void;

    useTransaction (trx: TransactionClientContract): this
    useConnection (connection: string): this

    /**
     * Gives an option to the end user to define constraints for update, insert
     * and delete queries. Since the query builder for these queries aren't
     * exposed to the end user, this method opens up the API to build
     * custom queries.
     */
    $getQueryFor(
        action: 'insert',
        client: QueryClientContract
    ): ReturnType<QueryClientContract['insertQuery']>

    $getQueryFor(
        action: 'update' | 'delete',
        client: QueryClientContract
    ): ReturnType<QueryClientContract['query']>

    /**
     * Read/write attributes. Following methods are intentionally loosely typed,
     * so that one can bypass the public facing API and type checking for
     * advanced use cases
     */
    $setAttribute(key: string, value: any): void

    $getAttribute(key: string): any

    $getAttributeFromCache(key: string, callback: CacheNode['getter']): any

    /**
     * Read/write realtionships. Following methods are intentionally loosely typed,
     * so that one can bypass the public facing API and type checking for
     * advanced use cases
     */
    $hasRelated(key: string): boolean

    $setRelated(key: string, result: OneOrMany<LucidRow>): void

    $pushRelated(key: string, result: OneOrMany<LucidRow>): void

    $getRelated(key: string, defaultValue?: any): OneOrMany<LucidRow> | undefined

    /**
     * Consume the adapter result and hydrate the model
     */
    $consumeAdapterResult(adapterResult: ModelObject, sideloadAttributes?: ModelObject): void

    $hydrateOriginals(): void

    fill(value: Partial<ModelAttributes<this>>, allowNonExtraProperties?: boolean): void

    merge(value: Partial<ModelAttributes<this>>, allowNonExtraProperties?: boolean): void

    save(): Promise<void>

    delete(): Promise<void>

    refresh(): Promise<void>

    preload: ModelBuilderPreloadFn<this>

    /**
     * Serialize attributes to a plain object
     */
    serializeAttributes(fieldsToCherryPick?: CherryPickFields, raw?: boolean): ModelObject

    /**
     * Serialize computed properties to a plain object
     */
    serializeComputed(fields?: CherryPickFields): ModelObject

    /**
     * Serialize relationships to key-value pair of model instances and
     * their serializeAs keys
     */
    serializeRelations(
        fields: undefined,
        raw: true
    ): { [key: string]: LucidRow | LucidRow[] }

    /**
     * Serialize relationships to key-value pair of plain nested objects
     */
    serializeRelations(
        cherryPick: CherryPick['relations'] | undefined,
        raw: false | undefined
    ): ModelObject

    serializeRelations(cherryPick?: CherryPick['relations'], raw?: boolean): ModelObject

    /**
     * Serialize model to a plain object
     */
    serialize(cherryPick?: CherryPick): ModelObject

    /**
     * Serialize everything
     */
    toJSON(): ModelObject

    /**
     * Returns related model for a given relationship
     */
    related<Name extends ExtractModelRelations<this>>(
        relation: Name
    ): this[Name] extends ModelRelations ? this[Name]['client'] : never
}
