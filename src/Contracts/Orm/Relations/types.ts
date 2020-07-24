/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:10 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ChainableContract } from '../../Database/ChainableContract';
import { QueryClientContract } from '../../Database/QueryClientContract';
import { QueryCallback } from '../../Database/types';
import { HasManyClientContract } from './HasManyClientContract';
import { HasOneClientContract } from './HasOneClientContract';
import { LucidModel } from '../../Model/LucidModel';
import { LucidRow, ModelObject } from '../../Model/LucidRow';
import { TypedDecorator } from '../../Model/types';
import { StrictValues } from '../../querybuilder';
import { BelongsToClientContract } from './BelongsToClientContract';
import { BelongsToRelationContract } from './BelongsToRelationContract';
import { HasManyRelationContract } from './HasManyRelationContract';
import { HasManyThroughClientContract } from './HasManyThroughClientContract';
import { HasManyThroughRelationContract } from './HasManyThroughRelationContract';
import { HasOneRelationContract } from './HasOneRelationContract';
import { ManyToManyClientContract } from './ManyToManyClientContract';
import { ManyToManyQueryBuilderContract } from './ManyToManyQueryBuilderContract';
import { ManyToManyRelationContract } from './ManyToManyRelationContract';
import { RelationQueryBuilderContract } from './RelationQueryBuilderContract';
import {MorphToClientContract} from "./MorphToClientContract";
import {MorphToRelationContract} from "./MorphToRelationContract";
import { MorphOneClientContract } from './MorphOneClientContract';
import { MorphOneRelationContract } from './MorphOneRelationContract';
import {MorphManyClientContract} from "./MorphManyClientContract";
import {MorphManyRelationContract} from "./MorphManyRelationContract";

/**
 * ------------------------------------------------------
 * Opaque typed relationships
 * ------------------------------------------------------
 *
 * They have no runtime relevance, just a way to distinguish
 * between standard model properties and relationships
 *
 */
export type ModelRelationTypes = {
    readonly type: 'hasOne' | 'hasMany' | 'belongsTo' | 'manyToMany' | 'hasManyThrough'
}

/**
 * Extracts relationship attributes from the model
 */
export type ExtractModelRelations<Model extends LucidRow> = {
    [Key in keyof Model]: Model[Key] extends ModelRelations ? Key : never
}[keyof Model];

/**
 * These exists on the models directly as a relationship. The idea
 * is to distinguish relationship properties from other model
 * properties.
 */
export type ModelRelations =
    HasOne<LucidModel, LucidModel> |
    HasMany<LucidModel, LucidModel> |
    BelongsTo<LucidModel, LucidModel> |
    ManyToMany<LucidModel, LucidModel> |
    HasManyThrough<LucidModel, LucidModel> |
    MorphTo<LucidModel, LucidModel> |
    MorphOne<LucidModel, LucidModel> |
    MorphMany<LucidModel, LucidModel>

/**
 * ------------------------------------------------------
 * Preloader
 * ------------------------------------------------------
 */

/**
 * The preload function
 */
export interface QueryBuilderPreloadFn<Model extends LucidRow, Builder extends any> {
    <Name extends ExtractModelRelations<Model>,
        RelatedBuilder = Model[Name] extends ModelRelations ? Model[Name]['builder'] : never,
        >(
        relation: Name,
        callback?: (builder: RelatedBuilder) => void
    ): Builder
}

/**
 * Shape of the preloader to preload relationships
 */
export interface PreloaderContract<Model extends LucidRow> {
    processAllForOne(parent: Model, client: QueryClientContract): Promise<void>

    processAllForMany(parent: Model[], client: QueryClientContract): Promise<void>

    preload: QueryBuilderPreloadFn<Model, this>

    sideload(values: ModelObject): this
}

/**
 * A union of relationships
 */
export type RelationshipsContract =
    HasOneRelationContract<LucidModel, LucidModel> |
    HasManyRelationContract<LucidModel, LucidModel> |
    BelongsToRelationContract<LucidModel, LucidModel> |
    ManyToManyRelationContract<LucidModel, LucidModel> |
    HasManyThroughRelationContract<LucidModel, LucidModel> |
    MorphToRelationContract<LucidModel, LucidModel> |
    MorphOneRelationContract<LucidModel, LucidModel> |
    MorphManyRelationContract<LucidModel, LucidModel>


