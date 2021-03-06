/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/9/2020
 * Time: 8:59 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import { FakeLogger as Logger } from '@adonisjs/logger/build/standalone'
import { Profiler } from '@adonisjs/profiler/build/standalone'
import { Filesystem } from '@poppinss/dev-utils'
import { Application } from '@tngraphql/illuminate';
import { ApplicationContract } from '@tngraphql/illuminate/dist/Contracts/ApplicationContract';
import { EventServiceProvider } from '@tngraphql/illuminate/dist/Foundation/Events/EventServiceProvider';
import { Chance } from 'chance'
import * as dotenv from 'dotenv'
import * as knex from 'knex';
import { join } from 'path'
import { ConnectionContract } from '../src/Contracts/Connection/ConnectionContract';
import { ConnectionConfig } from '../src/Contracts/Connection/types';
import { DatabaseContract } from '../src/Contracts/Database/DatabaseContract';
import { DatabaseQueryBuilderContract } from '../src/Contracts/Database/DatabaseQueryBuilderContract';
import { InsertQueryBuilderContract } from '../src/Contracts/Database/InsertQueryBuilderContract';
import { QueryClientContract } from '../src/Contracts/Database/QueryClientContract';
import { RawQueryBuilderContract } from '../src/Contracts/Database/RawQueryBuilderContract';
import { MigratorContract, MigratorOptions } from '../src/Contracts/MigratorContract';
import { LucidModel } from '../src/Contracts/Model/LucidModel';
import { LucidRow } from '../src/Contracts/Model/LucidRow';
import { AdapterContract } from '../src/Contracts/Orm/AdapterContract';
import { SchemaConstructorContract } from '../src/Contracts/SchemaConstructorContract';
import { Database } from '../src/Database/Database';
import { DatabaseQueryBuilder } from '../src/Database/QueryBuilder/DatabaseQueryBuilder';
import { InsertQueryBuilder } from '../src/Database/QueryBuilder/InsertQueryBuilder';
import { RawQueryBuilder } from '../src/Database/QueryBuilder/RawQueryBuilder';
import { Migrator } from '../src/Migrator/Migrator';
import { Adapter } from '../src/Orm/Adapter/Adapter';
import { BaseModel } from '../src/Orm/BaseModel/BaseModel';
import { QueryClient } from '../src/QueryClient/QueryClient';
import { Schema } from '../src/Schema';
import { Emitter } from '@adonisjs/events/build/standalone'

export const fs = new Filesystem(join(__dirname, 'tmp'))
dotenv.config()

/**
 * Returns config based upon DB set in environment variables
 */
export function getConfig(): ConnectionConfig {
    switch (process.env.DB) {
    case 'sqlite':
        return {
            client: 'sqlite',
            connection: {
                filename: join(fs.basePath, 'db.sqlite')
            },
            useNullAsDefault: true,
            debug: false
        }
    case 'mysql':
        return {
            client: 'mysql',
            connection: {
                host: process.env.MYSQL_HOST as string,
                port: Number(process.env.MYSQL_PORT),
                database: process.env.DB_NAME as string,
                user: process.env.MYSQL_USER as string,
                password: process.env.MYSQL_PASSWORD as string
            },
            useNullAsDefault: true
        }
    case 'mysql2':
            return {
                client: 'mysql2',
                connection: {
                    host: process.env.MYSQL_HOST as string,
                    port: Number(process.env.MYSQL_PORT),
                    database: process.env.DB_NAME as string,
                    user: process.env.MYSQL_USER as string,
                    password: process.env.MYSQL_PASSWORD as string
                },
                useNullAsDefault: true
            }
    case 'pg':
        return {
            client: 'pg',
            connection: {
                host: process.env.PG_HOST as string,
                port: Number(process.env.PG_PORT),
                database: process.env.DB_NAME as string,
                user: process.env.PG_USER as string,
                password: process.env.PG_PASSWORD as string
            },
            useNullAsDefault: true
        }
    case 'mssql':
        return {
            client: 'mssql',
            connection: {
                user: process.env.MSSQL_USER as string,
                server: process.env.MSSQL_SERVER as string,
                password: process.env.MSSQL_PASSWORD as string,
                database: 'master',
                // options: {
                //     enableArithAbort: true
                // }
            },
            pool: {
                min: 0,
                idleTimeoutMillis: 300
            }
        }
    default:
        throw new Error(`Missing test config for ${ process.env.DB } connection`)
    }
}

