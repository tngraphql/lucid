/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 3:22 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */


import { JoinCallback } from 'knex';
import { ChainableContract } from './Database/ChainableContract';
import { InsertQueryBuilderContract } from './Database/InsertQueryBuilderContract';
import { RawBuilderContract } from './Database/RawBuilderContract';
import { RawQueryBuilderContract } from './Database/RawQueryBuilderContract';
import { ReferenceBuilderContract } from './Database/ReferenceBuilderContract';
import { QueryCallback } from './Database/types';
import { OneOrMany } from './Model/types';

/**
 * A builder method to allow raw queries. However, the return type is the
 * instance of current query builder. This is used for `.{verb}Raw` methods.
 */
export interface RawQueryFn<Builder extends ChainableContract> {
    (sql: string | RawQuery): Builder

    (sql: string, bindings: RawQueryBindings): Builder
}

/**
 * Possible signatures for a select method on database query builder.
 */
export interface DatabaseQueryBuilderSelect<Builder extends ChainableContract> {
    /**
     * Selecting columns as a dictionary with key as the alias and value is
     * the original column.
     */
    (columns: Dictionary<string, string>): Builder

    /**
     * An array of values with subqueries
     */
    (columns: ValueWithSubQueries<string>[]): Builder

    /**
     * A spread of array arguments
     */
    (...columns: ValueWithSubQueries<string>[]): Builder

    /**
     * Wildcard selector.
     */
    (column: '*'): Builder
}

/**
 * Possible signatures for adding a where clause
 */
export interface Where<Builder extends ChainableContract> {
    /**
     * Callback for wrapped clauses
     */
    (callback: QueryCallback<Builder>): Builder

    /**
     * Passing an object of named key-value pair
     */
    (clause: Dictionary<any, string>): Builder

    /**
     * Key-value pair. The value can also be a subquery
     */
    (key: string, value: StrictValues | ChainableContract): Builder

    (key: string, operator: string, value: StrictValues | ChainableContract): Builder
}

/**
 * Possible signatures for adding where in clause.
 */
export interface WhereIn<Builder extends ChainableContract> {
    /**
     * Column name and array of values
     */
    (K: string, value: (StrictValues | ChainableContract)[]): Builder

    /**
     * Column names and array of values as an 2d array
     */
    (K: string[], value: (StrictValues | ChainableContract)[][]): Builder

    /**
     * Column name with a subquery for a callback that yields an array of
     * results
     */
    (k: string, subquery: ChainableContract | QueryCallback<Builder>): Builder

    /**
     * Column names along with a subquery that yields an array
     */
    (k: string[], subquery: ChainableContract): Builder
}

/**
 * Possible signatures for adding whereNull clause.
 */
export interface WhereNull<Builder extends ChainableContract> {
    (key: string): Builder
}

/**
 * Possibles signatures for adding a where exists clause
 */
export interface WhereExists<Builder extends ChainableContract> {
    (callback: QueryCallback<Builder> | ChainableContract): Builder
}

/**
 * Possibles signatures for adding a where between clause
 */
export interface WhereBetween<Builder extends ChainableContract> {
    /**
     * Accept any string as a key for supporting prefix columns
     */
    (key: string, value: [
        StrictValues | ChainableContract,
        StrictValues | ChainableContract,
    ]): Builder
}

/**
 * Possible signatures for join query
 */
export interface Join<Builder extends ChainableContract> {
    /**
     * Defining the join table with primary and secondary columns
     * to match
     */
    (table: string, primaryColumn: string, secondaryColumn: string): Builder

    /**
     * Defining the join table with primary and secondary columns
     * to match, where secondary column is output of a raw query
     */
    (table: string, primaryColumn: string, raw: RawQuery): Builder

    /**
     * Defining the join table with primary and secondary columns
     * to match with a custom operator
     */
    (table: string, primaryColumn: string, operator: string, secondaryColumn: string): Builder

    /**
     * Join with a callback. The callback receives an array of join class from
     * knex directly.
     */
    (table: string, callback: JoinCallback): Builder
}

/**
 * Possible signatures for a distinct clause
 */
export interface Distinct<Builder extends ChainableContract> {
    (columns: string[]): Builder

    (...columns: string[]): Builder

    (column: '*'): Builder
}

/**
 * The signatures are same as the `distinct` method. For subqueries and
 * raw queries, one must use `groupByRaw`.
 */
export interface GroupBy<Builder extends ChainableContract> extends Distinct<Builder> {
}

/**
 * Possible signatures for aggregate functions. Aggregates will push to the
 * result set. Unlike knex, we force defining aliases for each aggregate.
 */
export interface Aggregate<Builder extends ChainableContract> {
    /**
     * Accepting column with the alias for the count.
     */
    (
        column: OneOrMany<ValueWithSubQueries<string>>,
        alias?: string
    ): Builder

    /**
     * Accepting an object for multiple counts in a single query.
     */
    (
        columns: Dictionary<OneOrMany<ValueWithSubQueries<string>>, string>
    ): Builder
}

