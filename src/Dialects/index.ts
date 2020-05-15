/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:57 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { MssqlDialect } from './Mssql'
import { MysqlDialect } from './Mysql'
import { OracleDialect } from './Oracle'
import { PgDialect } from './Pg'
import { RedshiftDialect } from './Redshift'
import { SqliteDialect } from './Sqlite'
import {Mysql2Dialect} from "./Mysql2";

export const dialects = {
    'mssql': MssqlDialect,
    'mysql': MysqlDialect,
    'mysql2': Mysql2Dialect,
    'oracledb': OracleDialect,
    'postgres': PgDialect,
    'redshift': RedshiftDialect,
    'sqlite3': SqliteDialect
}
