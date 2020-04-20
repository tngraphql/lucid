/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/9/2020
 * Time: 10:07 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Connection } from '../../src/Connection/Connection';
import { ConnectionManager } from '../../src/Connection/ConnectionManager';
import { cleanup, getConfig, getEmitter, getLogger, mapToObj, setup } from '../helpers';

describe('connection-manager', () => {
    beforeAll(async () => {
        await setup();
    });

    afterAll(async () => {
        await cleanup();
    });

    test('do not connect until connect is called', async () => {
        const manager = new ConnectionManager(getLogger(), getEmitter())
        manager.add('primary', getConfig())

        expect(manager.has('primary')).toBeTruthy();
        expect(manager.isConnected('primary')).toBeFalsy();
        await manager.closeAll()
    })

    test('connect and set its state to open', async () => {
        const manager = new ConnectionManager(getLogger(), getEmitter())
        manager.add('primary', getConfig())
        manager.connect('primary')

        expect(manager.get('primary').state).toBe('open');
        expect(manager.isConnected('primary')).toBeTruthy();
        await manager.closeAll()
    })

    test('on disconnect set state to closed', async () => {
        const manager = new ConnectionManager(getLogger(), getEmitter())
        manager.add('primary', getConfig())
        manager.connect('primary')

        await manager.connections.get('primary')!.connection!.disconnect()
        expect(manager.get('primary').state).toBe('closed');
        expect(manager.isConnected('primary')).toBeFalsy();
        await manager.closeAll()
    })

    test('add duplicate connection must be a noop', async () => {
        const manager = new ConnectionManager(getLogger(), getEmitter())
        manager.add('primary', getConfig())
        manager.connect('primary')

        manager.add('primary', Object.assign({}, getConfig(), { client: 'foo' }))

        expect(manager.get('primary')!.config.client).not.toBe('foo');
        await manager.closeAll()
    })

    test('patch config when connection is not in open state', async () => {
        const manager = new ConnectionManager(getLogger(), getEmitter())
        manager.add('primary', getConfig())
        manager.connect('primary')

        await manager.close('primary')

        const fn = () => manager.add('primary', getConfig())
        expect(fn).not.toThrow();
        await manager.closeAll()
    })

    test('ignore multiple calls to `connect` on a single connection', (done) => {
        const emitter = getEmitter()
        let counter = 0

        const manager = new ConnectionManager(getLogger(), emitter)
        manager.add('primary', getConfig())

        emitter.on('db:connection:connect', () => {
            counter++
            if ( counter > 1 ) {
                throw new Error('Never expected to be called')
            }
            done()
        })

        manager.connect('primary')
        manager.connect('primary')
        manager.closeAll()
    })

    test('releasing a connection must close it first', async () => {
        expect.assertions(2);

        const emitter = getEmitter()

        const manager = new ConnectionManager(getLogger(), emitter)
        manager.add('primary', getConfig())
        manager.connect('primary')

        emitter.on('db:connection:disconnect', (connection) => {
            expect(connection.name).toBe('primary');
        })

        await manager.release('primary')
        expect(manager.has('primary')).toBeFalsy();
    })

    test('proxy error event', (done) => {
        expect.assertions(3);

        const emitter = getEmitter()
        const manager = new ConnectionManager(getLogger(), emitter)
        manager.add('primary', Object.assign({}, getConfig(), { client: null }))

        emitter.on('db:connection:error', async ([{ message }, connection]) => {
            try {
                expect(message).toBe('knex: Required configuration option \'client\' is missing.');
                expect(connection).toBeInstanceOf(Connection);
                await manager.closeAll()
                done()
            } catch (error) {
                await manager.closeAll()
                done(error)
            }
        })

        const fn = () => manager.connect('primary')
        expect(fn).toThrow(/knex: Required configuration option/);
    })

    test('patching the connection config must close old and create a new connection', (done) => {
        expect.assertions(6);

        let connections: any[] = []

        const emitter = getEmitter()
        const manager = new ConnectionManager(getLogger(), emitter)
        manager.add('primary', getConfig())

        emitter.on('db:connection:disconnect', async (connection) => {
            try {
                if ( connections.length === 2 ) {
                    expect(connection).toEqual(connections[0]);
                    expect(manager['orphanConnections'].size).toBe(0);
                    expect(mapToObj(manager.connections)).toEqual({
                        primary: {
                            config: connection.config,
                            name: 'primary',
                            state: 'open',
                            connection: connections[1]
                        }
                    })

                    done();
                }
            } catch (error) {
                done(error)
            }
        })

        emitter.on('db:connection:connect', (connection) => {
            expect(connection).toBeInstanceOf(Connection);
            if ( connections.length ) {
                expect(connection[0]).not.toEqual(connection);
            }

            connections.push(connection)
        })

        manager.connect('primary')

        /**
         * Patching will trigger disconnect and a new connect
         */
        manager.patch('primary', getConfig())
        manager.connect('primary')
    })

    test('get health check report for connections that has enabled health checks', async () => {
        const manager = new ConnectionManager(getLogger(), getEmitter())
        manager.add('primary', Object.assign({}, getConfig(), { healthCheck: true }))
        manager.add('secondary', Object.assign({}, getConfig(), { healthCheck: true }))
        manager.add('secondary-copy', Object.assign({}, getConfig(), { healthCheck: false }))

        const report = await manager.report()
        expect(report.health.healthy).toBeTruthy();
        expect(report.health.message).toBe('All connections are healthy');
        expect(report.meta).toHaveLength(2);
        expect(report.meta.map(({ connection }) => connection)).toEqual(['primary', 'secondary']);
    })

    test('get health check report when one of the connection is unhealthy', async () => {
        const manager = new ConnectionManager(getLogger(), getEmitter())
        manager.add('primary', Object.assign({}, getConfig(), { healthCheck: true }))
        manager.add('secondary', Object.assign({}, getConfig(), {
            healthCheck: true,
            connection: { host: 'bad-host' }
        }))
        manager.add('secondary-copy', Object.assign({}, getConfig(), { healthCheck: false }))

        const report = await manager.report()
        expect(report.health.healthy).toBeFalsy();
        expect(report.health.message).toBe('One or more connections are not healthy');
        expect(report.meta).toHaveLength(2);
        expect(report.meta.map(({ connection }) => connection)).toEqual(['primary', 'secondary']);
    }, 10000)
})
