/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:50 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import { Hooks } from '@poppinss/hooks/build'
import { AdapterContract } from '../Orm/AdapterContract';
import { ExtractModelRelations, ModelRelations, RelationshipsContract } from '../Orm/Relations/types';
import { ColumnOptions } from './ColumnOptions';
import { LucidRow, ModelAdapterOptions, ModelAttributes, ModelObject } from './LucidRow';
import { ModelKeysContract } from './ModelKeysContract';
import { ModelQueryBuilderContract } from './ModelQueryBuilderContract';
import { OrmConfig } from './OrmConfig';
import { ComputedOptions, EventsList, HooksHandler, ModelColumnOptions, ModelRelationOptions } from './types';

// export type LucidModel = typeof BaseModel & {new(): LucidRow};

// type LucidModel = typeof BaseModel;
//
// type Bas = { new(): LucidRow }

// export interface LucidModel extends Base, Bas {
// }

/**
 * Shape of the model static properties. The `$` prefix is to denote
 * special properties from the base model.
 *
 * @note: Since the interface name appears next to the inherited model
 *        methods, we have to choose a sunnict name
 */
export interface LucidModel {
    /**
     * Whether or not model has been booted. After this model configurations
     * are ignored
     */
    readonly _booted: boolean

    /**
     * A map of defined columns
     */
    $columnsDefinitions: Map<string, ModelColumnOptions>

    /**
     * A map of defined relationships
     */
    $relationsDefinitions: Map<string, RelationshipsContract>

    /**
     * A map of computed properties
     */
    $computedDefinitions: Map<string, ComputedOptions>

    /**
     * The primary key for finding unique referencing to a
     * model
     */
    primaryKey: string

    /**
     * Custom database connection to use
     */
    connection?: string

    /**
     * Database table to use
     */
    table: string

    /**
     * Adapter to work as a bridge between query builder and the model
     */
    $adapter: AdapterContract

    /**
     * Reference to hooks
     */
    $hooks: Hooks

    /**
     * Used to construct defaults for the model
     */
    $configurator: OrmConfig,

    /**
     * A copy of internal keys mapping. One should be able to resolve between
     * all key versions
     */
    $keys: {
        attributesToColumns: ModelKeysContract,
        attributesToSerialized: ModelKeysContract,
        columnsToAttributes: ModelKeysContract,
        columnsToSerialized: ModelKeysContract,
        serializedToColumns: ModelKeysContract,
        serializedToAttributes: ModelKeysContract,
    }

    /**
     * Creating model from adapter results
     */
    $createFromAdapterResult<T extends LucidModel>(
        this: T,
        result?: ModelObject,
        sideloadAttributes?: ModelObject,
        options?: ModelAdapterOptions
    ): null | InstanceType<T>

    /**
     * Creating multiple model instances from an array of adapter
     * result
     */
    $createMultipleFromAdapterResult<T extends LucidModel>(
        this: T,
        results: ModelObject[],
        sideloadAttributes?: ModelObject,
        options?: ModelAdapterOptions
    ): InstanceType<T>[]

    /**
     * Managing columns
     */
    $addColumn(name: string, options: Partial<ColumnOptions>): ColumnOptions

    $hasColumn(name: string): boolean

    $getColumn(name: string): ModelColumnOptions | undefined

    /**
     * Managing computed columns
     */
    $addComputed(name: string, options: Partial<ComputedOptions>): ComputedOptions

    $hasComputed(name: string): boolean

    $getComputed(name: string): ComputedOptions | undefined

    /**
     * Managing relationships
     */
    $addRelation(
        name: string,
        type: ModelRelations['type'],
        relatedModel: () => LucidModel,
        options: ModelRelationOptions
    ): void

    /**
     * Find if a relationship exists
     */
    $hasRelation(name: string): boolean

    /**
     * Get relationship declaration
     */
    $getRelation<Model extends LucidModel,
        Name extends ExtractModelRelations<InstanceType<Model>>>(
        this: Model,
        name: Name | string
    ): (InstanceType<Model>[Name] extends ModelRelations
        ? InstanceType<Model>[Name]['client']['relation']
        : RelationshipsContract) | undefined

    /**
     * Boot model
     */
    boot(): void

    booting(): void

    booted(): void

    emit(event: string, value: any): void;

    on(event: string, callback: (data: any) => void): void;

    /**
     * Get table name of model
     */
    getTable(): string;

    /**
     * Check if the model needs to be booted and if so, do it.
     */
    bootIfNotBooted(): void;

    /**
     * Register a before hook
     */
    before<Model extends LucidModel, Event extends 'find' | 'fetch'>(
        this: Model,
        event: Event,
        handler: HooksHandler<ModelQueryBuilderContract<Model>, Event>
    ): void