export function hasMysql(db: string) {
    return ['mysql', 'mysql2'].includes(db);
}

/**
 * Does base setup by creating databases
 */
export async function setup(destroyDb: boolean = true) {
    if ( process.env.DB === 'sqlite' ) {
        await fs.ensureRoot()
    }

    const db = knex(Object.assign({}, getConfig(), { debug: false }))

    const hasUsersTable = await db.schema.hasTable('users')
    if ( ! hasUsersTable ) {
        await db.schema.createTable('users', (table) => {
            table.increments()
            table.integer('country_id')
            table.integer('is_active')
            table.string('username', 100).unique()
            table.string('email', 100).unique()
            table.integer('points').defaultTo(0)
            table.dateTime('joined_at', { useTz: process.env.DB === 'mssql' })
            table.timestamp('created_at').defaultTo(db.fn.now())
            table.timestamp('updated_at').nullable()
        })
    }

    const hasFriendsTable = await db.schema.hasTable('friends')
    if ( ! hasFriendsTable ) {
        await db.schema.createTable('friends', (table) => {
            table.increments()
            table.string('username', 100).unique()
            table.string('display_name', 100)
            table.timestamp('deleted_at').nullable()
            table.timestamps()
        })
    }

    const hasCountriesTable = await db.schema.hasTable('countries')
    if ( ! hasCountriesTable ) {
        await db.schema.createTable('countries', (table) => {
            table.increments()
            table.string('name')
            table.timestamps()
        })
    }

    const hasSkillsTable = await db.schema.hasTable('skills')
    if ( ! hasSkillsTable ) {
        await db.schema.createTable('skills', (table) => {
            table.increments()
            table.string('name').notNullable()
            table.integer('is_active').nullable()
            table.timestamps()
        })
    }

    const hasUserSkillsTable = await db.schema.hasTable('skill_user')
    if ( ! hasUserSkillsTable ) {
        await db.schema.createTable('skill_user', (table) => {
            table.increments()
            table.integer('user_id')
            table.integer('skill_id')
            table.string('proficiency')
            table.timestamps()
        })
    }

    const hasPostsTable = await db.schema.hasTable('posts')
    if ( ! hasPostsTable ) {
        await db.schema.createTable('posts', (table) => {
            table.increments()
            table.integer('user_id')
            table.string('title').notNullable()
            table.timestamps()
        })
    }

    const hasTagsTable = await db.schema.hasTable('tags')
    if ( ! hasTagsTable ) {
        await db.schema.createTable('tags', (table) => {
            table.increments()
            table.string('name').notNullable()
            table.timestamps()
        })
    }
    const hasTagablesTable = await db.schema.hasTable('taggables')
    if ( ! hasTagablesTable ) {
        await db.schema.createTable('taggables', (table) => {
            table.increments()
            table.integer('tag_id')
            table.integer('taggable_id')
            table.string('taggable_type').notNullable()
            table.string('proficiency')
            table.timestamps()
        })
    }

    const hasComments = await db.schema.hasTable('comments')
    if ( ! hasComments ) {
        await db.schema.createTable('comments', (table) => {
            table.increments()
            table.integer('post_id')
            table.integer('user_id')
            table.integer('commentable_id')
            table.string('commentable_type')
            table.string('body')
            table.timestamps()
        })
    }

    const hasProfilesTable = await db.schema.hasTable('profiles')
    if ( ! hasProfilesTable ) {
        await db.schema.createTable('profiles', (table) => {
            table.increments()
            table.integer('user_id')
            table.string('display_name').notNullable()
            table.string('type').nullable()
            table.timestamps()
        })
    }

    const hasIdentitiesTable = await db.schema.hasTable('identities')
    if ( ! hasIdentitiesTable ) {
        await db.schema.createTable('identities', (table) => {
            table.increments()
            table.integer('profile_id')
            table.string('identity_name')
            table.timestamps()
        })
    }

    if ( destroyDb ) {
        await db.destroy()
    }
}

