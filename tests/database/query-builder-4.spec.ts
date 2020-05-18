/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 5/18/2020
 * Time: 12:51 PM
 */
import { Connection } from '../../src/Connection/Connection';
import {
    cleanup,
    getBaseModel,
    getConfig,
    getDb,
    getLogger,
    getEmitter,
    getQueryBuilder,
    getQueryClient,
    resetTables,
    setup
} from '../helpers';

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Query Builder | event', () => {
    beforeAll(async () => {
        await setup()
    })

    afterAll(async () => {
        await cleanup()
    })

    afterEach(async () => {
        await resetTables()
    })

    test('emit db:query event when debug globally enabled', async (done) => {
        expect.assertions(4);

        const config = Object.assign({}, getConfig(), { debug: true })
        const emitter = getEmitter()

        const connection = new Connection('primary', config, getLogger())
        connection.connect()

        let db = getQueryBuilder(getQueryClient(connection, 'dual', emitter))
        emitter.on('db:query', (query) => {
            expect(query).toHaveProperty('sql');
            expect(query).toHaveProperty('inTransaction');
            expect(query).toHaveProperty('duration');
            expect(query.connection).toBe('primary');
            done()
        })

        await db.select('*').from('users')
        await connection.disconnect()
    })

    test('do not emit db:query event when debug not enabled', async () => {
        const config = Object.assign({}, getConfig(), { debug: false })
        const emitter = getEmitter()

        const connection = new Connection('primary', config, getLogger())
        connection.connect()

        let db = getQueryBuilder(getQueryClient(connection, 'dual', emitter))
        emitter.on('db:query', () => {
            throw new Error('Never expected to reach here')
        })

        await db.select('*').from('users')
        await connection.disconnect()
    })

    test('emit db:query event when enabled on a single query', async (done) => {
        expect.assertions(4);
        const config = Object.assign({}, getConfig(), { debug: false })
        const emitter = getEmitter()

        const connection = new Connection('primary', config, getLogger())
        connection.connect()

        let db = getQueryBuilder(getQueryClient(connection, 'dual', emitter))
        emitter.on('db:query', (query) => {
            expect(query).toHaveProperty('sql');
            expect(query).toHaveProperty('inTransaction');
            expect(query).toHaveProperty('duration');
            expect(query.connection).toBe('primary');
            done()
        })

        await db.select('*').from('users').debug(true)
        await connection.disconnect()
    })
})