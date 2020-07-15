/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 9:48 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { LucidModel } from '../../src/Contracts/Model/LucidModel';
import { ModelQueryBuilderContract } from '../../src/Contracts/Model/ModelQueryBuilderContract';
import { ScopeContract } from '../../src/Contracts/Model/ScopeContract';
import { scope } from '../../src/Helpers/scope';
import { column } from '../../src/Orm/Decorators';
import { ModelQueryBuilder } from '../../src/Orm/QueryBuilder/ModelQueryBuilder';
import { cleanup, getBaseModel, getDb, getProfiler, ormAdapter, resetTables, setup } from '../helpers';
import { SoftDeletes } from '../../src/Orm/SoftDeletes';
import {DateTime} from "luxon";

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Model query builder', () => {
    beforeAll(async () => {
        db = getDb()
        BaseModel = getBaseModel(ormAdapter(db))
        await setup()
    })

    afterAll(async () => {
        await cleanup()
        await db.manager.closeAll()
    })

    afterEach(async () => {
        await resetTables()
    })

    describe('global scope', () => {
        let PointScopeClass;
        let UserClass;
        beforeEach(async () => {
            class PointScope implements ScopeContract {

                public apply(builder: ModelQueryBuilderContract<LucidModel>, model: LucidModel): void {
                    builder.where('points', 2);
                }
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string;

                static boot() {
                    super.boot();

                    this.addGlobalScope('active_true', (query) => {
                        query.where('is_active', true);
                    });

                    this.addGlobalScope(query => {
                        query.where('points', 1);
                    });

                    this.addGlobalScope(new PointScope());
                }
            }

            PointScopeClass = PointScope;
            UserClass = User;
        });

        it('apply global scope', async () => {
            class User extends BaseModel {
                static table = 'users';

                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string;

            }

            const { sql, bindings } = UserClass.query().toSQL();

            expect(sql).not.toBe(User.query().toSQL().sql);

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('users')
                                                               .where('is_active', true)
                                                               .where('points', 1)
                                                               .where('points', 2)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings);
        });

        it('remove a global scope for a given query', async () => {
            const { sql, bindings } = UserClass.withoutGlobalScope('active_true').toSQL();

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('users')
                                                               .where('points', 1)
                                                               .where('points', 2)
                                                               .toSQL()
            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings);

            expect(UserClass.withoutGlobalScope('active_true').removedScopes()).toEqual(['active_true']);
            expect(UserClass.withoutGlobalScope('active_true')._scopes).toHaveLength(2);
        });

        it('remove a global scope for a given query should accepts the class', async () => {
            const { sql, bindings } = UserClass.withoutGlobalScope(PointScopeClass).toSQL();

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('users')
                                                               .where('is_active', true)
                                                               .where('points', 1)
                                                               .toSQL()
            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            class Scope {
            }

            expect(UserClass.withoutGlobalScope(Scope).removedScopes()).toEqual([Scope]);
            expect(UserClass.withoutGlobalScope(PointScopeClass).removedScopes()).toEqual([PointScopeClass]);
            expect(UserClass.withoutGlobalScope(Scope)._scopes).toHaveLength(3);

        });

        it('remove several of the global scopes', async () => {
            const { sql, bindings } = UserClass.withoutGlobalScopes(['active_true']).toSQL();

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('users')
                                                               .where('points', 1)
                                                               .where('points', 2)
                                                               .toSQL()
            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            expect(UserClass.withoutGlobalScopes(['active_true']).removedScopes()).toEqual(['active_true']);
            expect(UserClass.withoutGlobalScopes(['active_true', PointScopeClass]).removedScopes()).toEqual(['active_true', PointScopeClass]);
        });

        it('remove all of the global scopes', async () => {
            const { sql, bindings } = UserClass.withoutGlobalScopes().toSQL();

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('users')
                                                               .toSQL()
            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)

            expect(UserClass.withoutGlobalScopes().removedScopes()).toHaveLength(3);
            expect(UserClass.withoutGlobalScopes()._scopes).toHaveLength(0);
        });

        it('apply global scope query', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string;

                @column()
                public is_active: number;

                static boot() {
                    super.boot();

                    this.addGlobalScope(query => {
                        query.where('is_active', 1);
                    });
                }
            }

            await User.create({
                username: 'nguyen',
                is_active: 1
            });
            await User.create({
                username: 'nguyen2',
                is_active: 2
            });

            expect((await User.query()).map(x=>x.toJSON())).toEqual([{"id": 1, "is_active": 1, "username": "nguyen"}]);
            expect((await User.all()).map(x=>x.toJSON())).toEqual([{"id": 1, "is_active": 1, "username": "nguyen"}]);
        });

        it('apply global scope first', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string;

                @column()
                public is_active: number;

                static boot() {
                    super.boot();

                    this.addGlobalScope(query => {
                        query.where('is_active', 1);
                    });
                }
            }

            await User.create({
                username: 'nguyen',
                is_active: 1
            });
            await User.create({
                username: 'nguyen2',
                is_active: 2
            });

            expect((await User.first()).toJSON()).toEqual({"id": 1, "is_active": 1, "username": "nguyen"});
        });
    });

    describe('local scope', () => {
        let UserClass;
        beforeEach(async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string;

                public static scopeActive(query) {
                    return query.where('is_active', true);
                }

                public static scopePoint(query) {
                    return query.where('point', '>', 0);
                }

                public static scopeOfPoint(query, point: number) {
                    return query.where('point', point);
                }
            }

            UserClass = User;
        });

        it('apply local scope', async () => {
            const { sql, bindings } = UserClass.query().active().point().toSQL();

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('users')
                                                               .where('is_active', true)
                                                               .where('point', '>', 0)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        });

        it('apply local scopes inside a sub query', async () => {
            const { sql, bindings } = UserClass.query().active().orWhere(query => {
                query.point();
            }).toSQL();

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('users')
                                                               .where('is_active', true)
                                                               .orWhere(query => {
                                                                   query.where('point', '>', 0);
                                                               })
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        });

        it('dynamic scopes', async () => {
            const { sql, bindings } = UserClass.query().ofPoint(10).toSQL();

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('users')
                                                               .where('point', 10)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        });

        it('call name scope too same builder method', async () => {
            expect.assertions(1);
            const task = [];

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string;

                public static scopeWhere(query, active: boolean = false) {
                    task.push('where');
                    return query.where('is_active', active);
                }
            }

            expect(task).toEqual([]);
        });
    });

    describe('Builder', () => {
        test('get instance of query builder for the given model', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }


            expect(User.query()).toBeInstanceOf(ModelQueryBuilder)
        })

        test('pre select the table for the query builder instance', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }


            expect(User.query().knexQuery['_single'].table).toBe('users')
        })

        test('execute select queries', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }


            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

            const users = await User.query().where('username', 'virk')
            expect(users).toHaveLength(1)
            expect(users[0]).toBeInstanceOf(User)
            expect(users[0].$attributes).toEqual({ id: 1, username: 'virk' })
        })

        test('pass custom connection to the model instance', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }


            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

            const users = await User.query({ connection: 'secondary' }).where('username', 'virk')
            expect(users).toHaveLength(1)
            expect(users[0]).toBeInstanceOf(User)
            expect(users[0].$attributes).toEqual({ id: 1, username: 'virk' })
            expect(users[0].$options!.connection).toEqual('secondary')
        })

        test('pass sideloaded attributes to the model instance', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }


            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

            const users = await User
                .query({ connection: 'secondary' })
                .where('username', 'virk')
                .sideload({ loggedInUser: { id: 1 } })

            expect(users).toHaveLength(1)
            expect(users[0]).toBeInstanceOf(User)
            expect(users[0].$attributes).toEqual({ id: 1, username: 'virk' })
            expect(users[0].$sideloaded).toEqual({ loggedInUser: { id: 1 } })
        })

        test('pass custom profiler to the model instance', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }


            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

            const profiler = getProfiler()
            const users = await User.query({ profiler }).where('username', 'virk')
            expect(users).toHaveLength(1)
            expect(users[0]).toBeInstanceOf(User)
            expect(users[0].$attributes).toEqual({ id: 1, username: 'virk' })
            expect(users[0].$options!.profiler).toEqual(profiler)
        })

        test('perform update using model query builder', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }


            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

            const rows = await User.query().where('username', 'virk').update({ username: 'hvirk' })
            expect(rows).toHaveLength(1)
            expect(rows).toEqual([1])

            const user = await db.from('users').where('username', 'hvirk').first()
            expect(user!.username).toBe('hvirk')
        })

        test('perform increment using model query builder', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert([{ username: 'virk', points: 1 }])

            const rows = await User.query().where('username', 'virk').increment('points', 1)
            expect(rows).toHaveLength(1)
            expect(rows).toEqual([1])

            const user = await db.from('users').where('username', 'virk').first()
            expect(user!.points).toBe(2)
        })

        test('perform decrement using model query builder', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }


            await db.insertQuery().table('users').insert([{ username: 'virk', points: 3 }])

            const rows = await User.query().where('username', 'virk').decrement('points', 1)
            expect(rows).toHaveLength(1)
            expect(rows).toEqual([1])

            const user = await db.from('users').where('username', 'virk').first()
            expect(user!.points).toBe(2)
        })

        test('delete in bulk', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }


            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

            const rows = await User.query().where('username', 'virk').del()
            expect(rows).toHaveLength(1)
            expect(rows).toEqual([1])

            const user = await db.from('users').where('username', 'virk').first()
            expect(user).toBeNull()
        })

        test('clone query builder', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }


            const query = User.query()
            const clonedQuery = query.clone()
            expect(clonedQuery).toBeInstanceOf(ModelQueryBuilder)
        })

        test('clone query builder with internal flags', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }


            const query = User.query().groupBy('id')
            const clonedQuery = query.clone()
            expect(clonedQuery.hasGroupBy).toBeTruthy()
        })

        test('pass sideloaded data to cloned query', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }


            await db.insertQuery().table('users').insert([{ username: 'virk', points: 3 }])

            const query = User.query().sideload({ username: 'virk' })
            const user = await query.clone().firstOrFail()
            expect(user.$sideloaded).toEqual({ username: 'virk' })
        })

        test('apply scopes', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                public static active = scope((query) => {
                    query.where('is_active', true)
                });

                public static scopeActive(query, value: boolean = true) {
                    return query.where('is_active', value);
                }
            }


            const { sql, bindings } = User.query().apply((scopes) => {
                scopes.active();
            }).toSQL();

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('users')
                                                               .where('is_active', true)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('apply scopes inside a sub query', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                public static active = scope((query) => {
                    query.where('is_active', true)
                })
            }


            const { sql, bindings } = User.query().where((builder) => {
                builder.apply((scopes) => scopes.active())
            }).toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('users')
                                                               .where((builder) => builder.where('is_active', true))
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('make aggregate queries with the model query builder', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }


            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

            const users = await User.query().count('* as total')
            expect(Number(users[0].total)).toBe(2)
        })
    });

    describe('Soft Deletes', () => {
        let FriendClass;
        beforeEach(async () => {
            class Friend extends BaseModel {
                static table = 'friends';

                @column({ isPrimary: true })
                public id: number

                @column()
                username: string;

                @column.dateTime({autoCreate: true})
                public createdAt: DateTime;

                @column.dateTime({ autoCreate: true, autoUpdate: true })
                public updatedAt: DateTime

                @column.dateTime()
                public deletedAt: DateTime

                static boot() {
                    super.boot();

                    this.use(SoftDeletes);
                }
            }

            FriendClass = Friend;
        });

        it('model delete', async () => {
            const friend = new FriendClass();
            friend.name = 1;
            await friend.save();

            db.enableQueryLog();
            await friend.delete();

            const stack = db.getQueryLog();
            const {sql, bindings} = db.from('friends').where('id', 1).update({deleted_at: '', updated_at: ''}).toSQL();
            expect(stack[0].sql).toEqual(sql)
        });

        it('model force delete', async () => {
            const friend = new FriendClass();
            friend.name = 1;
            await friend.save();
            db.enableQueryLog();
            await friend.forceDelete();
            expect(friend.isForceDeleting()).toBeFalsy();
            const stack = db.getQueryLog();
            const {sql, bindings} = db.from('friends').where('id', 1).delete().toSQL();
            expect(stack[0].sql).toEqual(sql)
        });

        it('model restore', async () => {
            const friend = new FriendClass();
            friend.name = 1;
            await friend.save();


            await friend.delete();

            db.enableQueryLog();

            if (friend.trashed()) {
                await friend.restore();
            }

            const stack = db.getQueryLog();

            expect(stack).toHaveLength(1);
            const {sql, bindings} = stack[0];
            const {sql: knexSql} = db.from('friends').where('id', 1).update({updated_at: '', deleted_at: ''}).toSQL();
            expect(sql).toEqual(knexSql);
            expect(bindings.includes(null)).toBeTruthy();
        });

        it('builder delete', async () => {
            db.enableQueryLog();
            await FriendClass.query().delete();

            const {sql} = db.getQueryLog()[0];

            const {sql: knexSql, bindings: knexBindings} = db.from('friends').whereNull('friends.deleted_at')
                .update({
                    'friends.deleted_at': '',
                    updated_at: ''
                })
                .toSQL();

            expect(sql).toEqual(knexSql);
        });

        it('builder force delete', async () => {
            db.enableQueryLog();

            await FriendClass.query().forceDelete();

            const {sql} = db.getQueryLog()[0];

            const {sql: knexSql, bindings: knexBindings} = db.from('friends').delete().toSQL();
            expect(sql).toEqual(knexSql);
        });

        it('builder restore', async () => {
            const friend = new FriendClass();
            friend.name = 1;
            await friend.save();

            const d = await FriendClass.query().where('id', friend.id).delete();
            db.enableQueryLog();

            await FriendClass.query().where('id', friend.id).restore();

            const {sql} = db.getQueryLog()[0];
            const {sql: knexSql} = db.from('friends')
                .where('id', friend.id)
                .update({
                    'deleted_at': '',
                    'updated_at': ''
                })
                .toSQL();
            expect(sql).toEqual(knexSql);
        });

        it('query columns not delete', async () => {
            for (const item of [1, 2, 3]) {
                const friend = new FriendClass();
                friend.name = 1;
                await friend.save();
            }
            const friend = new FriendClass();
            friend.name = 1;
            await friend.save();
            await friend.delete();

            db.enableQueryLog();
            const data = await FriendClass.query();
            const {sql, bindings} = db.getQueryLog()[0];
            const {sql: knexSql, bindings: knexBindings} = db.from('friends').whereNull('friends.deleted_at').toSQL();
            expect(data).toHaveLength(3);
            expect(sql).toEqual(knexSql);
            expect(bindings).toEqual(knexBindings);
        });

        it('query using withTrashed', async () => {
            for (const item of [1, 2, 3]) {
                const friend = new FriendClass();
                friend.name = 1;
                await friend.save();
            }
            const friend = new FriendClass();
            friend.name = 1;
            await friend.save();
            await friend.delete();

            db.enableQueryLog();
            const data = await FriendClass.query().withTrashed();

            const {sql, bindings} = db.getQueryLog()[0];
            const {sql: knexSql, bindings: knexBindings} = db.from('friends').toSQL();
            expect(data).toHaveLength(4);
            expect(sql).toEqual(knexSql);
            expect(bindings).toEqual(knexBindings);
        });

        it('query using withTrashed and withTrashed =  false', async () => {
            for (const item of [1, 2, 3]) {
                const friend = new FriendClass();
                friend.name = 1;
                await friend.save();
            }
            const friend = new FriendClass();
            friend.name = 1;
            await friend.save();
            await friend.delete();

            db.enableQueryLog();
            const data = await FriendClass.query().withTrashed(false);

            const {sql, bindings} = db.getQueryLog()[0];
            const {sql: knexSql, bindings: knexBindings} = db.from('friends').whereNull('friends.deleted_at').toSQL();
            expect(data).toHaveLength(3);
            expect(sql).toEqual(knexSql);
            expect(bindings).toEqual(knexBindings);
        });

        it('query using withoutTrashed', async () => {
            for (const item of [1, 2, 3]) {
                const friend = new FriendClass();
                friend.name = 1;
                await friend.save();
            }
            const friend = new FriendClass();
            friend.name = 1;
            await friend.save();
            await friend.delete();

            db.enableQueryLog();
            const data = await FriendClass.query().withoutTrashed();
            const {sql, bindings} = db.getQueryLog()[0];
            const {sql: knexSql, bindings: knexBindings} = db.from('friends').whereNull('friends.deleted_at').toSQL();
            expect(data).toHaveLength(3);
            expect(sql).toEqual(knexSql);
            expect(bindings).toEqual(knexBindings);
        });

        it('query using only trashed', async () => {
            for (const item of [1, 2, 3]) {
                const friend = new FriendClass();
                friend.name = 1;
                await friend.save();
            }
            const friend = new FriendClass();
            friend.name = 1;
            await friend.save();
            await friend.delete();

            db.enableQueryLog();
            const data = await FriendClass.query().onlyTrashed();

            const {sql, bindings} = db.getQueryLog()[0];
            const {sql: knexSql, bindings: knexBindings} = db.from('friends').whereNotNull('friends.deleted_at').toSQL();
            expect(data).toHaveLength(1);
            expect(sql).toEqual(knexSql);
            expect(bindings).toEqual(knexBindings);
        });
    });
})
