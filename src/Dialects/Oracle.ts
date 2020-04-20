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

export class OracleDialect implements DialectContract {
    public readonly name = 'oracledb'
    public readonly supportsAdvisoryLocks = false

    /**
     * The default format for datetime column. The date formats is
     * valid for luxon date parsing library
     */
    public readonly dateTimeFormat = 'yyyy-MM-dd HH:mm:ss'

    constructor(private client: QueryClientContract) {
    }

    /**
     * Not implemented yet
     */
    public async getAllTables(): Promise<any> {
        throw new Error(
            '"getAllTables" method is not implemented for oracledb. Create a PR to add the feature'
        )
    }

    /**
     * Truncate pg table with option to cascade and restart identity
     */
    public async truncate(table: string, cascade: boolean = false) {
        if ( cascade ) {
            await this.client.rawQuery(`TRUNCATE ${ table } CASCADE;`)
        } else {
            await this.client.rawQuery(`TRUNCATE ${ table };`);
        }
    }

    public getAdvisoryLock(): Promise<boolean> {
        throw new Error('Support for advisory locks is not implemented for oracledb. Create a PR to add the feature')
    }

    public releaseAdvisoryLock(): Promise<boolean> {
        throw new Error('Support for advisory locks is not implemented for oracledb. Create a PR to add the feature')
    }
}
