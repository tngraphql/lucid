/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 12:57 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { LoggerContract } from '@ioc:Adonis/Core/Logger'
import { ProfilerContract } from '@ioc:Adonis/Core/Profiler'

import { Exception } from '@poppinss/utils/build'
import { EmitterContract } from '@tngraphql/illuminate/dist/Contracts/Events/EmitterContract';
import { ConnectionManager } from '../Connection/ConnectionManager'
import { ConnectionManagerContract } from '../Contracts/Connection/ConnectionManagerContract';
import { DatabaseClientOptions, DatabaseConfig } from '../Contracts/Connection/types';
import { DatabaseContract } from '../Contracts/Database/DatabaseContract';
import { QueryClientContract } from '../Contracts/Database/QueryClientContract';
import { TransactionClientContract } from '../Contracts/Database/TransactionClientContract';
import { prettyPrint } from '../Helpers/prettyPrint'
import { ModelQueryBuilder } from '../Orm/QueryBuilder/ModelQueryBuilder'
import { QueryClient } from '../QueryClient/QueryClient'
import { SimplePaginator } from './Paginator/SimplePaginator'
import { DatabaseQueryBuilder } from './QueryBuilder/DatabaseQueryBuilder'
import { InsertQueryBuilder } from './QueryBuilder/InsertQueryBuilder'
import { RawBuilder } from './StaticBuilder/RawBuilder'
import { ReferenceBuilder } from './StaticBuilder/ReferenceBuilder';
import './customTransaction';

/**
 * Database class exposes the API to manage multiple connections and obtain an instance
 * of query/transaction clients.
 */
export class Database implements DatabaseContract {
    /**
     * Reference to connections manager
     */
    public manager: ConnectionManagerContract

    /**
     * Primary connection name
     */
    public primaryConnectionName = this.config.connection

    /**
     * Reference to query builders. We expose them, so that they can be
     * extended from outside using macros.
     */
    public DatabaseQueryBuilder = DatabaseQueryBuilder
    public InsertQueryBuilder = InsertQueryBuilder
    public ModelQueryBuilder = ModelQueryBuilder
    public SimplePaginator = SimplePaginator

    /**
     * A store of global transactions
     */
    public connectionGlobalTransactions: Map<string, TransactionClientContract> = new Map()

    /**
     * A store of global transactions
     */
    static _cls;

    constructor(
        private config: DatabaseConfig,
        private logger: LoggerContract,
        private profiler: ProfilerContract,
        private emitter: EmitterContract
    ) {
        this.manager = new ConnectionManager(this.logger, this.emitter)
        this.registerConnections()
    }

    public static clsRun(fn: (ctx?: any) => void) {
        const ns = this._cls;
        if ( ! ns ) return fn();

        let res;
        ns.run(context => res = fn(context));
        return res;
    }

    public prettyPrint = prettyPrint

    /**
     * Registering all connections with the manager, so that we can fetch
     * and connect with them whenver required.
     */
    private registerConnections() {
        Object.keys(this.config.connections).forEach((name) => {
            this.manager.add(name, this.config.connections[name])
        })
    }

    /**
     * Returns the connection node from the connection manager
     */
    public getRawConnection(name: string) {
        return this.manager.get(name)
    }

    /**
     * Returns the query client for a given connection
     */
    public connection(connection: string = this.primaryConnectionName, options?: DatabaseClientOptions): QueryClientContract {
        options = options || {}

        /**
         * Use default profiler, when no profiler is defined when obtaining
         * the query client for a given connection.
         */
        if ( ! options.profiler ) {
            options.profiler = this.profiler
        }

        /**
         * Connect is noop when already connected
         */
        this.manager.connect(connection)

        /**
         * Disallow modes other than `read` or `write`
         */
        if ( options.mode && ! ['read', 'write'].includes(options.mode) ) {
            throw new Exception(`Invalid mode ${ options.mode }. Must be read or write`)
        }

        /**
         * Return the global transaction when it already exists.
         */
        if ( Database._cls ) {
            const t = Database._cls.get('transaction');
            if ( t ) {
                this.logger.trace({ connection }, 'using pre-existing global transaction connection');
                return t;
            }
            // this.logger.trace({ connection }, 'using pre-existing global transaction connection');
            // const globalTransactionClient = this.connectionGlobalTransactions.get(connection)!
            // return globalTransactionClient
        }

        /**
         * Fetching connection for the given name
         */
        const rawConnection = this.getRawConnection(connection)!.connection!

        /**
         * Generating query client for a given connection and setting appropriate
         * mode on it
         */
        this.logger.trace({ connection }, 'creating query client in %s mode', [options.mode || 'dual'])
        const queryClient = options.mode
            ? new QueryClient(options.mode, rawConnection, this.emitter)
            : new QueryClient('dual', rawConnection, this.emitter)

        /**
         * Passing profiler to the query client for profiling queries
         */
        queryClient.profiler = options.profiler
        return queryClient
    }

