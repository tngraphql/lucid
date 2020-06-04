/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/9/2020
 * Time: 8:59 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Connection } from '../../src/Connection/Connection';
import {cleanup, getConfig, getLogger, hasMysql, resetTables, setup} from '../helpers';

describe('connection', () => {

    if ( process.env.DB !== 'sqlite' ) {
        describe('Connection | Config', () => {
            beforeAll(async () => {
                await setup();
            });

            afterAll(async () => {
                await cleanup();
            });

            it('get write config by merging values from connection', async () => {
                const config: any = getConfig();
                config.replicas! = {
                    write: {
                        connection: {
                            host: '10.0.0.1'
                        }
                    },
                    read: {
                        connection: [{
                            host: '10.0.0.1'
                        }]
                    }
                };

                const connection = new Connection('primary', config, getLogger());
                const writeConfig = connection['getWriteConfig']();

                expect(writeConfig.client).toBe(config.client);
                expect(writeConfig.connection['host']).toBe('10.0.0.1');
            });

            it('get read config by merging values from connection', async () => {
                const config = getConfig()
                config.replicas! = {
                    write: {
                        connection: {
                            host: '10.0.0.1'
                        }
                    },
                    read: {
                        connection: [{
                            host: '10.0.0.1'
                        }]
                    }
                }

                const connection = new Connection('primary', config, getLogger())
                const readConfig = connection['getReadConfig']()

                expect(readConfig.client).toBe(config.client);

                if ( process.env.DB === 'mssql' ) {
                    expect(readConfig.connection).toEqual({ database: 'master' });
                } else {
                    expect(readConfig.connection).toEqual({ database: process.env.DB_NAME });
                }
            });
        });
    }

    describe('Connection | setup', () => {
        beforeAll(async () => {
            await setup();
        });

        afterAll(async () => {
            await cleanup();
        });

        afterAll(async () => {
            await resetTables()
        });

        it('do not instantiate knex unless connect is called', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())

            expect(connection.client).toBeUndefined();
        });

        it('instantiate knex when connect is invoked', (done) => {
            expect.assertions(2);
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.on('connect', async () => {
                expect(connection.client).toBeDefined();
                expect(connection.pool.numUsed()).toBe(0);
                await connection.disconnect();
                done();
            });

            connection.connect();
        });

        it('on disconnect destroy knex', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()
            await connection.disconnect()

            expect(connection.client).toBeUndefined();
            expect(connection['_readClient']).toBeUndefined();
        });

        it('on disconnect emit disconnect event', (done) => {
            expect.assertions(1);
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            connection.on('disconnect', () => {
                expect(connection.client).toBeUndefined();
                done()
            })

            connection.disconnect()
        });

        it('raise error when unable to make connection', (done) => {
            expect.assertions(2);
            const connection = new Connection(
                'primary',
                Object.assign({}, getConfig(), { client: null }),
                getLogger()
            )

            connection.on('error', ({ message }) => {
                try {
                    expect(message).toBe('knex: Required configuration option \'client\' is missing.');
                    done()
                } catch (error) {
                    done(error)
                }
            })

            const fn = () => connection.connect()
            expect(fn).toThrow(/knex: Required configuration option/)
        });

        if ( process.env.DB === 'mysql' ) {
            it('pass user config to mysql driver', async () => {
                const config: any = getConfig()
                config.connection!.charset = 'utf-8'
                config.connection!.typeCast = false

                const connection = new Connection('primary', config, getLogger())
                await connection.connect()

                expect(connection.client['context'].client.constructor.name).toBe('Client_MySQL');
                expect(connection.client['context'].client.config.connection.charset).toBe('utf-8');
                expect(connection.client['context'].client.config.connection.typeCast).toBe(false);
                await connection.disconnect()
            });
        }
        if ( process.env.DB === 'mysql2' ) {
            it('pass user config to mysql driver', async () => {
                const config: any = getConfig()
                config.connection!.charset = 'utf-8'
                config.connection!.typeCast = false

                const connection = new Connection('primary', config, getLogger())
                await connection.connect()

                expect(connection.client['context'].client.constructor.name).toBe('Client_MySQL2');
                expect(connection.client['context'].client.config.connection.charset).toBe('utf-8');
                expect(connection.client['context'].client.config.connection.typeCast).toBe(false);
                await connection.disconnect()
            });
        }


        // it('test', async () => {
        //     const config = getConfig()
        //     config.connection!.charset = 'utf8'
        //     config.connection!.typeCast = false
        //
        //     // const config: any = getConfig();
        //     config.replicas! = {
        //         write: {
        //             connection: {
        //                 host: 'localhost',
        //             },
        //         },
        //         read: {
        //             connection: [{
        //                 host: 'localhost',
        //             }],
        //         },
        //     };
        //
        //     const connection = new Connection('primary', config, getLogger())
        //     await connection.connect();
        //
        //     console.log(await connection.readClient.select().table('users'));
        //     // console.log(await connection.client.select().table('users'));
        // }, 15000);
    });

    describe('Health Checks', () => {
        beforeAll(async () => {
            await setup();
        });

        afterAll(async () => {
            await cleanup();
        });

        it('get healthcheck report for healthy connection', async () => {
            const connection = new Connection('primary', getConfig(), getLogger())
            connection.connect()

            const report = await connection.getReport()

            expect(report).toEqual({
                connection: 'primary',
                message: 'Connection is healthy',
                error: null
            });

            await connection.disconnect()
        });

        if ( process.env.DB !== 'sqlite' ) {
            it('get healthcheck report for un-healthy connection', async () => {
                const connection = new Connection('primary', Object.assign({}, getConfig(), {
                    connection: {
                        host: 'bad-host'
                    }
                }), getLogger())
                connection.connect()

                const report = await connection.getReport()
                expect(report.message).toBe('Unable to reach the database server');
                expect(report.error).toBeDefined();

                await connection.disconnect()
            }, 15000);

            it('get healthcheck report for un-healthy read host', async () => {
                const connection = new Connection('primary', Object.assign({}, getConfig(), {
                    replicas: {
                        write: {
                            connection: getConfig().connection
                        },
                        read: {
                            connection: [
                                getConfig().connection,
                                Object.assign({}, getConfig().connection, { host: 'bad-host' })
                            ]
                        }
                    }
                }), getLogger())
                connection.connect()

                const report = await connection.getReport()
                expect(report.message).toBe('Unable to reach one of the read hosts');
                expect(report.error).toBeDefined();

                await connection.disconnect()
            }, 15000);
        }
    });
})
