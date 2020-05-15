/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 5/3/2020
 * Time: 8:43 AM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as Transaction from 'knex/lib/transaction.js';

const Debug = require('debug');
const debug = Debug('knex:tx');
const makeKnex = require('knex/lib/util/make-knex');
const {uniqueId, isUndefined} = require('lodash');


/**
 * Isolation levels can be set per-transaction by passing `options.isolationLevel` to `transaction`.
 */
export enum ISOLATION_LEVELS {
    READ_UNCOMMITTED = 'READ UNCOMMITTED',
    READ_COMMITTED = 'READ COMMITTED',
    REPEATABLE_READ = 'REPEATABLE READ',
    SERIALIZABLE = 'SERIALIZABLE',
}

Transaction.prototype.setIsolationLevel = async function (value, options) {
    if (!value) {
        return;
    }
    if (!(value && !this.client.transacting)) {
        return;
    }

    const sql = options.dialect.setIsolationLevelQuery(value);

    if (!sql) {
        return;
    }

    return this.trxClient.raw(sql);
};

Transaction.prototype._evaluateContainer = async function (config, container) {
    return this.acquireConnection(config, async (connection) => {
        const trxClient = (this.trxClient = makeTxClient(
            this,
            this.client,
            connection
        ));

        let startTransaction;

        if (config?.dialect?.settingIsolationLevelDuringTransaction) {
            startTransaction = this.client.transacting
                ? this.savepoint(connection)
                : this.begin(connection);

            await this.setIsolationLevel(config.isolationLevel, config);

        } else {
            await this.setIsolationLevel(config.isolationLevel, config);

            startTransaction = this.client.transacting
                ? this.savepoint(connection)
                : this.begin(connection);
        }

        const executionPromise = new Promise((resolver, rejecter) => {
            this._resolver = resolver;
            this._rejecter = rejecter;
        });

        Promise.resolve()
            .then(() => {
                return makeTransactor(this, connection, trxClient);
            })
            .then((transactor) => {
                transactor.executionPromise = executionPromise;

                // If we've returned a "thenable" from the transaction container, assume
                // the rollback and commit are chained to this object's success / failure.
                // Directly thrown errors are treated as automatic rollbacks.
                let result;
                try {
                    result = container(transactor);
                } catch (err) {
                    result = Promise.reject(err);
                }
                if (result && result.then && typeof result.then === 'function') {
                    result
                        .then((val) => {
                            return transactor.commit(val);
                        })
                        .catch((err) => {
                            return transactor.rollback(err);
                        });
                }
                return null;
            })
            .catch((e) => {
                return this._rejecter(e);
            });

        return executionPromise;
    });
}

// The transactor is a full featured knex object, with a "commit", a "rollback"
// and a "savepoint" function. The "savepoint" is just sugar for creating a new
// transaction. If the rollback is run inside a savepoint, it rolls back to the
// last savepoint - otherwise it rolls back the transaction.
function makeTransactor(trx, connection, trxClient) {
    const transactor = makeKnex(trxClient);

    transactor.context.withUserParams = () => {
        throw new Error(
            'Cannot set user params on a transaction - it can only inherit params from main knex instance'
        );
    };

    transactor.isTransaction = true;
    transactor.userParams = trx.userParams || {};

    transactor.context.transaction = function (container, options) {
        if (!options) {
            options = {doNotRejectOnRollback: true};
        } else if (isUndefined(options.doNotRejectOnRollback)) {
            options.doNotRejectOnRollback = true;
        }

        return this._transaction(container, options, trx);
    };

    transactor.savepoint = function (container, options) {
        return transactor.transaction(container, options);
    };

    if (trx.client.transacting) {
        transactor.commit = (value) => trx.release(connection, value);
        transactor.rollback = (error) => trx.rollbackTo(connection, error);
    } else {
        transactor.commit = (value) => trx.commit(connection, value);
        transactor.rollback = (error) => trx.rollback(connection, error);
    }

    transactor.isCompleted = () => trx.isCompleted();

    return transactor;
}

// We need to make a client object which always acquires the same
// connection and does not release back into the pool.
function makeTxClient(trx, client, connection) {
    const trxClient = Object.create(client.constructor.prototype);
    trxClient.version = client.version;
    trxClient.config = client.config;
    trxClient.driver = client.driver;
    trxClient.connectionSettings = client.connectionSettings;
    trxClient.transacting = true;
    trxClient.valueForUndefined = client.valueForUndefined;
    trxClient.logger = client.logger;

    trxClient.on('query', function (arg) {
        trx.emit('query', arg);
        client.emit('query', arg);
    });

    trxClient.on('query-error', function (err, obj) {
        trx.emit('query-error', err, obj);
        client.emit('query-error', err, obj);
    });

    trxClient.on('query-response', function (response, obj, builder) {
        trx.emit('query-response', response, obj, builder);
        client.emit('query-response', response, obj, builder);
    });

    const _query = trxClient.query;
    trxClient.query = function (conn, obj) {
        const completed = trx.isCompleted();
        return new Promise(function (resolve, reject) {
            try {
                if (conn !== connection)
                    throw new Error('Invalid connection for transaction query.');
                if (completed) completedError(trx, obj);
                resolve(_query.call(trxClient, conn, obj));
            } catch (e) {
                reject(e);
            }
        });
    };
    const _stream = trxClient.stream;
    trxClient.stream = function (conn, obj, stream, options) {
        const completed = trx.isCompleted();
        return new Promise(function (resolve, reject) {
            try {
                if (conn !== connection)
                    throw new Error('Invalid connection for transaction query.');
                if (completed) completedError(trx, obj);
                resolve(_stream.call(trxClient, conn, obj, stream, options));
            } catch (e) {
                reject(e);
            }
        });
    };
    trxClient.acquireConnection = function () {
        return Promise.resolve(connection);
    };
    trxClient.releaseConnection = function () {
        return Promise.resolve();
    };

    return trxClient;
}

function completedError(trx, obj) {
    const sql = typeof obj === 'string' ? obj : obj && obj.sql;
    debug('%s: Transaction completed: %s', trx.txid, sql);
    throw new Error(
        'Transaction query already complete, run with DEBUG=knex:tx for more info'
    );
}
