/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:19 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */


import { ModelRelations } from '../Orm/Relations/types';
import { LucidModel } from './LucidModel';

/**
 * Shape of ORM config to have a standard place for computing
 * defaults
 */
export type OrmConfig = {
    /**
     * Return the default table name for a given model
     */
    getTableName(model: LucidModel): string

    /**
     * Return the `columnName` for a given model
     */
    getColumnName(model: LucidModel, key: string): string

    /**
     * Return the `serializeAs` key for a given model property
     */
    getSerializeAsKey(model: LucidModel, key: string): string

    /**
     * Return the local key property name for a given relationship
     */
    getLocalKey(
        relation: ModelRelations['type'],
        model: LucidModel,
        relatedModel: LucidModel
    ): string

    /**
     * Return the foreign key property name for a given relationship
     */
    getForeignKey(
        relation: ModelRelations['type'],
        model: LucidModel,
        relatedModel: LucidModel
    ): string

    /**
     * Return the pivot table name for many to many relationship
     */
    getPivotTableName(
        relation: 'manyToMany',
        model: LucidModel,
        relatedModel: LucidModel,
        relationName: string
    ): string

    /**
     * Return the pivot foreign key for many to many relationship
     */
    getPivotForeignKey(
        relation: 'manyToMany',
        model: LucidModel,
        relatedModel: LucidModel,
        relationName: string
    ): string
}