    before<Model extends LucidModel, Event extends EventsList>(
        this: Model,
        event: Event,
        handler: HooksHandler<InstanceType<Model>, Event>
    ): void

    /**
     * Register an after hook
     */
    after<Model extends LucidModel>(
        this: Model,
        event: 'fetch',
        handler: HooksHandler<InstanceType<Model>[], 'fetch'>
    ): void

    after<Model extends LucidModel, Event extends EventsList>(
        this: Model,
        event: Event,
        handler: HooksHandler<InstanceType<Model>, Event>
    ): void

    /**
     * Create model and return its instance back
     */
    create<T extends LucidModel>(
        this: T,
        values: Partial<ModelAttributes<InstanceType<T>>>,
        options?: ModelAdapterOptions
    ): Promise<InstanceType<T>>

    /**
     * Create many of model instances
     */
    createMany<T extends LucidModel>(
        this: T,
        values: Partial<ModelAttributes<InstanceType<T>>>,
        options?: ModelAdapterOptions
    ): Promise<InstanceType<T>[]>

    /**
     * Find one using the primary key
     */
    find<T extends LucidModel>(
        this: T,
        value: any,
        options?: ModelAdapterOptions
    ): Promise<null | InstanceType<T>>

    /**
     * Find one using the primary key or fail
     */
    findOrFail<T extends LucidModel>(
        this: T,
        value: any,
        options?: ModelAdapterOptions
    ): Promise<InstanceType<T>>

    /**
     * Same as `query().first()`
     */
    first<T extends LucidModel>(
        this: T,
        options?: ModelAdapterOptions
    ): Promise<null | InstanceType<T>>

    /**
     * Same as `query().firstOrFail()`
     */
    firstOrFail<T extends LucidModel>(
        this: T,
        options?: ModelAdapterOptions
    ): Promise<null | InstanceType<T>>

    /**
     * Find many using an array of primary keys
     */
    findMany<T extends LucidModel>(
        this: T,
        value: any[],
        options?: ModelAdapterOptions
    ): Promise<InstanceType<T>[]>

    /**
     * Returns the first row or create a new instance of model without
     * persisting it
     */
    firstOrNew<T extends LucidModel>(
        this: T,
        search: Partial<ModelAttributes<InstanceType<T>>>,
        savePayload?: Partial<ModelAttributes<InstanceType<T>>>,
        options?: ModelAdapterOptions
    ): Promise<InstanceType<T>>

    /**
     * Returns the first row or save it to the database
     */
    firstOrCreate<T extends LucidModel>(
        this: T,
        search: Partial<ModelAttributes<InstanceType<T>>>,
        savePayload?: Partial<ModelAttributes<InstanceType<T>>>,
        options?: ModelAdapterOptions
    ): Promise<InstanceType<T>>

    /**
     * Find rows or create in-memory instances of the missing
     * one's.
     */
    fetchOrNewUpMany<T extends LucidModel>(
        this: T,
        uniqueKey: keyof ModelAttributes<InstanceType<T>>,
        payload: Partial<ModelAttributes<InstanceType<T>>>[],
        options?: ModelAdapterOptions,
        mergeAttributes?: boolean
    ): Promise<InstanceType<T>[]>

    /**
     * Find rows or create many when missing. One db call is invoked
     * for each create
     */
    fetchOrCreateMany<T extends LucidModel>(
        this: T,
        uniqueKey: keyof ModelAttributes<InstanceType<T>>,
        payload: Partial<ModelAttributes<InstanceType<T>>>[],
        options?: ModelAdapterOptions
    ): Promise<InstanceType<T>[]>

    /**
     * Returns the first row or save it to the database
     */
    updateOrCreate<T extends LucidModel>(
        this: T,
        search: Partial<ModelAttributes<InstanceType<T>>>,
        updatePayload: Partial<ModelAttributes<InstanceType<T>>>,
        options?: ModelAdapterOptions
    ): Promise<InstanceType<T>>

    /**
     * Update existing rows or create new one's.
     */
    updateOrCreateMany<T extends LucidModel>(
        this: T,
        uniqueKey: keyof ModelAttributes<InstanceType<T>>,
        payload: Partial<ModelAttributes<InstanceType<T>>>[],
        options?: ModelAdapterOptions
    ): Promise<InstanceType<T>[]>

    /**
     * Fetch all rows
     */
    all<T extends LucidModel>(
        this: T,
        options?: ModelAdapterOptions
    ): Promise<InstanceType<T>[]>

    /**
     * Returns the query for fetching a model instance
     */
    query<Model extends LucidModel,
        Result extends any = InstanceType<Model>,
        >(
        this: Model,
        options?: ModelAdapterOptions
    ): ModelQueryBuilderContract<Model, Result>

    /**
     * Truncate model table
     */
    truncate(cascade?: boolean): Promise<void>

    new(): LucidRow
}
