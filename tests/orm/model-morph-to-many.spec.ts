/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 9:48 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import {MorphToMany} from '../../src/Contracts/Orm/Relations/types';
import {scope} from '../../src/Helpers/scope';
import {column, manyToMany, morphToMany} from '../../src/Orm/Decorators';
import {MorphToManyQueryBuilder} from '../../src/Orm/Relations/MorphToMany/QueryBuilder';
import {cleanup, getBaseModel, getDb, getProfiler, ormAdapter, resetTables, setup} from '../helpers';
import {Relation} from "../../src/Orm/Relations/Base/Relation";

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Model | MorphToMany', () => {

    describe('Model | MorphToMany | Options', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })

        test('raise error when localKey is missing', () => {
            expect.assertions(1)

            try {
                class Tag extends BaseModel {
                }

                class User extends BaseModel {
                    @morphToMany(() => Tag, {
                        name: 'taggable',
                        pivotTable: 'taggables'
                    })
                    public tags: MorphToMany<typeof Tag>
                }


                User.$getRelation('tags')!.boot()
            } catch ({message}) {
                expect(
                    message).toBe('E_MISSING_MODEL_ATTRIBUTE: "User.tags" expects "id" to exist on "User" model, but is missing',
                )
            }
        })

        test('use primary key as the local key', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            User.$getRelation('tags')!.boot()

            expect(User.$getRelation('tags')!['localKey']).toBe('id')
            expect(User.$getRelation('tags')!['localKeyColumnName']).toBe('id')
        })

        test('use custom defined local key', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public uid: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    localKey: 'uid'
                })
                public tags: MorphToMany<typeof Tag>
            }


            User.$getRelation('tags')!.boot()

            expect(User.$getRelation('tags')!['localKey']).toBe('uid')
            expect(User.$getRelation('tags')!['localKeyColumnName']).toBe('uid')
        })

        test('raise error when relatedKey is missing', () => {
            expect.assertions(1)

            try {
                class Tag extends BaseModel {
                }

                Tag.bootIfNotBooted();

                class User extends BaseModel {
                    @column({isPrimary: true})
                    public id: number

                    @morphToMany(() => Tag, {
                        name: 'taggable',
                        pivotTable: 'taggables'
                    })
                    public tags: MorphToMany<typeof Tag>
                }


                User.$getRelation('tags')!.boot()
            } catch ({message}) {
                expect(
                    message).toBe('E_MISSING_MODEL_ATTRIBUTE: "User.tags" expects "id" to exist on "Tag" model, but is missing',
                )
            }
        })

        test('use related model primary key as the related key', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            User.$getRelation('tags')!.boot()

            expect(User.$getRelation('tags')!['relatedKey']).toBe('id')
            expect(User.$getRelation('tags')!['relatedKeyColumnName']).toBe('id')
        })

        test('use custom defined related key', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public uid: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    relatedKey: 'uid'
                })
                public tags: MorphToMany<typeof Tag>
            }

            User.$getRelation('tags')!.boot()

            expect(User.$getRelation('tags')!['relatedKey']).toBe('uid')
            expect(User.$getRelation('tags')!['relatedKeyColumnName']).toBe('uid')
        })

        test('compute pivotForeignKey from table name + primary key', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            User.$getRelation('tags')!.boot()

            expect(User.$getRelation('tags')!['pivotForeignKey']).toBe('taggable_id')
        })

        test('use custom defined pivotForeignKey', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    pivotForeignKey: 'user_uid'
                })
                public tags: MorphToMany<typeof Tag>
            }

            User.$getRelation('tags')!.boot()

            expect(User.$getRelation('tags')!['pivotForeignKey']).toBe('user_uid')
        })

        test('compute relatedPivotForeignKey from related model name + primary key', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            User.$getRelation('tags')!.boot()

            expect(User.$getRelation('tags')!['pivotRelatedForeignKey']).toBe('tag_id')
        })

        test('use custom defined relatedPivotForeignKey', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    pivotRelatedForeignKey: 'tag_uid'
                })
                public tags: MorphToMany<typeof Tag>
            }


            User.$getRelation('tags')!.boot()

            expect(User.$getRelation('tags')!['pivotRelatedForeignKey']).toBe('tag_uid')
        })
    })

    describe('Model | MorphToMany | Set Relations', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })

        test('set related model instance', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            User.$getRelation('tags')!.boot()

            const user = new User()
            const tag = new Tag()
            User.$getRelation('tags')!.setRelated(user, [tag])
            expect(user.tags).toEqual([tag])
        })

        test('push related model instance', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            User.$getRelation('tags')!.boot()

            const user = new User()
            const tag = new Tag()
            const tag1 = new Tag()

            User.$getRelation('tags')!.setRelated(user, [tag])
            User.$getRelation('tags')!.pushRelated(user, [tag1])
            expect(user.tags).toEqual([tag, tag1])
        })

        test('set many of related instances', () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            User.$getRelation('tags')!.boot()

            const user = new User()
            user.fill({id: 1})

            const user1 = new User()
            user1.fill({id: 2})

            const user2 = new User()
            user2.fill({id: 3})

            const tag = new Tag()
            tag.$extras = {
                pivot_taggable_id: 1,
            }

            const tag1 = new Tag()
            tag1.$extras = {
                pivot_taggable_id: 2,
            }

            const tag2 = new Tag()
            tag2.$extras = {
                pivot_taggable_id: 1,
            }

            User.$getRelation('tags')!.setRelatedForMany([user, user1, user2], [tag, tag1, tag2])
            expect(user.tags).toEqual([tag, tag2])
            expect(user1.tags).toEqual([tag1])
            expect(user2.tags).toEqual([] as any)
        })
    })

    describe('Model | MorphToMany | bulk operations', () => {
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            await db.table('users').insert({username: 'virk'})

            const user = await User.find(1)
            const {sql, bindings} = user!.related('tags').query().toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection()
                .getWriteClient()
                .from('tags')
                .select('tags.*', 'taggables.taggable_id as pivot_taggable_id', 'taggables.tag_id as pivot_tag_id')
                .innerJoin('taggables', 'tags.id', 'taggables.tag_id')
                .where('taggables.taggable_type', 'User')
                .where('taggables.taggable_id', 1)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for selecting related for many rows', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            await db.table('users').multiInsert([
                {username: 'virk'},
                {username: 'nikk'},
            ])

            const users = await User.all()
            User.$getRelation('tags')!.boot()

            const related = User.$getRelation('tags')!.eagerQuery(users, db.connection())
            const {sql, bindings} = related.toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection()
                .getWriteClient()
                .from('tags')
                .select('tags.*', 'taggables.taggable_id as pivot_taggable_id', 'taggables.tag_id as pivot_tag_id')
                .innerJoin('taggables', 'tags.id', 'taggables.tag_id')
                .where('taggables.taggable_type', 'User')
                .whereIn('taggables.taggable_id', [2, 1])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('select extra columns', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    pivotColumns: ['score'],
                })
                public tags: MorphToMany<typeof Tag>
            }

            await db.table('users').insert({username: 'virk'})

            const user = await User.find(1)
            const {sql, bindings} = user!.related('tags').query().toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection()
                .getWriteClient()
                .from('tags')
                .select(
                    'tags.*',
                    'taggables.taggable_id as pivot_taggable_id',
                    'taggables.tag_id as pivot_tag_id',
                    'taggables.score as pivot_score',
                )
                .innerJoin('taggables', 'tags.id', 'taggables.tag_id')
                .where('taggables.taggable_type', 'User')
                .where('taggables.taggable_id', 1)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('select extra columns at runtime', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            await db.table('users').insert({username: 'virk'})

            const user = await User.find(1)
            const {sql, bindings} = user!.related('tags').query().pivotColumns(['score']).toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection()
                .getWriteClient()
                .from('tags')
                .select(
                    'taggables.score as pivot_score',
                    'tags.*',
                    'taggables.taggable_id as pivot_taggable_id',
                    'taggables.tag_id as pivot_tag_id',
                )
                .innerJoin('taggables', 'tags.id', 'taggables.tag_id')
                .where('taggables.taggable_type', 'User')
                .where('taggables.taggable_id', 1)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for updating rows', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            await db.table('users').insert({username: 'virk'})

            const user = await User.find(1)

            const now = new Date()
            const {sql, bindings} = user!.related('tags').query().update({updated_at: now}).toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection()
                .getWriteClient()
                .from('taggables')
                .where('taggables.taggable_type', 'User')
                .where('taggables.taggable_id', 1)
                .update({updated_at: now})
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for deleting rows', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            await db.table('users').insert({username: 'virk'})

            const user = await User.find(1)

            const {sql, bindings} = user!.related('tags').query().del().toSQL()
            const {sql: knexSql, bindings: knexBindings} = db.connection()
                .getWriteClient()
                .from('taggables')
                .where('taggables.taggable_type', 'User')
                .where('taggables.taggable_id', 1)
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            await db.table('users').insert({username: 'virk'})
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

            const user = await User.find(1)
            const total = await user!.related('tags')
                .query()
                .count('* as total')

            expect(Number(total[0].total)).toEqual(2)
        })

        test('select extra columns with count', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            await db.table('users').insert({username: 'virk'})
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

            const user = await User.find(1)
            const total = await user!.related('tags')
                .query()
                .select('name')
                .groupBy('tags.name')
                .count('* as total')

            expect(total).toHaveLength(2)
            expect(total[0].name).toBe('Cooking')
            expect(Number(total[0].total)).toBe(1)

            expect(total[1].name).toBe('Programming')
            expect(Number(total[1].total)).toBe(1)
        })

        test('select extra pivot columns with count', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            await db.table('users').insert({username: 'virk'})
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

            const user = await User.find(1)
            const total = await user!.related('tags')
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

    describe('Model | MorphToMany | preload', () => {
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

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>;
            }

            Relation.morphMap({
                'user': () => User
            });

            await db.insertQuery().table('users').insert([{username: 'virk'}])
            await db.insertQuery().table('tags').insert([{name: 'Programming'}, {name: 'Dancing'}])
            await db.insertQuery().table('taggables').insert([
                {
                    taggable_type: 'user',
                    taggable_id: 1,
                    tag_id: 1,
                }
            ])

            const users = await User.query().preload('tags');
            expect(users).toHaveLength(1)
            expect(users[0].tags).toHaveLength(1)
            expect(users[0].tags[0].name).toBe('Programming')
            expect(users[0].tags[0].$extras.pivot_taggable_id).toBe(1)
            expect(users[0].tags[0].$extras.pivot_tag_id).toBe(1)
        })

        test('preload relation for many', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
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
                    taggable_id: 1,
                    taggable_type: 'User',
                    tag_id: 2,
                },
                {
                    taggable_id: 2,
                    taggable_type: 'User',
                    tag_id: 2,
                },
            ])

            const users = await User.query().preload('tags')
            expect(users).toHaveLength(2)
            expect(users[0].tags).toHaveLength(2)
            expect(users[1].tags).toHaveLength(1)

            expect(users[0].tags[0].name).toBe('Programming')
            expect(users[0].tags[0].$extras.pivot_taggable_id).toBe(1)
            expect(users[0].tags[0].$extras.pivot_tag_id).toBe(1)

            expect(users[0].tags[1].name).toBe('Dancing')
            expect(users[0].tags[1].$extras.pivot_taggable_id).toBe(1)
            expect(users[0].tags[1].$extras.pivot_tag_id).toBe(2)

            expect(users[1].tags[0].name).toBe('Dancing')
            expect(users[1].tags[0].$extras.pivot_taggable_id).toBe(2)
            expect(users[1].tags[0].$extras.pivot_tag_id).toBe(2)
        })

        test('preload relation using model instance', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
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
                    taggable_id: 1,
                    taggable_type: 'User',
                    tag_id: 2,
                },
                {
                    taggable_id: 2,
                    taggable_type: 'User',
                    tag_id: 2,
                },
            ])

            const users = await User.query().orderBy('id', 'asc')
            expect(users).toHaveLength(2)

            await users[0].preload('tags')
            await users[1].preload('tags')

            expect(users[0].tags).toHaveLength(2)
            expect(users[1].tags).toHaveLength(1)

            expect(users[0].tags[0].name).toBe('Programming')
            expect(users[0].tags[0].$extras.pivot_taggable_id).toBe(1)
            expect(users[0].tags[0].$extras.pivot_tag_id).toBe(1)

            expect(users[0].tags[1].name).toBe('Dancing')
            expect(users[0].tags[1].$extras.pivot_taggable_id).toBe(1)
            expect(users[0].tags[1].$extras.pivot_tag_id).toBe(2)

            expect(users[1].tags[0].name).toBe('Dancing')
            expect(users[1].tags[0].$extras.pivot_taggable_id).toBe(2)
            expect(users[1].tags[0].$extras.pivot_tag_id).toBe(2)
        })

        test('select extra pivot columns', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @column()
                public proficiency: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    pivotColumns: ['proficiency']
                })
                public tags: MorphToMany<typeof Tag>
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
                    taggable_id: 1,
                    tag_id: 2,
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

            const users = await User.query().preload('tags')
            expect(users).toHaveLength(2)
            expect(users[0].tags).toHaveLength(2)
            expect(users[1].tags).toHaveLength(1)

            expect(users[0].tags[0].name).toBe('Programming')
            expect(users[0].tags[0].$extras.pivot_taggable_id).toBe(1)
            expect(users[0].tags[0].$extras.pivot_tag_id).toBe(1)
            expect(users[0].tags[0].$extras.pivot_proficiency).toBe('expert')

            expect(users[0].tags[1].name).toBe('Dancing')
            expect(users[0].tags[1].$extras.pivot_taggable_id).toBe(1)
            expect(users[0].tags[1].$extras.pivot_tag_id).toBe(2)
            expect(users[0].tags[1].$extras.pivot_proficiency).toBe('beginner')

            expect(users[1].tags[0].name).toBe('Dancing')
            expect(users[1].tags[0].$extras.pivot_taggable_id).toBe(2)
            expect(users[1].tags[0].$extras.pivot_tag_id).toBe(2)
            expect(users[1].tags[0].$extras.pivot_proficiency).toBe('beginner')
        })

        test('select extra pivot columns at runtime', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                @column()
                public proficiency: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
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
                    taggable_id: 1,
                    tag_id: 2,
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

            const users = await User.query().preload('tags', (builder) => {
                builder.pivotColumns(['proficiency'])
            })

            expect(users).toHaveLength(2)
            expect(users[0].tags).toHaveLength(2)
            expect(users[1].tags).toHaveLength(1)

            expect(users[0].tags[0].name).toBe('Programming')
            expect(users[0].tags[0].$extras.pivot_taggable_id).toBe(1)
            expect(users[0].tags[0].$extras.pivot_tag_id).toBe(1)
            expect(users[0].tags[0].$extras.pivot_proficiency).toBe('expert')

            expect(users[0].tags[1].name).toBe('Dancing')
            expect(users[0].tags[1].$extras.pivot_taggable_id).toBe(1)
            expect(users[0].tags[1].$extras.pivot_tag_id).toBe(2)
            expect(users[0].tags[1].$extras.pivot_proficiency).toBe('beginner')

            expect(users[1].tags[0].name).toBe('Dancing')
            expect(users[1].tags[0].$extras.pivot_taggable_id).toBe(2)
            expect(users[1].tags[0].$extras.pivot_tag_id).toBe(2)
            expect(users[1].tags[0].$extras.pivot_proficiency).toBe('beginner')
        })

        test('cherry pick columns during preload', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
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

            const users = await User.query().preload('tags', (builder) => {
                return builder.select(['name'])
            })

            expect(users).toHaveLength(1)
            expect(users[0].tags).toHaveLength(1)
            expect(users[0].tags[0].name).toBe('Programming')
            expect(users[0].tags[0].$extras).toEqual({pivot_taggable_id: 1, pivot_tag_id: 1})
        })

        test('raise error when local key is not selected', async () => {
            expect.assertions(1)

            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
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
                await User.query().select('username').preload('tags')
            } catch ({message}) {
                expect(message).toBe('Cannot preload "tags", value of "User.id" is undefined')
            }
        })

        test('do not run preload query when parent rows are empty', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const users = await User.query().preload('tags', () => {
                throw new Error('not expected to be here')
            })
            expect(users).toHaveLength(0)
        })
    })

    describe('Model | MorphToMany | Select', () => {
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

                @column()
                public isActive: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query.select(['isActive']).toSQL();
            const {sql: knexSql, bindings: knexBindings} = db.from('tags').select('tags.is_active').toSQL();
            expect(sql).toBe(knexSql);
        });

        it('define columns with aliases', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public isActive: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query.select('isActive as a').toSQL();
            const {sql: knexSql, bindings: knexBindings} = db.from('tags').select('tags.is_active as a').toSQL();
            expect(sql).toBe(knexSql);
        });

        it('define columns as multiple arguments', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public isActive: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query.select('name', 'isActive').toSQL();
            const {sql: knexSql, bindings: knexBindings} = db.from('tags').select('tags.name', 'tags.is_active').toSQL();
            expect(sql).toBe(knexSql);
        });

        it('define columns as object', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public isActive: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query.select({name: 'name', isActive: 'isActive'}).toSQL();
            const {sql: knexSql, bindings: knexBindings} =
                db.from('tags').select({name: 'tags.name', isActive: 'tags.is_active'}).toSQL();
            expect(sql).toBe(knexSql);
        });

        it('define columns as multiple arguments with aliases', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public isActive: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query.select('name as n', 'isActive as a').toSQL();
            const {sql: knexSql, bindings: knexBindings} =
                db.from('tags').select('tags.name as n', 'tags.is_active as a').toSQL();
            expect(sql).toBe(knexSql);
        });

        it('define columns as subqueries', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public isActive: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query.select(db.from('addresses').count('* as total').as('addresses_total')).toSQL();
            const {sql: knexSql, bindings: knexBindings} =
                db.from('tags').select(db.from('addresses').count('* as total').as('addresses_total')).toSQL();
            expect(sql).toBe(knexSql);
        });

        it('define columns as subqueries inside an array', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public isActive: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query.select([db.from('addresses').count('* as total').as('addresses_total')]).toSQL();
            const {sql: knexSql, bindings: knexBindings} =
                db.from('tags').select(db.from('addresses').count('* as total').as('addresses_total')).toSQL();
            expect(sql).toBe(knexSql);
        });
    });

    describe('Model | MorphToMany | wherePivot', () => {
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .wherePivot('username', 'virk')
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
                .where('taggables.username', 'virk')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add where wrapped clause', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .where((builder) => builder.wherePivot('username', 'virk'))
                ['toSQL']()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
                .where((builder) => builder.where('taggables.username', 'virk'))
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add where clause with operator', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .wherePivot('age', '>', 22)
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
                .where('taggables.age', '>', 22)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add where clause as a raw query', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .wherePivot('age', '>', db.rawQuery('select min_age from ages limit 1;'))
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .wherePivot('age', '>', 22)
                .orWherePivot('age', 18)
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .wherePivot('age', '>', 22)
                .orWhere((builder) => {
                    builder.wherePivot('age', 18)
                })
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
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

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
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
                        model: 'User',
                        relatedModel: 'Tag',
                        pivotTable: 'taggables',
                        type: 'manyToMany',
                    })
                }
                profilerPacketIndex++
            })

            await User.query({profiler}).preload('tags')
        })
    })

    describe('Model | MorphToMany | whereNotPivot', () => {
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true
            const {sql, bindings} = query.whereNotPivot('username', 'virk').toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
                .whereNot('taggables.username', 'virk')
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add where not clause with operator', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereNotPivot('age', '>', 22)
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
                .whereNot('taggables.age', '>', 22)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add where not clause as a raw query', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereNotPivot('age', '>', db.rawQuery('select min_age from ages limit 1;'))
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereNotPivot('age', '>', 22)
                .orWhereNotPivot('age', 18)
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
                .whereNot('taggables.age', '>', 22)
                .orWhereNot('taggables.age', 18)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })

    describe('Model | MorphToMany | whereInPivot', () => {
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereInPivot('username', ['virk', 'nikk'])
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
                .whereIn('taggables.username', ['virk', 'nikk'])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereIn as a query callback', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereInPivot('username', (builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereInPivot('username', db.query().select('id').from('accounts'))
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereInPivot('username', [
                    db.rawQuery(`select ${ref('id')} from ${ref('accounts')}`),
                ])
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereInPivot(
                    ['username', 'email'],
                    db.query().select('username', 'email').from('accounts'),
                )
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereInPivot(['username', 'email'], [['foo', 'bar']])
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
                .whereIn(['taggables.username', 'taggables.email'], [['foo', 'bar']])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add orWhereIn clause', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereInPivot('username', ['virk', 'nikk'])
                .orWhereInPivot('username', ['foo'])
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

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
                .from('tags')
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

    describe('Model | MorphToMany | whereNotInPivot', () => {
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereNotInPivot('username', ['virk', 'nikk'])
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
                .whereNotIn('taggables.username', ['virk', 'nikk'])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereNotIn as a query callback', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereNotInPivot('username', (builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereNotInPivot('username', db.query().select('username').from('accounts'))
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereNotInPivot(['username', 'email'], [['foo', 'bar']])
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
                .whereNotIn(['taggables.username', 'taggables.email'], [['foo', 'bar']])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add orWhereNotIn clause', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

            query['appliedConstraints'] = true

            const {sql, bindings} = query
                .whereNotInPivot('username', ['virk', 'nikk'])
                .orWhereNotInPivot('username', ['foo'])
                .toSQL()

            const {sql: knexSql, bindings: knexBindings} = db.connection().getWriteClient()
                .from('tags')
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }


            const user = new User()
            const query = user!.related('tags').query()

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
                .from('tags')
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

    describe('Model | MorphToMany | save', () => {
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const tag = new Tag()
            tag.name = 'Programming'

            await user.related('tags').save(tag)

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('tags').count('*', 'total')
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const tag = new Tag()
            tag.name = 'Programming'

            await user.related('tags').save(tag)
            await user.related('tags').save(tag)

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalPosts[0].total)).toBe(1)

            expect(tagUsers).toHaveLength(1)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(tag.id)

            expect(user.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
        })

        test('attach duplicates when save is called more than once with with checkExisting = false', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const tag = new Tag()
            tag.name = 'Programming'

            await user.related('tags').save(tag)
            await user.related('tags').save(tag, false)

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalPosts[0].total)).toBe(1)

            expect(tagUsers).toHaveLength(2)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(tag.id)

            expect(tagUsers[1].taggable_id).toBe(user.id)
            expect(tagUsers[1].tag_id).toBe(tag.id)

            expect(user.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
        })

        test('attach when related pivot entry exists but for a different parent @sanityCheck', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const user1 = new User()
            user1.username = 'nikk'
            await user1.save()

            const tag = new Tag()
            tag.name = 'Programming'

            await user.related('tags').save(tag)
            await user1.related('tags').save(tag)

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(2)
            expect(Number(totalTags[0].total)).toBe(1)

            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(tag.id)

            expect(tagUsers[1].taggable_id).toBe(user1.id)
            expect(tagUsers[1].tag_id).toBe(tag.id)

            expect(user.$trx).toBeUndefined()
            expect(user1.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
        })
    })

    describe('Model | MorphToMany | saveMany', () => {
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const tag = new Tag()
            tag.name = 'Programming'

            const tag1 = new Tag()
            tag1.name = 'Cooking'

            await user.related('tags').saveMany([tag, tag1])

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalPosts[0].total)).toBe(2)

            expect(tagUsers).toHaveLength(2)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].taggable_type).toBe('User')
            expect(tagUsers[0].tag_id).toBe(tag.id)
            expect(tagUsers[1].taggable_id).toBe(user.id)
            expect(tagUsers[1].tag_id).toBe(tag1.id)

            expect(user.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
            expect(tag1.$trx).toBeUndefined()
        })

        test('do not attach duplicates when saveMany is called more than once', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const tag = new Tag()
            tag.name = 'Programming'

            const tag1 = new Tag()
            tag1.name = 'Cooking'

            await user.related('tags').saveMany([tag, tag1])
            await user.related('tags').saveMany([tag, tag1])

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalPosts[0].total)).toBe(2)

            expect(tagUsers).toHaveLength(2)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(tag.id)
            expect(tagUsers[1].taggable_id).toBe(user.id)
            expect(tagUsers[1].tag_id).toBe(tag1.id)

            expect(user.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
            expect(tag1.$trx).toBeUndefined()
        })

        test('attach duplicates when saveMany is called more than once with checkExisting = false', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const tag = new Tag()
            tag.name = 'Programming'

            const tag1 = new Tag()
            tag1.name = 'Cooking'

            await user.related('tags').saveMany([tag, tag1])
            await user.related('tags').saveMany([tag, tag1], false)

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalPosts[0].total)).toBe(2)

            expect(tagUsers).toHaveLength(4)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(tag.id)
            expect(tagUsers[1].taggable_id).toBe(user.id)
            expect(tagUsers[1].tag_id).toBe(tag1.id)

            expect(tagUsers[2].taggable_id).toBe(user.id)
            expect(tagUsers[2].tag_id).toBe(tag.id)
            expect(tagUsers[3].taggable_id).toBe(user.id)
            expect(tagUsers[3].tag_id).toBe(tag1.id)

            expect(user.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
            expect(tag1.$trx).toBeUndefined()
        })

        test('attach when related pivot entry exists but for a different parent @sanityCheck', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const user1 = new User()
            user1.username = 'nikk'

            const tag = new Tag()
            tag.name = 'Programming'

            const tag1 = new Tag()
            tag1.name = 'Cooking'

            await user.related('tags').saveMany([tag, tag1])
            await user1.related('tags').saveMany([tag, tag1])

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()
            expect(user1.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(2)
            expect(Number(totalPosts[0].total)).toBe(2)

            expect(tagUsers).toHaveLength(4)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(tag.id)
            expect(tagUsers[1].taggable_id).toBe(user.id)
            expect(tagUsers[1].tag_id).toBe(tag1.id)

            expect(tagUsers[2].taggable_id).toBe(user1.id)
            expect(tagUsers[2].tag_id).toBe(tag.id)
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const trx = await db.transaction()

            const user = new User()
            user.username = 'virk'
            user.$trx = trx
            await user.save()

            const user1 = new User()
            user1.$trx = trx
            user1.username = 'nikk'

            const tag = new Tag()
            tag.name = 'Programming'

            const tag1 = new Tag()
            tag1.name = 'Cooking'

            await user.related('tags').saveMany([tag, tag1])
            await user1.related('tags').saveMany([tag, tag1])

            expect(user.$trx.isCompleted).toBeFalsy()
            expect(user1.$trx.isCompleted).toBeFalsy()

            await trx.rollback()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalPosts[0].total)).toBe(0)

            expect(tagUsers).toHaveLength(0)
        })
    })

    describe('Model | MorphToMany | create', () => {
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const tag = await user.related('tags').create({name: 'Programming'})

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('tags').count('*', 'total')
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

        test('wrap create inside a custom transaction', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const trx = await db.transaction()

            const user = new User()
            user.username = 'virk'
            user.$trx = trx
            await user.save()

            const tag = await user.related('tags').create({name: 'Programming'})
            expect(user.$trx.isCompleted).toBeFalsy()
            expect(tag.$trx!.isCompleted).toBeFalsy()

            await trx.commit()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalPosts[0].total)).toBe(1)

            expect(tagUsers).toHaveLength(1)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(tag.id)

            expect(user.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
        })
    })

    describe('Model | MorphToMany | createMany', () => {
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const [tag, tag1] = await user.related('tags').createMany([
                {name: 'Programming'},
                {name: 'Cooking'},
            ])

            expect(user.$isPersisted).toBeTruthy()
            expect(tag.$isPersisted).toBeTruthy()
            expect(tag1.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalTags[0].total)).toBe(2)

            expect(tagUsers).toHaveLength(2)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].taggable_type).toBe('User')
            expect(tagUsers[0].tag_id).toBe(tag.id)

            expect(tagUsers[1].taggable_id).toBe(user.id)
            expect(tagUsers[1].tag_id).toBe(tag1.id)

            expect(user.$trx).toBeUndefined()
            expect(tag.$trx).toBeUndefined()
            expect(tag1.$trx).toBeUndefined()
        })

        test('wrap create many inside a custom transaction', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const trx = await db.transaction()

            const user = new User()
            user.username = 'virk'
            user.$trx = trx
            await user.save()

            const [tag, tag1] = await user.related('tags').createMany([
                {name: 'Programming'},
                {name: 'Cooking'},
            ])

            expect(user.$trx.isCompleted).toBeFalsy()
            expect(tag.$trx!.isCompleted).toBeFalsy()
            expect(tag1.$trx!.isCompleted).toBeFalsy()

            await trx.rollback()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalPosts[0].total)).toBe(0)
            expect(tagUsers).toHaveLength(0)
        })
    })

    describe('Model | MorphToMany | attach', () => {
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await user.related('tags').attach([1, 2])

            expect(user.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalTags[0].total)).toBe(0)

            expect(tagUsers).toHaveLength(2)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].taggable_type).toBe('User')
            expect(tagUsers[0].tag_id).toBe(1)

            expect(tagUsers[1].taggable_id).toBe(user.id)
            expect(tagUsers[1].tag_id).toBe(2)
        })

        test('attach with extra attributes', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await user.related('tags').attach({
                1: {
                    proficiency: 'Beginner',
                },
                2: {
                    proficiency: 'Master',
                },
            })

            expect(user.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalTags[0].total)).toBe(0)

            expect(tagUsers).toHaveLength(2)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(1)
            expect(tagUsers[0].proficiency).toBe('Beginner')

            expect(tagUsers[1].taggable_id).toBe(user.id)
            expect(tagUsers[1].tag_id).toBe(2)
            expect(tagUsers[1].proficiency).toBe('Master')
        })
    })

    describe('Model | MorphToMany | detach', () => {
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: user.id,
                    tag_id: 1,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: user.id,
                    tag_id: 2,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
            ])

            await user.related('tags').detach([1])

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalTags[0].total)).toBe(0)

            expect(tagUsers).toHaveLength(1)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].taggable_type).toBe('User')
            expect(tagUsers[0].tag_id).toBe(2)
        })

        test('scope detach self to @sanityCheck', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: user.id,
                    tag_id: 1,
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

            await user.related('tags').detach([2])

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalTags[0].total)).toBe(0)

            expect(tagUsers).toHaveLength(2)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(1)

            expect(tagUsers[1].taggable_id).toBe(2)
            expect(tagUsers[1].tag_id).toBe(2)
        })
    })

    describe('Model | MorphToMany | sync', () => {
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: user.id,
                    tag_id: 1,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: user.id,
                    tag_id: 2,
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

            await user.related('tags').sync([1])

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalTags[0].total)).toBe(0)
            expect(tagUsers).toHaveLength(2);

            expect(tagUsers[0].id).toBe(1)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].taggable_type).toBe('User')
            expect(tagUsers[0].tag_id).toBe(1)

            expect(tagUsers[1].id).toBe(3)
            expect(tagUsers[1].taggable_id).toBe(2)
            expect(tagUsers[1].tag_id).toBe(1)
        })

        test('keep duplicates of the id under sync', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: user.id,
                    tag_id: 1,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: user.id,
                    tag_id: 2,
                    proficiency: 'Master',
                    taggable_type: 'User'
                },
                {
                    taggable_id: user.id,
                    tag_id: 1,
                    proficiency: 'Master',
                    taggable_type: 'User'
                },
            ])

            await user.related('tags').sync([1])

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalTags[0].total)).toBe(0)
            expect(tagUsers).toHaveLength(2);

            expect(tagUsers[0].id).toBe(1)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(1)

            expect(tagUsers[1].id).toBe(3)
            expect(tagUsers[1].taggable_id).toBe(user.id)
            expect(tagUsers[1].tag_id).toBe(1)
        })

        test('update pivot rows when additional properties are changed', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: user.id,
                    tag_id: 1,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: user.id,
                    tag_id: 2,
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

            await user.related('tags').sync({
                1: {
                    proficiency: 'Intermediate',
                },
            })

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables').orderBy('id', 'asc')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalTags[0].total)).toBe(0)
            expect(tagUsers).toHaveLength(2);

            expect(tagUsers[0].id).toBe(1)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(1)
            expect(tagUsers[0].proficiency).toBe('Intermediate')

            expect(tagUsers[1].id).toBe(3)
            expect(tagUsers[1].taggable_id).toBe(2)
            expect(tagUsers[1].tag_id).toBe(1)
            expect(tagUsers[1].proficiency).toBe('Master')
        })

        test('do not update pivot row when no extra properties are defined', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: user.id,
                    tag_id: 1,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: user.id,
                    tag_id: 2,
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

            await user.related('tags').sync({1: {}})

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalTags[0].total)).toBe(0)
            expect(tagUsers).toHaveLength(2);

            expect(tagUsers[0].id).toBe(1)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(1)
            expect(tagUsers[0].proficiency).toBe('Beginner')

            expect(tagUsers[1].id).toBe(3)
            expect(tagUsers[1].taggable_id).toBe(2)
            expect(tagUsers[1].tag_id).toBe(1)
            expect(tagUsers[1].proficiency).toBe('Master')
        })

        test('do not remove rows when detach = false', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: user.id,
                    tag_id: 1,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: user.id,
                    tag_id: 2,
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

            await user.related('tags').sync([1], false)

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalTags[0].total)).toBe(0)
            expect(tagUsers).toHaveLength(3);

            expect(tagUsers[0].id).toBe(1)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(1)
            expect(tagUsers[0].proficiency).toBe('Beginner')

            expect(tagUsers[1].id).toBe(2)
            expect(tagUsers[1].taggable_id).toBe(user.id)
            expect(tagUsers[1].tag_id).toBe(2)
            expect(tagUsers[1].proficiency).toBe('Master')

            expect(tagUsers[2].id).toBe(3)
            expect(tagUsers[2].taggable_id).toBe(2)
            expect(tagUsers[2].tag_id).toBe(1)
            expect(tagUsers[2].proficiency).toBe('Master')
        })

        test('do not remove rows when nothing has changed', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: user.id,
                    tag_id: 1,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: user.id,
                    tag_id: 2,
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

            await user.related('tags').sync([1, 2])

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalTags = await db.query().from('tags').count('*', 'total')
            const tagUsers = await db.query().from('taggables')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalTags[0].total)).toBe(0)
            expect(tagUsers).toHaveLength(3)

            expect(tagUsers[0].id).toBe(1)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(1)
            expect(tagUsers[0].proficiency).toBe('Beginner')

            expect(tagUsers[1].id).toBe(2)
            expect(tagUsers[1].taggable_id).toBe(user.id)
            expect(tagUsers[1].tag_id).toBe(2)
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public username: string

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('taggables').multiInsert([
                {
                    taggable_id: user.id,
                    tag_id: 1,
                    proficiency: 'Beginner',
                    taggable_type: 'User'
                },
                {
                    taggable_id: user.id,
                    tag_id: 2,
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

            const trx = await db.transaction()
            await user.related('tags').sync({
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

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalTags[0].total)).toBe(0)
            expect(tagUsers).toHaveLength(3)

            expect(tagUsers[0].id).toBe(1)
            expect(tagUsers[0].taggable_id).toBe(user.id)
            expect(tagUsers[0].tag_id).toBe(1)
            expect(tagUsers[0].proficiency).toBe('Beginner')

            expect(tagUsers[1].id).toBe(2)
            expect(tagUsers[1].taggable_id).toBe(user.id)
            expect(tagUsers[1].tag_id).toBe(2)
            expect(tagUsers[1].proficiency).toBe('Master')

            expect(tagUsers[2].id).toBe(3)
            expect(tagUsers[2].taggable_id).toBe(2)
            expect(tagUsers[2].tag_id).toBe(1)
            expect(tagUsers[2].proficiency).toBe('Master')
        })
    })

    describe('Model | MorphToMany | pagination', () => {
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
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

            const user = await User.find(1)
            const tags = await user!.related('tags').query().paginate(1, 1)

            tags.baseUrl('/tags')

            expect(tags.all()).toHaveLength(1)
            expect(tags.all()[0]).toBeInstanceOf(Tag)
            expect(tags.all()[0].$extras).not.toHaveProperty('total');
            expect(tags.perPage).toBe(1)
            expect(tags.currentPage).toBe(1)
            expect(tags.lastPage).toBe(2)
            expect(tags.hasPages).toBeTruthy()
            expect(tags.hasMorePages).toBeTruthy()
            expect(tags.isEmpty).toBeFalsy()
            expect(Number(tags.total)).toBe(2)
            expect(tags.hasTotal).toBeTruthy()
            expect(tags.getMeta()).toEqual({
                total: 2,
                per_page: 1,
                current_page: 1,
                last_page: 2,
                first_page: 1,
                first_page_url: '/tags?page=1',
                last_page_url: '/tags?page=2',
                next_page_url: '/tags?page=2',
                previous_page_url: null,
            })
        })

        test('disallow paginate during preload', async () => {
            expect.assertions(1)

            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
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
                await User.query().preload('tags', (query) => {
                    query.paginate(1, 5)
                })
            } catch ({message}) {
                expect(message).toBe('Cannot paginate relationship "tags" during preload')
            }
        })
    })

    describe('Model | MorphToMany | clone', () => {
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
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
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

            const user = await User.find(1)
            const clonedQuery = user!.related('tags').query().clone()
            expect(clonedQuery).toBeInstanceOf(MorphToManyQueryBuilder)
        })
    })

    describe('Model | MorphToMany | scopes', () => {
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

                @column()
                public name: string

                public static programmingOnly = scope((query) => {
                    query.where('name', 'Programming')
                })
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
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

            const user = await User.query().preload('tags', (query) => {
                query.apply((scopes) => scopes.programmingOnly())
            }).firstOrFail()

            const userWithoutScopes = await User.query().preload('tags').firstOrFail()

            expect(user.tags).toHaveLength(1)
            expect(userWithoutScopes.tags).toHaveLength(2)
            expect(user.tags[0].name).toBe('Programming')
        })

        test('apply scopes on related query', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                public static programmingOnly = scope((query) => {
                    query.where('name', 'Programming')
                })
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
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

            const user = await User.findOrFail(1)
            const tags = await user.related('tags').query().apply((scopes) => scopes.programmingOnly())
            const tagsWithoutScope = await user.related('tags').query()

            expect(tags).toHaveLength(1)
            expect(tagsWithoutScope).toHaveLength(2)
            expect(tags[0].name).toBe('Programming')
        })
    })

    describe('Model | MorphToMany | global scopes', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
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
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        it('apply scopes during eagerload', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                public static boot() {
                    this.addGlobalScope(query => query.where('name', 'Programming'))
                }
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            db.enableQueryLog();
            await User.query().preload('tags').firstOrFail();

            const {sql} = db.getQueryLog()[1];
            const {sql: knexSql} = db.from('tags')
                .select([
                    'tags.*',
                    'taggables.taggable_id as pivot_taggable_id',
                    'taggables.tag_id as pivot_tag_id'
                ])
                .join('taggables', 'tags.id', '=', 'taggables.tag_id')
                .where('taggables.taggable_type', 'User')
                .whereIn('taggables.taggable_id', [1])
                .where('name', 'Programming').toSQL();
            expect(sql).toEqual(knexSql);
        });

        it('apply scopes on related query', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                public static boot() {
                    this.addGlobalScope(query => query.where('name', 'Programming'))
                }
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            db.enableQueryLog();
            const user = await User.findOrFail(1)
            const tags = await user.related('tags').query();

            const {sql} = db.getQueryLog()[1];
            const {sql: knexSql} = db.from('tags')
                .select([
                    'tags.*',
                    'taggables.taggable_id as pivot_taggable_id',
                    'taggables.tag_id as pivot_tag_id'
                ])
                .join('taggables', 'tags.id', '=', 'taggables.tag_id')
                .where('taggables.taggable_type', 'User')
                .where('taggables.taggable_id', 1)
                .where('name', 'Programming').toSQL();
            expect(sql).toEqual(knexSql);
        });

        it('apply scopes on related paginate', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string

                public static boot() {
                    this.addGlobalScope(query => query.where('name', 'Programming'))
                }
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables'
                })
                public tags: MorphToMany<typeof Tag>
            }

            const user = await User.findOrFail(1);
            db.enableQueryLog();
            await user.related('tags').query().paginate(1, 20);

            {
                const {sql} = db.getQueryLog()[0];
                const {sql: knexSql} = db.from('tags')
                    .join('taggables', 'tags.id', '=', 'taggables.tag_id')
                    .where('taggables.taggable_type', 'User')
                    .where('taggables.taggable_id', 1)
                    .where('name', 'Programming')
                    .count('* as total')
                    .toSQL();
                expect(sql).toEqual(knexSql);
            }

            {
                const {sql} = db.getQueryLog()[1];
                const {sql: knexSql} = db.from('tags')
                    .select([
                        'tags.*',
                        'taggables.taggable_id as pivot_taggable_id',
                        'taggables.tag_id as pivot_tag_id'
                    ])
                    .join('taggables', 'tags.id', '=', 'taggables.tag_id')
                    .where('taggables.taggable_type', 'User')
                    .where('taggables.taggable_id', 1)
                    .where('name', 'Programming')
                    .limit(20)
                    .toSQL();
                expect(sql).toEqual(knexSql);
            }
        });
    });

    describe('Model | MorphToMany | onQuery', () => {
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

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    onQuery: (query) => query.where('name', 'Programming'),
                })
                public tags: MorphToMany<typeof Tag>
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

            const user = await User.query().preload('tags').firstOrFail()
            expect(user.tags).toHaveLength(1)
            expect(user.tags[0].name).toBe('Programming')
        })

        test('do not invoke onQuery method during preloading subqueries', async () => {
            expect.assertions(3)

            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    onQuery: (query) => {
                        expect(true).toBeTruthy()
                        query.where('name', 'Programming')
                    },
                })
                public tags: MorphToMany<typeof Tag>
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

            const user = await User.query().preload('tags', (query) => {
                query.where(() => {
                })
            }).firstOrFail()

            expect(user.tags).toHaveLength(1)
            expect(user.tags[0].name).toBe('Programming')
        })

        test('invoke onQuery method on related query builder', async () => {
            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    onQuery: (query) => query.where('name', 'Programming'),
                })
                public tags: MorphToMany<typeof Tag>
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

            const user = await User.findOrFail(1)
            const tags = await user.related('tags').query()
            expect(tags).toHaveLength(1)
            expect(tags[0].name).toBe('Programming')
        })

        test('invoke onQuery method on pivot query builder', async () => {
            expect.assertions(1)

            class Tag extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({isPrimary: true})
                public id: number

                @morphToMany(() => Tag, {
                    name: 'taggable',
                    pivotTable: 'taggables',
                    onQuery: (query) => {
                        expect(query.isPivotOnlyQuery).toBeTruthy()
                    },
                })
                public tags: MorphToMany<typeof Tag>
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

            const user = await User.findOrFail(1)
            await user.related('tags').pivotQuery()
        })
    })
})
