/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/10/2020
 * Time: 7:19 AM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { DatabaseContract } from '../../src/Contracts/Database/DatabaseContract';
import { cleanup, getConfig, getDb, getEmitter, getLogger, getProfiler, setup } from '../helpers';
import { Database } from '../../src/Database/Database';

describe('database', () => {
    describe('Sample', () => {
        beforeAll(async () => {
            await setup();
        });

        afterAll(async () => {
            await cleanup();
        });

        it('register all connections with the manager', async () => {
            const config = {
                connection: 'primary',
                connections: {
                    primary: getConfig(),
                    test: getConfig()
                },
            }

            const db = new Database(config, getLogger(), getProfiler(), getEmitter());

            expect(db.manager.connections.get('test')).toBeDefined();

            expect(db.manager.connections.get('primary')).toBeDefined();
            expect(db.manager.connections.get('primary')!.state).toBe('registered');
            expect(db.manager.connections.get('primary')!.connection).toBeUndefined();

            await db.manager.closeAll();
        });

        it('make connection when db.connection is called', (done) => {
            expect.assertions(1);

            const config = {
                connection: 'primary',
                connections: { primary: getConfig() },
            }

            const emitter = getEmitter()
            const db = new Database(config, getLogger(), getProfiler(), emitter)
            emitter.on('db:connection:connect', (connection) => {
                expect(connection.name).toBe('primary');
                done()
            })

            db.connection()
            db.manager.closeAll()
        });

        it('make connection to a named connection', (done) => {
            expect.assertions(1);

            const config = {
                connection: 'primary',
                connections: { primary: getConfig() },
            }

            const emitter = getEmitter()
            const db = new Database(config, getLogger(), getProfiler(), emitter)
            emitter.on('db:connection:connect', (connection) => {
                expect(connection.name).toBe('primary');
                done()
            })

            db.connection('primary')
            db.manager.closeAll()
        });

        it('make connection to a named connection in write mode', async () => {
            const config = {
                connection: 'primary',
                connections: { primary: getConfig() },
            }

            const db = new Database(config, getLogger(), getProfiler(), getEmitter())
            const client = await db.connection('primary', { mode: 'write' })

            expect(client.mode).toBe('write');
            await db.manager.closeAll()
        });

        it('make connection to a named connection in read mode', async () => {
            const config = {
                connection: 'primary',
                connections: { primary: getConfig() },
            }

            const db = new Database(config, getLogger(), getProfiler(), getEmitter())
            const client = db.connection('primary', { mode: 'read' })

            expect(client.mode).toBe('read');
            await db.manager.closeAll()
        });

        it('get transaction instance', async () => {
            const config = {
                connection: 'primary',
                connections: { primary: getConfig() },
            }

            const db = new Database(config, getLogger(), getProfiler(), getEmitter())
            const trx = await db.transaction()

            expect(trx.mode).toBe('dual')
            expect(trx.isTransaction).toBeTruthy();

            await trx.rollback()
            await db.manager.closeAll()
        });

        it('get raw query builder instance', async () => {
            const config = {
                connection: 'primary',
                connections: { primary: getConfig() },
            }

            const db = new Database(config, getLogger(), getProfiler(), getEmitter())
            const result = await db.rawQuery('select 1 + 1')
            expect(result).toBeDefined();
            await db.manager.closeAll()
        })

        it('get raw query builder instance in read mode', async () => {
            const config = {
                connection: 'primary',
                connections: { primary: getConfig() },
            }

            const db = new Database(config, getLogger(), getProfiler(), getEmitter())
            const result = await db.rawQuery('select 1 + 1', [], { mode: 'read' })
            expect(result).toBeDefined();
            await db.manager.closeAll()
        })

        it('get raw query builder instance in write mode', async () => {
            const config = {
                connection: 'primary',
                connections: { primary: getConfig() },
            }

            const db = new Database(config, getLogger(), getProfiler(), getEmitter())
            const result = await db.rawQuery('select 1 + 1', [], { mode: 'write' })
            expect(result).toBeDefined();
            await db.manager.closeAll()
        })

        it('pass profiler to query client', async () => {
            const config = {
                connection: 'primary',
                connections: { primary: getConfig() },
            }

            const profiler = getProfiler()
            const db = new Database(config, getLogger(), profiler, getEmitter())
            const client = db.connection('primary')
            expect(client.profiler).toEqual(profiler);
            await db.manager.closeAll()
        })

        it('pass custom profiler to query client', async () => {
            const config = {
                connection: 'primary',
                connections: { primary: getConfig() },
            }

            const profiler = getProfiler()
            const row = profiler.create('scoped')

            const db = new Database(config, getLogger(), profiler, getEmitter())
            const client = db.connection('primary', { profiler: row })
            expect(client.profiler).toEqual(row);
            await db.manager.closeAll()
        })

        it('set hasHealthChecks enabled flag to true, when one ore more connections are using health checks', async () => {
            const config = {
                connection: 'primary',
                connections: {primary: Object.assign({}, getConfig(), {healthCheck: true})},
            }

            const db = new Database(config, getLogger(), getProfiler(), getEmitter())
            expect(db.hasHealthChecksEnabled).toBeTruthy();
            await db.manager.closeAll()
        })
    });

    describe('Database | extend', () => {
        beforeAll(async () => {
            await setup();
        });

        afterAll(async () => {
            await cleanup();
        });

        it('extend database query builder by adding macros', async () => {
            const db = getDb();

            db.DatabaseQueryBuilder.macro('whereActive', function whereActive () {
                this.where('is_active', true)
                return this
            })

            const knexClient = db.connection().getReadClient()

            const { sql, bindings } = db.query().from('users')['whereActive']().toSQL()
            const { sql: knexSql, bindings: knexBindings } = knexClient
                .from('users')
                .where('is_active', true)
                .toSQL()

            expect(sql).toBe(knexSql);
            expect(bindings).toEqual(knexBindings);

            await db.manager.closeAll()
        })

        it('extend insert query builder by adding macros', async () => {
            const db = getDb()

            db.InsertQueryBuilder.macro('returnId', function whereActive () {
                this.returning('id')
                return this
            })

            const knexClient = db.connection().getReadClient()

            const { sql, bindings } = db
                .insertQuery()
                .table('users')['returnId']()
                .insert({ id: 1 })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = knexClient
                .from('users')
                .returning('id')
                .insert({ id: 1 })
                .toSQL()

            expect(sql).toBe(knexSql);
            expect(bindings).toEqual(knexBindings);

            await db.manager.closeAll()
        })
    });

    describe('Database | global transaction', () => {
        let db: DatabaseContract;
        const config = {
            connection: 'primary',
            connections: { primary: getConfig() },
        }
        beforeAll(async () => {
            await setup();
        });

        afterAll(async () => {
            // await cleanup();
        });

        beforeEach(async () => {
            db = new Database(config, getLogger(), getProfiler(), getEmitter());
        });

        afterEach(async () => {
            await db.manager.closeAll();
        });

        it('supports automatically committing', async () => {
            await db.transaction(() => {
                return Promise.resolve();
            });
        });

        it('does not allow queries after commit', async () => {
            const t = await db.transaction();

            await t.rawQuery('SELECT 1+1');

            await t.commit();

            try {
                await t.rawQuery('SELECT 1+1');
            } catch (e) {
                expect(e.message).toBe('Transaction query already complete, run with DEBUG=knex:tx for more info');
            }
        });

        it('does not allow queries immediately after commit call', async () => {
            await db.transaction(async (trx) => {
                await trx.rawQuery('SELECT 1+1');
                await trx.commit();
                try {
                    await trx.rawQuery('SELECT 1+1')
                } catch ({message}) {
                    expect(message).toBe('Transaction query already complete, run with DEBUG=knex:tx for more info');
                };
            });
        });

        it('does not allow queries after rollback', async () => {
            await db.transaction(async (trx) => {
                await db.rawQuery('SELECT 1+1').useTransaction(trx);
                await trx.rollback();
                try {
                    await db.rawQuery('SELECT 1+1').useTransaction(trx)
                } catch ({message}) {
                    expect(message).toBe('Transaction query already complete, run with DEBUG=knex:tx for more info');
                };
            });
        });

        it('supports event `commit` when a transaction is committed', async () => {
            const stack = [];

            await db.transaction(async trx => {
                trx.on('commit', function(t) {
                    stack.push('commit');
                });
                await db.rawQuery('SELECT 1+1').useTransaction(trx);
            });

            expect(stack).toEqual(['commit']);
        });

        it('supports event `rollback` when a transaction is rolled back', async () => {
            const stack = [];

            await db.transaction(async trx => {
                trx.on('rollback', function(t) {
                    stack.push('rollback');
                });
                await db.rawQuery('SELECT 1+1').useTransaction(trx);
                throw new Error('');
            }).catch(() => {});

            expect(stack).toEqual(['rollback']);
        });

        it('supports automatically rolling back with a thrown error', async () => {
            await db.transaction(async (trx) => {
                await db.table('users').insert({ username: 'virk' }).useTransaction(trx);
                throw new Error();
            }).catch(() => {

            })

            const users = await db.from('users');
            expect(users).toHaveLength(0);
        });

        it('supports automatically rolling back with a rejection', async () => {
            await db.transaction(async (trx) => {
                await db.table('users').insert({ username: 'virk' }).useTransaction(trx);
                return Promise.reject(new Error('Swag'));
            }).catch(() => {

            })

            const users = await db.from('users');
            expect(users).toHaveLength(0);
        });

        it('perform queries inside a transaction using `useTransaction`', async () => {
            const trx = await db.transaction();
            await db.table('users').insert({ username: 'virk' }).useTransaction(trx);
            await trx.rollback();

            const users = await db.from('users');
            expect(users).toHaveLength(0);
        });

        test('perform queries inside a transaction', async () => {
            const config = {
                connection: 'primary',
                connections: { primary: getConfig() },
            }

            const db = new Database(config, getLogger(), getProfiler(), getEmitter())
            try {
                await db.transaction(async (trx) => {
                    await db.table('users').insert({ username: 'virk' }).useTransaction(trx);
                    throw new Error('rollback');
                })
            } catch (e) {
                expect(e.message).toEqual('rollback');
            }

            const users = await db.from('users');
            expect(users).toHaveLength(0);

            await db.manager.closeAll()
        })

        it('create transactions inside a transaction', async () => {
            const trx1 = await db.transaction()
            await trx1.table('users').insert({ username: 'virk2' })

            const trx2 = await trx1.transaction()
            await trx2.table('users').insert({ username: 'virk' })
            await trx2.commit();

            await trx1.rollback();

            const users = await db.from('users');
            expect(users).toHaveLength(0);
            // expect(db.connectionGlobalTransactions.size).toBe(0);
            // await db.manager.closeAll()
        })

        // test('multiple calls to beginGlobalTransaction must be a noop', async () => {
        //     const config = {
        //         connection: 'primary',
        //         connections: { primary: getConfig() },
        //     }
        //
        //     const db = new Database(config, getLogger(), getProfiler(), getEmitter());
        //
        //     // await db.beginGlobalTransaction()
        //     // await db.beginGlobalTransaction()
        //     // await db.beginGlobalTransaction()
        //
        //     await db.table('users').insert({ username: 'virk' })
        //
        //     // await db.rollbackGlobalTransaction()
        //
        //     const users = await db.from('users')
        //     expect(users).toHaveLength(0);
        //     expect(db.connectionGlobalTransactions.size).toBe(0);
        //
        //     await db.manager.closeAll()
        // })
    });
})