/**
 * Decorator signature to define has one relationship
 */
export type HasOneDecorator = <RelatedModel extends LucidModel>(
    model: (() => RelatedModel),
    options?: RelationOptions<HasOne<RelatedModel>>
) => TypedDecorator<HasOne<RelatedModel>>

/**
 * Decorator signature to define has many relationship
 */
export type HasManyDecorator = <RelatedModel extends LucidModel> (
    model: (() => RelatedModel),
    options?: RelationOptions<HasOne<RelatedModel>>
) => TypedDecorator<HasMany<RelatedModel>>

/**
 * Decorator signature to define belongs to relationship
 */
export type BelongsToDecorator = <RelatedModel extends LucidModel> (
    model: (() => RelatedModel),
    options?: RelationOptions<HasOne<RelatedModel>>
) => TypedDecorator<BelongsTo<RelatedModel>>

/**
 * Decorator signature to define many to many relationship
 */
export type ManyToManyDecorator = <RelatedModel extends LucidModel> (
    model: (() => RelatedModel),
    column?: ManyToManyRelationOptions<ManyToMany<RelatedModel>>
) => TypedDecorator<ManyToMany<RelatedModel>>

/**
 * Decorator signature to define has many through relationship
 */
export type HasManyThroughDecorator = <RelatedModel extends LucidModel> (
    model: [(() => RelatedModel), (() => LucidModel)],
    column?: Omit<ThroughRelationOptions<HasManyThrough<RelatedModel>>, 'throughModel'>
) => TypedDecorator<HasManyThrough<RelatedModel>>

/**
 * Decorator signature to define morph to relationship
 */
export type MorphToDecorator = <RelatedModel extends LucidModel>(
    options?: MorphToRelationOptions<MorphTo<RelatedModel>>
) => TypedDecorator<MorphTo<RelatedModel>>

/**
 * Decorator signature to define morph to relationship
 */
export type MorphOneDecorator = <RelatedModel extends LucidModel>(
    model: (() => RelatedModel),
    options?: MorphOneRelationOptions<MorphTo<RelatedModel>>
) => TypedDecorator<MorphOne<RelatedModel>>

/**
 * Decorator signature to define morph to relationship
 */
export type MorphManyDecorator = <RelatedModel extends LucidModel>(
    model: (() => RelatedModel),
    options?: MorphOneRelationOptions<MorphTo<RelatedModel>>
) => TypedDecorator<MorphMany<RelatedModel>>

export type MorphOneRelationOptions<Related extends ModelRelations> = {
    name?: string
    type?: string
    id?: string,
    localKey?: string
    onQuery?(query: Related['builder']): void,
}

export type MorphToRelationOptions<Related extends ModelRelations> = {
    localKey?: string
    type?: string
    id?: string,
    onQuery?(query: Related['builder']): void,
}

/**
 * Options accepted when defining a new relationship. Certain
 * relationships like `manyToMany` have their own options
 */
export type RelationOptions<Related extends ModelRelations> = {
    localKey?: string,
    foreignKey?: string,
    serializeAs?: string | null,
    onQuery?(query: Related['builder']): void,
}

/**
 * Opaque type for has belongs to relationship
 */
export type BelongsTo<RelatedModel extends LucidModel,
    ParentModel extends LucidModel = LucidModel> = InstanceType<RelatedModel> & {
    readonly type: 'belongsTo',
    model: RelatedModel,
    instance: InstanceType<RelatedModel>,
    client: BelongsToClientContract<BelongsToRelationContract<ParentModel, RelatedModel>,
        RelatedModel>
    builder: RelationQueryBuilderContract<RelatedModel, any>,
}

/**
 * Opaque type for has many relationship
 */
export type HasMany<RelatedModel extends LucidModel,
    ParentModel extends LucidModel = LucidModel> = InstanceType<RelatedModel>[] & {
    readonly type: 'hasMany',
    model: RelatedModel,
    instance: InstanceType<RelatedModel>,
    client: HasManyClientContract<HasManyRelationContract<ParentModel, RelatedModel>,
        RelatedModel>
    builder: RelationQueryBuilderContract<RelatedModel, any>,
}

/**
 * Opaque type for has one relationship
 */
