/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 2:00 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Exception } from '@poppinss/utils/build'
import { DateTime } from 'luxon'
import { LucidModel } from '../../Contracts/Model/LucidModel';
import { LucidRow } from '../../Contracts/Model/LucidRow';
import { DateColumnDecorator, DateTimeColumnDecorator } from '../../Contracts/Model/types';

export const DATE_TIME_TYPES = {
    date: 'date',
    datetime: 'datetime',
}

/**
 * The method to prepare the date column before persisting it's
 * value to the database
 */
function prepareDateColumn(value: any, attributeName: string, modelInstance: LucidRow) {
    /**
     * Return string or missing values as it is. If `auto` is set to true on
     * the column, then the hook will always initialize the date
     */
    if ( typeof (value) === 'string' || ! value ) {
        return value
    }

    const modelName = modelInstance.constructor.name

    /**
     * Format luxon instances to SQL formatted date
     */
    if ( value instanceof DateTime ) {
        if ( ! value.isValid ) {
            throw new Exception(
                `Invalid value for "${ modelName }.${ attributeName }". ${ value.invalidReason }`,
                500,
                'E_INVALID_DATE_COLUMN_VALUE'
            )
        }

        return value.toISODate()
    }

    /**
     * Anything else if not an acceptable value for date column
     */
    throw new Exception(
        `The value for "${ modelName }.${ attributeName }" must be an instance of "luxon.DateTime"`,
        500,
        'E_INVALID_DATE_COLUMN_VALUE'
    )
}

/**
 * Consume database return value and convert it to an instance of luxon.DateTime
 */
function consumeDateColumn(value: any, attributeName: string, modelInstance: LucidRow) {
    /**
     * Bypass null columns
     */
    if ( ! value ) {
        return value
    }

    /**
     * Convert from string
     */
    if ( typeof (value) === 'string' ) {
        return DateTime.fromSQL(value)
    }

    /**
     * Convert from date
     */
    if ( value instanceof Date ) {
        return DateTime.fromJSDate(value)
    }

    /**
     * Any another value cannot be formatted
     */
    const modelName = modelInstance.constructor.name
    throw new Exception(
        `Cannot format "${ modelName }.${ attributeName }" ${ typeof (value) } value to an instance of "luxon.DateTime"`,
        500,
        'E_INVALID_DATE_COLUMN_VALUE'
    )
}

/**
 * The method to prepare the datetime column before persisting it's
 * value to the database
 */
function prepareDateTimeColumn(value: any, attributeName: string, modelInstance: LucidRow) {
    /**
     * Return string or missing values as it is. If `auto` is set to true on
     * the column, then the hook will always initialize the date
     */
    if ( typeof (value) === 'string' || ! value ) {
        return value
    }

    const model = modelInstance.constructor as LucidModel
    const modelName = model.name
    const dateTimeFormat = model.query(modelInstance.$options).client.dialect.dateTimeFormat

    /**
     * Format luxon instances to SQL formatted date
     */
    if ( value instanceof DateTime ) {
        if ( ! value.isValid ) {
            throw new Exception(
                `Invalid value for "${ modelName }.${ attributeName }". ${ value.invalidReason }`,
                500,
                'E_INVALID_DATETIME_COLUMN_VALUE'
            )
        }

        return value.toFormat(dateTimeFormat)
    }

    /**
     * Anything else if not an acceptable value for date column
     */
    throw new Exception(
        `The value for "${ modelName }.${ attributeName }" must be an instance of "luxon.DateTime"`,
        500,
        'E_INVALID_DATETIME_COLUMN_VALUE'
    )
}

/**
 * Consume database return value and convert it to an instance of luxon.DateTime
 */
function consumeDateTimeColumn(value: any, attributeName: string, modelInstance: LucidRow) {
    /**
     * Bypass null columns
     */
    if ( ! value ) {
        return value
    }

    /**
     * Convert from string
     */
    if ( typeof (value) === 'string' ) {
        return DateTime.fromSQL(value)
    }

    /**
     * Convert from date
     */
    if ( value instanceof Date ) {
        return DateTime.fromJSDate(value)
    }

    /**
     * Any another value cannot be formatted
     */
    const modelName = modelInstance.constructor.name
    throw new Exception(
        `Cannot format "${ modelName }.${ attributeName }" ${ typeof (value) } value to an instance of "luxon.DateTime"`,
        500,
        'E_INVALID_DATETIME_COLUMN_VALUE'
    )
}

/**
 * Decorator to define a new date column
 */
export const dateColumn: DateColumnDecorator = (options?) => {
    return function decorateAsColumn(target, property) {
        const Model = target.constructor as LucidModel
        Model.bootIfNotBooted()

        const normalizedOptions = Object.assign({
            prepare: prepareDateColumn,
            consume: consumeDateColumn,
            serialize: (value: DateTime) => {
                if ( value instanceof DateTime ) {
                    return value.toISODate()
                }
                return value
            },
            meta: {}
        }, options)

        /**
         * Type always has to be a date
         */
        normalizedOptions.meta.type = DATE_TIME_TYPES.date
        normalizedOptions.meta.autoCreate = normalizedOptions.autoCreate === true
        normalizedOptions.meta.autoUpdate = normalizedOptions.autoUpdate === true
        Model.$addColumn(property, normalizedOptions)
    }
}

/**
 * Decorator to define a new date time column
 */
export const dateTimeColumn: DateTimeColumnDecorator = (options?) => {
    return function decorateAsColumn(target, property) {
        const Model = target.constructor as LucidModel
        Model.bootIfNotBooted()

        const normalizedOptions = Object.assign({
            prepare: prepareDateTimeColumn,
            consume: consumeDateTimeColumn,
            meta: {}
        }, options)

        /**
         * Type always has to be a datetime
         */
        normalizedOptions.meta.type = DATE_TIME_TYPES.datetime
        normalizedOptions.meta.autoCreate = normalizedOptions.autoCreate === true
        normalizedOptions.meta.autoUpdate = normalizedOptions.autoUpdate === true
        Model.$addColumn(property, normalizedOptions)
    }
}
