/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 8:42 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import {Connection} from '../../src/Connection/Connection';
import {QueryClient} from '../../src/QueryClient/QueryClient';
import {TransactionClient} from '../../src/TransactionClient/TransactionClient';
import {cleanup, getConfig, getEmitter, getLogger, getProfiler, hasMysql, resetTables, setup} from '../helpers';
import {QueryClientContract} from "../../src/Contracts/Database/QueryClientContract";
import {ISOLATION_LEVELS} from "../../src/Database/customTransaction";
import {RawBuilder} from "../../src/Database/StaticBuilder/RawBuilder";
import {ReferenceBuilder} from "../../src/Database/StaticBuilder/ReferenceBuilder";
import {resolveClientNameWithAliases} from 'knex/lib/helpers'

const delay = require('delay')

describe('Transaction | query | ' + process.env.DB, () => {
    beforeAll(async () => {
        await setup()
    })

    afterAll(async () => {
        await cleanup()
    })

    afterEach(async () => {
        await resetTables()
    })

    it('returns the read client', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter()).transaction();

        expect(db.knexClient).toBe(db.getReadClient());
        await db.commit();

        await connection.disconnect()
    });

    it('Truncate tables inside a transaction', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter());

        const trx = await db.transaction();
        await trx.table('users').insert({username: 'job'});
        await trx.truncate('users', true);

        await trx.commit();

        expect(await db.from('users')).toHaveLength(0);
        await connection.disconnect()
    });

    it('get all table names', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter());

        const trx = await db.transaction();

        const tables = await trx.getAllTables(['public'])
        if (!hasMysql(process.env.DB)) {
            expect(tables).toEqual([
                'comments',
                'countries',
                'friends',
                'identities',
                'posts',
                'profiles',
                'skill_user',
                'skills',
                "taggables",
                "tags",
                'users'
            ])
        } else {
            expect(tables).toEqual([
                'comments',
                'countries',
                'friends',
                'identities',
                'posts',
                'profiles',
                'skills',
                'skill_user',
                "taggables",
                "tags",
                'users'
            ])
        }

        await trx.commit();
        await connection.disconnect()
    });

    it('Get columns info', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter());

        const trx = await db.transaction();

        const column = await trx.columnsInfo('users');

        expect(Object.keys(column)).toEqual([
            'id',
            'country_id',
            'is_active',
            'username',
            'email',
            'points',
            'joined_at',
            'created_at',
            'updated_at'
        ])

        await trx.commit();
        await connection.disconnect()
    });

    it('get single column info', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter());

        const trx = await db.transaction();

        const column = await trx.columnsInfo('users', 'id');

        expect(['integer', 'int'].includes(column.type)).toBeTruthy();

        await trx.commit();
        await connection.disconnect()
    });

    it('Returns the Knex raw query builder instance', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter());

        const trx = await db.transaction();

        await trx.table('users').insert({username: 'job'});

        const res = await trx.knexRawQuery("SELECT * FROM users");

        expect(res).toBeDefined();

        await trx.commit();
        await connection.disconnect()
    });

    it('Returns an instance of raw builder', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter());

        const trx = await db.transaction();

        const res = await trx.raw("SELECT 1+1");

        expect(res).toEqual(new RawBuilder("SELECT 1+1"));

        await trx.commit();
        await connection.disconnect()
    });

    it('Returns reference builder.', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter());

        const trx = await db.transaction();

        const res = await trx.ref("name");

        expect(res).toEqual(new ReferenceBuilder("name"));

        await trx.commit();
        await connection.disconnect()
    });

    if (!['sqlite', 'mssql'].includes(process.env.DB as string)) {
        describe('advisory locks', () => {
            it('get advisory lock', async () => {
                const connection = new Connection('primary', getConfig(), getLogger())
                connection.connect()

                const db = await new QueryClient('dual', connection, getEmitter());

                const trx = await db.transaction();

                const lock = await trx.getAdvisoryLock(1)

                expect(lock).toBeTruthy()
                expect(trx.dialect.name).toBe(resolveClientNameWithAliases(connection.config.client))

                await trx.releaseAdvisoryLock(1)

                await trx.commit();
                await connection.disconnect()
            });

            it('release advisory lock', async () => {
                const connection = new Connection('primary', getConfig(), getLogger())
                connection.connect()

                const db = await new QueryClient('dual', connection, getEmitter());

                const trx = await db.transaction();

                if (trx.dialect.name === 'sqlite3') {
                    await connection.disconnect()
                    return
                }

                await trx.getAdvisoryLock(1)
                const released = await trx.releaseAdvisoryLock(1)
                expect(released).toBeTruthy()

                await trx.commit();
                await connection.disconnect()
            });
        });
    }

    it('perform select query under a transaction', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter()).transaction()
        const results = await db.query().from('users')
        await db.commit()

        expect(Array.isArray(results)).toBeTruthy();
        expect(results).toHaveLength(0)

        await connection.disconnect()
    })

    it('commit insert', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter()).transaction()
        await db.insertQuery().table('users').insert({username: 'virk'})
        await db.commit()

        const results = await new QueryClient('dual', connection, getEmitter()).query().from('users')
        expect(Array.isArray(results)).toBeTruthy();
        expect(results).toHaveLength(1)
        expect(results[0].username).toBe('virk')

        await connection.disconnect()
    })

    it('rollback insert', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter()).transaction()
        await db.insertQuery().table('users').insert({username: 'virk'})
        await db.rollback()

        const results = await new QueryClient('dual', connection, getEmitter()).query().from('users')
        expect(Array.isArray(results)).toBeTruthy();
        expect(results).toHaveLength(0)

        await connection.disconnect()
    })

    it('perform nested transactions with save points', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        /**
         * Transaction 1
         */
        const db = await new QueryClient('dual', connection, getEmitter()).transaction()
        await db.insertQuery().table('users').insert({username: 'virk'})

        /**
         * Transaction 2: Save point
         */
        const db1 = await db.transaction()
        await db1.insertQuery().table('users').insert({username: 'nikk'})

        /**
         * Rollback 2
         */
        await db1.rollback()

        /**
         * Commit first
         */
        await db.commit()

        const results = await new QueryClient('dual', connection, getEmitter()).query().from('users')
        expect(Array.isArray(results)).toBeTruthy();
        expect(results).toHaveLength(1)
        expect(results[0].username).toBe('virk')

        await connection.disconnect()
    })

    it('emit after commit event', async () => {
        const stack: string[] = []
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter()).transaction()

        db.on('commit', (trx) => {
            stack.push('commit')
            expect(trx).toBeInstanceOf(TransactionClient)
        })

        await db.insertQuery().table('users').insert({username: 'virk'})
        await db.commit()

        expect(db.listenerCount('commit')).toEqual(0)
        expect(db.listenerCount('rollback')).toEqual(0)
        expect(stack).toEqual(['commit'])

        await connection.disconnect()
    })

    it('execute before and after rollback hooks', async () => {
        const stack: string[] = []
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = await new QueryClient('dual', connection, getEmitter()).transaction()

        db.on('rollback', (trx) => {
            stack.push('rollback')
            expect(trx).toBeInstanceOf(TransactionClient)
        })

        await db.insertQuery().table('users').insert({username: 'virk'})
        await db.rollback()
        expect(db.listenerCount('commit')).toEqual(0)
        expect(db.listenerCount('rollback')).toEqual(0)
        expect(stack).toEqual(['rollback'])

        await connection.disconnect()
    })

    it('commit insert inside a self managed transaction', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        await new QueryClient('dual', connection, getEmitter()).transaction(async (db) => {
            await db.insertQuery().table('users').insert({username: 'virk'})
        })

        const results = await new QueryClient('dual', connection, getEmitter()).query().from('users')
        expect(Array.isArray(results)).toBeTruthy();
        expect(results).toHaveLength(1)
        expect(results[0].username).toBe('virk')

        await connection.disconnect()
    })

    it('rollback insert inside a self managed transaction', async () => {
        expect.assertions(3)

        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        try {
            await new QueryClient('dual', connection, getEmitter()).transaction(async (db) => {
                await db.insertQuery().table('users').insert({username: 'virk'})
                throw new Error('should rollback')
            })
        } catch (error) {
            expect(error.message).toBe('should rollback')
        }

        const results = await new QueryClient('dual', connection, getEmitter()).query().from('users')
        expect(Array.isArray(results)).toBeTruthy();
        expect(results).toHaveLength(0)

        await connection.disconnect()
    })

    it('perform nested managed transactions', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        /**
         * Transaction 1
         */
        await new QueryClient('dual', connection, getEmitter()).transaction(async (db) => {
            await db.insertQuery().table('users').insert({username: 'virk'})

            /**
             * Transaction 2: Save point
             */
            await db.transaction(async (db1) => {
                await db1.insertQuery().table('users').insert({username: 'nikk'})

                /**
                 * Manual callback, should work fine
                 */
                await db1.rollback()
            })
        })

        const results = await new QueryClient('dual', connection, getEmitter()).query().from('users')
        expect(Array.isArray(results)).toBeTruthy();
        expect(results).toHaveLength(1)
        expect(results[0].username).toBe('virk')

        await connection.disconnect()
    })

    it('nest transaction queries inside profiler row', async () => {
        const stack: { id: string, parentId: string | undefined, label: string, data: any }[] = []
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const profiler = getProfiler(true)
        const client = new QueryClient('dual', connection, getEmitter())
        client.profiler = profiler

        profiler.process((log) => {
            stack.push({id: log['id'], parentId: log.parent_id, label: log.label, data: log.data})
        })

        const db = await client.transaction()
        await db.insertQuery().table('users').insert({username: 'virk'})
        await db.commit()

        expect(stack).toHaveLength(2)
        expect(stack[0].label).toBe('db:query')
        expect(stack[1].label).toBe('trx:begin')
        expect(stack[0].parentId).toBe(stack[1].id)
        expect(stack[1].data).toEqual({state: 'commit'})

        await connection.disconnect()
    })

    it('nest save points queries inside profiler row', async () => {
        const stack: { id: string, parentId: string | undefined, label: string, data: any }[] = []
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const profiler = getProfiler(true)
        const client = new QueryClient('dual', connection, getEmitter())
        client.profiler = profiler

        profiler.process((log) => {
            stack.push({id: log['id'], parentId: log.parent_id, label: log.label, data: log.data})
        })

        const db = await client.transaction()
        const nested = await db.transaction()
        await nested.insertQuery().table('users').insert({username: 'virk'})
        await nested.rollback()
        await db.commit()

        expect(stack).toHaveLength(3)
        expect(stack[0].label).toBe('db:query')
        expect(stack[1].label).toBe('trx:begin')
        expect(stack[2].label).toBe('trx:begin')
        expect(stack[0].parentId).toBe(stack[1].id)
        expect(stack[1].data).toEqual({state: 'rollback'})
        expect(stack[2].data).toEqual({state: 'commit'})
        expect(stack[1].parentId).toBe(stack[2].id)

        await connection.disconnect()
    })

    it('nest transaction queries inside managed transaction', async () => {
        const stack: { id: string, parentId: string | undefined, label: string, data: any }[] = []
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const profiler = getProfiler(true)
        const client = new QueryClient('dual', connection, getEmitter())
        client.profiler = profiler

        profiler.process((log) => {
            stack.push({id: log['id'], parentId: log.parent_id, label: log.label, data: log.data})
        })

        await client.transaction(async (db) => {
            await db.insertQuery().table('users').insert({username: 'virk'})
        })

        expect(stack).toHaveLength(2)
        expect(stack[0].label).toBe('db:query')
        expect(stack[1].label).toBe('trx:begin')
        expect(stack[0].parentId).toBe(stack[1].id)
        expect(stack[1].data).toEqual({state: 'commit'})

        await connection.disconnect()
    });

    it('should set isolation level correctly', async () => {
        const stack = [];
        const expectations = {
            all: [
                'SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;',
                'BEGIN;',
                'COMMIT;'
            ],
            pg: [
                'BEGIN;',
                'SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;',
                'COMMIT;',
            ],
            sqlite: [
                'BEGIN;',
                'PRAGMA read_uncommitted = ON;',
                'COMMIT;'
            ],
            mssql: [
                'BEGIN;',
                'COMMIT;'
            ]
        };

        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = new QueryClient('dual', connection, getEmitter());

        db.getWriteClient().on('query', args => {
            stack.push(args);
        });


        await db.transaction({isolationLevel: ISOLATION_LEVELS.READ_UNCOMMITTED}, async (trx) => {
        });

        const dialect = process.env.DB;

        expect(stack.map(arg => arg.sql)).toEqual(expectations[dialect] || expectations.all);

        await connection.disconnect()
    });

    if (!['sqlite'].includes(process.env.DB)) {
        it('should read the most recent committed rows when using the READ COMMITTED isolation level', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect();

            const db = new QueryClient('dual', connection, getEmitter());

            await db.transaction({isolationLevel: ISOLATION_LEVELS.READ_COMMITTED}, async (trx) => {
                expect(await trx.from('users')).toHaveLength(0);

                // Create a User outside of the transaction
                await db.table('users').insert({username: 'jan'});

                // We SHOULD see the created user inside the transaction
                expect(await trx.from('users')).toHaveLength(1);
            });
            await connection.disconnect()
        });
    }

    if (!['sqlite', 'mssql'].includes(process.env.DB)) {
        it('should not read newly committed rows when using the REPEATABLE READ isolation level', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const db: QueryClientContract = new QueryClient('dual', connection, getEmitter());

            await db.transaction({isolationLevel: ISOLATION_LEVELS.REPEATABLE_READ}, async (trx) => {
                expect(await db.from('users').useTransaction(trx)).toHaveLength(0);

                // Create a User outside of the transaction
                await db.table('users').insert({username: 'nguyen'});

                // We SHOULD NOT see the created user inside the transaction
                expect(await db.from('users').useTransaction(trx)).toHaveLength(0);
            });

            await connection.disconnect()
        });
    }

    if (!['sqlite', 'pg', 'mssql'].includes(process.env.DB)) {
        it('should block updates after reading a row using SERIALIZABLE', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect();
            const transactionSpy = jest.fn();

            const db: QueryClientContract = new QueryClient('dual', connection, getEmitter());

            await db.table('users').insert({
                username: 'jan'
            });

            await db.transaction({
                isolationLevel: ISOLATION_LEVELS.SERIALIZABLE
            }, async (transaction) => {
                await db.from('users').useTransaction(transaction);

                await Promise.all([
                    db.from('users')
                        .update({
                            username: 'nguyen'
                        })
                        .where('username', 'jan')
                        .then(() => {
                            expect(transactionSpy).toHaveBeenCalled();
                        }),
                    delay(2000)
                        .then(_ => transaction.commit())
                        .then(transactionSpy)
                ]);
            });

            await connection.disconnect()
        });
    }

    it('works even if a transaction: null option is passed', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = new QueryClient('dual', connection, getEmitter());

        await db.transaction({transaction: null})
            .then(t => {
                t.commit()
            });

        await connection.disconnect()
    });

    it('works even if a transaction: undefined option is passed', async () => {
        const connection = new Connection('primary', getConfig(), getLogger())
        connection.connect()

        const db = new QueryClient('dual', connection, getEmitter());

        await db.transaction({transaction: undefined})
            .then(t => {
                t.commit()
            });
        await connection.disconnect()
    });
});