/**
 * Does cleanup removes database
 */
export async function cleanup(customTables?: string[]) {
    const db = knex(Object.assign({}, getConfig(), { debug: false }))

    if ( customTables ) {
        await Promise.all(customTables.map((table) => db.schema.dropTableIfExists(table)))
        await db.destroy()
        return
    }

    await db.schema.dropTableIfExists('users')
    await db.schema.dropTableIfExists('friends')
    await db.schema.dropTableIfExists('countries')
    await db.schema.dropTableIfExists('skills')
    await db.schema.dropTableIfExists('skill_user')
    await db.schema.dropTableIfExists('profiles')
    await db.schema.dropTableIfExists('posts')
    await db.schema.dropTableIfExists('comments')
    await db.schema.dropTableIfExists('identities')
    await db.schema.dropTableIfExists('knex_migrations')
    await db.schema.dropTableIfExists('tags')
    await db.schema.dropTableIfExists('taggables')

    await db.destroy()
}

/**
 * Reset database tables
 */
export async function resetTables() {
    const db = knex(Object.assign({}, getConfig(), { debug: false }))
    await db.table('users').truncate()
    await db.table('friends').truncate()
    await db.table('countries').truncate()
    await db.table('skills').truncate()
    await db.table('skill_user').truncate()
    await db.table('profiles').truncate()
    await db.table('posts').truncate()
    await db.table('comments').truncate()
    await db.table('identities').truncate()
    await db.table('tags').truncate()
    await db.table('taggables').truncate()
    await db.destroy()
}

/**
 * Returns the query client typed to it's interface
 */
export function getQueryClient(
    connection: ConnectionContract,
    mode?: 'read' | 'write' | 'dual',
    emitter?: Emitter,
): QueryClientContract {
    return new QueryClient(mode || 'dual', connection, emitter || getEmitter()) as QueryClientContract
}

/**
 * Returns query builder instance for a given connection
 */
export function getQueryBuilder(client: QueryClientContract) {
    return new DatabaseQueryBuilder(
        client.getWriteClient().queryBuilder(),
        client
    ) as unknown as DatabaseQueryBuilderContract
}

/**
 * Returns raw query builder instance for a given connection
 */
export function getRawQueryBuilder(client: QueryClientContract, sql: string, bindings?: any[]) {
    const writeClient = client.getWriteClient()
    return new RawQueryBuilder(
        bindings ? writeClient.raw(sql, bindings) : writeClient.raw(sql),
        client
    ) as unknown as RawQueryBuilderContract
}

/**
 * Returns query builder instance for a given connection
 */
export function getInsertBuilder(client: QueryClientContract) {
    return new InsertQueryBuilder(
        client.getWriteClient().queryBuilder(),
        client
    ) as unknown as InsertQueryBuilderContract
}

/**
 * Returns fake logger instance
 */
export function getLogger() {
    return new Logger({
        enabled: true,
        name: 'lucid',
        level: 'debug',
        prettyPrint: false
    })
}

/**
 * Returns emitter instance
 */
export function getEmitter() {
    const app = new Application();
    app.register(new EventServiceProvider(app));
    return app.events;
    // return new Emitter(new Ioc())
}

/**
 * Returns profiler instance
 */
export function getProfiler(enabled: boolean = false) {
    return new Profiler(__dirname, getLogger(), { enabled })
}

/**
 * Returns the database instance
 */
export function getDb(emitter?: any) {
    const config = {
        connection: 'primary',
        connections: {
            primary: getConfig(),
            secondary: getConfig()
        }
    }

    return new Database(config, getLogger(), getProfiler(), emitter || getEmitter()) as DatabaseContract
}

/**
 * Returns the orm adapter
 */
export function ormAdapter(db: DatabaseContract) {
    return new Adapter(db)
}

/**
 * Returns the base model with the adapter attached to it
 */
export function getBaseModel(adapter: AdapterContract, container?: ApplicationContract) {
    BaseModel.$adapter = adapter
    // BaseModel.$container = container || new Application()
    return BaseModel as unknown as LucidModel
}

