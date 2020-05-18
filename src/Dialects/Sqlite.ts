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
import { QueryClientContract } from '../Contracts/Database/QueryClientContract';
import { ISOLATION_LEVELS } from '../Database/customTransaction';
import { AbstractDialect } from './AbstractDialect';

export class SqliteDialect extends AbstractDialect implements DialectContract {
    public readonly name = 'sqlite3'
    public readonly supportsAdvisoryLocks = false

    /**
     * The default format for datetime column. The date formats is
     * valid for luxon date parsing library
     */
    public readonly dateTimeFormat = 'yyyy-MM-dd HH:mm:ss'

    /**
     * Returns an array of table names
     */
    public async getAllTables() {
        const tables = await this.client
                                 .query()
                                 .from('sqlite_master')
                                 .select('name')
                                 .where('type', 'table')
                                 .whereNot('name', 'like', 'sqlite_%')
                                 .orderBy('name', 'asc')

        return tables.map(({ name }) => name)
    }

    /**
     * Truncate SQLITE tables
     */
    public async truncate(table: string, _: boolean) {
        return this.client.knexQuery().table(table).truncate()
    }

    /**
     * Attempts to add advisory lock to the database and
     * returns it's status.
     */
    public getAdvisoryLock(): Promise<boolean> {
        throw new Error('Sqlite doesn\'t support advisory locks')
    }

    /**
     * Releases the advisory lock
     */
    public releaseAdvisoryLock(): Promise<boolean> {
        throw new Error('Sqlite doesn\'t support advisory locks')
    }

    public setIsolationLevelQuery(value) {
        switch (value) {
        case ISOLATION_LEVELS.REPEATABLE_READ:
            return '';
        case ISOLATION_LEVELS.READ_UNCOMMITTED:
            return 'PRAGMA read_uncommitted = ON;';
        case ISOLATION_LEVELS.READ_COMMITTED:
            return 'PRAGMA read_uncommitted = OFF;';
        case ISOLATION_LEVELS.SERIALIZABLE:
            return '';
        default:
            throw new Error(`Unknown isolation level: ${value}`);
        }
    }
}
