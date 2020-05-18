/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:51 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Dialect specfic methods
 */
export interface DialectContract {
    name: 'mssql' | 'mysql' | 'mysql2' | 'oracledb' | 'postgres' | 'redshift' | 'sqlite3'
    readonly supportsAdvisoryLocks: boolean
    readonly dateTimeFormat: string

    getAllTables(schemas?: string[]): Promise<string[]>

    truncate(table: string, cascade?: boolean): Promise<void>

    getAdvisoryLock(key: string | number, timeout?: number): Promise<boolean>

    releaseAdvisoryLock(key: string | number): Promise<boolean>
}
