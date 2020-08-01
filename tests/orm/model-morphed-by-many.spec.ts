/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 9:48 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import {MorphedByMany, MorphToMany} from '../../src/Contracts/Orm/Relations/types';
import {scope} from '../../src/Helpers/scope';
import {column, morphedByMany, morphToMany} from '../../src/Orm/Decorators';
import {cleanup, getBaseModel, getDb, getProfiler, ormAdapter, resetTables, setup} from '../helpers';
import {Relation} from "../../src/Orm/Relations/Base/Relation";
import {MorphToManyQueryBuilder} from "../../src/Orm/Relations/MorphToMany/QueryBuilder";

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Model | MorphedByMany', () => {

    describe('Model | MorphedByMany | Options', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })

        test('raise error when localKey is missing', () => {
            expect.assertions(1)

            try {
                class Tag extends BaseModel {
                    @morphedByMany(() => User, {
                        name: 'taggable',
                        pivotTable: 'taggables'
                    })
                    public users: MorphedByMany<typeof User>
                }

                class User extends BaseModel {
                }


                Tag.$getRelation('users')!.boot()
            } catch ({message}) {
                expect(
                    message).toBe('E_MISSING_MODEL_ATTRIBUTE: "Tag.users" expects "id" to exist on "Tag" model, but is missing',
                )
            }
        })

        test('use primary key as the local key', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            Tag.$getRelation('users')!.boot()

            expect(Tag.$getRelation('users')!['localKey']).toBe('id')
            expect(Tag.$getRelation('users')!['localKeyColumnName']).toBe('id')
        })

        test('use custom defined local key', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public uid: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    localKey: 'uid'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }


            Tag.$getRelation('users')!.boot()

            expect(Tag.$getRelation('users')!['localKey']).toBe('uid')
            expect(Tag.$getRelation('users')!['localKeyColumnName']).toBe('uid')
        })

        test('raise error when relatedKey is missing', () => {
            expect.assertions(1)

            try {
                class Tag extends BaseModel {
                    @column({isPrimary: true})
                    public id: number

                    @morphedByMany(() => User, {
                        name: 'taggable',
                        pivotTable: 'taggables'
                    })
                    public users: MorphedByMany<typeof User>
                }

                class User extends BaseModel {
                }

                User.bootIfNotBooted();

                Tag.$getRelation('users')!.boot()
            } catch ({message}) {
                expect(
                    message).toBe('E_MISSING_MODEL_ATTRIBUTE: "Tag.users" expects "id" to exist on "User" model, but is missing',
                )
            }
        })

        test('use related model primary key as the related key', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            Tag.$getRelation('users')!.boot()

            expect(Tag.$getRelation('users')!['relatedKey']).toBe('id')
            expect(Tag.$getRelation('users')!['relatedKeyColumnName']).toBe('id')
        })

        test('use custom defined related key', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    relatedKey: 'uid'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public uid: number
            }

            Tag.$getRelation('users')!.boot()

            expect(Tag.$getRelation('users')!['relatedKey']).toBe('uid')
            expect(Tag.$getRelation('users')!['relatedKeyColumnName']).toBe('uid')
        })

        test('compute pivotForeignKey from table name + primary key', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            Tag.$getRelation('users')!.boot()

            expect(Tag.$getRelation('users')!['pivotForeignKey']).toBe('tag_id')
        })

        test('use custom defined pivotForeignKey', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    pivotForeignKey: 'user_uid'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            Tag.$getRelation('users')!.boot()

            expect(Tag.$getRelation('users')!['pivotForeignKey']).toBe('user_uid')
        })

        test('compute relatedPivotForeignKey from related model name + primary key', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }


            Tag.$getRelation('users')!.boot()

            expect(Tag.$getRelation('users')!['pivotRelatedForeignKey']).toBe('taggable_id')
        })

        test('use custom defined relatedPivotForeignKey', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    pivotRelatedForeignKey: 'tag_uid'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }


            Tag.$getRelation('users')!.boot()

            expect(Tag.$getRelation('users')!['pivotRelatedForeignKey']).toBe('tag_uid')
        })
    })

    describe('Model | MorphedByMany | Set Relations', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })

        test('set related model instance', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            Tag.$getRelation('users')!.boot()

            const user = new User()
            const tag = new Tag()
            Tag.$getRelation('users')!.setRelated(tag, [user])
            expect(tag.users).toEqual([user])
        })

        test('push related model instance', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            Tag.$getRelation('users')!.boot()

            const tag = new Tag()
            const user = new User()
            const user1 = new User()

            Tag.$getRelation('users')!.setRelated(tag, [user])
            Tag.$getRelation('users')!.pushRelated(tag, [user1])
            expect(tag.users).toEqual([user, user1])
        })

        test('set many of related instances', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            Tag.$getRelation('users')!.boot()

            const tag = new Tag()
            tag.fill({id: 1})

            const tag1 = new Tag()
            tag1.fill({id: 2})

            const tag2 = new Tag()
            tag2.fill({id: 3})

            const user = new User()
            user.$extras = {
                pivot_tag_id: 1,
            }

            const user1 = new User()
            user1.$extras = {
                pivot_tag_id: 2,
            }

            const user2 = new User()
            user2.$extras = {
                pivot_tag_id: 1,
            }

            Tag.$getRelation('users')!.setRelatedForMany([tag, tag1, tag2], [user, user1, user2])
            expect(tag.users).toEqual([user, user2])
            expect(tag1.users).toEqual([user1])
            expect(tag2.users).toEqual([] as any)
        })
    })

    describe('Model | MorphedByMany | bulk operations', () => {
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

        test('generate correct sql for selecting related rows', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            await db.table('tags').insert({name: 'virk'})

            const tag = await Tag.find(1)
            const {sql, bindings} = tag!.related('users').query().toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection()
                .getWriteClient()
                .from('users')
                .select('users.*', 'taggables.tag_id as pivot_tag_id', 'taggables.taggable_id as pivot_taggable_id')
                .innerJoin('taggables', 'users.id', 'taggables.taggable_id')
                .where('taggables.taggable_type', 'User')
                .where('taggables.tag_id', 1)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for selecting related for many rows', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            await db.table('tags').multiInsert([
                {name: 'virk'},
                {name: 'nikk'},
            ])

            const tags = await Tag.all()
            Tag.$getRelation('users')!.boot()

            const related = Tag.$getRelation('users')!.eagerQuery(tags, db.connection())
            const {sql, bindings} = related.toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection()
                .getWriteClient()
                .from('users')
                .select('users.*', 'taggables.tag_id as pivot_tag_id', 'taggables.taggable_id as pivot_taggable_id')
                .innerJoin('taggables', 'users.id', 'taggables.taggable_id')
                .where('taggables.taggable_type', 'User')
                .whereIn('taggables.tag_id', [2, 1])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('select extra columns', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    pivotColumns: ['score'],
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            await db.table('tags').insert({name: 'virk'})

            const tag = await Tag.find(1)
            const {sql, bindings} = tag!.related('users').query().toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection()
                .getWriteClient()
                .from('users')
                .select(
                    'users.*',
                    'taggables.tag_id as pivot_tag_id',
                    'taggables.taggable_id as pivot_taggable_id',
                    'taggables.score as pivot_score'
                )
                .innerJoin('taggables', 'users.id', 'taggables.taggable_id')
                .where('taggables.taggable_type', 'User')
                .where('taggables.tag_id', 1)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('select extra columns at runtime', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            await db.table('tags').insert({name: 'virk'})

            const tag = await Tag.find(1)
            const {sql, bindings} = tag!.related('users').query().pivotColumns(['score']).toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection()
                .getWriteClient()
                .from('users')
                .select(
                    'taggables.score as pivot_score',
                    'users.*',
                    'taggables.tag_id as pivot_tag_id',
                    'taggables.taggable_id as pivot_taggable_id',
                )
                .innerJoin('taggables', 'users.id', 'taggables.taggable_id')
                .where('taggables.taggable_type', 'User')
                .where('taggables.tag_id', 1)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for updating rows', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            await db.table('tags').insert({name: 'virk'})

            const tag = await Tag.find(1)

            const now = new Date()
            const {sql, bindings} = tag!.related('users').query().update({updated_at: now}).toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection()
                .getWriteClient()
                .from('taggables')
                .where('taggables.taggable_type', 'User')
                .where('taggables.tag_id', 1)
                .update({updated_at: now})
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for deleting rows', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            await db.table('tags').insert({name: 'virk'})

            const tag = await Tag.find(1)

            const {sql, bindings} = tag!.related('users').query().del().toSQL()
            const {sql: knexSql, bindings: knexBindings} = db.connection()
                .getWriteClient()
                .from('taggables')
                .where('taggables.taggable_type', 'User')
                .where('taggables.tag_id', 1)
                .del()
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })

    describe('Model | HasMany | aggregates', () => {
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

        test('get total of all related rows', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            await db.table('users').multiInsert([{username: 'virk'}, {username: 'nikk'}])
            await db.table('tags').multiInsert([
                {name: 'Programming'},
                {name: 'Cooking'},
                {name: 'Dancing'},
            ])
            await db.table('taggables').multiInsert([
                {taggable_id: 1, tag_id: 1, taggable_type: 'User'},
                {taggable_id: 1, tag_id: 2, taggable_type: 'User'},
                {taggable_id: 2, tag_id: 2, taggable_type: 'User'},
            ])

            const tag = await Tag.find(2)
            const total = await tag!.related('users')
                .query()
                .count('* as total')

            expect(Number(total[0].total)).toEqual(2)
        })

        test('select extra columns with count', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            await db.table('users').insert([{username: 'virk'},{username: 'nikk'}])
            await db.table('tags').multiInsert([
                {name: 'Programming'},
                {name: 'Cooking'},
                {name: 'Dancing'},
            ])
            await db.table('taggables').multiInsert([
                {taggable_id: 1, tag_id: 1, taggable_type: 'User'},
                {taggable_id: 1, tag_id: 2, taggable_type: 'User'},
                {taggable_id: 2, tag_id: 2, taggable_type: 'User'},
            ])

            const tag = await Tag.find(2)
            const total = await tag!.related('users')
                .query()
                .select('username')
                .groupBy('users.username')
                .count('* as total')

            expect(total).toHaveLength(2)
            expect(total[0].username).toBe('nikk')
            expect(Number(total[0].total)).toBe(1)

            expect(total[1].username).toBe('virk')
            expect(Number(total[1].total)).toBe(1)
        })

        test('select extra pivot columns with count', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            await db.table('users').insert([{username: 'virk'}, {username: 'nikk'}])
            await db.table('tags').multiInsert([
                {name: 'Programming'},
                {name: 'Cooking'},
                {name: 'Dancing'},
            ])
            await db.table('taggables').multiInsert([
                {taggable_id: 1, tag_id: 1, proficiency: 'Beginner', taggable_type: 'User'},
                {taggable_id: 1, tag_id: 2, proficiency: 'Advanced', taggable_type: 'User'},
                {taggable_id: 2, tag_id: 2, proficiency: 'Beginner', taggable_type: 'User'},
            ])

            const tag = await Tag.find(2)
            const total = await tag!.related('users')
                .query()
                .pivotColumns(['proficiency'])
                .groupBy('taggables.proficiency')
                .count('* as total')

            expect(total).toHaveLength(2)
            expect(total[0].pivot_proficiency).toBe('Advanced')
            expect(Number(total[0].total)).toBe(1)

            expect(total[1].pivot_proficiency).toBe('Beginner')
            expect(Number(total[1].total)).toBe(1)
        })
    })

    describe('Model | MorphedByMany | preload', () => {
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

        test('preload relation', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>;
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            Relation.morphMap({
                'user': () => User
            });

            await db.insertQuery().table('users').insert([{username: 'virk'},{username: 'nikk'}])
            await db.insertQuery().table('tags').insert([{name: 'Programming'}])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_type: 'user',
                    taggable_id: 1,
                    tag_id: 1,
                }
            ])

            const tags = await Tag.query().preload('users');
            expect(tags).toHaveLength(1)
            expect(tags[0].users).toHaveLength(1)
            expect(tags[0].users[0].username).toBe('virk')
            expect(tags[0].users[0].$extras.pivot_taggable_id).toBe(1)
            expect(tags[0].users[0].$extras.pivot_tag_id).toBe(1)
        })

        test('preload relation for many', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }


            await db.insertQuery().table('users').insert([{username: 'virk'}, {username: 'nikk'}])
            await db.insertQuery().table('tags').insert([{name: 'Programming'}, {name: 'Dancing'}])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_id: 1,
                    taggable_type: 'User',
                    tag_id: 1,
                },
                {
                    taggable_id: 2,
                    taggable_type: 'User',
                    tag_id: 1,
                },
                {
                    taggable_id: 2,
                    taggable_type: 'User',
                    tag_id: 2,
                },
            ])

            const tags = await Tag.query().preload('users')
            expect(tags).toHaveLength(2)
            expect(tags[0].users).toHaveLength(2)
            expect(tags[1].users).toHaveLength(1)

            expect(tags[0].users[0].username).toBe('virk')
            expect(tags[0].users[0].$extras.pivot_taggable_id).toBe(1)
            expect(tags[0].users[0].$extras.pivot_tag_id).toBe(1)

            expect(tags[0].users[1].username).toBe('nikk')
            expect(tags[0].users[1].$extras.pivot_taggable_id).toBe(2)
            expect(tags[0].users[1].$extras.pivot_tag_id).toBe(1)

            expect(tags[1].users[0].username).toBe('nikk')
            expect(tags[1].users[0].$extras.pivot_taggable_id).toBe(2)
            expect(tags[1].users[0].$extras.pivot_tag_id).toBe(2)
        })

        test('preload relation using model instance', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert([{username: 'virk'}, {username: 'nikk'}])
            await db.insertQuery().table('tags').insert([{name: 'Programming'}, {name: 'Dancing'}])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_id: 1,
                    taggable_type: 'User',
                    tag_id: 1,
                },
                {
                    taggable_id: 2,
                    taggable_type: 'User',
                    tag_id: 1,
                },
                {
                    taggable_id: 2,
                    taggable_type: 'User',
                    tag_id: 2,
                },
            ])

            const tags = await Tag.query().orderBy('id', 'asc')
            expect(tags).toHaveLength(2)

            await tags[0].preload('users')
            await tags[1].preload('users')

            expect(tags[0].users).toHaveLength(2)
            expect(tags[1].users).toHaveLength(1)

            expect(tags[0].users[0].username).toBe('virk')
            expect(tags[0].users[0].$extras.pivot_taggable_id).toBe(1)
            expect(tags[0].users[0].$extras.pivot_tag_id).toBe(1)

            expect(tags[0].users[1].username).toBe('nikk')
            expect(tags[0].users[1].$extras.pivot_taggable_id).toBe(2)
            expect(tags[0].users[1].$extras.pivot_tag_id).toBe(1)

            expect(tags[1].users[0].username).toBe('nikk')
            expect(tags[1].users[0].$extras.pivot_taggable_id).toBe(2)
            expect(tags[1].users[0].$extras.pivot_tag_id).toBe(2)
        })

        test('select extra pivot columns', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    pivotColumns: ['proficiency']
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }


            await db.insertQuery().table('users').insert([{username: 'virk'}, {username: 'nikk'}])
            await db.insertQuery().table('tags').insert([{name: 'Programming'}, {name: 'Dancing'}])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_id: 1,
                    tag_id: 1,
                    proficiency: 'expert',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: 1,
                    proficiency: 'beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: 2,
                    proficiency: 'beginner',
                    taggable_type: 'User'
                },
            ])

            const tags = await Tag.query().preload('users')
            expect(tags).toHaveLength(2)
            expect(tags[0].users).toHaveLength(2)
            expect(tags[1].users).toHaveLength(1)

            expect(tags[0].users[0].username).toBe('virk')
            expect(tags[0].users[0].$extras.pivot_taggable_id).toBe(1)
            expect(tags[0].users[0].$extras.pivot_tag_id).toBe(1)
            expect(tags[0].users[0].$extras.pivot_proficiency).toBe('expert')

            expect(tags[0].users[1].username).toBe('nikk')
            expect(tags[0].users[1].$extras.pivot_taggable_id).toBe(2)
            expect(tags[0].users[1].$extras.pivot_tag_id).toBe(1)
            expect(tags[0].users[1].$extras.pivot_proficiency).toBe('beginner')

            expect(tags[1].users[0].username).toBe('nikk')
            expect(tags[1].users[0].$extras.pivot_taggable_id).toBe(2)
            expect(tags[1].users[0].$extras.pivot_tag_id).toBe(2)
            expect(tags[1].users[0].$extras.pivot_proficiency).toBe('beginner')
        })

        test('select extra pivot columns at runtime', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }


            await db.insertQuery().table('users').insert([{username: 'virk'}, {username: 'nikk'}])
            await db.insertQuery().table('tags').insert([{name: 'Programming'}, {name: 'Dancing'}])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_id: 1,
                    tag_id: 1,
                    proficiency: 'expert',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: 1,
                    proficiency: 'beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: 2,
                    proficiency: 'beginner',
                    taggable_type: 'User'
                },
            ])

            const tags = await Tag.query().preload('users', (builder) => {
                builder.pivotColumns(['proficiency'])
            })

            expect(tags).toHaveLength(2)
            expect(tags[0].users).toHaveLength(2)
            expect(tags[1].users).toHaveLength(1)

            expect(tags[0].users[0].username).toBe('virk')
            expect(tags[0].users[0].$extras.pivot_taggable_id).toBe(1)
            expect(tags[0].users[0].$extras.pivot_tag_id).toBe(1)
            expect(tags[0].users[0].$extras.pivot_proficiency).toBe('expert')

            expect(tags[0].users[1].username).toBe('nikk')
            expect(tags[0].users[1].$extras.pivot_taggable_id).toBe(2)
            expect(tags[0].users[1].$extras.pivot_tag_id).toBe(1)
            expect(tags[0].users[1].$extras.pivot_proficiency).toBe('beginner')

            expect(tags[1].users[0].username).toBe('nikk')
            expect(tags[1].users[0].$extras.pivot_taggable_id).toBe(2)
            expect(tags[1].users[0].$extras.pivot_tag_id).toBe(2)
            expect(tags[1].users[0].$extras.pivot_proficiency).toBe('beginner')
        })

        test('cherry pick columns during preload', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert([{username: 'virk'}])
            await db.insertQuery().table('tags').insert([{name: 'Programming'}, {name: 'Dancing'}])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_id: 1,
                    taggable_type: 'User',
                    tag_id: 1,
                },
            ])

            const tags = await Tag.query().preload('users', (builder) => {
                return builder.select(['username'])
            })

            expect(tags).toHaveLength(2)
            expect(tags[0].users).toHaveLength(1)
            expect(tags[0].users[0].username).toBe('virk')
            expect(tags[0].users[0].$extras).toEqual({pivot_taggable_id: 1, pivot_tag_id: 1})
        })

        test('raise error when local key is not selected', async () => {
            expect.assertions(1)

            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert([{username: 'virk'}, {username: 'nikk'}])
            await db.insertQuery().table('tags').insert([{name: 'Programming'}, {name: 'Dancing'}])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_id: 1,
                    tag_id: 1,
                    taggable_type: 'User'
                },
                {
                    taggable_id: 1,
                    tag_id: 2,
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: 2,
                    taggable_type: 'User'
                },
            ])

            try {
                await Tag.query().select('name').preload('users')
            } catch ({message}) {
                expect(message).toBe('Cannot preload "users", value of "Tag.id" is undefined')
            }
        })

        test('do not run preload query when parent rows are empty', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const tags = await Tag.query().preload('users', () => {
                throw new Error('not expected to be here')
            })
            expect(tags).toHaveLength(0)
        })
    })

    describe('Model | MorphedByMany | Select', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        it('define columns as array', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public isActive: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query.select(['isActive']).toSQL();
            const {sql: knexSql, bindings: knexBindings} = db.from('users').select('users.is_active').toSQL();
            expect(sql).toBe(knexSql);
        });

        it('define columns with aliases', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public isActive: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query.select('isActive as a').toSQL();
            const {sql: knexSql, bindings: knexBindings} = db.from('users').select('users.is_active as a').toSQL();
            expect(sql).toBe(knexSql);
        });

        it('define columns as multiple arguments', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public isActive: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query.select('name', 'isActive').toSQL();
            const {sql: knexSql, bindings: knexBindings} = db.from('users').select('users.name', 'users.is_active').toSQL();
            expect(sql).toBe(knexSql);
        });

        it('define columns as object', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public isActive: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query.select({name: 'name', isActive: 'isActive'}).toSQL();
            const {sql: knexSql, bindings: knexBindings} =
                db.from('users').select({name: 'users.name', isActive: 'users.is_active'}).toSQL();
            expect(sql).toBe(knexSql);
        });

        it('define columns as multiple arguments with aliases', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public isActive: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query.select('name as n', 'isActive as a').toSQL();
            const {sql: knexSql, bindings: knexBindings} =
                db.from('users').select('users.name as n', 'users.is_active as a').toSQL();
            expect(sql).toBe(knexSql);
        });

        it('define columns as subqueries', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public isActive: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query.select(db.from('addresses').count('* as total').as('addresses_total')).toSQL();
            const {sql: knexSql, bindings: knexBindings} =
                db.from('users').select(db.from('addresses').count('* as total').as('addresses_total')).toSQL();
            expect(sql).toBe(knexSql);
        });

        it('define columns as subqueries inside an array', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public isActive: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query.select([db.from('addresses').count('* as total').as('addresses_total')]).toSQL();
            const {sql: knexSql, bindings: knexBindings} =
                db.from('users').select(db.from('addresses').count('* as total').as('addresses_total')).toSQL();
            expect(sql).toBe(knexSql);
        });
    });

    describe('Model | MorphedByMany | wherePivot', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        test('add where clause', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .wherePivot('username', 'virk')
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .where('taggables.username', 'virk')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add where wrapped clause', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }


            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .where((builder) => builder.wherePivot('username', 'virk'))
                ['toSQL']()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .where((builder) => builder.where('taggables.username', 'virk'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add where clause with operator', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }


            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .wherePivot('age', '>', 22)
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .where('taggables.age', '>', 22)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add where clause as a raw query', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }


            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .wherePivot('age', '>', db.rawQuery('select min_age from ages limit 1;'))
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .where(
                    'taggables.age',
                    '>',
                    db.connection().getWriteClient().raw('select min_age from ages limit 1;'),
                )
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add orWhere clause', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .wherePivot('age', '>', 22)
                .orWherePivot('age', 18)
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .where('taggables.age', '>', 22)
                .orWhere('taggables.age', 18)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add orWhere wrapped clause', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .wherePivot('age', '>', 22)
                .orWhere((builder) => {
                    builder.wherePivot('age', 18)
                })
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .where('taggables.age', '>', 22)
                .orWhere((builder) => {
                    builder.where('taggables.age', 18)
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('pass relationship metadata to the profiler', async () => {
            expect.assertions(1)

            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            await db.insertQuery().table('users').insert([{username: 'virk'}])
            await db.insertQuery().table('tags').insert([{name: 'Programming'}, {name: 'Dancing'}])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_id: 1,
                    tag_id: 1,
                    taggable_type: 'User'
                },
            ])

            const profiler = getProfiler(true)

            let profilerPacketIndex = 0
            profiler.process((packet) => {
                if (profilerPacketIndex === 1) {
                    expect(packet.data.relation).toEqual({
                        model: 'Tag',
                        relatedModel: 'User',
                        pivotTable: 'taggables',
                        type: 'manyToMany',
                    })
                }
                profilerPacketIndex++
            })

            await Tag.query({profiler}).preload('users')
        })
    })

    describe('Model | MorphedByMany | whereNotPivot', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        test('add where no clause', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true
            const {sql, bindings} = query.whereNotPivot('username', 'virk').toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereNot('taggables.username', 'virk')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add where not clause with operator', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereNotPivot('age', '>', 22)
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereNot('taggables.age', '>', 22)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add where not clause as a raw query', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereNotPivot('age', '>', db.rawQuery('select min_age from ages limit 1;'))
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereNot(
                    'taggables.age',
                    '>',
                    db.connection().getWriteClient().raw('select min_age from ages limit 1;'),
                )
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add orWhereNot clause', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereNotPivot('age', '>', 22)
                .orWhereNotPivot('age', 18)
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereNot('taggables.age', '>', 22)
                .orWhereNot('taggables.age', 18)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })

    describe('Model | MorphedByMany | whereInPivot', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        test('add whereIn clause', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereInPivot('username', ['virk', 'nikk'])
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereIn('taggables.username', ['virk', 'nikk'])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereIn as a query callback', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereInPivot('username', (builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereIn('taggables.username', (builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereIn as a subquery', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereInPivot('username', db.query().select('id').from('accounts'))
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereIn('taggables.username', db.connection().getWriteClient().select('id').from('accounts'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereIn as a rawquery', async () => {
            const ref = db.connection().getWriteClient().ref.bind(db.connection().getWriteClient())

            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereInPivot('username', [
                    db.rawQuery(`select ${ref('id')} from ${ref('accounts')}`),
                ])
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereIn('taggables.username', [
                    db.connection().getWriteClient().raw(`select ${ref('id')} from ${ref('accounts')}`),
                ])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereIn as a subquery with array of keys', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereInPivot(
                    ['username', 'email'],
                    db.query().select('username', 'email').from('accounts'),
                )
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereIn(
                    ['taggables.username', 'taggables.email'],
                    db.connection().getWriteClient().select('username', 'email').from('accounts'),
                )
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereIn as a 2d array', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereInPivot(['username', 'email'], [['foo', 'bar']])
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereIn(['taggables.username', 'taggables.email'], [['foo', 'bar']])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add orWhereIn clause', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereInPivot('username', ['virk', 'nikk'])
                .orWhereInPivot('username', ['foo'])
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereIn('taggables.username', ['virk', 'nikk'])
                .orWhereIn('taggables.username', ['foo'])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add orWhereIn as a query callback', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }


            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereInPivot('username', (builder) => {
                    builder.from('accounts')
                })
                .orWhereInPivot('username', (builder) => {
                    builder.from('employees')
                })
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereIn('taggables.username', (builder) => {
                    builder.from('accounts')
                })
                .orWhereIn('taggables.username', (builder) => {
                    builder.from('employees')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })

    describe('Model | MorphedByMany | whereNotInPivot', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        test('add whereNotIn clause', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }


            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereNotInPivot('username', ['virk', 'nikk'])
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereNotIn('taggables.username', ['virk', 'nikk'])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereNotIn as a query callback', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }


            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereNotInPivot('username', (builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereNotIn('taggables.username', (builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereNotIn as a sub query', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }


            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereNotInPivot('username', db.query().select('username').from('accounts'))
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereNotIn(
                    'taggables.username',
                    db.connection().getWriteClient().select('username').from('accounts'),
                )
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereNotIn as a 2d array', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }


            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereNotInPivot(['username', 'email'], [['foo', 'bar']])
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereNotIn(['taggables.username', 'taggables.email'], [['foo', 'bar']])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add orWhereNotIn clause', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }


            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereNotInPivot('username', ['virk', 'nikk'])
                .orWhereNotInPivot('username', ['foo'])
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereNotIn('taggables.username', ['virk', 'nikk'])
                .orWhereNotIn('taggables.username', ['foo'])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add orWhereNotIn as a subquery', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }


            const tag = new Tag()
            const query = tag!.related('users').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereNotInPivot('username', (builder) => {
                    builder.from('accounts')
                })
                .orWhereNotInPivot('username', (builder) => {
                    builder.from('employees')
                })
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('users')
                .whereNotIn('taggables.username', (builder) => {
                    builder.from('accounts')
                })
                .orWhereNotIn('taggables.username', (builder) => {
                    builder.from('employees')
                })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })

    describe('Model | MorphedByMany | save', () => {
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

        test('save related instance', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const user = new User()
            user.username = 'virk'

            const tag = new Tag()
            tag.name = 'Programming'
            await tag.save();

            await tag.related('users').save(user)

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('users').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalPosts[0].total)).toBe(1)

            expect(tagUsers).toHaveLength(1)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].taggable_type).toBe('User')
            expect(tagUsers[0].tag_id).toBe(tag.id)
            expect(user.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
        })

        test('do not attach duplicates when save is called more than once', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const user = new User()
            user.username = 'virk'

            const tag = new Tag()
            tag.name = 'Programming'
            await tag.save()

            await tag.related('users').save(user)
            await tag.related('users').save(user)

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()

            const totalTags = await db.query().from('tags').count('*', 'total')
            const totalUsers = await db.query().from('users').count('*', 'total')
            const taggable = await db.query().from('taggables')

            expect(Number(totalTags[0].total)).toBe(1)
            expect(Number(totalUsers[0].total)).toBe(1)

            expect(taggable).toHaveLength(1)
            expect(taggable[0].taggable_id).toBe(user.id)
            expect(taggable[0].tag_id).toBe(tag.id)

            expect(user.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
        })

        test('attach duplicates when save is called more than once with with checkExisting = false', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const user = new User()
            user.username = 'virk'

            const tag = new Tag()
            tag.name = 'Programming'
            await tag.save()

            await tag.related('users').save(user)
            await tag.related('users').save(user, false)

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()

            const totalTags = await db.query().from('tags').count('*', 'total')
            const totalUsers = await db.query().from('users').count('*', 'total')
            const taggables = await db.query().from('taggables')

            expect(Number(totalTags[0].total)).toBe(1)
            expect(Number(totalUsers[0].total)).toBe(1)

            expect(taggables).toHaveLength(2)
            expect(taggables[0].taggable_id).toBe(user.id)
            expect(taggables[0].tag_id).toBe(tag.id)

            expect(taggables[1].taggable_id).toBe(user.id)
            expect(taggables[1].tag_id).toBe(tag.id)

            expect(user.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
        })

        test('attach when related pivot entry exists but for a different parent @sanityCheck', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const user = new User()
            user.username = 'virk'

            const tag = new Tag()
            tag.name = 'Programming'
            await tag.save()

            const tag1 = new Tag()
            tag1.name = 'Being'
            await tag1.save()

            await tag.related('users').save(user)
            await tag1.related('users').save(user)

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const taggables = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalTags[0].total)).toBe(2)

            expect(taggables[0].taggable_id).toBe(user.id)
            expect(taggables[0].tag_id).toBe(tag.id)

            expect(taggables[1].taggable_id).toBe(user.id)
            expect(taggables[1].tag_id).toBe(tag1.id)

            expect(user.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
            expect(tag1.$trx).toBeUndefined()
        })
    })

    describe('Model | MorphedByMany | saveMany', () => {
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

        test('save many of related instance', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const user = new User()
            user.username = 'virk'
            const user1 = new User()
            user1.username = 'nikk'

            const tag = new Tag()
            tag.name = 'Programming'
            await tag.save()

            await tag.related('users').saveMany([user, user1])

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(2)
            expect(Number(totalTags[0].total)).toBe(1)

            expect(tagUsers).toHaveLength(2)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].taggable_type).toBe('User')
            expect(tagUsers[0].tag_id).toBe(tag.id)
            expect(tagUsers[1].taggable_id).toBe(user1.id)
            expect(tagUsers[1].tag_id).toBe(tag.id)

            expect(user.$trx).toBeUndefined()
            expect(user1.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
        })

        test('do not attach duplicates when saveMany is called more than once', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const user = new User()
            user.username = 'virk'
            const user1 = new User()
            user1.username = 'nikk'

            const tag = new Tag()
            tag.name = 'Programming'
            await tag.save()

            await tag.related('users').saveMany([user, user1])
            await tag.related('users').saveMany([user, user1])

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(2)
            expect(Number(totalTags[0].total)).toBe(1)

            expect(tagUsers).toHaveLength(2)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(tag.id)
            expect(tagUsers[1].taggable_id).toBe(user1.id)
            expect(tagUsers[1].tag_id).toBe(tag.id)

            expect(user.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
            expect(user1.$trx).toBeUndefined()
        })

        test('attach duplicates when saveMany is called more than once with checkExisting = false', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const user = new User()
            user.username = 'virk'
            const user1 = new User()
            user1.username = 'nikk'

            const tag = new Tag()
            tag.name = 'Programming'
            await tag.save()

            await tag.related('users').saveMany([user, user1])
            await tag.related('users').saveMany([user, user1], false)

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(2)
            expect(Number(totalTags[0].total)).toBe(1)

            expect(tagUsers).toHaveLength(4)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(tag.id)
            expect(tagUsers[1].taggable_id).toBe(user1.id)
            expect(tagUsers[1].tag_id).toBe(tag.id)

            expect(tagUsers[2].taggable_id).toBe(user.id)
            expect(tagUsers[2].tag_id).toBe(tag.id)
            expect(tagUsers[3].taggable_id).toBe(user1.id)
            expect(tagUsers[3].tag_id).toBe(tag.id)

            expect(user.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
            expect(user1.$trx).toBeUndefined()
        })

        test('attach when related pivot entry exists but for a different parent @sanityCheck', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const user = new User()
            user.username = 'virk'
            const user1 = new User()
            user1.username = 'nikk'

            const tag = new Tag()
            tag.name = 'Programming'
            await tag.save()

            const tag1 = new Tag()
            tag1.name = 'Cooking'

            await tag.related('users').saveMany([user, user1])
            await tag1.related('users').saveMany([user, user1])

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()
            expect(user1.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(2)
            expect(Number(totalTags[0].total)).toBe(2)

            expect(tagUsers).toHaveLength(4)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(tag.id)
            expect(tagUsers[1].taggable_id).toBe(user1.id)
            expect(tagUsers[1].tag_id).toBe(tag.id)

            expect(tagUsers[2].taggable_id).toBe(user.id)
            expect(tagUsers[2].tag_id).toBe(tag1.id)
            expect(tagUsers[3].taggable_id).toBe(user1.id)
            expect(tagUsers[3].tag_id).toBe(tag1.id)

            expect(user.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
            expect(tag1.$trx).toBeUndefined()
        })

        test('wrap saveMany inside a custom transaction', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const trx = await db.transaction()

            const user = new User()
            user.username = 'virk'
            const user1 = new User()
            user1.username = 'nikk'

            const tag = new Tag()
            tag.name = 'Programming'
            tag.$trx = trx
            await tag.save()


            const tag1 = new Tag()
            tag1.$trx = trx
            tag1.name = 'Cooking'

            await tag.related('users').saveMany([user, user1])
            await tag1.related('users').saveMany([user, user1])

            expect(user.$trx.isCompleted).toBeFalsy()
            expect(user1.$trx.isCompleted).toBeFalsy()

            await trx.rollback()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalTags[0].total)).toBe(0)

            expect(tagUsers).toHaveLength(0)
        })
    })

    describe('Model | MorphedByMany | create', () => {
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

        test('create related instance', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const tag = new Tag()
            tag.name = 'Programming'
            await tag.save()

            const user = await tag.related('users').create({username: 'virk'})

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalTags[0].total)).toBe(1)

            expect(tagUsers).toHaveLength(1)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].taggable_type).toBe('User')
            expect(tagUsers[0].tag_id).toBe(tag.id)
            expect(user.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
        })

        test('wrap create inside a custom transaction', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const trx = await db.transaction()

            const tag = new Tag()
            tag.name = 'Programming'
            tag.$trx = trx
            await tag.save()

            const user = await tag.related('users').create({username: 'virk'})
            expect(user.$trx.isCompleted).toBeFalsy()
            expect(tag.$trx!.isCompleted).toBeFalsy()

            await trx.commit()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalTags[0].total)).toBe(1)

            expect(tagUsers).toHaveLength(1)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(tag.id)

            expect(user.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
        })
    })

    describe('Model | MorphedByMany | createMany', () => {
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

        test('create many of related instance', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const tag = new Tag()
            tag.name = 'virk'
            await tag.save()

            const [user, user1] = await tag.related('users').createMany([
                {username: 'Programming'},
                {username: 'Cooking'},
            ])

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()
            expect(user1.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(2)
            expect(Number(totalTags[0].total)).toBe(1)

            expect(tagUsers).toHaveLength(2)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].taggable_type).toBe('User')
            expect(tagUsers[0].tag_id).toBe(tag.id)

            expect(tagUsers[1].taggable_id).toBe(user1.id)
            expect(tagUsers[1].tag_id).toBe(tag.id)

            expect(user.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
            expect(user1.$trx).toBeUndefined()
        })

        test('wrap create many inside a custom transaction', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const trx = await db.transaction()

            const tag = new Tag()
            tag.name = 'virk'
            tag.$trx = trx
            await tag.save()

            const [user, user1] = await tag.related('users').createMany([
                {username: 'Programming'},
                {username: 'Cooking'},
            ])

            expect(user.$trx.isCompleted).toBeFalsy()
            expect(tag.$trx!.isCompleted).toBeFalsy()
            expect(user1.$trx!.isCompleted).toBeFalsy()

            await trx.rollback()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalTags[0].total)).toBe(0)
            expect(tagUsers).toHaveLength(0)
        })
    })

    describe('Model | MorphedByMany | attach', () => {
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

        test('attach one or more ids to the pivot table', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const tag = new Tag()
            tag.name = 'virk'
            await tag.save()

            await tag.related('users').attach([1, 2])

            expect(tag.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalTags[0].total)).toBe(1)

            expect(tagUsers).toHaveLength(2)
            expect(tagUsers[0].taggable_id).toBe(1)
            expect(tagUsers[0].taggable_type).toBe('User')
            expect(tagUsers[0].tag_id).toBe(tag.id)

            expect(tagUsers[1].taggable_id).toBe(2)
            expect(tagUsers[1].tag_id).toBe(tag.id)
        })

        test('attach with extra attributes', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const tag = new Tag()
            tag.name = 'virk'
            await tag.save()

            await tag.related('users').attach({
                1: {
                    proficiency: 'Beginner',
                },
                2: {
                    proficiency: 'Master',
                },
            })

            expect(tag.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalTags[0].total)).toBe(1)

            expect(tagUsers).toHaveLength(2)
            expect(tagUsers[0].taggable_id).toBe(1)
            expect(tagUsers[0].tag_id).toBe(tag.id)
            expect(tagUsers[0].proficiency).toBe('Beginner')

            expect(tagUsers[1].taggable_id).toBe(2)
            expect(tagUsers[1].tag_id).toBe(tag.id)
            expect(tagUsers[1].proficiency).toBe('Master')
        })
    })

    describe('Model | MorphedByMany | detach', () => {
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

        test('detach one or more ids from the pivot table', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const tag = new Tag()
            tag.name = 'virk'
            await tag.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: 1,
                    tag_id: tag.id,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: tag.id,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
            ])

            await tag.related('users').detach([1])

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalTags[0].total)).toBe(1)

            expect(tagUsers).toHaveLength(1)
            expect(tagUsers[0].taggable_id).toBe(2)
            expect(tagUsers[0].taggable_type).toBe('User')
            expect(tagUsers[0].tag_id).toBe(tag.id)
        })

        test('scope detach self to @sanityCheck', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const tag = new Tag()
            tag.name = 'virk'
            await tag.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: 1,
                    tag_id: tag.id,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: 2,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
            ])

            await tag.related('users').detach([2])

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalTags[0].total)).toBe(1)

            expect(tagUsers).toHaveLength(2)
            expect(tagUsers[0].taggable_id).toBe(1)
            expect(tagUsers[0].tag_id).toBe(tag.id)

            expect(tagUsers[1].taggable_id).toBe(2)
            expect(tagUsers[1].tag_id).toBe(2)
        })
    })

    describe('Model | MorphedByMany | sync', () => {
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

        test('sync ids by dropping only the missing one\'s', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const tag = new Tag()
            tag.name = 'virk'
            await tag.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: 1,
                    tag_id: tag.id,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: tag.id,
                    proficiency: 'Master',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 1,
                    tag_id: 2,
                    proficiency: 'Master',
                    taggable_type: 'User'
                },
            ])

            await tag.related('users').sync([1])

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalTags[0].total)).toBe(1)
            expect(tagUsers).toHaveLength(2);

            expect(tagUsers[0].id).toBe(1)
            expect(tagUsers[0].taggable_id).toBe(1)
            expect(tagUsers[0].taggable_type).toBe('User')
            expect(tagUsers[0].tag_id).toBe(tag.id)

            expect(tagUsers[1].id).toBe(3)
            expect(tagUsers[1].taggable_id).toBe(1)
            expect(tagUsers[1].tag_id).toBe(2)
        })

        test('keep duplicates of the id under sync', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const tag = new Tag()
            tag.name = 'virk'
            await tag.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: 1,
                    tag_id: tag.id,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: tag.id,
                    proficiency: 'Master',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 1,
                    tag_id: tag.id,
                    proficiency: 'Master',
                    taggable_type: 'User'
                },
            ])

            await tag.related('users').sync([1])

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalTags[0].total)).toBe(1)
            expect(tagUsers).toHaveLength(2);

            expect(tagUsers[0].id).toBe(1)
            expect(tagUsers[0].taggable_id).toBe(1)
            expect(tagUsers[0].tag_id).toBe(tag.id)

            expect(tagUsers[1].id).toBe(3)
            expect(tagUsers[1].taggable_id).toBe(1)
            expect(tagUsers[1].tag_id).toBe(tag.id)
        })

        test('update pivot rows when additional properties are changed', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const tag = new Tag()
            tag.name = 'virk'
            await tag.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: 1,
                    tag_id: tag.id,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: tag.id,
                    proficiency: 'Master',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 1,
                    tag_id: 2,
                    proficiency: 'Master',
                    taggable_type: 'User'
                },
            ])

            await tag.related('users').sync({
                1: {
                    proficiency: 'Intermediate',
                },
            })

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables').orderBy('id', 'asc')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalTags[0].total)).toBe(1)
            expect(tagUsers).toHaveLength(2);

            expect(tagUsers[0].id).toBe(1)
            expect(tagUsers[0].taggable_id).toBe(1)
            expect(tagUsers[0].tag_id).toBe(tag.id)
            expect(tagUsers[0].proficiency).toBe('Intermediate')

            expect(tagUsers[1].id).toBe(3)
            expect(tagUsers[1].taggable_id).toBe(1)
            expect(tagUsers[1].tag_id).toBe(2)
            expect(tagUsers[1].proficiency).toBe('Master')
        })

        test('do not update pivot row when no extra properties are defined', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const tag = new Tag()
            tag.name = 'virk'
            await tag.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: 1,
                    tag_id: tag.id,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: tag.id,
                    proficiency: 'Master',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 1,
                    tag_id: 2,
                    proficiency: 'Master',
                    taggable_type: 'User'
                },
            ])

            await tag.related('users').sync({1: {}})

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalTags[0].total)).toBe(1)
            expect(tagUsers).toHaveLength(2);

            expect(tagUsers[0].id).toBe(1)
            expect(tagUsers[0].taggable_id).toBe(1)
            expect(tagUsers[0].tag_id).toBe(tag.id)
            expect(tagUsers[0].proficiency).toBe('Beginner')

            expect(tagUsers[1].id).toBe(3)
            expect(tagUsers[1].taggable_id).toBe(1)
            expect(tagUsers[1].tag_id).toBe(2)
            expect(tagUsers[1].proficiency).toBe('Master')
        })

        test('do not remove rows when detach = false', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const tag = new Tag()
            tag.name = 'virk'
            await tag.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: 1,
                    tag_id: tag.id,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 1,
                    tag_id: tag.id,
                    proficiency: 'Master',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 1,
                    tag_id: 2,
                    proficiency: 'Master',
                    taggable_type: 'User'
                },
            ])

            await tag.related('users').sync([1], false)

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalTags[0].total)).toBe(1)
            expect(tagUsers).toHaveLength(3);

            expect(tagUsers[0].id).toBe(1)
            expect(tagUsers[0].taggable_id).toBe(1)
            expect(tagUsers[0].tag_id).toBe(tag.id)
            expect(tagUsers[0].proficiency).toBe('Beginner')

            expect(tagUsers[1].id).toBe(2)
            expect(tagUsers[1].taggable_id).toBe(1)
            expect(tagUsers[1].tag_id).toBe(tag.id)
            expect(tagUsers[1].proficiency).toBe('Master')

            expect(tagUsers[2].id).toBe(3)
            expect(tagUsers[2].taggable_id).toBe(1)
            expect(tagUsers[2].tag_id).toBe(2)
            expect(tagUsers[2].proficiency).toBe('Master')
        })

        test('do not remove rows when nothing has changed', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const tag = new Tag()
            tag.name = 'virk'
            await tag.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: 1,
                    tag_id: tag.id,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: tag.id,
                    proficiency: 'Master',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: 1,
                    proficiency: 'Master',
                    taggable_type: 'User'
                },
            ])

            await tag.related('users').sync([1, 2])

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalTags[0].total)).toBe(1)
            expect(tagUsers).toHaveLength(3)

            expect(tagUsers[0].id).toBe(1)
            expect(tagUsers[0].taggable_id).toBe(1)
            expect(tagUsers[0].tag_id).toBe(tag.id)
            expect(tagUsers[0].proficiency).toBe('Beginner')

            expect(tagUsers[1].id).toBe(2)
            expect(tagUsers[1].taggable_id).toBe(2)
            expect(tagUsers[1].tag_id).toBe(tag.id)
            expect(tagUsers[1].proficiency).toBe('Master')

            expect(tagUsers[2].id).toBe(3)
            expect(tagUsers[2].taggable_id).toBe(2)
            expect(tagUsers[2].tag_id).toBe(1)
            expect(tagUsers[2].proficiency).toBe('Master')
        })

        test('use custom transaction', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            const tag = new Tag()
            tag.name = 'virk'
            await tag.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: 1,
                    tag_id: tag.id,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: tag.id,
                    proficiency: 'Master',
                    taggable_type: 'User'
                },
                {
                    taggable_id: 1,
                    tag_id: 2,
                    proficiency: 'Master',
                    taggable_type: 'User'
                },
            ])

            const trx = await db.transaction()
            await tag.related('users').sync({
                1: {
                    proficiency: 'Intermediate',
                },
                3: {
                    proficiency: 'Intermediate',
                },
            }, true, trx)

            await trx.rollback()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalTags[0].total)).toBe(1)
            expect(tagUsers).toHaveLength(3)

            expect(tagUsers[0].id).toBe(1)
            expect(tagUsers[0].taggable_id).toBe(1)
            expect(tagUsers[0].tag_id).toBe(tag.id)
            expect(tagUsers[0].proficiency).toBe('Beginner')

            expect(tagUsers[1].id).toBe(2)
            expect(tagUsers[1].taggable_id).toBe(2)
            expect(tagUsers[1].tag_id).toBe(tag.id)
            expect(tagUsers[1].proficiency).toBe('Master')

            expect(tagUsers[2].id).toBe(3)
            expect(tagUsers[2].taggable_id).toBe(1)
            expect(tagUsers[2].tag_id).toBe(2)
            expect(tagUsers[2].proficiency).toBe('Master')
        })
    })

    describe('Model | MorphedByMany | pagination', () => {
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

        test('paginate using related model query builder instance', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            await db.table('users').insert([{username: 'virk'},{username: 'nikk'}])
            await db.insertQuery().table('tags').insert([
                {name: 'Programming'},
                {name: 'Dancing'},
                {name: 'Singing'},
            ])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_id: 1,
                    taggable_type: 'User',
                    tag_id: 1,
                },
                {
                    taggable_id: 2,
                    taggable_type: 'User',
                    tag_id: 1,
                },
            ])

            const tag = await Tag.find(1)
            const users = await tag!.related('users').query().paginate(1, 1)

            users.baseUrl('/users')

            expect(users.all()).toHaveLength(1)
            expect(users.all()[0]).toBeInstanceOf(User)
            expect(users.all()[0].$extras).not.toHaveProperty('total');
            expect(users.perPage).toBe(1)
            expect(users.currentPage).toBe(1)
            expect(users.lastPage).toBe(2)
            expect(users.hasPages).toBeTruthy()
            expect(users.hasMorePages).toBeTruthy()
            expect(users.isEmpty).toBeFalsy()
            expect(Number(users.total)).toBe(2)
            expect(users.hasTotal).toBeTruthy()
            expect(users.getMeta()).toEqual({
                total: 2,
                per_page: 1,
                current_page: 1,
                last_page: 2,
                first_page: 1,
                first_page_url: '/users?page=1',
                last_page_url: '/users?page=2',
                next_page_url: '/users?page=2',
                previous_page_url: null,
            })
        })

        test('disallow paginate during preload', async () => {
            expect.assertions(1)

            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            await db.table('users').insert({username: 'virk'})
            await db.insertQuery().table('tags').insert([
                {name: 'Programming'},
                {name: 'Dancing'},
                {name: 'Singing'},
            ])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_id: 1,
                    taggable_type: 'User',
                    tag_id: 1,
                },
                {
                    taggable_id: 1,
                    taggable_type: 'User',
                    tag_id: 2,
                },
            ])

            try {
                await Tag.query().preload('users', (query) => {
                    query.paginate(1, 5)
                })
            } catch ({message}) {
                expect(message).toBe('Cannot paginate relationship "users" during preload')
            }
        })
    })

    describe('Model | MorphedByMany | clone', () => {
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

        test('clone related model query builder', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            await db.table('users').insert({username: 'virk'})
            await db.insertQuery().table('tags').insert([
                {name: 'Programming'},
                {name: 'Dancing'},
                {name: 'Singing'},
            ])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_id: 1,
                    taggable_type: 'User',
                    tag_id: 1,
                },
                {
                    taggable_id: 1,
                    taggable_type: 'User',
                    tag_id: 2,
                },
            ])

            const tag = await Tag.find(1)
            const clonedQuery = tag!.related('users').query().clone()
            expect(clonedQuery).toBeInstanceOf(MorphToManyQueryBuilder)
        })
    })

    describe('Model | MorphedByMany | scopes', () => {
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

        test('apply scopes during eagerload', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                public static virkOnly = scope((query) => {
                    query.where('username', 'virk')
                })
            }

            await db.table('users').insert([{username: 'virk'},{username: 'nikk'}])
            await db.insertQuery().table('tags').insert([
                {name: 'Programming'},
                {name: 'Dancing'},
                {name: 'Singing'},
            ])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_id: 1,
                    tag_id: 1,
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: 1,
                    taggable_type: 'User'
                },
            ])

            const tag = await Tag.query().preload('users', (query) => {
                query.apply((scopes) => scopes.virkOnly())
            }).firstOrFail()

            const userWithoutScopes = await Tag.query().preload('users').firstOrFail()

            expect(tag.users).toHaveLength(1)
            expect(userWithoutScopes.users).toHaveLength(2)
            expect(tag.users[0].username).toBe('virk')
        })

        test('apply scopes on related query', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                public static virkOnly = scope((query) => {
                    query.where('username', 'virk')
                })
            }

            await db.table('users').insert([{username: 'virk'},{username: 'nikk'}])
            await db.insertQuery().table('tags').insert([
                {name: 'Programming'},
                {name: 'Dancing'},
                {name: 'Singing'},
            ])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_id: 1,
                    tag_id: 1,
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: 1,
                    taggable_type: 'User'
                },
            ])

            const tag = await Tag.findOrFail(1)
            const users = await tag.related('users').query().apply((scopes) => scopes.virkOnly())
            const usersWithoutScope = await tag.related('users').query()

            expect(users).toHaveLength(1)
            expect(usersWithoutScope).toHaveLength(2)
            expect(users[0].username).toBe('virk')
        })
    })

    describe('Model | MorphedByMany | global scopes', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
            await db.table('users').insert([{username: 'virk'},{username: 'nikk'}])
            await db.insertQuery().table('tags').insert([
                {name: 'Programming'},
                {name: 'Dancing'},
                {name: 'Singing'},
            ])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_id: 1,
                    tag_id: 1,
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: 1,
                    taggable_type: 'User'
                },
            ])
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        it('apply scopes during eagerload', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                public static boot() {
                    this.addGlobalScope(query => query.where('username', 'Programming'))
                }
            }

            db.enableQueryLog();
            await Tag.query().preload('users').firstOrFail();

            const {sql} = db.getQueryLog()[1];
            const {sql: knexSql} = db.from('users')
                .select('users.*', 'taggables.tag_id as pivot_tag_id', 'taggables.taggable_id as pivot_taggable_id')
                .innerJoin('taggables', 'users.id', 'taggables.taggable_id')
                .where('taggables.taggable_type', 'User')
                .whereIn('taggables.tag_id', [1])
                .where('username', 'Programming').toSQL();
            expect(sql).toEqual(knexSql);
        });

        it('apply scopes on related query', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                public static boot() {
                    this.addGlobalScope(query => query.where('username', 'Programming'))
                }
            }

            db.enableQueryLog();
            const tag = await Tag.findOrFail(1)
            const users = await tag.related('users').query();

            const {sql} = db.getQueryLog()[1];
            const {sql: knexSql} = db.from('users')
                .select('users.*', 'taggables.tag_id as pivot_tag_id', 'taggables.taggable_id as pivot_taggable_id')
                .innerJoin('taggables', 'users.id', 'taggables.taggable_id')
                .where('taggables.taggable_type', 'User')
                .where('taggables.tag_id', 1)
                .where('username', 'Programming').toSQL();
            expect(sql).toEqual(knexSql);
        });

        it('apply scopes on related paginate', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                public static boot() {
                    this.addGlobalScope(query => query.where('username', 'virk'))
                }
            }

            const tag = await Tag.findOrFail(1);
            db.enableQueryLog();
            await tag.related('users').query().paginate(1, 20);

            {
                const {sql} = db.getQueryLog()[0];
                const {sql: knexSql} = db.from('users')
                    .innerJoin('taggables', 'users.id', 'taggables.taggable_id')
                    .where('taggables.taggable_type', 'User')
                    .where('taggables.tag_id', 1)
                    .where('username', 'Programming')
                    .count('* as total')
                    .toSQL();
                expect(sql).toEqual(knexSql);
            }

            {
                const {sql} = db.getQueryLog()[1];
                const {sql: knexSql} = db.from('users')
                    .select('users.*', 'taggables.tag_id as pivot_tag_id', 'taggables.taggable_id as pivot_taggable_id')
                    .innerJoin('taggables', 'users.id', 'taggables.taggable_id')
                    .where('taggables.taggable_type', 'User')
                    .where('taggables.tag_id', 1)
                    .where('username', 'Programming')
                    .limit(20)
                    .toSQL();
                expect(sql).toEqual(knexSql);
            }
        });
    });

    describe('Model | MorphedByMany | onQuery', () => {
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

        test('invoke onQuery method when preloading relationship', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    onQuery: (query) => query.where('username', 'virk'),
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            await db.table('users').insert({username: 'virk'})
            await db.insertQuery().table('tags').insert([
                {name: 'Programming'},
                {name: 'Dancing'},
                {name: 'Singing'},
            ])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_id: 1,
                    tag_id: 1,
                    taggable_type: 'User'
                },
                {
                    taggable_id: 1,
                    tag_id: 2,
                    taggable_type: 'User'
                },
            ])

            const tag = await Tag.query().preload('users').firstOrFail()
            expect(tag.users).toHaveLength(1)
            expect(tag.users[0].username).toBe('virk')
        })

        test('do not invoke onQuery method during preloading subqueries', async () => {
            expect.assertions(3)

            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    onQuery: (query) => {
                        expect(true).toBeTruthy()
                        query.where('username', 'virk')
                    },
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            await db.table('users').insert({username: 'virk'})
            await db.insertQuery().table('tags').insert([
                {name: 'Programming'},
                {name: 'Dancing'},
                {name: 'Singing'},
            ])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_id: 1,
                    tag_id: 1,
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: 1,
                    taggable_type: 'User'
                },
            ])

            const tag = await Tag.query().preload('users', (query) => {
                query.where(() => {
                })
            }).firstOrFail()

            expect(tag.users).toHaveLength(1)
            expect(tag.users[0].username).toBe('virk')
        })

        test('invoke onQuery method on related query builder', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    onQuery: (query) => query.where('username', 'virk'),
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            await db.table('users').insert({username: 'virk'})
            await db.insertQuery().table('tags').insert([
                {name: 'Programming'},
                {name: 'Dancing'},
                {name: 'Singing'},
            ])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_id: 1,
                    tag_id: 1,
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: 1,
                    taggable_type: 'User'
                },
            ])

            const tag = await Tag.findOrFail(1)
            const users = await tag.related('users').query()
            expect(users).toHaveLength(1)
            expect(users[0].username).toBe('virk')
        })

        test('invoke onQuery method on pivot query builder', async () => {
            expect.assertions(1)

            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphedByMany(() => User, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    onQuery: (query) => {
                        expect(query.isPivotOnlyQuery).toBeTruthy()
                    },
                })
                public users: MorphedByMany<typeof User>
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string
            }

            await db.table('users').insert({username: 'virk'})
            await db.insertQuery().table('tags').insert([
                {name: 'Programming'},
                {name: 'Dancing'},
                {name: 'Singing'},
            ])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_id: 1,
                    tag_id: 1,
                    taggable_type: 'User'
                },
                {
                    taggable_id: 2,
                    tag_id: 1,
                    taggable_type: 'User'
                },
            ])

            const tag = await Tag.findOrFail(1)
            await tag.related('users').pivotQuery()
        })
    })

    describe('Model HasQuery', () => {
        let Tag;
        let User;

        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
            class UserModel extends BaseModel {
                static table = 'users';
                @column({ isPrimary: true })
                public id: number

                @column()
                public uid: number
            }

            class TagModel extends BaseModel {
                static table = 'tags';

                @column({isPrimary: true})
                public id: number

                @column()
                public uid: number

                @column()
                public name: string

                @morphedByMany(() => UserModel, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    localKey: 'uid'
                })
                public users: MorphedByMany<typeof UserModel>;
            }

            User = UserModel;
            Tag = TagModel;
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        afterEach(async () => {
            await resetTables()
        })

        it('has query', async () => {
            const {sql, bindings} = Tag.query().where('id', 1).has('users').toSQL();
            const {sql: knexSql} = db
                .from('tags')
                .select('*')
                .where('id', 1)
                .whereExists(builder => {
                    builder
                        .from('users')
                        .select('users.*')
                        .select({
                            'pivot_tag_id': 'taggables.tag_id',
                            'pivot_taggable_id': 'taggables.taggable_id'
                        })
                        .innerJoin(
                            'taggables',
                            'users.id',
                            'taggables.taggable_id'
                        )
                        .where('taggables.taggable_type', 'tag')
                        .whereRaw('tags.uid = taggables.tag_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('withcount query', async () => {
            const {sql, bindings} = Tag.query().where('id', 1).withCount('users').toSQL();

            const q = db.from('users')
                .innerJoin(
                    'taggables',
                    'users.id',
                    'taggables.taggable_id'
                )
                .where('taggables.taggable_type', 'tag')
                .whereRaw('tags.uid = taggables.tag_id')
                .count('*')

            const {sql: knexSql} = db
                .from('tags')
                .select('tags.*')
                .where('id', 1)
                .selectSub(q, 'users_count')
                .toSQL();
            expect(sql).toBe(knexSql);
        });

        it('orHas query', async () => {
            const {sql, bindings} = Tag.query().where('id', 1).orHas('users').toSQL();
            const {sql: knexSql} = db
                .from('tags')
                .select('*')
                .where('id', 1)
                .orWhereExists(builder => {
                    builder
                        .from('users')
                        .select('users.*')
                        .select({
                            'pivot_tag_id': 'taggables.tag_id',
                            'pivot_taggable_id': 'taggables.taggable_id'
                        })
                        .innerJoin(
                            'taggables',
                            'users.id',
                            'taggables.taggable_id'
                        )
                        .where('taggables.taggable_type', 'tag')
                        .whereRaw('tags.uid = taggables.tag_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('whereHas query', async () => {
            const {sql, bindings} = Tag.query().where('id', 1).whereHas('users').toSQL();
            const {sql: knexSql} = db
                .from('tags')
                .select('*')
                .where('id', 1)
                .whereExists(builder => {
                    builder
                        .from('users')
                        .select('users.*')
                        .select({
                            'pivot_tag_id': 'taggables.tag_id',
                            'pivot_taggable_id': 'taggables.taggable_id'
                        })
                        .innerJoin(
                            'taggables',
                            'users.id',
                            'taggables.taggable_id'
                        )
                        .where('taggables.taggable_type', 'tag')
                        .whereRaw('tags.uid = taggables.tag_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('whereHas use callback query', async () => {
            const {sql, bindings} = Tag.query().where('id', 1).whereHas('users', query => {
                query.where(query.qualifyColumn('id'), 1)
            }).toSQL();
            const {sql: knexSql} = db
                .from('tags')
                .select('*')
                .where('id', 1)
                .whereExists(builder => {
                    builder
                        .from('users')
                        .select('users.*')
                        .select({
                            'pivot_tag_id': 'taggables.tag_id',
                            'pivot_taggable_id': 'taggables.taggable_id'
                        })
                        .innerJoin(
                            'taggables',
                            'users.id',
                            'taggables.taggable_id'
                        )
                        .where('taggables.taggable_type', 'tag')
                        .whereRaw('tags.uid = taggables.tag_id')
                        .where('users.id', 1)
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orWhereHas query', async () => {
            const {sql, bindings} = Tag.query().where('id', 1).orWhereHas('users').toSQL();
            const {sql: knexSql} = db
                .from('tags')
                .select('*')
                .where('id', 1)
                .orWhereExists(builder => {
                    builder
                        .from('users')
                        .select('users.*')
                        .select({
                            'pivot_tag_id': 'taggables.tag_id',
                            'pivot_taggable_id': 'taggables.taggable_id'
                        })
                        .innerJoin(
                            'taggables',
                            'users.id',
                            'taggables.taggable_id'
                        )
                        .where('taggables.taggable_type', 'tag')
                        .whereRaw('tags.uid = taggables.tag_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orWhereHas using callback query', async () => {
            const {sql, bindings} = Tag.query().where('id', 1).orWhereHas('users', query => {
                query.where(query.qualifyColumn('id'), 1)
            }).toSQL();
            const {sql: knexSql} = db
                .from('tags')
                .select('*')
                .where('id', 1)
                .orWhereExists(builder => {
                    builder
                        .from('users')
                        .select('users.*')
                        .select({
                            'pivot_tag_id': 'taggables.tag_id',
                            'pivot_taggable_id': 'taggables.taggable_id'
                        })
                        .innerJoin(
                            'taggables',
                            'users.id',
                            'taggables.taggable_id'
                        )
                        .where('taggables.taggable_type', 'tag')
                        .whereRaw('tags.uid = taggables.tag_id')
                        .where('users.id', 1)
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('doesntHave query', async () => {
            const {sql, bindings} = Tag.query().where('id', 1).doesntHave('users').toSQL();
            const {sql: knexSql} = db
                .from('tags')
                .select('*')
                .where('id', 1)
                .whereNotExists(builder => {
                    builder
                        .from('users')
                        .select('users.*')
                        .select({
                            'pivot_tag_id': 'taggables.tag_id',
                            'pivot_taggable_id': 'taggables.taggable_id'
                        })
                        .innerJoin(
                            'taggables',
                            'users.id',
                            'taggables.taggable_id'
                        )
                        .where('taggables.taggable_type', 'tag')
                        .whereRaw('tags.uid = taggables.tag_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orDoesntHave query', async () => {
            const {sql, bindings} = Tag.query().where('id', 1).orDoesntHave('users').toSQL();
            const {sql: knexSql} = db
                .from('tags')
                .select('*')
                .where('id', 1)
                .orWhereNotExists(builder => {
                    builder
                        .from('users')
                        .select('users.*')
                        .select({
                            'pivot_tag_id': 'taggables.tag_id',
                            'pivot_taggable_id': 'taggables.taggable_id'
                        })
                        .innerJoin(
                            'taggables',
                            'users.id',
                            'taggables.taggable_id'
                        )
                        .where('taggables.taggable_type', 'tag')
                        .whereRaw('tags.uid = taggables.tag_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('whereDoesntHave query', async () => {
            const {sql, bindings} = Tag.query().where('id', 1).whereDoesntHave('users').toSQL();
            const {sql: knexSql} = db
                .from('tags')
                .select('*')
                .where('id', 1)
                .whereNotExists(builder => {
                    builder
                        .from('users')
                        .select('users.*')
                        .select({
                            'pivot_tag_id': 'taggables.tag_id',
                            'pivot_taggable_id': 'taggables.taggable_id'
                        })
                        .innerJoin(
                            'taggables',
                            'users.id',
                            'taggables.taggable_id'
                        )
                        .where('taggables.taggable_type', 'tag')
                        .whereRaw('tags.uid = taggables.tag_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('whereDoesntHave using callback query', async () => {
            const {sql, bindings} = Tag.query().where('id', 1).whereDoesntHave('users', query => {
                query.where(query.qualifyColumn('id'), 1)
            }).toSQL();
            const {sql: knexSql} = db
                .from('tags')
                .select('*')
                .where('id', 1)
                .whereNotExists(builder => {
                    builder
                        .from('users')
                        .select('users.*')
                        .select({
                            'pivot_tag_id': 'taggables.tag_id',
                            'pivot_taggable_id': 'taggables.taggable_id'
                        })
                        .innerJoin(
                            'taggables',
                            'users.id',
                            'taggables.taggable_id'
                        )
                        .where('taggables.taggable_type', 'tag')
                        .whereRaw('tags.uid = taggables.tag_id')
                        .where('users.id', 1)
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orWhereDoesntHave query', async () => {
            const {sql, bindings} = Tag.query().where('id', 1).orWhereDoesntHave('users').toSQL();
            const {sql: knexSql} = db
                .from('tags')
                .select('*')
                .where('id', 1)
                .orWhereNotExists(builder => {
                    builder
                        .from('users')
                        .select('users.*')
                        .select({
                            'pivot_tag_id': 'taggables.tag_id',
                            'pivot_taggable_id': 'taggables.taggable_id'
                        })
                        .innerJoin(
                            'taggables',
                            'users.id',
                            'taggables.taggable_id'
                        )
                        .where('taggables.taggable_type', 'tag')
                        .whereRaw('tags.uid = taggables.tag_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orWhereDoesntHave using callback query', async () => {
            const {sql, bindings} = Tag.query().where('id', 1).orWhereDoesntHave('users', query => {
                query.where(query.qualifyColumn('id'), 1)
            }).toSQL();
            const {sql: knexSql} = db
                .from('tags')
                .select('*')
                .where('id', 1)
                .orWhereNotExists(builder => {
                    builder
                        .from('users')
                        .select('users.*')
                        .select({
                            'pivot_tag_id': 'taggables.tag_id',
                            'pivot_taggable_id': 'taggables.taggable_id'
                        })
                        .innerJoin(
                            'taggables',
                            'users.id',
                            'taggables.taggable_id'
                        )
                        .where('taggables.taggable_type', 'tag')
                        .whereRaw('tags.uid = taggables.tag_id')
                        .where('users.id', 1)
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('has query when have global scope', async () => {
            class UserModel extends BaseModel {
                static table = 'users';
                @column({ isPrimary: true })
                public id: number

                @column()
                public uid: number

                static boot() {
                    this.addGlobalScope('name', query => {
                        query.where(query.qualifyColumn('type'), 'twitter')
                    });
                }
            }

            class Tag extends BaseModel {
                static table = 'tags';

                @column({isPrimary: true})
                public id: number

                @column()
                public uid: number

                @column()
                public name: string

                @morphedByMany(() => UserModel, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    localKey: 'uid'
                })
                public users: MorphedByMany<typeof UserModel>;
            }

            const {sql, bindings} = Tag.query().has('users').toSQL();
            const {sql: knexSql, bindings: knexBindings} = db
                .from('tags')
                .select('*')
                .whereExists(builder => {
                    builder
                        .from('users')
                        .select('users.*')
                        .select({
                            'pivot_tag_id': 'taggables.tag_id',
                            'pivot_taggable_id': 'taggables.taggable_id'
                        })
                        .innerJoin(
                            'taggables',
                            'users.id',
                            'taggables.taggable_id'
                        )
                        .where('taggables.taggable_type', 'UserModel')
                        .whereRaw('tags.uid = taggables.tag_id')
                        .where('users.type', 'twitter')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
            expect(bindings).toEqual(knexBindings);
        });
    });
})
