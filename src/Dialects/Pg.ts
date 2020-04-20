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

export class PgDialect implements DialectContract {
    public readonly name = 'postgres'
    public readonly supportsAdvisoryLocks = true

    /**
     * The default format for datetime column. The date formats is
     * valid for luxon date parsing library
     */
    public readonly dateTimeFormat = 'yyyy-MM-dd\'T\'HH:mm:ss.SSSZZ'

    constructor(private client: QueryClientContract) {
    }

    /**
     * Returns an array of table names for one or many schemas.
     */
    public async getAllTables(schemas: string[]) {
        const tables = await this.client
                                 .query()
                                 .from('pg_catalog.pg_tables')
                                 .select('tablename')
                                 .whereIn('schemaname', schemas)
                                 .orderBy('tablename', 'asc')

        return tables.map(({ tablename }) => tablename)
    }

    /**
     * Truncate pg table with option to cascade and restart identity
     */
    public async truncate(table: string, cascade: boolean = false) {
        if ( cascade ) {
            await this.client.rawQuery(`TRUNCATE ${ table } RESTART IDENTITY CASCADE;`);
        } else {
            await this.client.rawQuery(`TRUNCATE ${ table };`);
        }
    }

    /**
     * Attempts to add advisory lock to the database and
     * returns it's status.
     */
    public async getAdvisoryLock(key: string): Promise<boolean> {
        const response = await this.client.rawQuery(`SELECT PG_TRY_ADVISORY_LOCK('${ key }') as lock_status;`);

        return response.rows[0] && response.rows[0].lock_status === true
    }

    /**
     * Releases the advisory lock
     */
    public async releaseAdvisoryLock(key: string): Promise<boolean> {
        const response = await this.client.rawQuery(`SELECT PG_ADVISORY_UNLOCK('${ key }') as lock_status;`)
        return response.rows[0] && response.rows[0].lock_status === true
    }
}
