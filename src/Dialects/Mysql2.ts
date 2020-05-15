/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:57 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { DialectContract } from '../Contracts/Database/DialectContract';
import { RawBuilder } from '../Database/StaticBuilder/RawBuilder'
import {AbstractDialect} from "./AbstractDialect";

export class Mysql2Dialect extends AbstractDialect implements DialectContract {
    public readonly name = 'mysql2';

    public readonly supportsAdvisoryLocks = true;

    public readonly settingIsolationLevelDuringTransaction = false;

    /**
     * The default format for datetime column. The date formats is
     * valid for luxon date parsing library
     */
    public readonly dateTimeFormat = 'yyyy-MM-dd HH:mm:ss'

    /**
     * Truncate mysql table with option to cascade
     */
    public async truncate(table: string, cascade: boolean = false) {
        if ( ! cascade ) {
            return this.client.knexQuery().table(table).truncate()
        }

        /**
         * Cascade and truncate
         */
        const trx = await this.client.transaction()
        try {
            await trx.rawQuery('SET FOREIGN_KEY_CHECKS=0;')
            await trx.knexQuery().table(table).truncate()
            await trx.rawQuery('SET FOREIGN_KEY_CHECKS=1;')
            await trx.commit()
        } catch (error) {
            await trx.rollback()
            throw error
        }
    }

    /**
     * Returns an array of table names
     */
    public async getAllTables() {
        const tables = await this.client
                                 .query()
                                 .from('information_schema.tables')
                                 .select('table_name')
                                 .where('TABLE_TYPE', 'BASE TABLE')
                                 .debug(true)
                                 .where('table_schema', new RawBuilder('database()'))
                                 .orderBy('table_name', 'asc')

        return tables.map(({ table_name }) => table_name)
    }

    /**
     * Attempts to add advisory lock to the database and
     * returns it's status.
     */
    public async getAdvisoryLock(key: string, timeout: number = 0): Promise<boolean> {
        const response = await this.client.rawQuery(`SELECT GET_LOCK('${ key }', ${ timeout }) as lock_status;`)
        return response[0] && response[0][0] && response[0][0].lock_status === 1
    }

    /**
     * Releases the advisory lock
     */
    public async releaseAdvisoryLock(key: string): Promise<boolean> {
        const response = await this.client.rawQuery(`SELECT RELEASE_LOCK('${ key }') as lock_status;`)
        return response[0] && response[0][0] && response[0][0].lock_status === 1
    }
}
