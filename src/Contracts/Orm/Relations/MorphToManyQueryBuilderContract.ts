/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:54 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { RelationQueryBuilderContract } from './RelationQueryBuilderContract';
import { LucidModel } from '../../Model/LucidModel';
import { WhereInPivot, WherePivot } from './types';

/**
 * Shape of many to many query builder. It has few methods over the standard
 * model query builder
 */
export interface MorphToManyQueryBuilderContract<
    Related extends LucidModel,
    Result extends any,
    > extends RelationQueryBuilderContract<Related, Result> {
    pivotColumns (columns: string[]): this
    isPivotOnlyQuery: boolean

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