    /**
     * Returns the Knex query builder
     */
    public knexQuery() {
        return this.connection(this.primaryConnectionName).knexQuery()
    }

    /**
     * Returns the Knex raw query builder
     */
    public knexRawQuery(sql: string, bindings?: any[]) {
        return this.connection(this.primaryConnectionName).knexRawQuery(sql, bindings)
    }

    /**
     * Returns query builder. Optionally one can define the mode as well
     */
    public query(options?: DatabaseClientOptions) {
        return this.connection(this.primaryConnectionName, options).query()
    }

    /**
     * Returns insert query builder. Always has to be dual or write mode and
     * hence it doesn't matter, since in both `dual` and `write` mode,
     * the `write` connection is always used.
     */
    public insertQuery(options?: DatabaseClientOptions) {
        return this.connection(this.primaryConnectionName, options).insertQuery()
    }

    /**
     * Returns a query builder instance for a given model.
     */
    public modelQuery(model: any, options?: DatabaseClientOptions) {
        return this.connection(this.primaryConnectionName, options).modelQuery(model)
    }

    /**
     * Returns an instance of raw query builder. Optionally one can
     * defined the `read/write` mode in which to execute the
     * query
     */
    public rawQuery(sql: string, bindings?: any, options?: DatabaseClientOptions) {
        return this.connection(this.primaryConnectionName, options).rawQuery(sql, bindings)
    }

    /**
     * Returns an instance of raw builder. This raw builder queries
     * cannot be executed. Use `rawQuery`, if you want to execute
     * queries raw queries.
     */
    public raw(sql: string, bindings?: any) {
        return new RawBuilder(sql, bindings)
    }

    /**
     * Returns reference builder.
     */
    public ref(reference: string) {
        return new ReferenceBuilder(reference)
    }

    /**
     * Returns instance of a query builder and selects the table
     */
    public from(table: any) {
        return this.connection().from(table)
    }

    /**
     * Returns insert query builder and selects the table
     */
    public table(table: any) {
        return this.connection().table(table)
    }

    /**
     * Returns a transaction instance on the default
     * connection
     */
    public async transaction<T = TransactionClientContract>(options?, autoCallback?): Promise<T> {
        if (typeof options === 'function') {
            autoCallback = options;
            options = undefined;
        }
        return this.connection().transaction<T>(options, autoCallback);
    }

    /**
     * Invokes `manager.report`
     */
    public report() {
        return this.manager.report()
    }

    // /**
    //  * Begin a new global transaction
    //  */
    // public async beginGlobalTransaction(
    //     connectionName?: string,
    //     options?: Omit<DatabaseClientOptions, 'mode'>
    // ) {
    //     connectionName = connectionName || this.primaryConnectionName
    //
    //     /**
    //      * Return global transaction as it is
    //      */
    //     const globalTrx = this.connectionGlobalTransactions.get(connectionName)
    //     if ( globalTrx ) {
    //         return globalTrx
    //     }
    //
    //     /**
    //      * Create a new transaction and store a reference to it
    //      */
    //     const trx = await this.connection(connectionName, options).transaction()
    //     this.connectionGlobalTransactions.set(trx.connectionName, trx)
    //
    //     /**
    //      * Listen for events to drop the reference when transaction
    //      * is over
    //      */
    //     trx.on('commit', ($trx) => {
    //         this.connectionGlobalTransactions.delete($trx.connectionName)
    //     })
    //
    //     trx.on('rollback', ($trx) => {
    //         this.connectionGlobalTransactions.delete($trx.connectionName)
    //     })
    //
    //     return trx
    // }
    //
    // /**
    //  * Commit an existing global transaction
    //  */
    // public async commitGlobalTransaction(connectionName?: string) {
    //     connectionName = connectionName || this.primaryConnectionName
    //     const trx = this.connectionGlobalTransactions.get(connectionName)
    //
    //     if ( ! trx ) {
    //         throw new Exception([
    //             'Cannot commit a non-existing global transaction.',
    //             ' Make sure you are not calling "commitGlobalTransaction" twice'
    //         ].join(''))
    //     }
    //
    //     await trx.commit()
    // }
    //
    // /**
    //  * Rollback an existing global transaction
    //  */
    // public async rollbackGlobalTransaction(connectionName?: string) {
    //     connectionName = connectionName || this.primaryConnectionName
    //     const trx = this.connectionGlobalTransactions.get(connectionName)
    //
    //     if ( ! trx ) {
    //         throw new Exception([
    //             'Cannot rollback a non-existing global transaction.',
    //             ' Make sure you are not calling "commitGlobalTransaction" twice'
    //         ].join(''))
    //     }
    //
    //     await trx.rollback()
    // }
}
