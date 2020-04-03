/*
 * @adonisjs/lucid
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

declare module '@ioc:Adonis/Lucid/Relations' {
  import {
    ModelObject,
    ModelContract,
    ModelConstructorContract,
    ModelQueryBuilderContract,
  } from '@ioc:Adonis/Lucid/Model'

  import {
    QueryClientContract,
    TransactionClientContract,
  } from '@ioc:Adonis/Lucid/Database'

  import {
    StrictValues,
    QueryCallback,
    ChainableContract,
  } from '@ioc:Adonis/Lucid/DatabaseQueryBuilder'

  /**
   * Options accepted when defining a new relationship. Certain
   * relationships like `manyToMany` have their own options
   */
  export type RelationOptions = {
    relatedModel: (() => ModelConstructorContract),
    localKey?: string,
    foreignKey?: string,
    serializeAs?: string | null,
  }

  /**
   * Options accepted by many to many relationship
   */
  export type ManyToManyRelationOptions = {
    relatedModel: (() => ModelConstructorContract),
    pivotTable?: string,
    localKey?: string,
    pivotForeignKey?: string,
    relatedKey?: string,
    pivotRelatedForeignKey?: string,
    pivotColumns?: string[],
    serializeAs?: string,
  }

  /**
   * Options accepted by through relationships
   */
  export type ThroughRelationOptions = RelationOptions & {
    throughModel: (() => ModelConstructorContract)
    throughLocalKey?: string,
    throughForeignKey?: string,
  }

  /**
   * ------------------------------------------------------
   * Decorators
   * ------------------------------------------------------
   */

  /**
   * Decorator signature to define has one relationship
   */
  export type HasOneDecorator = (
    model: RelationOptions['relatedModel'],
    options?: Omit<RelationOptions, 'relatedModel'>,
  ) => (target: any, property: string | Symbol) => void

  /**
   * Decorator signature to define has many relationship
   */
  export type HasManyDecorator = (
    model: RelationOptions['relatedModel'],
    options?: Omit<RelationOptions, 'relatedModel'>,
  ) => (target: any, property: string | Symbol) => void

  /**
   * Decorator signature to define belongs to relationship
   */
  export type BelongsToDecorator = (
    model: RelationOptions['relatedModel'],
    options?: Omit<RelationOptions, 'relatedModel'>,
  ) => (target: any, property: string | Symbol) => void

  /**
   * Decorator signature to define many to many relationship
   */
  export type ManyToManyDecorator = (
    model: ManyToManyRelationOptions['relatedModel'],
    column?: Omit<ManyToManyRelationOptions, 'relatedModel'>,
  ) => (target: any, property: string | Symbol) => void

  /**
   * Decorator signature to define has many through relationship
   */
  export type HasManyThroughDecorator = (
    model: [ThroughRelationOptions['relatedModel'], ThroughRelationOptions['throughModel']],
    column?: Omit<ThroughRelationOptions, 'relatedModel' | 'throughModel'>,
  ) => (target: any, property: string | Symbol) => void

  /**
   * ------------------------------------------------------
   * Opaque typed relationships
   * ------------------------------------------------------
   */

  /**
   * Opaque type for has one relationship
   */
  export type HasOne<
    Related extends ModelContract,
    Model extends ModelConstructorContract = ModelConstructorContract
  > = Related & {
    type: 'hasOne',
    model: ModelConstructorContract<Related>,
    instance: Related,
    relation: HasOneRelationContract<Model, ModelConstructorContract<Related>>
  }

  /**
   * Opaque type for has many relationship
   */
  export type HasMany<
    Related extends ModelContract,
    Model extends ModelConstructorContract = ModelConstructorContract
  > = Related[] & {
    type: 'hasMany',
    model: ModelConstructorContract<Related>,
    instance: Related,
    relation: HasManyRelationContract<Model, ModelConstructorContract<Related>>
  }

  /**
   * Opaque type for has belongs to relationship
   */
  export type BelongsTo<
    Related extends ModelContract,
    Model extends ModelConstructorContract = ModelConstructorContract
  > = Related & {
    type: 'belongsTo',
    model: ModelConstructorContract<Related>,
    instance: Related,
    relation: BelongsToRelationContract<Model, ModelConstructorContract<Related>>
  }

  /**
   * Opaque type for many to many relationship
   */
  export type ManyToMany<
    Related extends ModelContract,
    Model extends ModelConstructorContract = ModelConstructorContract
  > = Related[] & {
    type: 'manyToMany',
    model: ModelConstructorContract<Related>,
    instance: Related,
    relation: ManyToManyRelationContract<Model, ModelConstructorContract<Related>>
  }

  /**
   * Opaque type for many to many relationship
   */
  export type HasManyThrough<
    Related extends ModelContract,
    Model extends ModelConstructorContract = ModelConstructorContract
  > = Related[] & {
    type: 'hasManyThrough',
    model: ModelConstructorContract<Related>,
    instance: Related,
    relation: HasManyThroughRelationContract<Model, ModelConstructorContract<Related>>
  }

  /**
   * Possible typed relations
   */
  type TypedRelations =
    HasOne<ModelContract, ModelConstructorContract> |
    HasMany<ModelContract, ModelConstructorContract> |
    BelongsTo<ModelContract, ModelConstructorContract> |
    ManyToMany<ModelContract, ModelConstructorContract> |
    HasManyThrough<ModelContract, ModelConstructorContract>

  /**
   * Returns relationship model instance or array of instances based
   * upon the relationship type
   */
  export type ExtractRelationModel<
    Relation extends TypedRelations,
  > = Relation['type'] extends 'hasOne' | 'belongsTo' ? Relation['instance'] : Relation['instance'][]

  /**
   * ------------------------------------------------------
   * Relationships
   * ------------------------------------------------------
   */

  /**
   * Interface to be implemented by all relationship types
   */
  export interface BaseRelationContract<
    Model extends ModelConstructorContract,
    RelatedModel extends ModelConstructorContract
  > {
    readonly type: TypedRelations['type']
    readonly relationName: string
    readonly serializeAs: string | null
    readonly booted: boolean
    readonly model: Model
    relatedModel (): RelatedModel
    boot (): void
  }

  /**
   * Has one relationship interface
   */
  export interface HasOneRelationContract<
    Model extends ModelConstructorContract,
    RelatedModel extends ModelConstructorContract
  > extends BaseRelationContract<Model, RelatedModel> {
    type: 'hasOne'

    $setRelated (
      parent: InstanceType<Model>,
      related: InstanceType<RelatedModel> | null
    ): void

    $pushRelated (
      parent: InstanceType<Model>,
      related: InstanceType<RelatedModel> | null
    ): void

    $setRelatedForMany (
      parent: InstanceType<Model>[],
      related: InstanceType<RelatedModel>[],
    ): void

    /**
     * Returns the query client for one or many model instances
     */
    client (
      model: InstanceType<Model> | InstanceType<Model>[],
      client: QueryClientContract,
    ): HasOneClientContract<this, Model, RelatedModel>
  }

  /**
   * Has many relationship interface
   */
  export interface HasManyRelationContract<
    Model extends ModelConstructorContract,
    RelatedModel extends ModelConstructorContract
  > extends BaseRelationContract<Model, RelatedModel> {
    type: 'hasMany'

    $setRelated (
      parent: InstanceType<Model>,
      related: InstanceType<RelatedModel>[]
    ): void

    $pushRelated (
      parent: InstanceType<Model>,
      related: InstanceType<RelatedModel> | InstanceType<RelatedModel>[]
    ): void

    $setRelatedForMany (
      parent: InstanceType<Model>[],
      related: InstanceType<RelatedModel>[],
    ): void

    /**
     * Returns the query client for one or many model instances
     */
    client (
      model: InstanceType<Model> | InstanceType<Model>[],
      client: QueryClientContract,
    ): HasManyClientContract<this, Model, RelatedModel>
  }

  /**
   * Belongs to relationship interface
   */
  export interface BelongsToRelationContract<
    Model extends ModelConstructorContract,
    RelatedModel extends ModelConstructorContract
  > extends BaseRelationContract<Model, RelatedModel> {
    type: 'belongsTo'

    $setRelated (
      parent: InstanceType<Model>,
      related: InstanceType<RelatedModel> | null
    ): void

    $pushRelated (
      parent: InstanceType<Model>,
      related: InstanceType<RelatedModel> | null
    ): void

    $setRelatedForMany (
      parent: InstanceType<Model>[],
      related: InstanceType<RelatedModel>[],
    ): void

    /**
     * Returns the query client for one or many model instances
     */
    client (
      model: InstanceType<Model> | InstanceType<Model>[],
      client: QueryClientContract,
    ): BelongsToClientContract<this, Model, RelatedModel>
  }

  /**
   * Many to many relationship interface
   */
  export interface ManyToManyRelationContract<
    Model extends ModelConstructorContract,
    RelatedModel extends ModelConstructorContract
  > extends BaseRelationContract<Model, RelatedModel> {
    type: 'manyToMany'

    $setRelated (
      parent: InstanceType<Model>,
      related: InstanceType<RelatedModel>[]
    ): void

    $pushRelated (
      parent: InstanceType<Model>,
      related: InstanceType<RelatedModel> | InstanceType<RelatedModel>[]
    ): void

    $setRelatedForMany (
      parent: InstanceType<Model>[],
      related: InstanceType<RelatedModel>[],
    ): void

    /**
     * Returns the query client for one or many model instances
     */
    client (
      model: InstanceType<Model> | InstanceType<Model>[],
      client: QueryClientContract,
    ): ManyToManyClientContract<this, Model, RelatedModel>
  }

  /**
   * Has many through relationship interface
   */
  export interface HasManyThroughRelationContract<
    Model extends ModelConstructorContract,
    RelatedModel extends ModelConstructorContract
  > extends BaseRelationContract<Model, RelatedModel> {
    type: 'hasManyThrough'

    $setRelated (
      parent: InstanceType<Model>,
      related: InstanceType<RelatedModel>[]
    ): void

    $pushRelated (
      parent: InstanceType<Model>,
      related: InstanceType<RelatedModel> | InstanceType<RelatedModel>[]
    ): void

    $setRelatedForMany (
      parent: InstanceType<Model>[],
      related: InstanceType<RelatedModel>[],
    ): void

    /**
     * Returns the query client for one or many model instances
     */
    client (
      model: InstanceType<Model> | InstanceType<Model>[],
      client: QueryClientContract,
    ): RelationBaseQueryClientContract<this, Model, RelatedModel>
  }

  /**
   * A union of relationships
   */
  export type RelationshipsContract =
    HasOneRelationContract<ModelConstructorContract, ModelConstructorContract> |
    HasManyRelationContract<ModelConstructorContract, ModelConstructorContract> |
    BelongsToRelationContract<ModelConstructorContract, ModelConstructorContract> |
    ManyToManyRelationContract<ModelConstructorContract, ModelConstructorContract> |
    HasManyThroughRelationContract<ModelConstructorContract, ModelConstructorContract>

  /**
   * ------------------------------------------------------
   * Relationships query client
   * ------------------------------------------------------
   */
  export interface RelationBaseQueryClientContract<
    Relation extends RelationshipsContract,
    Model extends ModelConstructorContract,
    RelatedModel extends ModelConstructorContract
  > {
    relation: Relation,
    /**
     * Return a query builder instance of the relationship
     */
    query<
      Result extends any = InstanceType<RelatedModel>
    > (): RelationBaseQueryBuilderContract<RelatedModel, Result>

    /**
     * Eager query only works when client instance is created using multiple
     * parent model instances
     */
    eagerQuery<
      Result extends any = InstanceType<RelatedModel>
    > (): RelationBaseQueryBuilderContract<RelatedModel, Result>
  }

  /**
   * Query client for has one relationship
   */
  export interface HasOneClientContract<
    Relation extends RelationshipsContract,
    Model extends ModelConstructorContract,
    RelatedModel extends ModelConstructorContract,
    Related extends InstanceType<RelatedModel> = InstanceType<RelatedModel>
  > extends RelationBaseQueryClientContract<Relation, Model, RelatedModel> {
    save (related: Related): Promise<void>

    create (
      values: Partial<Related['$columns']>,
    ): Promise<Related>

    firstOrCreate (
      search: Partial<Related['$columns']>,
      savePayload?: Partial<Related['$columns']>,
    ): Promise<Related>

    updateOrCreate (
      search: ModelObject,
      updatePayload: ModelObject,
    ): Promise<Related>
  }

  /**
   * Query client for has many relationship. Extends hasOne and
   * adds support for saving many relations
   */
  export interface HasManyClientContract<
    Relation extends RelationshipsContract,
    Model extends ModelConstructorContract,
    RelatedModel extends ModelConstructorContract,
    Related extends InstanceType<RelatedModel> = InstanceType<RelatedModel>
  > extends HasOneClientContract<Relation, Model, RelatedModel> {
    saveMany (related: Related[]): Promise<void>
    createMany (values: Partial<Related['$columns']>[]): Promise<Related[]>
  }

  /**
   * Query client for belongs to relationship. Uses `associate` and
   * `dissociate` over save.
   */
  export interface BelongsToClientContract<
    Relation extends RelationshipsContract,
    Model extends ModelConstructorContract,
    RelatedModel extends ModelConstructorContract,
    Related extends InstanceType<RelatedModel> = InstanceType<RelatedModel>
  > extends RelationBaseQueryClientContract<Relation, Model, RelatedModel> {
    associate (related: Related): Promise<void>
    dissociate (): Promise<void>
  }

  /**
   * Query client for many to many relationship.
   */
  export interface ManyToManyClientContract<
    Relation extends RelationshipsContract,
    Model extends ModelConstructorContract,
    RelatedModel extends ModelConstructorContract,
    Related extends InstanceType<RelatedModel> = InstanceType<RelatedModel>
  > {
    relation: Relation,

    query<
      Result extends any = Related
    > (): ManyToManyQueryBuilderContract<RelatedModel, Result>

    /**
     * Eager query only works when client instance is created using multiple
     * parent model instances
     */
    eagerQuery<
      Result extends any = Related
    > (): ManyToManyQueryBuilderContract<RelatedModel, Result>

    /**
     * Pivot query just targets the pivot table without any joins
     */
    pivotQuery<
      Result extends any = any
    > (): ManyToManyQueryBuilderContract<RelatedModel, Result>

    /**
     * Save related model instance.
     */
    save (related: Related, checkExisting?: boolean): Promise<void>

    /**
     * Save many of related model instance.
     */
    saveMany (related: Related[], checkExisting?: boolean): Promise<void>

    /**
     * Create related model instance
     */
    create (
      values: Partial<Related['$columns']>,
      checkExisting?: boolean,
    ): Promise<Related>

    /**
     * Create many of related model instances
     */
    createMany (
      values: Partial<Related['$columns']>[],
      checkExisting?: boolean,
    ): Promise<Related[]>

    /**
     * Attach new pivot rows
     */
    attach (
      ids: (string | number)[] | { [key: string]: ModelObject },
      trx?: TransactionClientContract,
    ): Promise<void>

    /**
     * Detach existing pivot rows
     */
    detach (
      ids?: (string | number)[],
      trx?: TransactionClientContract,
    ): Promise<void>

    /**
     * Sync pivot rows.
     */
    sync (
      ids: (string | number)[] | { [key: string]: ModelObject },
      detach?: boolean,
      trx?: TransactionClientContract,
    ): Promise<void>
  }

  /**
   * ------------------------------------------------------
   * Relationships query builders
   * ------------------------------------------------------
   */

  /**
   * Base query builder for all relations
   */
  export interface RelationBaseQueryBuilderContract<
    Related extends ModelConstructorContract,
    Result extends any = InstanceType<Related>
  > extends ModelQueryBuilderContract<Related, Result> {
    $selectRelationKeys (): this
  }

  /**
   * Possible signatures for adding a where clause
   */
  interface WherePivot<Builder extends ChainableContract> {
    (key: string, value: StrictValues | ChainableContract): Builder
    (key: string, operator: string, value: StrictValues | ChainableContract): Builder
  }

  /**
   * Possible signatures for adding where in clause.
   */
  interface WhereInPivot<Builder extends ChainableContract> {
    (K: string, value: (StrictValues | ChainableContract)[]): Builder
    (K: string[], value: (StrictValues | ChainableContract)[][]): Builder
    (k: string, subquery: ChainableContract | QueryCallback<Builder>): Builder
    (k: string[], subquery: ChainableContract): Builder
  }

  /**
   * Shape of many to many query builder. It has few methods over the standard
   * model query builder
   */
  export interface ManyToManyQueryBuilderContract<
    Related extends ModelConstructorContract,
    Result extends any = InstanceType<Related>
  > extends RelationBaseQueryBuilderContract<Related, Result> {
    pivotColumns (columns: string[]): this

    wherePivot: WherePivot<this>
    orWherePivot: WherePivot<this>
    andWherePivot: WherePivot<this>

    whereNotPivot: WherePivot<this>
    orWhereNotPivot: WherePivot<this>
    andWhereNotPivot: WherePivot<this>

    whereInPivot: WhereInPivot<this>
    orWhereInPivot: WhereInPivot<this>
    andWhereInPivot: WhereInPivot<this>

    whereNotInPivot: WhereInPivot<this>
    orWhereNotInPivot: WhereInPivot<this>
    andWhereNotInPivot: WhereInPivot<this>
  }

  /**
   * ------------------------------------------------------
   * Preloader
   * ------------------------------------------------------
   */

  /**
   * The preload function
   */
  export interface QueryBuilderPreloadFn<Model extends ModelContract, Builder extends any> {
    /**
     * If Typescript were to support high order generics. The life would
     * have been a lot better
     */
    <
      Name extends keyof ExtractRelations<Model>,
      RelationType extends TypedRelations = Model[Name] extends TypedRelations ? Model[Name] : never,
    > (
      relation: Name,
      callback?: (
        builder: ReturnType<ReturnType<RelationType['relation']['client']>['eagerQuery']>,
      ) => void,
    ): Builder
  }

  /**
   * Shape of the preloader to preload relationships
   */
  export interface PreloaderContract<Model extends ModelContract> {
    $processAllForOne (parent: Model, client: QueryClientContract): Promise<void>
    $processAllForMany (parent: Model[], client: QueryClientContract): Promise<void>
    preload: QueryBuilderPreloadFn<Model, this>
    sideload (values: ModelObject): this
  }

  /**
   * ------------------------------------------------------
   * Helpers
   * ------------------------------------------------------
   */

  /**
   * Extract defined relationships from a model class
   */
  export type ExtractRelations<Model extends ModelContract> = {
    [FilteredKey in {
      [Key in keyof Model]: Model[Key] extends TypedRelations ? Key : never
    }[keyof Model]]: string
  }
}