export type HasOne<RelatedModel extends LucidModel,
    ParentModel extends LucidModel = LucidModel> = InstanceType<RelatedModel> & {
    readonly type: 'hasOne',
    model: RelatedModel,
    instance: InstanceType<RelatedModel>,
    client: HasOneClientContract<HasOneRelationContract<ParentModel, RelatedModel>,
        RelatedModel>,
    builder: RelationQueryBuilderContract<RelatedModel, any>,
}

/**
 * Opaque type for many to many relationship
 */
export type ManyToMany<RelatedModel extends LucidModel,
    ParentModel extends LucidModel = LucidModel> = InstanceType<RelatedModel>[] & {
    readonly type: 'manyToMany',
    model: RelatedModel,
    instance: InstanceType<RelatedModel>,
    client: ManyToManyClientContract<ManyToManyRelationContract<ParentModel, RelatedModel>,
        RelatedModel>,
    builder: ManyToManyQueryBuilderContract<RelatedModel, any>,
}

/**
 * Opaque type for many to many relationship
 */
export type HasManyThrough<RelatedModel extends LucidModel,
    ParentModel extends LucidModel = LucidModel> = InstanceType<RelatedModel>[] & {
    readonly type: 'hasManyThrough',
    model: RelatedModel,
    instance: InstanceType<RelatedModel>,
    client: HasManyThroughClientContract<HasManyThroughRelationContract<ParentModel, RelatedModel>,
        RelatedModel>,
    builder: RelationQueryBuilderContract<RelatedModel, any>,
}

/**
 * Opaque type for morph to relationship
 */
export type MorphTo<RelatedModel extends LucidModel,
    ParentModel extends LucidModel = LucidModel> = InstanceType<RelatedModel> & {
    readonly type: 'morphTo',
    model: RelatedModel,
    instance: InstanceType<RelatedModel>,
    client: MorphToClientContract<MorphToRelationContract<ParentModel, RelatedModel>,
        RelatedModel>,
    builder: RelationQueryBuilderContract<RelatedModel, any>,
}

export type MorphOne<RelatedModel extends LucidModel,
    ParentModel extends LucidModel = LucidModel> = InstanceType<RelatedModel> & {
    readonly type: 'morphOne',
    model: RelatedModel,
    instance: InstanceType<RelatedModel>,
    client: MorphOneClientContract<MorphOneRelationContract<ParentModel, RelatedModel>,
        RelatedModel>,
    builder: RelationQueryBuilderContract<RelatedModel, any>,
}

export type MorphMany<RelatedModel extends LucidModel,
    ParentModel extends LucidModel = LucidModel> = InstanceType<RelatedModel> & {
    readonly type: 'morphMany',
    model: RelatedModel,
    instance: InstanceType<RelatedModel>,
    client: MorphManyClientContract<MorphManyRelationContract<ParentModel, RelatedModel>,
        RelatedModel>,
    builder: RelationQueryBuilderContract<RelatedModel, any>,
}

/**
 * Options accepted by through relationships
 */
export type ThroughRelationOptions<Related extends ModelRelations> = RelationOptions<Related> & {
    throughLocalKey?: string,
    throughForeignKey?: string,
    throughModel: () => LucidModel,
}

/**
 * Options accepted by many to many relationship
 */
export type ManyToManyRelationOptions<Related extends ModelRelations> = {
    pivotTable?: string,
    localKey?: string,
    pivotForeignKey?: string,
    relatedKey?: string,
    pivotRelatedForeignKey?: string,
    pivotColumns?: string[],
    serializeAs?: string,
    onQuery?(query: Related['builder']): void,
}

/**
 * Possible signatures for adding a where clause
 */
export interface WherePivot<Builder extends ChainableContract> {
    (key: string, value: StrictValues | ChainableContract): Builder
    (key: string, operator: string, value: StrictValues | ChainableContract): Builder
}

/**
 * Possible signatures for adding where in clause.
 */
export interface WhereInPivot<Builder extends ChainableContract> {
    (K: string, value: (StrictValues | ChainableContract)[]): Builder
    (K: string[], value: (StrictValues | ChainableContract)[][]): Builder
    (k: string, subquery: ChainableContract | QueryCallback<Builder>): Builder
    (k: string[], subquery: ChainableContract): Builder
}
