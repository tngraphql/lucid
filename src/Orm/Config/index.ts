/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:00 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as lodash from 'lodash';
import { plural, singular } from 'pluralize'
import { LucidModel } from '../../Contracts/Model/LucidModel';
import { OrmConfig } from '../../Contracts/Model/OrmConfig';
import { ModelRelations } from '../../Contracts/Orm/Relations/types';

/**
 * The default config for constructing ORM defaults
 */
export const Config: OrmConfig = {
    /**
     * Returns the table name for a given model
     */
    getTableName(model: LucidModel) {
        return plural(lodash.snakeCase(model.name))
    },

    /**
     * Returns the column name for a given model attribute
     */
    getColumnName(_: LucidModel, key: string) {
        return lodash.snakeCase(key)
    },

    /**
     * Returns the serialized key (toJSON key) name for a given attribute.
     */
    getSerializeAsKey(_: LucidModel, key: string) {
        return lodash.snakeCase(key)
    },

    /**
     * Returns the local key for a given relationship
     */
    getLocalKey(
        relation: ModelRelations['type'],
        model: LucidModel,
        related: LucidModel
    ): string {
        if ( relation === 'belongsTo' ) {
            return related.primaryKey
        }

        return model.primaryKey
    },

    /**
     * Returns the foreign key for a given relationship
     */
    getForeignKey(
        relation: ModelRelations['type'],
        model: LucidModel,
        related: LucidModel
    ): string {
        if ( relation === 'belongsTo' ) {
            return lodash.camelCase(`${ singular(related.getTable()) }_${ related.primaryKey }`)
        }

        return lodash.camelCase(`${ singular(model.getTable()) }_${ model.primaryKey }`)
    },

    /**
     * Returns the pivot table name for manyToMany relationship
     */
    getPivotTableName(
        _: 'manyToMany',
        model: LucidModel,
        relatedModel: LucidModel
    ): string {
        return lodash.snakeCase([singular(relatedModel.getTable()), singular(model.getTable())].sort().join('_'))
    },

    /**
     * Returns the pivot foreign key for manyToMany relationship
     */
    getPivotForeignKey(
        _: 'manyToMany',
        model: LucidModel
    ): string {
        return lodash.snakeCase(`${ singular(model.getTable()) }_${ model.primaryKey }`)
    }
}
