/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 8:45 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Filesystem } from '@poppinss/dev-utils/build';
import { join } from "path";
import { cleanup, getBaseSchema, getDb, resetTables, setup } from '../helpers';

let db: ReturnType<typeof getDb>
const fs = new Filesystem(join(__dirname, 'app'))

describe('Schema', () => {
    beforeAll(async () => {
        db = getDb()
        await setup()
    })

    afterAll(async () => {
        await cleanup()
        await db.manager.closeAll()
    })

    afterEach(async () => {
        await resetTables()
    })

    it('get schema queries defined inside the up method in dry run', async () => {
        class UsersSchema extends getBaseSchema() {
            public up () {
                this.schema.createTable('users', (table) => {
                    table.increments('id')
                    table.string('username')
                })
            }
        }

        const schema = new UsersSchema(db.connection(), 'users.ts', true)
        const queries = await schema.execUp()

        const knexSchema = db.connection().schema.createTable('users', (table) => {
            table.increments('id')
            table.string('username')
        }).toQuery()

        expect(queries).toEqual([knexSchema])
    })

    it('get schema queries defined inside the down method in dry run', async () => {
        class UsersSchema extends getBaseSchema() {
            public down () {
                this.schema.dropTable('users')
            }
        }

        const schema = new UsersSchema(db.connection(), 'users.ts', true)
        const queries = await schema.execDown()

        const knexSchema = db.connection().schema.dropTable('users').toQuery()
        expect(queries).toEqual([knexSchema])
    })

    it('get knex raw query builder using now method', async () => {
        class UsersSchema extends getBaseSchema() {
            public up () {
                this.schema.createTable('users', (table) => {
                    table.increments('id')
                    table.string('username')
                })
            }
        }

        const schema = new UsersSchema(db.connection(), 'users.ts', true)
        expect(schema.now().toQuery()).toBe('CURRENT_TIMESTAMP')
    })

    it('do not execute defer calls in dry run', async () => {
        expect.assertions(1)

        class UsersSchema extends getBaseSchema() {
            public up () {
                expect(true).toBeTruthy()
                this.defer(() => {
                    throw new Error('Not expected to be invoked')
                })
            }
        }

        const schema = new UsersSchema(db.connection(), 'foo.ts', true)
        await schema.execUp()
    })

    it('execute up method queries on a given connection', async () => {
        class UsersSchema extends getBaseSchema() {
            public up () {
                this.schema.createTable('schema_users', (table) => {
                    table.increments('id')
                    table.string('username')
                })

                this.schema.createTable('schema_accounts', (table) => {
                    table.increments('id')
                    table.integer('user_id').unsigned().references('schema_users.id')
                })
            }
        }

        const trx = await db.transaction()
        const schema = new UsersSchema(trx, 'users.ts', false)

        try {
            await schema.execUp()
            await trx.commit()
        } catch (error) {
            await trx.rollback()
        }

        const hasUsers = await db.connection().schema.hasTable('schema_users')
        const hasAccounts = await db.connection().schema.hasTable('schema_accounts')

        await db.connection().schema.dropTable('schema_accounts')
        await db.connection().schema.dropTable('schema_users')

        expect(hasUsers).toBeTruthy()
        expect(hasAccounts).toBeTruthy()
    })

    it('execute up method deferred actions in correct sequence', async () => {
        class UsersSchema extends getBaseSchema() {
            public up () {
                this.schema.createTable('schema_users', (table) => {
                    table.increments('id')
                    table.string('username')
                })

                this.defer(async () => {
                    await this.db.table('schema_users').insert({ username: 'virk' })
                })

                this.schema.createTable('schema_accounts', (table) => {
                    table.increments('id')
                    table.integer('user_id').unsigned().references('schema_users.id')
                })
            }
        }

        const trx = await db.transaction()
        const schema = new UsersSchema(trx, 'users.ts', false)

        try {
            await schema.execUp()
            await trx.commit()
        } catch (error) {
            await trx.rollback()
        }

        const user = await db.connection().query().from('schema_users').first()
        expect(user.username).toBe('virk')

        await db.connection().schema.dropTable('schema_accounts')
        await db.connection().schema.dropTable('schema_users')
    })

    it('execute down method queries on a given connection', async () => {
        class UsersSchema extends getBaseSchema() {
            public up () {
                this.schema.createTable('schema_users', (table) => {
                    table.increments('id')
                    table.string('username')
                })

                this.schema.createTable('schema_accounts', (table) => {
                    table.increments('id')
                    table.integer('user_id').unsigned().references('schema_users.id')
                })
            }

            public down () {
                if (this.db.dialect.name !== 'sqlite3') {
                    this.schema.table('schema_accounts', (table) => {
                        table.dropForeign(['user_id'])
                    })
                }

                this.schema.dropTable('schema_users')
                this.schema.dropTable('schema_accounts')
            }
        }

        await new UsersSchema(db.connection(), 'users.ts', false).execUp()

        const trx = await db.transaction()
        const schema = new UsersSchema(trx, 'users.ts', false)

        try {
            await schema.execDown()
            await trx.commit()
        } catch (error) {
            await trx.rollback()
        }

        const hasUsers = await db.connection().schema.hasTable('schema_users')
        const hasAccounts = await db.connection().schema.hasTable('schema_accounts')

        expect(hasUsers).toBeFalsy()
        expect(hasAccounts).toBeFalsy()
    })

    it('use now helper to define default timestamp', async () => {
        class UsersSchema extends getBaseSchema() {
            public up () {
                this.schema.createTable('users', (table) => {
                    table.increments('id')
                    table.timestamp('created_at').defaultTo(this.now())
                })
            }
        }

        const schema = new UsersSchema(db.connection(), 'users.ts', true)
        const queries = await schema.execUp()

        const knexSchema = db.connection().schema.createTable('users', (table) => {
            table.increments('id')
            table.timestamp('created_at').defaultTo(db.connection().getWriteClient().fn.now())
        }).toQuery()

        expect(queries).toEqual([knexSchema])
    })
});
