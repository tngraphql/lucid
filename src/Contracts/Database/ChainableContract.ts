/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 1:00 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as Knex from 'knex';
import {
    DatabaseQueryBuilderSelect,
    Distinct,
    FromTable,
    GroupBy,
    Having,
    HavingBetween,
    HavingExists,
    HavingIn,
    HavingNull,
    Intersect,
    Join,
    OrderBy,
    RawQueryFn,
    Union,
    UnionAll,
    Where,
    WhereBetween,
    WhereExists,
    WhereIn,
    WhereNull,
    With
} from '../querybuilder';

/**
 * The chainable contract has all the methods that can be chained
 * to build a query. This interface will never have any
 * methods to execute a query.
 */
export interface ChainableContract {
    knexQuery: Knex.QueryBuilder
    hasAggregates: boolean,
    hasGroupBy: boolean,
    hasUnion: boolean,
    keysResolver?: (columnName: string) => string,

    from: FromTable<this>
    select: DatabaseQueryBuilderSelect<this>

    where: Where<this>
    orWhere: Where<this>
    andWhere: Where<this>

    whereNot: Where<this>
    orWhereNot: Where<this>
    andWhereNot: Where<this>

    whereIn: WhereIn<this>
    orWhereIn: WhereIn<this>
    andWhereIn: WhereIn<this>

    whereNotIn: WhereIn<this>
    orWhereNotIn: WhereIn<this>
    andWhereNotIn: WhereIn<this>

    whereNull: WhereNull<this>
    orWhereNull: WhereNull<this>
    andWhereNull: WhereNull<this>

    whereNotNull: WhereNull<this>
    orWhereNotNull: WhereNull<this>
    andWhereNotNull: WhereNull<this>

    whereExists: WhereExists<this>
    orWhereExists: WhereExists<this>
    andWhereExists: WhereExists<this>

    whereNotExists: WhereExists<this>
    orWhereNotExists: WhereExists<this>
    andWhereNotExists: WhereExists<this>

    whereBetween: WhereBetween<this>
    orWhereBetween: WhereBetween<this>
    andWhereBetween: WhereBetween<this>

    whereNotBetween: WhereBetween<this>
    orWhereNotBetween: WhereBetween<this>
    andWhereNotBetween: WhereBetween<this>

    whereRaw: RawQueryFn<this>
    orWhereRaw: RawQueryFn<this>
    andWhereRaw: RawQueryFn<this>

    join: Join<this>
    innerJoin: Join<this>
    leftJoin: Join<this>
    leftOuterJoin: Join<this>
    rightJoin: Join<this>
    rightOuterJoin: Join<this>
    fullOuterJoin: Join<this>
    crossJoin: Join<this>
    joinRaw: RawQueryFn<this>

    having: Having<this>
    orHaving: Having<this>
    andHaving: Having<this>

    havingIn: HavingIn<this>
    orHavingIn: HavingIn<this>
    andHavingIn: HavingIn<this>

    havingNotIn: HavingIn<this>
    orHavingNotIn: HavingIn<this>
    andHavingNotIn: HavingIn<this>

    havingNull: HavingNull<this>
    orHavingNull: HavingNull<this>
    andHavingNull: HavingNull<this>

    havingNotNull: HavingNull<this>
    orHavingNotNull: HavingNull<this>
    andHavingNotNull: HavingNull<this>

    havingExists: HavingExists<this>
    orHavingExists: HavingExists<this>
    andHavingExists: HavingExists<this>

    havingNotExists: HavingExists<this>
    orHavingNotExists: HavingExists<this>
    andHavingNotExists: HavingExists<this>

    havingBetween: HavingBetween<this>
    orHavingBetween: HavingBetween<this>
    andHavingBetween: HavingBetween<this>

    havingNotBetween: HavingBetween<this>
    orHavingNotBetween: HavingBetween<this>
    andHavingNotBetween: HavingBetween<this>

    havingRaw: RawQueryFn<this>
    orHavingRaw: RawQueryFn<this>
    andHavingRaw: RawQueryFn<this>

    distinct: Distinct<this>

    groupBy: GroupBy<this>
    groupByRaw: RawQueryFn<this>

    orderBy: OrderBy<this>
    orderByRaw: RawQueryFn<this>

    union: Union<this>
    unionAll: UnionAll<this>

    intersect: Intersect<this>

    with: With<this>,
    withRecursive: With<this>,

    withSchema(schema: string): this,

    as(name: string): this

    offset(offset: number): this

    limit(limit: number): this

    clearSelect(): this

    clearWhere(): this

    clearOrder(): this

    clearHaving(): this

    clearLimit(): this

    clearOffset(): this

    forUpdate(...tableNames: string[]): this

    forShare(...tableNames: string[]): this

    skipLocked(): this

    noWait(): this

    [key: string]: any | (() => this);
}