/**
 * Possible signatures for orderBy method.
 */
export interface OrderBy<Builder extends ChainableContract> {
    /**
     * Order by a column and optional direction
     */
    (column: string, direction?: 'asc' | 'desc'): Builder

    /**
     * Order by multiple columns in default direction
     */
    (columns: string[]): Builder

    /**
     * Order by multiple columns and custom direction for each of them
     */
    (columns: { column: string, order?: 'asc' | 'desc' }[]): Builder
}

/**
 * Possible signatures for a union clause
 */
export interface Union<Builder extends ChainableContract> {
    (callback: OneOrMany<QueryCallback<Builder>>, wrap?: boolean): Builder

    (subquery: OneOrMany<ChainableContract | RawQuery>, wrap?: boolean): Builder
}

/**
 * Same signature as union
 */
export interface UnionAll<Builder extends ChainableContract> extends Union<Builder> {
}

/**
 * Same signature as union
 */
export interface Intersect<Builder extends ChainableContract> extends Union<Builder> {
}

/**
 * Possible signatures for having clause
 */
export interface Having<Builder extends ChainableContract> {
    /**
     * A subquery callback
     */
    (callback: QueryCallback<Builder>): Builder

    /**
     * Key operator and value. Value can be a subquery as well
     */
    (key: string, operator: string, value: StrictValues | ChainableContract): Builder
}

/**
 * Possible signatures for `having in` clause.
 */
export interface HavingIn<Builder extends ChainableContract> {
    /**
     * Key and an array of literal values, raw queries or
     * subqueries.
     */
    (key: string, value: (StrictValues | ChainableContract)[]): Builder

    /**
     * Key, along with a query callback
     */
    (key: string, callback: QueryCallback<Builder>): Builder
}

/**
 * Possible signatures for `having null` clause
 */
export interface HavingNull<Builder extends ChainableContract> extends WhereNull<Builder> {
}

/**
 * Possible signatures for `having exists` clause
 */
export interface HavingExists<Builder extends ChainableContract> {
    /**
     * A query callback or a sub query
     */
    (callback: QueryCallback<Builder> | ChainableContract): Builder
}

/**
 * Possible signatures for having between
 */
export interface HavingBetween<Builder extends ChainableContract> extends WhereBetween<Builder> {
}

/**
 * Possible signatures of `with` CTE
 */
export interface With<Builder extends ChainableContract> {
    (alias: string, query: RawQuery | ChainableContract | QueryCallback<Builder>): Builder
}

/**
 * Possible signatures for defining table for a select query.
 */
export interface FromTable<Builder extends ChainableContract> {
    (
        table: string | Dictionary<string, string> | QueryCallback<Builder> | ChainableContract
    ): Builder
}

/**
 * Possible signatures for the `returning` method.
 */
export interface Returning<Builder> {
    (column: OneOrMany<string>): Builder
}

/**
 * Possible signatures for performing an update
 */
export interface Update<Builder extends ChainableContract> {
    /**
     * Accepts an array of object of named key/value pair and returns an array
     * of Generic return columns.
     */
    (values: Dictionary<any, string>, returning?: string | string[]): Builder

    /**
     * Accepts a key-value pair to update.
     */
    (column: string, value: any, returning?: string | string[]): Builder
}

/**
 * Possible signatures for incrementing/decrementing
 * values
 */
export interface Counter<Builder extends ChainableContract> {
    (column: string, counter?: number): Builder

    (values: Dictionary<number, string>): Builder
}

/**
 * Possible signatures for an insert query
 */
export interface Insert<Builder extends InsertQueryBuilderContract> {
    (values: Dictionary<any, string>): Builder
}

/**
 * Possible signatures for doing multiple inserts in a single query
 */
export interface MultiInsert<Builder extends InsertQueryBuilderContract> {
    (values: Dictionary<any, string>[]): Builder
}

/**
 * Shape of raw query bindings
 */
export type RawQueryBindings = { [key: string]: StrictValuesWithoutRaw } | StrictValuesWithoutRaw[];


/**
 * Acceptable raw queries
 */
export type RawQuery = RawBuilderContract | RawQueryBuilderContract

/**
 * Extracted from ts-essentials
 */
export type Dictionary<T, K extends string | number = string> = { [key in K]: T }

/**
 * A known set of values allowed when defining values for different
 * clauses
 */
export type StrictValues =
    | string
    | number
    | boolean
    | Date
    | Array<string>
    | Array<number>
    | Array<Date>
    | Array<boolean>
    | Buffer
    | RawQuery
    | ReferenceBuilderContract

/**
 * Strict set of allowed values except the raw queries
 */
export type StrictValuesWithoutRaw = Exclude<StrictValues, RawQuery>

/**
 * Allowing a generic value along with raw query instance or a subquery
 * instance
 */
type ValueWithSubQueries<T extends any> = T | ChainableContract | RawQueryBuilderContract