/**
 * Converts a map to an object
 */
export function mapToObj<T extends any>(collection: Map<any, any>): T {
    let obj = {} as T
    collection.forEach((value, key) => {
        obj[key] = value
    })
    return obj
}

/**
 * Returns the base schema class typed to it's interface
 */
export function getBaseSchema() {
    return Schema as unknown as SchemaConstructorContract
}

/**
 * Returns instance of migrator
 */
export function getMigrator(db: DatabaseContract, app: ApplicationContract, config: MigratorOptions) {
    return new Migrator(db, app, config) as unknown as MigratorContract
}

/**
 * Split string to an array using cross platform new lines
 */
export function toNewlineArray(contents: string): string[] {
    return contents.split(/\r?\n/)
}

/**
 * Returns an array of users filled with random data
 */
export function getUsers(count: number) {
    const chance = new Chance()
    return [...new Array(count)].map(() => {
        return {
            username: chance.string({ alpha: true }),
            email: chance.email()
        }
    })
}

/**
 * Returns an array of posts for a given user, filled with random data
 */
export function getPosts(count: number, userId: number) {
    const chance = new Chance()
    return [...new Array(count)].map(() => {
        return {
            user_id: userId,
            title: chance.sentence({ words: 5 })
        }
    })
}

export function getComments(count: number, userId: number, type: 'post') {
    const chance = new Chance()
    return [...new Array(count)].map(() => {
        return {
            commentable_id: userId,
            commentable_type: type,
            body: chance.sentence({ words: 5 })
        }
    })
}


type ActionType = 'insert' | 'update' | 'delete' | 'find' | 'findAll'

/**
 * Fake adapter implementation
 */
export class FakeAdapter implements AdapterContract {
    public operations: any[] = []

    private _handlers: any = {
        insert: [1],
        update: [1],
        find: null,
        delete: [1],
        findAll: null
    }

    private _invokeHandler(
        action: keyof FakeAdapter['_handlers'],
        model: LucidRow | LucidModel,
        options?: any
    ) {
        if ( typeof (this._handlers[action]) === 'function' ) {
            return this._handlers[action](model, options)
        }
        return this._handlers[action];
    }

    public query(): any {
        return {
            client: {
                dialect: {
                    dateTimeFormat: 'yyyy-MM-dd HH:mm:ss'
                }
            }
        }
    }

    public on<T extends LucidRow>(action: ActionType, handler: ((model: T, attributes: any) => void)): void
    public on<T extends LucidRow>(action: ActionType, handler: ((model: T, attributes: any) => void)): void
    public on<T extends LucidRow>(action: ActionType, handler: ((model: T) => void)): void
    public on<T extends LucidModel>(action: ActionType, handler: ((model: T, options?: any) => void)): void
    public on<T extends LucidModel>(action: ActionType, handler: ((model: T, options?: any) => void)): void
    public on<T extends LucidModel, R extends LucidRow>(
        action: ActionType,
        handler: ((model: R, attributes?: any) => void) | ((model: T, attributes?: any) => void)
    ): void {
        this._handlers[action] = handler
    }

    public modelClient(): any {
    }

    public modelConstructorClient(): any {
    }

    public insert(instance: LucidRow, attributes: any) {
        this.operations.push({ type: 'insert', instance, attributes })
        return this._invokeHandler('insert', instance, attributes)
    }

    public delete(instance: LucidRow) {
        this.operations.push({ type: 'delete', instance })
        return this._invokeHandler('delete', instance)
    }

    public update(instance: LucidRow, attributes: any) {
        this.operations.push({ type: 'update', instance, attributes })
        return this._invokeHandler('update', instance, attributes)
    }

    public async find(model: LucidModel, key: string, value: any, options?: any) {
        const payload: any = { type: 'find', model, key, value }
        if ( options ) {
            payload.options = options
        }

        this.operations.push(payload)
        return this._invokeHandler('find', model, options)
    }

    public async findAll(model: LucidModel, options?: any) {
        const payload: any = { type: 'findAll', model }
        if ( options ) {
            payload.options = options
        }

        this.operations.push(payload)
        return this._invokeHandler('findAll', model, options)
    }
}
