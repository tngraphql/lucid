/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:00 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import 'reflect-metadata'
import { LucidModel } from '../../Contracts/Model/LucidModel';
import {
    ColumnDecorator,
    ComputedDecorator,
    DateColumnDecorator,
    DateTimeColumnDecorator,
    HooksDecorator
} from '../../Contracts/Model/types';
import {
    BelongsToDecorator,
    HasManyDecorator,
    HasManyThroughDecorator,
    HasOneDecorator,
    ManyToManyDecorator, MorphToDecorator
} from '../../Contracts/Orm/Relations/types';

import { dateColumn, dateTimeColumn } from './date'

/**
 * Define property on a model as a column. The decorator needs a
 * proper model class inheriting the base model
 */
export const column: ColumnDecorator & {
    date: DateColumnDecorator,
    dateTime: DateTimeColumnDecorator,
} = (options?) => {
    return function decorateAsColumn(target, property) {
        const Model = target.constructor as LucidModel
        Model.bootIfNotBooted()
        Model.$addColumn(property, options || {})
    }
}

column.date = dateColumn
column.dateTime = dateTimeColumn

/**
 * Define computed property on a model. The decorator needs a
 * proper model class inheriting the base model
 */
export const computed: ComputedDecorator = (options) => {
    return function decorateAsComputed(target, property) {
        const Model = target.constructor as LucidModel

        Model.bootIfNotBooted()
        Model.$addComputed(property, options || {})
    }
}

/**
 * Define belongsTo relationship
 */
export const belongsTo: BelongsToDecorator = (relatedModel, relation?) => {
    return function decorateAsRelation(target, property: string) {
        const Model = target.constructor as LucidModel
        Model.bootIfNotBooted()
        Model.$addRelation(property, 'belongsTo', relatedModel, Object.assign({ relatedModel }, relation))
    }
}

/**
 * Define hasOne relationship
 */
export const hasOne: HasOneDecorator = (relatedModel, relation?) => {
    return function decorateAsRelation(target, property: string) {
        const Model = target.constructor as LucidModel
        Model.bootIfNotBooted()
        Model.$addRelation(property, 'hasOne', relatedModel, Object.assign({ relatedModel }, relation))
    }
}

/**
 * Define hasMany relationship
 */
export const hasMany: HasManyDecorator = (relatedModel, relation?) => {
    return function decorateAsRelation(target, property: string) {
        const Model = target.constructor as LucidModel
        Model.bootIfNotBooted()
        Model.$addRelation(property, 'hasMany', relatedModel, Object.assign({ relatedModel }, relation))
    }
}

/**
 * Define manyToMany relationship
 */
export const manyToMany: ManyToManyDecorator = (relatedModel, relation?) => {
    return function decorateAsRelation(target, property: string) {
        const Model = target.constructor as LucidModel
        Model.bootIfNotBooted()
        Model.$addRelation(property, 'manyToMany', relatedModel, Object.assign({ relatedModel }, relation))
    }
}

/**
 * Define hasManyThrough relationship
 */
export const hasManyThrough: HasManyThroughDecorator = ([relatedModel, throughModel], relation) => {
    return function decorateAsRelation(target, property: string) {
        const Model = target.constructor as LucidModel
        Model.bootIfNotBooted()
        Model.$addRelation(
            property,
            'hasManyThrough',
            relatedModel, Object.assign({ relatedModel, throughModel }, relation)
        )
    }
}

export const morphTo: MorphToDecorator = (relation?) => {
    return function decorateAsRelation(target, property: string) {
        const Model = target.constructor as LucidModel
        const relatedModel = () => Model;
        Model.bootIfNotBooted()
        Model.$addRelation(property, 'morphTo', relatedModel, Object.assign({ relatedModel }, relation))
    }
}

/**
 * Before/After save hook
 */
export const beforeSave: HooksDecorator = () => {
    return function decorateAsHook(target, property) {
        target.bootIfNotBooted()
        target.before('save', target[property].bind(target))
    }
}
export const afterSave: HooksDecorator = () => {
    return function decorateAsColumn(target, property) {
        target.bootIfNotBooted()
        target.after('save', target[property].bind(target))
    }
}

/**
 * Before/After create hook
 */
export const beforeCreate: HooksDecorator = () => {
    return function decorateAsColumn(target, property) {
        target.bootIfNotBooted()
        target.before('create', target[property].bind(target))
    }
}
export const afterCreate: HooksDecorator = () => {
    return function decorateAsColumn(target, property) {
        target.bootIfNotBooted()
        target.after('create', target[property].bind(target))
    }
}

/**
 * Before/After update hook
 */
export const beforeUpdate: HooksDecorator = () => {
    return function decorateAsColumn(target, property) {
        target.bootIfNotBooted()
        target.before('update', target[property].bind(target))
    }
}
export const afterUpdate: HooksDecorator = () => {
    return function decorateAsColumn(target, property) {
        target.bootIfNotBooted()
        target.after('update', target[property].bind(target))
    }
}

/**
 * Before/After delete hook
 */
export const beforeDelete: HooksDecorator = () => {
    return function decorateAsColumn(target, property) {
        target.bootIfNotBooted()
        target.before('delete', target[property].bind(target))
    }
}
export const afterDelete: HooksDecorator = () => {
    return function decorateAsColumn(target, property) {
        target.bootIfNotBooted()
        target.after('delete', target[property].bind(target))
    }
}

/**
 * Before/After find hook
 */
export const beforeFind: HooksDecorator = () => {
    return function decorateAsColumn(target, property) {
        target.bootIfNotBooted()
        target.before('find', target[property].bind(target))
    }
}
export const afterFind: HooksDecorator = () => {
    return function decorateAsColumn(target, property) {
        target.bootIfNotBooted()
        target.after('find', target[property].bind(target))
    }
}

/**
 * Before/After fetchs hook
 */
export const beforeFetch: HooksDecorator = () => {
    return function decorateAsColumn(target, property) {
        target.bootIfNotBooted()
        target.before('fetch', target[property].bind(target))
    }
}
export const afterFetch: HooksDecorator = () => {
    return function decorateAsColumn(target, property) {
        target.bootIfNotBooted()
        target.after('fetch', target[property].bind(target))
    }
}

/**
 * Before/After paginate hook
 */
export const beforePaginate: HooksDecorator = () => {
    return function decorateAsColumn (target, property) {
        target.bootIfNotBooted()
        target.before('paginate', target[property].bind(target))
    }
}
export const afterPaginate: HooksDecorator = () => {
    return function decorateAsColumn (target, property) {
        target.bootIfNotBooted()
        target.after('paginate', target[property].bind(target))
    }
}