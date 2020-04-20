/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/9/2020
 * Time: 8:39 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { LoggerContract } from '@ioc:Adonis/Core/Logger'

/**
 * Custom Knex logger that uses logger under the
 * hood.
 */
export class Logger {
    public warn = function(message: any) {
        this.adonisLogger.warn(message)
    }.bind(this)

    public error = function(message: any) {
        this.adonisLogger.error(message)
    }.bind(this)

    public deprecate = function(message: any) {
        this.adonisLogger.info(message)
    }.bind(this)

    public debug = function(message: any) {
        this.warn(
            '"debug" property inside config is depreciated. We recommend using "db:query" event for enrich logging'
        )
        this.adonisLogger.debug(message)
    }.bind(this)

    constructor(public name: string, public adonisLogger: LoggerContract) {
    }
}
