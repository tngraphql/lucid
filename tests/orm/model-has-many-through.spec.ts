/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 9:47 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import {BelongsTo, HasManyThrough} from '../../src/Contracts/Orm/Relations/types';
import { scope } from '../../src/Helpers/scope';
import {belongsTo, column, hasManyThrough} from '../../src/Orm/Decorators';
import { HasManyThroughQueryBuilder } from '../../src/Orm/Relations/HasManyThrough/QueryBuilder';
import { cleanup, getBaseModel, getDb, getProfiler, ormAdapter, resetTables, setup } from '../helpers';
import {Relation} from "../../src/Orm/Relations/Base/Relation";
import {SoftDeletes} from "../../src/Orm/SoftDeletes";
import {DateTime} from "luxon";

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Model | Has Many Through', () => {
    describe('Model | Has Many Through | Options', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })

        test('raise error when localKey is missing', () => {
            expect.assertions(1)

            try {
                class User extends BaseModel {
                }



                class Post extends BaseModel {
                }



                class Country extends BaseModel {
                    @hasManyThrough([() => Post, () => User])
                    public posts: HasManyThrough<typeof Post>
                }



                Country.$getRelation('posts')!.boot()
            } catch ({ message }) {
                expect(
                    message).toBe('E_MISSING_MODEL_ATTRIBUTE: "Country.posts" expects "id" to exist on "Country" model, but is missing'
                )
            }
        })

        test('raise error when foreignKey is missing', () => {
            expect.assertions(1)

            try {
                class User extends BaseModel {
                }

                User.bootIfNotBooted();

                class Post extends BaseModel {
                }

                Post.bootIfNotBooted();

                class Country extends BaseModel {
                    @column({ isPrimary: true })
                    public id: number

                    @hasManyThrough([() => Post, () => User])
                    public posts: HasManyThrough<typeof Post>
                }


                Country.$getRelation('posts')!.boot()
            } catch ({ message }) {
                expect(
                    message).toBe('E_MISSING_MODEL_ATTRIBUTE: "Country.posts" expects "countryId" to exist on "User" model, but is missing'
                )
            }
        })

        test('raise error when through local key is missing', () => {
            expect.assertions(1)

            try {
                class User extends BaseModel {
                    @column()
                    public countryId: number
                }



                class Post extends BaseModel {
                }



                class Country extends BaseModel {
                    @column({ isPrimary: true })
                    public id: number

                    @hasManyThrough([() => Post, () => User])
                    public posts: HasManyThrough<typeof Post>
                }


                Country.$getRelation('posts')!.boot()
            } catch ({ message }) {
                expect(
                    message).toBe('E_MISSING_MODEL_ATTRIBUTE: "Country.posts" expects "id" to exist on "User" model, but is missing'
                )
            }
        })

        test('raise error when through foreign key is missing', () => {
            expect.assertions(1)

            try {
                class User extends BaseModel {
                    @column({ isPrimary: true })
                    public id: number

                    @column()
                    public countryId: number
                }



                class Post extends BaseModel {
                }

                Post.bootIfNotBooted();

                class Country extends BaseModel {
                    @column({ isPrimary: true })
                    public id: number

                    @hasManyThrough([() => Post, () => User])
                    public posts: HasManyThrough<typeof Post>
                }


                Country.$getRelation('posts')!.boot()
            } catch ({ message }) {
                expect(
                    message).toBe('E_MISSING_MODEL_ATTRIBUTE: "Country.posts" expects "userId" to exist on "Post" model, but is missing'
                )
            }
        })

        test('compute all required keys', () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column()
                public userId: number
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }



            const relation = Country.$getRelation('posts')!
            relation.boot()

            expect(relation['localKey']).toBe('id')
            expect(relation['localKeyColumnName']).toBe('id')

            expect(relation['foreignKey']).toBe('countryId')
            expect(relation['foreignKeyColumnName']).toBe('country_id')

            expect(relation['throughLocalKey']).toBe('id')
            expect(relation['throughLocalKeyColumnName']).toBe('id')

            expect(relation['throughForeignKey']).toBe('userId')
            expect(relation['throughForeignKeyColumnName']).toBe('user_id')
        })

        test('compute custom keys', () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public uid: number

                @column()
                public countryUid: number
            }



            class Post extends BaseModel {
                @column()
                public userUid: number
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public uid: number

                @hasManyThrough([() => Post, () => User], {
                    throughForeignKey: 'userUid',
                    throughLocalKey: 'uid',
                    foreignKey: 'countryUid',
                    localKey: 'uid'
                })
                public posts: HasManyThrough<typeof Post>
            }



            const relation = Country.$getRelation('posts')!
            relation.boot()

            expect(relation['localKey']).toBe('uid')
            expect(relation['localKeyColumnName']).toBe('uid')

            expect(relation['foreignKey']).toBe('countryUid')
            expect(relation['foreignKeyColumnName']).toBe('country_uid')

            expect(relation['throughLocalKey']).toBe('uid')
            expect(relation['throughLocalKeyColumnName']).toBe('uid')

            expect(relation['throughForeignKey']).toBe('userUid')
            expect(relation['throughForeignKeyColumnName']).toBe('user_uid')
        })
    })

    describe('Model | Has Many Through | Set Relations', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })

        test('set related model instance', () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column()
                public userId: number
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }


            Country.$getRelation('posts')!.boot()

            const country = new Country()
            const post = new Post()

            Country.$getRelation('posts')!.setRelated(country, [post])
            expect(country.posts).toEqual([post])
        })

        test('push related model instance', () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column()
                public userId: number
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }


            Country.$getRelation('posts')!.boot()

            const country = new Country()
            const post = new Post()
            const post1 = new Post()

            Country.$getRelation('posts')!.setRelated(country, [post])
            Country.$getRelation('posts')!.pushRelated(country, [post1])
            expect(country.posts).toEqual([post, post1])
        })

        test('set many of related instances', () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column()
                public userId: number
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }


            Country.$getRelation('posts')!.boot()

            const country = new Country()
            country.fill({ id: 1 })

            const country1 = new Country()
            country1.fill({ id: 2 })

            const country2 = new Country()
            country2.fill({ id: 3 })

            const post = new Post()
            post.fill({ userId: 1 })
            post.$extras = {
                through_country_id: 1
            }

            const post1 = new Post()
            post1.fill({ userId: 2 })
            post1.$extras = {
                through_country_id: 2
            }

            const post2 = new Post()
            post2.fill({ userId: 3 })
            post2.$extras = {
                through_country_id: 1
            }

            Country.$getRelation('posts')!.setRelatedForMany([country, country1, country2], [post, post1, post2])
            expect(country.posts).toEqual([post, post2])
            expect(country1.posts).toEqual([post1])
            expect(country2.posts).toEqual([] as any)
        })
    })

    describe('Model | Has Many Through | bulk operations', () => {
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
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column()
                public userId: number
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }


            await db.table('countries').insert({ name: 'India' })

            const country = await Country.find(1)
            const { sql, bindings } = country!.related('posts').query().toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('posts')
                                                               .select('posts.*', 'users.country_id as through_country_id')
                                                               .innerJoin('users', 'users.id', 'posts.user_id')
                                                               .where('users.country_id', 1)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for selecting many related rows', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column()
                public userId: number
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }


            await db.table('countries').multiInsert([
                { name: 'India' },
                { name: 'UK' }
            ])

            const countries = await Country.all()
            Country.$getRelation('posts')!.boot()

            const query = Country.$getRelation('posts')!.eagerQuery(countries, db.connection())
            const { sql, bindings } = query.toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('posts')
                                                               .select('posts.*', 'users.country_id as through_country_id')
                                                               .innerJoin('users', 'users.id', 'posts.user_id')
                                                               .whereIn('users.country_id', [2, 1])
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for updating related rows', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column()
                public userId: number
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }


            await db.table('countries').insert({ name: 'India' })

            const country = await Country.find(1)
            const now = new Date()

            const { sql, bindings } = country!.related('posts').query().update({
                updated_at: now
            }).toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('posts')
                                                               .update({ updated_at: now })
                                                               .whereIn('posts.user_id', (builder) => {
                                                                   builder.from('users').where('users.country_id', 1)
                                                               })
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for deleting related rows', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column()
                public userId: number
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }


            await db.table('countries').insert({ name: 'India' })

            const country = await Country.find(1)
            const { sql, bindings } = country!.related('posts').query().del().toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('posts')
                                                               .del()
                                                               .whereIn('posts.user_id', (builder) => {
                                                                   builder.from('users').where('users.country_id', 1)
                                                               })
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })

    describe('Model | Has Many Through | aggregates', () => {
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
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column()
                public userId: number
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }


            await db.table('countries').insert({ name: 'India' })
            await db.table('users').insert({
                username: 'virk',
                country_id: 1
            })

            await db.table('posts').multiInsert([
                {
                    user_id: 1,
                    title: 'tngraphql 101'
                },
                {
                    user_id: 1,
                    title: 'Lucid 101'
                },
                {
                    user_id: 2,
                    title: 'Profiler 101'
                }
            ])

            const country = await Country.find(1)
            const total = await country!.related('posts').query().count('* as total')
            expect(Number(total[0].total)).toEqual(2)
        })

        test('select extra columns with count', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }

            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }

            await db.table('countries').insert({ name: 'India' })
            await db.table('users').insert({
                username: 'virk',
                country_id: 1
            })

            await db.table('posts').multiInsert([
                {
                    user_id: 1,
                    title: 'tngraphql 101'
                },
                {
                    user_id: 1,
                    title: 'Lucid 101'
                },
                {
                    user_id: 2,
                    title: 'Profiler 101'
                }
            ])

            const country = await Country.find(1)
            const total = await country!
                .related('posts')
                .query()
                .select('title')
                .groupBy('posts.title')
                .count('* as total')

            expect(total).toHaveLength(2)
            expect(Number(total[0].total)).toEqual(1)
            expect(total[0].title).toBe('Lucid 101')
            expect(Number(total[0].total)).toEqual(1)
            expect(total[1].title).toBe('tngraphql 101')
        })
    })

    describe('Model | Has Many Through | preload', () => {
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

        test('preload through relationships', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }



            await db.insertQuery().table('countries').insert([{ name: 'India' }])

            await db.insertQuery().table('users').insert([
                { username: 'virk', country_id: 1 },
                { username: 'nikk', country_id: 1 }
            ])

            await db.insertQuery().table('posts').insert([
                { title: 'tngraphql 101', user_id: 1 },
                { title: 'Lucid 101', user_id: 1 },
                { title: 'tngraphql5', user_id: 2 }
            ])

            const countries = await Country.query().preload('posts')
            expect(countries).toHaveLength(1)
            expect(countries[0].posts).toHaveLength(3)
            expect(countries[0].posts[0].title).toBe('tngraphql 101')
            expect(countries[0].posts[0].$extras.through_country_id).toBe(1)

            expect(countries[0].posts[1].title).toBe('Lucid 101')
            expect(countries[0].posts[1].$extras.through_country_id).toBe(1)

            expect(countries[0].posts[2].title).toBe('tngraphql5')
            expect(countries[0].posts[2].$extras.through_country_id).toBe(1)
        })

        test('preload many relationships', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }



            await db.insertQuery().table('countries').insert([{ name: 'India' }, { name: 'USA' }])

            await db.insertQuery().table('users').insert([
                { username: 'virk', country_id: 1 },
                { username: 'nikk', country_id: 2 }
            ])

            await db.insertQuery().table('posts').insert([
                { title: 'tngraphql 101', user_id: 1 },
                { title: 'Lucid 101', user_id: 1 },
                { title: 'tngraphql5', user_id: 2 }
            ])

            const countries = await Country.query().preload('posts')
            expect(countries).toHaveLength(2)
            expect(countries[0].posts).toHaveLength(2)
            expect(countries[1].posts).toHaveLength(1)

            expect(countries[0].posts[0].title).toBe('tngraphql 101')
            expect(countries[0].posts[0].$extras.through_country_id).toBe(1)

            expect(countries[0].posts[1].title).toBe('Lucid 101')
            expect(countries[0].posts[1].$extras.through_country_id).toBe(1)

            expect(countries[1].posts[0].title).toBe('tngraphql5')
            expect(countries[1].posts[0].$extras.through_country_id).toBe(2)
        })

        test('preload many relationships using model instance', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }



            await db.insertQuery().table('countries').insert([{ name: 'India' }, { name: 'USA' }])

            await db.insertQuery().table('users').insert([
                { username: 'virk', country_id: 1 },
                { username: 'nikk', country_id: 2 }
            ])

            await db.insertQuery().table('posts').insert([
                { title: 'tngraphql 101', user_id: 1 },
                { title: 'Lucid 101', user_id: 1 },
                { title: 'tngraphql5', user_id: 2 }
            ])

            const countries = await Country.query().orderBy('id', 'asc')
            expect(countries).toHaveLength(2)

            await countries[0].preload('posts')
            await countries[1].preload('posts')

            expect(countries[0].posts).toHaveLength(2)
            expect(countries[1].posts).toHaveLength(1)

            expect(countries[0].posts[0].title).toBe('tngraphql 101')
            expect(countries[0].posts[0].$extras.through_country_id).toBe(1)

            expect(countries[0].posts[1].title).toBe('Lucid 101')
            expect(countries[0].posts[1].$extras.through_country_id).toBe(1)

            expect(countries[1].posts[0].title).toBe('tngraphql5')
            expect(countries[1].posts[0].$extras.through_country_id).toBe(2)
        })

        test('cherry pick columns during preload', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }



            await db.insertQuery().table('countries').insert([{ name: 'India' }, { name: 'USA' }])

            await db.insertQuery().table('users').insert([
                { username: 'virk', country_id: 1 },
                { username: 'nikk', country_id: 2 }
            ])

            await db.insertQuery().table('posts').insert([
                { title: 'tngraphql 101', user_id: 1 },
                { title: 'Lucid 101', user_id: 1 },
                { title: 'tngraphql5', user_id: 2 }
            ])

            const countries = await Country.query().preload('posts', (builder) => {
                builder.select('title')
            })

            expect(countries).toHaveLength(2)
            expect(countries[0].posts).toHaveLength(2)
            expect(countries[1].posts).toHaveLength(1)

            expect(countries[0].posts[0].title).toBe('tngraphql 101')
            expect(countries[0].posts[0].$extras).toEqual({ through_country_id: 1 })

            expect(countries[0].posts[1].title).toBe('Lucid 101')
            expect(countries[0].posts[1].$extras).toEqual({ through_country_id: 1 })

            expect(countries[1].posts[0].title).toBe('tngraphql5')
            expect(countries[1].posts[0].$extras).toEqual({ through_country_id: 2 })
        })

        test('raise error when local key is not selected', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }



            await db.insertQuery().table('countries').insert([{ name: 'India' }, { name: 'USA' }])

            await db.insertQuery().table('users').insert([
                { username: 'virk', country_id: 1 },
                { username: 'nikk', country_id: 2 }
            ])

            await db.insertQuery().table('posts').insert([
                { title: 'tngraphql 101', user_id: 1 },
                { title: 'Lucid 101', user_id: 1 },
                { title: 'tngraphql5', user_id: 2 }
            ])

            try {
                await Country.query().select('name').preload('posts')
            } catch ({ message }) {
                expect(message).toBe('Cannot preload "posts", value of "Country.id" is undefined')
            }
        })

        test('pass relationship metadata to the profiler', async () => {
            expect.assertions(1)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }



            await db.insertQuery().table('countries').insert([{ name: 'India' }])

            await db.insertQuery().table('users').insert([
                { username: 'virk', country_id: 1 },
                { username: 'nikk', country_id: 1 }
            ])

            await db.insertQuery().table('posts').insert([
                { title: 'tngraphql 101', user_id: 1 },
                { title: 'Lucid 101', user_id: 1 },
                { title: 'tngraphql5', user_id: 2 }
            ])

            const profiler = getProfiler(true)

            let profilerPacketIndex = 0
            profiler.process((packet) => {
                if ( profilerPacketIndex === 1 ) {
                    expect(packet.data.relation).toEqual({
                        model: 'Country',
                        relatedModel: 'Post',
                        throughModel: 'User',
                        type: 'hasManyThrough'
                    })
                }
                profilerPacketIndex++
            })

            await Country.query({ profiler }).preload('posts')
        })

        test('do not run preload query when parent rows are empty', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }



            const countries = await Country.query().preload('posts', () => {
                throw new Error('not expected to be here')
            })
            expect(countries).toHaveLength(0)
        })
    })

    describe('Model | Has Many Through | select', () => {
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

        it('define columns as array', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }

            class Post extends BaseModel {
                @column()
                public id: number

                @column()
                public title: number

                @column()
                public userId: number
            }

            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }

            await db.table('countries').multiInsert([{ name: 'India' }, { name: 'Switzerland' }])

            const country = await Country.find(1)
            const {sql, bindings} = country!.related('posts').query().select(['userId']).toSQL();
            const {sql: knexSql, bindings: knexBindings} = db.from('posts')
                .select(['posts.user_id'])
                .select({
                    through_country_id: 'users.country_id'
                })
                .innerJoin('users', 'users.id', '=', 'posts.user_id')
                .where('users.country_id', 1)
                .toSQL()
            expect(sql).toBe(knexSql);
            expect(bindings).toEqual(knexBindings);
        });

        it('define columns with aliases', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }

            class Post extends BaseModel {
                @column()
                public id: number

                @column()
                public title: number

                @column()
                public userId: number
            }

            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }

            await db.table('countries').multiInsert([{ name: 'India' }, { name: 'Switzerland' }])

            const country = await Country.find(1)
            const {sql, bindings} = country!.related('posts').query().select(['userId as u']).toSQL();
            const {sql: knexSql, bindings: knexBindings} = db.from('posts')
                .select(['posts.user_id as u'])
                .select({
                    through_country_id: 'users.country_id'
                })
                .innerJoin('users', 'users.id', '=', 'posts.user_id')
                .where('users.country_id', 1)
                .toSQL()
            expect(sql).toBe(knexSql);
            expect(bindings).toEqual(knexBindings);
        });

        it('define columns as multiple arguments', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }

            class Post extends BaseModel {
                @column()
                public id: number

                @column()
                public title: number

                @column()
                public userId: number
            }

            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }

            await db.table('countries').multiInsert([{ name: 'India' }, { name: 'Switzerland' }])

            const country = await Country.find(1)
            const {sql, bindings} = country!.related('posts').query().select(['title','userId']).toSQL();
            const {sql: knexSql, bindings: knexBindings} = db.from('posts')
                .select(['posts.title', 'posts.user_id'])
                .select({
                    through_country_id: 'users.country_id'
                })
                .innerJoin('users', 'users.id', '=', 'posts.user_id')
                .where('users.country_id', 1)
                .toSQL()
            expect(sql).toBe(knexSql);
            expect(bindings).toEqual(knexBindings);
        });

        it('define columns as object', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }

            class Post extends BaseModel {
                @column()
                public id: number

                @column()
                public title: number

                @column()
                public userId: number
            }

            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }

            await db.table('countries').multiInsert([{ name: 'India' }, { name: 'Switzerland' }])

            const country = await Country.find(1)
            const {sql, bindings} = country!.related('posts').query().select({
                'title': 'title',
                'userId': 'userId'
            }).toSQL();
            const {sql: knexSql, bindings: knexBindings} = db.from('posts')
                .select(['posts.title as title', 'posts.user_id as userId'])
                .select({
                    through_country_id: 'users.country_id'
                })
                .innerJoin('users', 'users.id', '=', 'posts.user_id')
                .where('users.country_id', 1)
                .toSQL()
            expect(sql).toBe(knexSql);
            expect(bindings).toEqual(knexBindings);
        });

        it('define columns as multiple arguments with aliases', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }

            class Post extends BaseModel {
                @column()
                public id: number

                @column()
                public title: number

                @column()
                public userId: number
            }

            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }

            await db.table('countries').multiInsert([{ name: 'India' }, { name: 'Switzerland' }])

            const country = await Country.find(1)
            const {sql, bindings} = country!.related('posts').query().select('title as title', 'userId as userId').toSQL();
            const {sql: knexSql, bindings: knexBindings} = db.from('posts')
                .select(['posts.title as title', 'posts.user_id as userId'])
                .select({
                    through_country_id: 'users.country_id'
                })
                .innerJoin('users', 'users.id', '=', 'posts.user_id')
                .where('users.country_id', 1)
                .toSQL()
            expect(sql).toBe(knexSql);
            expect(bindings).toEqual(knexBindings);
        });

        it('define columns as subqueries', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }

            class Post extends BaseModel {
                @column()
                public id: number

                @column()
                public title: number

                @column()
                public userId: number
            }

            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }

            await db.table('countries').multiInsert([{ name: 'India' }, { name: 'Switzerland' }])

            const country = await Country.find(1)
            const {sql, bindings} = country!.related('posts').query()
                .select(db.from('addresses').count('* as total').as('addresses_total')).toSQL();
            const {sql: knexSql, bindings: knexBindings} = db.from('posts')
                .select(db.from('addresses').count('* as total').as('addresses_total'))
                .select({
                    through_country_id: 'users.country_id'
                })
                .innerJoin('users', 'users.id', '=', 'posts.user_id')
                .where('users.country_id', 1)
                .toSQL()
            expect(sql).toBe(knexSql);
            expect(bindings).toEqual(knexBindings);
        });

        it('define columns as subqueries inside an array', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }

            class Post extends BaseModel {
                @column()
                public id: number

                @column()
                public title: number

                @column()
                public userId: number
            }

            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }

            await db.table('countries').multiInsert([{ name: 'India' }, { name: 'Switzerland' }])

            const country = await Country.find(1)
            const {sql, bindings} = country!.related('posts').query()
                .select([db.from('addresses').count('* as total').as('addresses_total')]).toSQL();
            const {sql: knexSql, bindings: knexBindings} = db.from('posts')
                .select(db.from('addresses').count('* as total').as('addresses_total'))
                .select({
                    through_country_id: 'users.country_id'
                })
                .innerJoin('users', 'users.id', '=', 'posts.user_id')
                .where('users.country_id', 1)
                .toSQL()
            expect(sql).toBe(knexSql);
            expect(bindings).toEqual(knexBindings);
        });
    });

    describe('Model | Has Many Through | pagination', () => {
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
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }

            class Post extends BaseModel {
                @column()
                public userId: number
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }



            await db.table('countries').multiInsert([{ name: 'India' }, { name: 'Switzerland' }])
            await db.table('users').multiInsert([
                {
                    username: 'virk',
                    country_id: 1
                },
                {
                    username: 'nikk',
                    country_id: 1
                },
                {
                    username: 'romain',
                    country_id: 2
                }
            ])

            await db.table('posts').multiInsert([
                {
                    title: 'tngraphql 101',
                    user_id: 1
                },
                {
                    title: 'Lucid 101',
                    user_id: 1
                },
                {
                    title: 'Design 101',
                    user_id: 2
                },
                {
                    title: 'Dev 101',
                    user_id: 3
                }
            ])

            const country = await Country.find(1)
            const posts = await country!.related('posts').query().paginate(1, 2)
            posts.baseUrl('/posts')

            expect(posts.all()).toHaveLength(2)
            expect(posts.all()[0]).toBeInstanceOf(Post)
            // assert.notProperty(posts.all()[0].$extras, 'total')
            expect(posts.all()[0].$extras).not.toHaveProperty('total')
            expect(posts.perPage).toBe(2)
            expect(posts.currentPage).toBe(1)
            expect(posts.lastPage).toBe(2)
            expect(posts.hasPages).toBeTruthy()
            expect(posts.hasMorePages).toBeTruthy()
            expect(posts.isEmpty).toBeFalsy()
            expect(Number(posts.total)).toBe(3)
            expect(posts.hasTotal).toBeTruthy()
            expect(posts.getMeta()).toEqual({
                total: 3,
                per_page: 2,
                current_page: 1,
                last_page: 2,
                first_page: 1,
                first_page_url: '/posts?page=1',
                last_page_url: '/posts?page=2',
                next_page_url: '/posts?page=2',
                previous_page_url: null
            })
        })

        test('disallow paginate during preload', async () => {
            expect.assertions(1)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column()
                public userId: number
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }



            await db.table('countries').insert({ name: 'India' })

            try {
                await Country.query().preload('posts', (query) => query.paginate(1))
            } catch ({ message }) {
                expect(message).toBe('Cannot paginate relationship "posts" during preload')
            }
        })
    })

    describe('Model | Has Many Through | clone', () => {
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
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column()
                public userId: number
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }



            await db.table('countries').multiInsert([{ name: 'India' }, { name: 'Switzerland' }])
            await db.table('users').multiInsert([
                {
                    username: 'virk',
                    country_id: 1
                },
                {
                    username: 'nikk',
                    country_id: 1
                },
                {
                    username: 'romain',
                    country_id: 2
                }
            ])

            await db.table('posts').multiInsert([
                {
                    title: 'tngraphql 101',
                    user_id: 1
                },
                {
                    title: 'Lucid 101',
                    user_id: 1
                },
                {
                    title: 'Design 101',
                    user_id: 2
                },
                {
                    title: 'Dev 101',
                    user_id: 3
                }
            ])

            const country = await Country.find(1)
            const clonedQuery = country!.related('posts').query().clone()
            expect(clonedQuery).toBeInstanceOf(HasManyThroughQueryBuilder)
        })
    })

    describe('Model | Has Many Through | scopes', () => {
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
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column()
                public userId: number

                @column()
                public title: string

                public static adonisOnly = scope((query) => {
                    query.where('title', 'tngraphql 101')
                })
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }



            await db.table('countries').multiInsert([{ name: 'India' }, { name: 'Switzerland' }])
            await db.table('users').multiInsert([
                {
                    username: 'virk',
                    country_id: 1
                },
                {
                    username: 'nikk',
                    country_id: 1
                },
                {
                    username: 'romain',
                    country_id: 2
                }
            ])

            await db.table('posts').multiInsert([
                {
                    title: 'tngraphql 101',
                    user_id: 1
                },
                {
                    title: 'Lucid 101',
                    user_id: 1
                },
                {
                    title: 'Design 101',
                    user_id: 2
                },
                {
                    title: 'Dev 101',
                    user_id: 3
                }
            ])

            const country = await Country.query().where('id', 1).preload('posts', (query) => {
                query.apply((scopes) => scopes.adonisOnly())
            }).firstOrFail()

            const countryWithoutScope = await Country.query().where('id', 1).preload('posts').firstOrFail()

            expect(country.posts).toHaveLength(1)
            expect(countryWithoutScope.posts).toHaveLength(3)
            expect(country.posts[0].title).toBe('tngraphql 101')
        })

        test('apply scopes2 during eagerload', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }

            class Post extends BaseModel {
                @column()
                public userId: number

                @column()
                public title: string

                public static scopeTngraphqlOnly(query) {
                    query.where('title', 'tngraphql 101')
                }
            }

            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }

            await db.table('countries').multiInsert([{ name: 'India' }, { name: 'Switzerland' }])
            await db.table('users').multiInsert([
                {
                    username: 'virk',
                    country_id: 1
                },
                {
                    username: 'nikk',
                    country_id: 1
                },
                {
                    username: 'romain',
                    country_id: 2
                }
            ])

            await db.table('posts').multiInsert([
                {
                    title: 'tngraphql 101',
                    user_id: 1
                },
                {
                    title: 'Lucid 101',
                    user_id: 1
                },
                {
                    title: 'Design 101',
                    user_id: 2
                },
                {
                    title: 'Dev 101',
                    user_id: 3
                }
            ])

            const country = await Country.query().where('id', 1).preload('posts', (query) => {
                query.tngraphqlOnly()
            }).firstOrFail()

            const countryWithoutScope = await Country.query().where('id', 1).preload('posts').firstOrFail()

            expect(country.posts).toHaveLength(1)
            expect(countryWithoutScope.posts).toHaveLength(3)
            expect(country.posts[0].title).toBe('tngraphql 101')
        })

        test('apply scopes on related query', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column()
                public userId: number

                @column()
                public title: string

                public static adonisOnly = scope((query) => {
                    query.where('title', 'tngraphql 101')
                })
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }



            await db.table('countries').multiInsert([{ name: 'India' }, { name: 'Switzerland' }])
            await db.table('users').multiInsert([
                {
                    username: 'virk',
                    country_id: 1
                },
                {
                    username: 'nikk',
                    country_id: 1
                },
                {
                    username: 'romain',
                    country_id: 2
                }
            ])

            await db.table('posts').multiInsert([
                {
                    title: 'tngraphql 101',
                    user_id: 1
                },
                {
                    title: 'Lucid 101',
                    user_id: 1
                },
                {
                    title: 'Design 101',
                    user_id: 2
                },
                {
                    title: 'Dev 101',
                    user_id: 3
                }
            ])

            const country = await Country.findOrFail(1)
            const posts = await country.related('posts').query().apply((scopes) => scopes.adonisOnly())
            const postsWithoutScope = await country.related('posts').query()

            expect(posts).toHaveLength(1)
            expect(postsWithoutScope).toHaveLength(3)
            expect(posts[0].title).toBe('tngraphql 101')
        })
    })

    describe('Model | Has Many Through | global scope', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()

            await db.table('countries').multiInsert([{ name: 'India' }, { name: 'Switzerland' }])
            await db.table('users').multiInsert([
                {
                    username: 'virk',
                    country_id: 1
                },
                {
                    username: 'nikk',
                    country_id: 1
                },
                {
                    username: 'romain',
                    country_id: 2
                }
            ])

            await db.table('posts').multiInsert([
                {
                    title: 'tngraphql 101',
                    user_id: 1
                },
                {
                    title: 'Lucid 101',
                    user_id: 1
                },
                {
                    title: 'Design 101',
                    user_id: 2
                },
                {
                    title: 'Dev 101',
                    user_id: 3
                }
            ])
        })

        afterAll(async () => {
            await cleanup()
            await resetTables()
            await db.manager.closeAll()
        })

        it('apply scopes during eagerload', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number;
            }

            class Post extends BaseModel {
                @column()
                public userId: number

                static boot() {
                    super.boot();

                    this.addGlobalScope('test',builder => builder.where('posts.id', 1))
                }
            }


            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }

            db.enableQueryLog();
            const countryWithoutScope = await Country.query().where('id', 1).preload('posts').firstOrFail()

            const stack = db.getQueryLog();

            const {sql} = stack[1];

            const {sql: knexSql} = db.from('posts')
                .select(['posts.*', 'users.country_id as through_country_id'])
                .join('users', 'users.id', '=', 'posts.user_id')
                .whereIn('users.country_id', [1])
                .where('posts.id', 1)
                .toSQL();

            expect(sql).toEqual(knexSql);
        });

        it('apply scopes on related query', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number;
            }

            class Post extends BaseModel {
                @column()
                public userId: number

                static boot() {
                    super.boot();

                    this.addGlobalScope('test',builder => builder.where('posts.id', 1))
                }
            }


            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }

            const country = await Country.findOrFail(1)
            db.enableQueryLog();

            const postsWithoutScope = await country.related('posts').query();

            const {sql} = db.getQueryLog()[0];

            const {sql: knexSql} = db.from('posts')
                .select(['posts.*', 'users.country_id as through_country_id'])
                .join('users', 'users.id', '=', 'posts.user_id')
                .where('users.country_id', 1)
                .where('posts.id', 1)
                .toSQL();

            expect(sql).toEqual(knexSql);
        });

        it('apply scopes on related paginate', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number;
            }

            class Post extends BaseModel {
                @column()
                public userId: number

                static boot() {
                    super.boot();

                    this.addGlobalScope('test',builder => builder.where('posts.id', 1))
                }
            }


            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }

            const country = await Country.find(1)
            db.enableQueryLog();
            const posts = await country!.related('posts').query().paginate(1, 2);

            const stack = db.getQueryLog();

            {
                const {sql} = stack[0];
                const {sql: knexSql} = db.from('posts')
                    .join('users', 'users.id', '=', 'posts.user_id')
                    .where('users.country_id', 1)
                    .where('posts.id', 1)
                    .count('* as total')
                    .toSQL();
                expect(sql).toEqual(knexSql);
            }

            {
                const {sql} = stack[1];
                const {sql: knexSql} = db.from('posts')
                    .select(['posts.*', 'users.country_id as through_country_id'])
                    .join('users', 'users.id', '=', 'posts.user_id')
                    .where('users.country_id', 1)
                    .where('posts.id', 1)
                    .limit(20)
                    .toSQL();
                expect(sql).toEqual(knexSql);
            }
        });
    });

    describe('Model | Has Many Through | onQuery', () => {
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
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column()
                public userId: number

                @column()
                public title: string
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User], {
                    onQuery: (query) => query.where('title', 'tngraphql 101')
                })
                public posts: HasManyThrough<typeof Post>
            }



            await db.table('countries').multiInsert([{ name: 'India' }, { name: 'Switzerland' }])
            await db.table('users').multiInsert([
                {
                    username: 'virk',
                    country_id: 1
                },
                {
                    username: 'nikk',
                    country_id: 1
                },
                {
                    username: 'romain',
                    country_id: 2
                }
            ])

            await db.table('posts').multiInsert([
                {
                    title: 'tngraphql 101',
                    user_id: 1
                },
                {
                    title: 'Lucid 101',
                    user_id: 1
                },
                {
                    title: 'Design 101',
                    user_id: 2
                },
                {
                    title: 'Dev 101',
                    user_id: 3
                }
            ])

            const country = await Country.query().where('id', 1).preload('posts').firstOrFail()
            expect(country.posts).toHaveLength(1)
            expect(country.posts[0].title).toBe('tngraphql 101')
        })

        test('do not invoke onQuery method on preloading subqueries', async () => {
            expect.assertions(3)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column()
                public userId: number

                @column()
                public title: string
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User], {
                    onQuery: (query) => {
                        expect(true).toBeTruthy()
                        query.where('title', 'tngraphql 101')
                    }
                })
                public posts: HasManyThrough<typeof Post>
            }



            await db.table('countries').multiInsert([{ name: 'India' }, { name: 'Switzerland' }])
            await db.table('users').multiInsert([
                {
                    username: 'virk',
                    country_id: 1
                },
                {
                    username: 'nikk',
                    country_id: 1
                },
                {
                    username: 'romain',
                    country_id: 2
                }
            ])

            await db.table('posts').multiInsert([
                {
                    title: 'tngraphql 101',
                    user_id: 1
                },
                {
                    title: 'Lucid 101',
                    user_id: 1
                },
                {
                    title: 'Design 101',
                    user_id: 2
                },
                {
                    title: 'Dev 101',
                    user_id: 3
                }
            ])

            const country = await Country
                .query()
                .where('id', 1)
                .preload('posts', (query) => query.where({}))
                .firstOrFail()

            expect(country.posts).toHaveLength(1)
            expect(country.posts[0].title).toBe('tngraphql 101')
        })

        test('invoke onQuery method on related query builder', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column()
                public userId: number

                @column()
                public title: string
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User], {
                    onQuery: (query) => query.where('title', 'tngraphql 101')
                })
                public posts: HasManyThrough<typeof Post>
            }



            await db.table('countries').multiInsert([{ name: 'India' }, { name: 'Switzerland' }])
            await db.table('users').multiInsert([
                {
                    username: 'virk',
                    country_id: 1
                },
                {
                    username: 'nikk',
                    country_id: 1
                },
                {
                    username: 'romain',
                    country_id: 2
                }
            ])

            await db.table('posts').multiInsert([
                {
                    title: 'tngraphql 101',
                    user_id: 1
                },
                {
                    title: 'Lucid 101',
                    user_id: 1
                },
                {
                    title: 'Design 101',
                    user_id: 2
                },
                {
                    title: 'Dev 101',
                    user_id: 3
                }
            ])

            const country = await Country.findOrFail(1)
            const posts = await country.related('posts').query()

            expect(posts).toHaveLength(1)
            expect(posts[0].title).toBe('tngraphql 101')
        })

        test('do not invoke onQuery method on related query builder subqueries', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number
            }



            class Post extends BaseModel {
                @column()
                public userId: number

                @column()
                public title: string
            }



            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User], {
                    onQuery: (query) => query.where('title', 'tngraphql 101')
                })
                public posts: HasManyThrough<typeof Post>
            }



            await db.table('countries').multiInsert([{ name: 'India' }, { name: 'Switzerland' }])
            await db.table('users').multiInsert([
                {
                    username: 'virk',
                    country_id: 1
                },
                {
                    username: 'nikk',
                    country_id: 1
                },
                {
                    username: 'romain',
                    country_id: 2
                }
            ])

            await db.table('posts').multiInsert([
                {
                    title: 'tngraphql 101',
                    user_id: 1
                },
                {
                    title: 'Lucid 101',
                    user_id: 1
                },
                {
                    title: 'Design 101',
                    user_id: 2
                },
                {
                    title: 'Dev 101',
                    user_id: 3
                }
            ])

            const country = await Country.findOrFail(1)
            const { sql, bindings } = country
                .related('posts')
                .query()
                .where((query) => query.whereNotNull('created_at'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .from('posts')
                                                               .select('posts.*', 'users.country_id as through_country_id')
                                                               .innerJoin('users', 'users.id', 'posts.user_id')
                                                               .where('title', 'tngraphql 101')
                                                               .where((query) => query.whereNotNull('created_at'))
                                                               .where('users.country_id', 1)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })

    describe('Model HasQuery', () => {
        let Profile;
        let User;
        let Post;
        let Country;

        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()

            class UserModel extends BaseModel {
                static table = 'users'
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number

                @belongsTo(() => CountryModel)
                public country: BelongsTo<typeof CountryModel>;
            }

            class PostModel extends BaseModel {
                static table = 'posts'
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public countryId: number

                @column()
                public title: string
            }

            class CountryModel extends BaseModel {
                static table = 'countries'
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public countryId: number

                @hasManyThrough([() => PostModel, () => CountryModel])
                public posts2: HasManyThrough<typeof PostModel>

                @hasManyThrough([() => CountryModel, () => UserModel])
                public countries: HasManyThrough<typeof CountryModel>

                @hasManyThrough([() => PostModel, () => UserModel])
                public posts: HasManyThrough<typeof PostModel>
            }

            User = UserModel;
            Post = PostModel;
            Country = CountryModel;
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        afterEach(async () => {
            await resetTables()
            Relation.$selfJoinCount = 0;
        })

        it('has query', async () => {
            const {sql, bindings} = Country.query().has('posts').toSQL();

            const {sql: knexSql} = db
                .from('countries')
                .select('*')
                .whereExists(builder => {
                    builder
                        .from('posts')
                        .select('posts.*')
                        .select({
                            'through_country_id': 'users.country_id'
                        })
                        .innerJoin(
                            'users',
                            'users.id',
                            'posts.user_id'
                        )
                        .whereRaw('countries.id = users.country_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('has nested query', async () => {
            const {sql, bindings} = Country.query().has('countries').toSQL();

            const {sql: knexSql} = db
                .from('countries')
                .select('*')
                .whereExists(builder => {
                    builder
                        .from('countries as lucid_reserved_0')
                        .select('*')
                        .innerJoin(
                            'users',
                            'users.id',
                            'lucid_reserved_0.user_id'
                        )
                        .whereRaw('countries.id = lucid_reserved_0.country_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('has nested query', async () => {
            const {sql, bindings} = Country.query().has('posts2').toSQL();

            const {sql: knexSql} = db
                .from('countries')
                .select('*')
                .whereExists(builder => {
                    builder
                        .from('posts')
                        .select('*')
                        .innerJoin(
                            'countries as lucid_reserved_0', // user
                            'lucid_reserved_0.id',
                            'posts.country_id'
                        )
                        .whereRaw('countries.id = lucid_reserved_0.country_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('withcount query', async () => {
            const {sql, bindings} = Country.query().withCount('posts').toSQL();
            const q = db.from('posts')
                .count('*')
                .innerJoin(
                    'users',
                    'users.id',
                    'posts.user_id'
                )
                .whereRaw('countries.id = users.country_id')


            const {sql: knexSql} = db
                .from('countries')
                .select('countries.*')
                .selectSub(q, 'posts_count')
                .toSQL();
            expect(sql).toBe(knexSql);
        });

        it('orHas query', async () => {
            const {sql, bindings} = Country.query().where('id', 1).orHas('posts').toSQL();

            const {sql: knexSql} = db
                .from('countries')
                .select('*')
                .where('id', 1)
                .orWhereExists(builder => {
                    builder
                        .from('posts')
                        .select('posts.*')
                        .select({
                            'through_country_id': 'users.country_id'
                        })
                        .innerJoin(
                            'users',
                            'users.id',
                            'posts.user_id'
                        )
                        .whereRaw('countries.id = users.country_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('whereHas query', async () => {
            const {sql, bindings} = Country.query().whereHas('posts').toSQL();
            const {sql: knexSql} = db
                .from('countries')
                .select('*')
                .whereExists(builder => {
                    builder
                        .from('posts')
                        .select('posts.*')
                        .select({
                            'through_country_id': 'users.country_id'
                        })
                        .innerJoin(
                            'users',
                            'users.id',
                            'posts.user_id'
                        )
                        .whereRaw('countries.id = users.country_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('whereHas use callback query', async () => {
            const {sql, bindings} = Country.query().whereHas('posts', query => {
                query.where(query.qualifyColumn('id'), 1)
            }).toSQL();

            const {sql: knexSql} = db
                .from('countries')
                .select('*')
                .whereExists(builder => {
                    builder
                        .from('posts')
                        .select('posts.*')
                        .select({
                            'through_country_id': 'users.country_id'
                        })
                        .innerJoin(
                            'users',
                            'users.id',
                            'posts.user_id'
                        )
                        .whereRaw('countries.id = users.country_id')
                        .where('posts.id', 1)
                })
                .toSQL();


            expect(sql).toBe(knexSql);
        });

        it('orWhereHas query', async () => {
            const {sql, bindings} = Country.query().orWhereHas('posts').toSQL();
            const {sql: knexSql} = db
                .from('countries')
                .select('*')
                .orWhereExists(builder => {
                    builder
                        .from('posts')
                        .select('posts.*')
                        .select({
                            'through_country_id': 'users.country_id'
                        })
                        .innerJoin(
                            'users',
                            'users.id',
                            'posts.user_id'
                        )
                        .whereRaw('countries.id = users.country_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orWhereHas using callback query', async () => {
            const {sql, bindings} = Country.query().orWhereHas('posts', query => {
                query.where(query.qualifyColumn('id'), 1)
            }).toSQL();
            const {sql: knexSql} = db
                .from('countries')
                .select('*')
                .orWhereExists(builder => {
                    builder
                        .from('posts')
                        .select('posts.*')
                        .select({
                            'through_country_id': 'users.country_id'
                        })
                        .innerJoin(
                            'users',
                            'users.id',
                            'posts.user_id'
                        )
                        .whereRaw('countries.id = users.country_id')
                        .where('posts.id', 1)
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('doesntHave query', async () => {
            const {sql, bindings} = Country.query().doesntHave('posts').toSQL();
            const {sql: knexSql} = db
                .from('countries')
                .select('*')
                .whereNotExists(builder => {
                    builder
                        .from('posts')
                        .select('posts.*')
                        .select({
                            'through_country_id': 'users.country_id'
                        })
                        .innerJoin(
                            'users',
                            'users.id',
                            'posts.user_id'
                        )
                        .whereRaw('countries.id = users.country_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orDoesntHave query', async () => {
            const {sql, bindings} = Country.query().where('id', 1).orDoesntHave('posts').toSQL();

            const {sql: knexSql} = db
                .from('countries')
                .select('*')
                .where('id', 1)
                .orWhereNotExists(builder => {
                    builder
                        .from('posts')
                        .select('posts.*')
                        .select({
                            'through_country_id': 'users.country_id'
                        })
                        .innerJoin(
                            'users',
                            'users.id',
                            'posts.user_id'
                        )
                        .whereRaw('countries.id = users.country_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('whereDoesntHave query', async () => {
            const {sql, bindings} = Country.query().where('id', 1).whereDoesntHave('posts').toSQL();
            const {sql: knexSql} = db
                .from('countries')
                .select('*')
                .where('id', 1)
                .whereNotExists(builder => {
                    builder
                        .from('posts')
                        .select('posts.*')
                        .select({
                            'through_country_id': 'users.country_id'
                        })
                        .innerJoin(
                            'users',
                            'users.id',
                            'posts.user_id'
                        )
                        .whereRaw('countries.id = users.country_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('whereDoesntHave using callback query', async () => {
            const {sql, bindings} = Country.query().where('id', 1).whereDoesntHave('posts', query => {
                query.where(query.qualifyColumn('id'), 1)
            }).toSQL();
            const {sql: knexSql} = db
                .from('countries')
                .select('*')
                .where('id', 1)
                .whereNotExists(builder => {
                    builder
                        .from('posts')
                        .select('posts.*')
                        .select({
                            'through_country_id': 'users.country_id'
                        })
                        .innerJoin(
                            'users',
                            'users.id',
                            'posts.user_id'
                        )
                        .whereRaw('countries.id = users.country_id')
                        .where('posts.id', 1)
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orWhereDoesntHave query', async () => {
            const {sql, bindings} = Country.query().where('id', 1).orWhereDoesntHave('posts').toSQL();
            const {sql: knexSql} = db
                .from('countries')
                .select('*')
                .where('id', 1)
                .orWhereNotExists(builder => {
                    builder
                        .from('posts')
                        .select('posts.*')
                        .select({
                            'through_country_id': 'users.country_id'
                        })
                        .innerJoin(
                            'users',
                            'users.id',
                            'posts.user_id'
                        )
                        .whereRaw('countries.id = users.country_id')
                        // .where('posts.id', 1)
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orWhereDoesntHave using callback query', async () => {
            const {sql, bindings} = Country.query().where('id', 1).orWhereDoesntHave('posts', query => {
                query.where(query.qualifyColumn('id'), 1)
            }).toSQL();
            const {sql: knexSql} = db
                .from('countries')
                .select('*')
                .where('id', 1)
                .orWhereNotExists(builder => {
                    builder
                        .from('posts')
                        .select('posts.*')
                        .select({
                            'through_country_id': 'users.country_id'
                        })
                        .innerJoin(
                            'users',
                            'users.id',
                            'posts.user_id'
                        )
                        .whereRaw('countries.id = users.country_id')
                        .where('posts.id', 1)
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('has query when have global scope', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number;

                static boot() {
                    super.boot();

                    this.addGlobalScope('test',builder => builder.where('posts.id', 1))
                }
            }

            class Post extends BaseModel {
                @column()
                public userId: number

                static boot() {
                    super.boot();

                    this.addGlobalScope('test',builder => builder.where('posts.id', 1))
                }
            }

            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }

            const {sql, bindings} = Country.query().has('posts').toSQL();
            const {sql: knexSql, bindings: knexBindings} = db
                .from('countries')
                .select('*')
                .whereExists(builder => {
                    builder
                        .from('posts')
                        .select('posts.*')
                        .select({
                            'through_country_id': 'users.country_id'
                        })
                        .innerJoin(
                            'users',
                            'users.id',
                            'posts.user_id'
                        )
                        .whereRaw('countries.id = users.country_id')
                        .where('posts.id', 1)
                })
                .toSQL();

            expect(sql).toBe(knexSql);
            expect(bindings).toEqual(knexBindings);
        });

        it('has query when have softdelete', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public countryId: number;

                @column.dateTime({autoCreate: true})
                public createdAt: DateTime

                @column.dateTime({autoCreate: true, autoUpdate: true})
                public updatedAt: DateTime;

                @column.dateTime()
                public deletedAt: DateTime;

                static boot() {
                    this.use(SoftDeletes);
                }
            }

            class Post extends BaseModel {
                @column()
                public userId: number

                @column.dateTime({autoCreate: true})
                public createdAt: DateTime

                @column.dateTime({autoCreate: true, autoUpdate: true})
                public updatedAt: DateTime;

                @column.dateTime()
                public deletedAt: DateTime;

                static boot() {
                    this.use(SoftDeletes);
                }
            }

            class Country extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasManyThrough([() => Post, () => User])
                public posts: HasManyThrough<typeof Post>
            }

            const {sql, bindings} = Country.query().has('posts').toSQL();
            const {sql: knexSql, bindings: knexBindings} = db
                .from('countries')
                .select('*')
                .whereExists(builder => {
                    builder
                        .from('posts')
                        .select('posts.*')
                        .select({
                            'through_country_id': 'users.country_id'
                        })
                        .innerJoin(
                            'users',
                            'users.id',
                            'posts.user_id'
                        )
                        .whereNull('users.deleted_at')
                        .whereRaw('countries.id = users.country_id')
                        .whereNull('posts.deleted_at')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
            expect(bindings).toEqual(knexBindings);
        });
    });
})
