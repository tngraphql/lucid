/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:41 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ProfilerContract, ProfilerRowContract } from '@ioc:Adonis/Core/Profiler';
import { ConnectionContract } from './ConnectionContract';

/**
 * Connection node used by majority of database
 * clients
 */
type SharedConnectionNode = {
    host?: string,
    user?: string,
    password?: string,
    database?: string,
    port?: number,
}

/**
 * Shape of the report node for the database connection report
 */
export type ReportNode = {
    connection: string,
    message: string,
    error: any,
}

/**
 * Migrations config
 */
export type MigratorConfig = {
    disableTransactions?: boolean,
    paths?: string[],
    tableName?: string,
    disableRollbacksInProduction?: boolean,
}

/**
 * Shared config options for all clients
 */
type SharedConfigNode = {
    useNullAsDefault?: boolean,
    debug?: boolean,
    asyncStackTraces?: boolean,
    revision?: number,
    healthCheck?: boolean,
    migrations?: MigratorConfig,
    pool?: {
        afterCreate?: (conn: any, done: any) => void,
        min?: number,
        max?: number,
        acquireTimeoutMillis?: number,
        createTimeoutMillis?: number,
        idleTimeoutMillis?: number,
        createRetryIntervalMillis?: number,
        reapIntervalMillis?: number,
        log?: (msg: string) => any,
        validate?: (resource: any) => boolean,
        propagateCreateError?: boolean,
    },
}

/**
 * The Sqlite specific config options are taken directly from the
 * driver. https://github.com/mapbox/node-sqlite3/wiki/API#new-sqlite3databasefilename-mode-callback
 *
 * Knex forwards all config options to the driver directly. So feel
 * free to define them (let us know, in case any options are missing)
 */
export type SqliteConfig = SharedConfigNode & {
    client: 'sqlite' | 'sqlite3',
    connection: {
        filename: string,
        mode?: any,
    },
    replicas?: never,
}

/**
 * The MYSQL specific config options are taken directly from the
 * driver. https://www.npmjs.com/package/mysql#connection-options
 *
 * Knex forwards all config options to the driver directly. So feel
 * free to define them (let us know, in case any options are missing)
 */
type MysqlConnectionNode = {
    socketPath?: string,
    localAddress?: string,
    charset?: string,
    timezone?: string,
    stringifyObjects?: boolean,
    insecureAuth?: boolean,
    typeCast?: boolean,
    supportBigNumbers?: boolean,
    bigNumberStrings?: boolean,
    dateStrings?: boolean | string[],
    flags?: string,
    ssl?: any,
}
export type MysqlConfig = SharedConfigNode & {
    client: 'mysql',
    version?: string,
    connection?: SharedConnectionNode & MysqlConnectionNode,
    replicas?: {
        write: {
            connection: MysqlConfig['connection'],
            pool?: MysqlConfig['pool'],
        }
        read: {
            connection: MysqlConfig['connection'][],
            pool?: MysqlConfig['pool'],
        },
    },
}

/**
 * `mysql2` config is same as `mysql`. So just refer mysql docs
 * https://www.npmjs.com/package/mysql#connection-options
 *
 * Knex forwards all config options to the driver directly. So feel
 * free to define them (let us know, in case any options are missing)
 */
export type Mysql2Config = MysqlConfig & {
    client: 'mysql2',
}

/**
 * Config is picked from PostgreSQL driver, just refer their docs
 * https://node-postgres.com/features/connecting#programmatic.
 *
 * - `returning` is added by Knex and not driver.
 * - `searchPath` is also added by Knex.
 *
 * Knex forwards all config options to the driver directly. So feel
 * free to define them (let us know, in case any options are missing)
 */
export type PostgreConfig = SharedConfigNode & {
    client: 'pg' | 'postgres' | 'postgresql',
    version?: string,
    returning?: string,
    connection?: string | SharedConnectionNode,
    replicas?: {
        write: {
            connection: PostgreConfig['connection'],
            pool?: PostgreConfig['pool'],
        }
        read: {
            connection: PostgreConfig['connection'][],
            pool?: PostgreConfig['pool'],
        },
    },
    searchPath?: string[],
}

/**
 * Redshift uses `pg` driver. So config options are same as Postgres.
 * https://node-postgres.com/features/connecting#programmatic.
 *
 * Knex forwards all config options to the driver directly. So feel
 * free to define them (let us know, in case any options are missing)
 */
export type RedshiftConfig = PostgreConfig & {
    client: 'redshift',
}

/**
 * Please install `oracledb` driver and not the `oracle`. The later is
 * depreciated. Config is only allowed for `oracledb`.
 *
 * Please refer to the driver configuration docs to learn more about the
 * config values.
 * https://oracle.github.io/node-oracledb/doc/api.html#oracledbproperties
 */
type OracleConnectionNode = {
    autoCommit?: boolean,
    connectionClass?: string,
    edition?: string,
    externalAuth?: boolean,
    fetchArraySize?: number,
    fetchAsBuffer?: any[],
    lobPrefetchSize?: number,
    maxRows?: number,
    oracleClientVersion?: number,
}
export type OracleConfig = SharedConfigNode & {
    client: 'oracledb',
    connection?: SharedConnectionNode & OracleConnectionNode,
    replicas?: {
        write: {
            connection: OracleConfig['connection'],
            pool?: OracleConfig['pool'],
        }
        read: {
            connection: OracleConfig['connection'][],
            pool?: OracleConfig['pool'],
        },
    },
    fetchAsString?: any[],
}

/**
 * Config values are taken directly from the driver config.
 * https://www.npmjs.com/package/mssql#config.
 *
 * Knex forwards all config options to the driver directly. So feel
 * free to define them (let us know, in case any options are missing)
 */
type MssqlConnectionNode = {
    server: string,
    domain?: string,
    connectionTimeout?: number,
    requestTimeout?: number,
    parseJSON?: boolean,
}
export type MssqlConfig = SharedConfigNode & {
    client: 'mssql',
    version?: string,
    connection?: SharedConnectionNode & MssqlConnectionNode,
    replicas?: {
        write: {
            connection: MssqlConfig['connection'],
            pool?: MssqlConfig['pool'],
        }
        read: {
            connection: MssqlConfig['connection'][],
            pool?: MssqlConfig['pool'],
        },
    },
}

/**
 * Connection config must be the config from one of the
 * available dialects
 */
export type ConnectionConfig =
    SqliteConfig |
    MysqlConfig |
    PostgreConfig |
    OracleConfig |
    RedshiftConfig |
    Mysql2Config |
    MssqlConfig

/**
 * Shape of config inside the database config file
 */
export type DatabaseConfig = {
    connection: string,
    connections: { [key: string]: ConnectionConfig },
}

/**
 * The shape of a connection within the connection manager
 */
export type ConnectionNode = {
    name: string,
    config: ConnectionConfig,
    connection?: ConnectionContract,
    state: 'registered' | 'migrating' | 'open' | 'closing' | 'closed',
}

/**
 * Options when retrieving new query client from the database
 * query builder
 */
export type DatabaseClientOptions = Partial<{
    mode: 'read' | 'write',
    profiler: ProfilerRowContract | ProfilerContract,
}>
