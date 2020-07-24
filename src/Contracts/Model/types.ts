/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:08 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { DateTime } from 'luxon'
import {
    ManyToManyRelationOptions,
    ModelRelations, MorphOneRelationOptions, MorphToManyRelationOptions, MorphToRelationOptions,
    RelationOptions,
    ThroughRelationOptions
} from '../Orm/Relations/types';
import { ColumnOptions } from './ColumnOptions';
import { LucidModel } from './LucidModel';
import { QueryScope } from './QueryScope';
import { QueryScopeCallback } from './QueryScopeCallback';

/**
 * Get one or many of a generic
 */
export type OneOrMany<T> = T | T[]

/**
 * Decorator for defining date columns
 */
export type DateColumnDecorator = (options?: Partial<ColumnOptions & {
    autoCreate: boolean,
    autoUpdate: boolean,
}>) => TypedDecorator<DateTime>

/**
 * Decorator for defining date time columns. It is same as
 * date column as of now
 */
export type DateTimeColumnDecorator = DateColumnDecorator

/**
 * Typed decorator
 */
export type TypedDecorator<PropType> = <TKey extends string, TTarget extends { [K in TKey]: PropType }>(
    target: TTarget,
    property: TKey
) => void

/**
 * Decorator function
 */
export type DecoratorFn = (target: any, property: any) => void

/**
 * Signature for column decorator function
 */
export type ColumnDecorator = (options?: Partial<ColumnOptions>) => DecoratorFn

/**
 * Signature for computed decorator function
 */
export type ComputedDecorator = (options?: Partial<ComputedOptions>) => DecoratorFn

/**
 * Decorator for defining hooks. The generics enforces that
 * decorator is used on static properties only
 */
export type HooksDecorator = () => <Model extends LucidModel>(
    target: Model,
    property: string
) => void

/**
 * Represents a computed property on the model
 */
export type ComputedOptions = {
    serializeAs: string | null,
    meta?: any,
}

/**
 * Shape of column options after they have set on the model
 */
export type ModelColumnOptions = ColumnOptions & {
    hasGetter: boolean,
    hasSetter: boolean,
}

/**
 * Extract the query scopes of a model
 */
export type ExtractScopes<Model extends any> = {
    [Scope in keyof PickProperties<Model, QueryScope<QueryScopeCallback>>]: (
        ...args: OmitFirst<Model[Scope]>
    ) => ExtractScopes<Model>
}

/**
 * Same as [[Parameters]] but omits the first parameter
 */
type OmitFirst<T extends (...args: any) => any> = T extends (x: any, ...args: infer P) => any ? P : never

/**
 * Same as [[Pick]] but picks by value and not the key
 */
type PickProperties<T, P> = Pick<T, { [K in keyof T]: T[K] extends P ? K : never }[keyof T]>

/**
 * List of events for which a model will trigger hooks
 */
export type EventsList = 'save' | 'create' | 'update' | 'delete' | 'fetch' | 'find' | 'paginate'
export type HooksHandler<Data extends any,
    Event extends EventsList,
    > = ((data: Data, event: Event) => Promise<void> | void) | string;

/**
 * Options accepted by the Model.$addRelation method
 */
export type ModelRelationOptions = RelationOptions<ModelRelations>
    | ManyToManyRelationOptions<ModelRelations>
    | ThroughRelationOptions<ModelRelations>
    | MorphOneRelationOptions<ModelRelations>
    | MorphToRelationOptions<ModelRelations>
    | MorphToManyRelationOptions<ModelRelations>

export type GlobalScope = ({
    scope: (() => void) | object | string,
    callback: (() => void) | object
});
