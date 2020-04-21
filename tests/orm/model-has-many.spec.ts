/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 9:47 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { HasMany } from '../../src/Contracts/Orm/Relations/types';
import { scope } from '../../src/Helpers/scope';
import { column, hasMany } from '../../src/Orm/Decorators';
import { HasManyQueryBuilder } from '../../src/Orm/Relations/HasMany/QueryBuilder';
import { cleanup, getBaseModel, getDb, getPosts, getProfiler, ormAdapter, resetTables, setup } from '../helpers';

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Model | HasMany', () => {
    describe('Model | HasMany | Options', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })

        test('raise error when localKey is missing', () => {
            expect.assertions(1)

            try {
                class Post extends BaseModel {
                }

                class User extends BaseModel {
                    @hasMany(() => Post)
                    public posts: HasMany<typeof Post>
                }


                User.$getRelation('posts')!.boot()
            } catch ({ message }) {
                expect(
                    message).toBe(                    'E_MISSING_MODEL_ATTRIBUTE: "User.posts" expects "id" to exist on "User" model, but is missing',
                )
            }
        })

        test('raise error when foreignKey is missing', () => {
            expect.assertions(1)

            try {
                class Post extends BaseModel {
                }

                Post.bootIfNotBooted();

                class User extends BaseModel {
                    @column({ isPrimary: true })
                    public id: number

                    @hasMany(() => Post)
                    public posts: HasMany<typeof Post>
                }


                User.$getRelation('posts')!.boot()
            } catch ({ message }) {
                expect(
                    message).toBe(                    'E_MISSING_MODEL_ATTRIBUTE: "User.posts" expects "userId" to exist on "Post" model, but is missing',
                )
            }
        })

        test('use primary key as the local key', () => {
            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            expect(User.$getRelation('posts')!['localKey']).toBe('id')
        })

        test('use custom defined primary key', () => {
            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'user_uid' })
                public uid: number

                @hasMany(() => Post, { localKey: 'uid' })
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            expect(User.$getRelation('posts')!['localKey']).toBe('uid')
        })

        test('compute foreign key from model name and primary key', () => {
            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            expect(User.$getRelation('posts')!['foreignKey']).toBe('userId')
        })

        test('use pre defined foreign key', () => {
            class Post extends BaseModel {
                @column({ columnName: 'user_id' })
                public userUid: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post, { foreignKey: 'userUid' })
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            expect(User.$getRelation('posts')!['foreignKey']).toBe('userUid')
        })
    })

    describe('Model | HasMany | Set Relations', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })

        test('set related model instance', () => {
            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            const user = new User()
            user.fill({ id: 1 })

            const post = new Post()
            post.fill({ userId: 1 })

            User.$getRelation('posts')!.setRelated(user, [post])
            expect(user.posts).toEqual([post])
        })

        test('push related model instance', () => {
            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            const user = new User()
            user.fill({ id: 1 })

            const post = new Post()
            post.fill({ userId: 1 })

            const post1 = new Post()
            post1.fill({ userId: 1 })

            User.$getRelation('posts')!.setRelated(user, [post])
            User.$getRelation('posts')!.pushRelated(user, [post1])

            expect(user.posts).toEqual([post, post1])
        })

        test('set many of related instances', () => {
            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            const user = new User()
            user.fill({ id: 1 })

            const user1 = new User()
            user1.fill({ id: 2 })

            const user2 = new User()
            user2.fill({ id: 3 })

            const post = new Post()
            post.fill({ userId: 1 })

            const post1 = new Post()
            post1.fill({ userId: 2 })

            const post2 = new Post()
            post2.fill({ userId: 1 })

            User.$getRelation('posts')!.setRelatedForMany([user, user1, user2], [post, post1, post2])
            expect(user.posts).toEqual([post, post2])
            expect(user1.posts).toEqual([post1])
            expect(user2.posts).toEqual([] as any)
        })
    })

    describe('Model | HasMany | bulk operations', () => {
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
            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            await db.table('users').insert({ username: 'virk' })

            const user = await User.find(1)
            const { sql, bindings } = user!.related('posts').query().toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('posts')
                                                               .where('user_id', 1)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for selecting related many rows', async () => {
            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            await db.table('users').multiInsert([
                { username: 'virk' },
                { username: 'nikk' },
            ])

            const users = await User.all()

            const related = User.$getRelation('posts')!.eagerQuery(users, db.connection())
            const { sql, bindings } = related.toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('posts')
                                                               .whereIn('user_id', [2, 1])
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for updating related rows', async () => {
            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            await db.table('users').insert({ username: 'virk' })

            const user = await User.find(1)
            const { sql, bindings } = user!.related('posts').query().update({
                title: 'Adonis 101',
            }).toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('posts')
                                                               .where('user_id', 1)
                                                               .update({ title: 'Adonis 101' })
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for deleting related row', async () => {
            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            await db.table('users').insert({ username: 'virk' })

            const user = await User.find(1)
            const { sql, bindings } = user!.related('posts').query().del().toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('posts')
                                                               .where('user_id', 1)
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
            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            await db.table('users').insert({ username: 'virk' })
            await db.table('posts').multiInsert([
                { title: 'Adonis 101', user_id: 1 },
                { title: 'Lucid 101', user_id: 1 },
                { title: 'Profiler 101', user_id: 2 },
            ])

            const user = await User.find(1)
            const total = await user!.related('posts').query().count('* as total')
            expect(Number(total[0].total)).toBe(2)
        })
    })

    describe('Model | HasMany | preload', () => {
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

        test('preload relationship', async () => {
            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

            const [user0, user1] = await db.query().from('users')
            await db.insertQuery().table('posts').insert([
                {
                    user_id: user0.id,
                    title: 'Adonis 101',
                },
                {
                    user_id: user1.id,
                    title: 'Lucid 101',
                },
            ])



            const users = await User.query().preload('posts')
            expect(users).toHaveLength(2)

            expect(users[0].posts[0].userId).toBe(users[0].id)
            expect(users[1].posts[0].userId).toBe(users[1].id)
        })

        test('preload relationship for many rows', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('posts').insert([
                {
                    user_id: 1,
                    title: 'Adonis 101',
                },
                {
                    user_id: 1,
                    title: 'Lucid 101',
                },
                {
                    user_id: 2,
                    title: 'Lucid 102',
                },
            ])


            const users = await User.query().preload('posts')

            expect(users[0]!.posts).toHaveLength(2)
            expect(users[0].posts[0]).toBeInstanceOf(Post)
            expect(users[0].posts[0].userId).toBe(users[0].id)
            expect(users[0].posts[1]).toBeInstanceOf(Post)
            expect(users[0].posts[1].userId).toBe(users[0].id)

            expect(users[1]!.posts).toHaveLength(1)
            expect(users[1].posts[0]).toBeInstanceOf(Post)
            expect(users[1].posts[0].userId).toBe(users[1].id)
        })

        test('add constraints during preload', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('posts').insert([
                {
                    user_id: 1,
                    title: 'Adonis 101',
                },
                {
                    user_id: 1,
                    title: 'Lucid 101',
                },
                {
                    user_id: 2,
                    title: 'Lucid 102',
                },
            ])



            const users = await User.query().preload('posts', (builder) => builder.where('title', 'Lucid 101'))
            expect(users).toHaveLength(2)

            expect(users[0].posts).toHaveLength(1)
            expect(users[0].posts[0].title).toBe('Lucid 101')
            expect(users[1].posts).toHaveLength(0)
        })

        test('cherry pick columns during preload', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('posts').insert([
                {
                    user_id: 1,
                    title: 'Adonis 101',
                },
                {
                    user_id: 1,
                    title: 'Lucid 101',
                },
                {
                    user_id: 2,
                    title: 'Lucid 102',
                },
            ])



            const users = await User.query().preload('posts', (builder) => {
                return builder.select('title')
            })

            expect(users).toHaveLength(2)
            expect(users[0].posts[0].$extras).toEqual({})
            expect(users[1].posts[0].$extras).toEqual({})
        })

        test('do not repeat fk when already defined', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('posts').insert([
                {
                    user_id: 1,
                    title: 'Adonis 101',
                },
                {
                    user_id: 1,
                    title: 'Lucid 101',
                },
                {
                    user_id: 2,
                    title: 'Lucid 102',
                },
            ])



            const users = await User.query().preload('posts', (builder) => {
                return builder.select('title', 'user_id')
            })

            expect(users).toHaveLength(2)
            expect(users[0].posts[0].$extras).toEqual({})
            expect(users[1].posts[0].$extras).toEqual({})
        })

        test('raise exception when local key is not selected', async () => {
            expect.assertions(1)

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('posts').insert([
                {
                    user_id: 1,
                    title: 'Adonis 101',
                },
                {
                    user_id: 1,
                    title: 'Lucid 101',
                },
                {
                    user_id: 2,
                    title: 'Lucid 102',
                },
            ])

            try {
                await User.query().select('username').preload('posts').where('username', 'virk').first()
            } catch ({ message }) {
                expect(message).toBe('Cannot preload "posts", value of "User.id" is undefined')
            }
        })

        test('preload nested relations', async () => {
            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public postId: number

                @column()
                public body: string
            }

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string

                @hasMany(() => Comment)
                public comments: HasMany<typeof Comment>
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('posts').insert([
                {
                    user_id: 1,
                    title: 'Adonis 101',
                },
                {
                    user_id: 2,
                    title: 'Lucid 101',
                },
            ])

            await db.insertQuery().table('comments').insert([
                {
                    post_id: 1,
                    body: 'Looks nice',
                },
                {
                    post_id: 2,
                    body: 'Wow! Never knew that',
                },
            ])

            const user = await User.query()
                                   .preload('posts', (builder) => builder.preload('comments'))
                                   .where('username', 'virk')
                                   .first()

            expect(user!.posts).toHaveLength(1)
            expect(user!.posts[0].comments).toHaveLength(1)
            expect(user!.posts[0].comments[0].postId).toBe(user!.posts[0].id)
        })

        test('preload nested relations using model instance', async () => {
            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public postId: number

                @column()
                public body: string
            }

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string

                @hasMany(() => Comment)
                public comments: HasMany<typeof Comment>
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('posts').insert([
                {
                    user_id: 1,
                    title: 'Adonis 101',
                },
                {
                    user_id: 2,
                    title: 'Lucid 101',
                },
            ])

            await db.insertQuery().table('comments').insert([
                {
                    post_id: 1,
                    body: 'Looks nice',
                },
                {
                    post_id: 2,
                    body: 'Wow! Never knew that',
                },
            ])

            const users = await User.all()

            await users[0].preload((preloader) => {
                preloader.preload('posts', (builder) => builder.preload('comments'))
            })

            await users[1].preload((preloader) => {
                preloader.preload('posts', (builder) => builder.preload('comments'))
            })

            expect(users[0].posts).toHaveLength(1)
            expect(users[0].posts[0].comments).toHaveLength(1)
            expect(users[0].posts[0].comments[0].postId).toBe(users[0].posts[0].id)

            expect(users[1].posts).toHaveLength(1)
            expect(users[1].posts[0].comments).toHaveLength(1)
            expect(users[1].posts[0].comments[0].postId).toBe(users[1].posts[0].id)
        })

        test('pass main query options down the chain', async () => {
            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public postId: number

                @column()
                public body: string
            }

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string

                @hasMany(() => Comment)
                public comments: HasMany<typeof Comment>
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('posts').insert([
                {
                    user_id: 1,
                    title: 'Adonis 101',
                },
                {
                    user_id: 2,
                    title: 'Lucid 101',
                },
            ])

            await db.insertQuery().table('comments').insert([
                {
                    post_id: 1,
                    body: 'Looks nice',
                },
                {
                    post_id: 2,
                    body: 'Wow! Never knew that',
                },
            ])

            const query = User.query({ connection: 'secondary' })
                              .preload('posts', (builder) => builder.preload('comments'))
                              .where('username', 'virk')

            const user = await query.first()
            expect(user!.posts).toHaveLength(1)
            expect(user!.posts[0].comments).toHaveLength(1)
            expect(user!.posts[0].comments[0].postId).toBe(user!.posts[0].id)

            expect(user!.$options!.connection).toBe('secondary')
            expect(user!.posts[0].$options!.connection).toBe('secondary')
            expect(user!.posts[0].comments[0].$options!.connection).toBe('secondary')
        })

        test('pass relationship metadata to the profiler', async () => {
            expect.assertions(1)

            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

            const [user0, user1] = await db.query().from('users')
            await db.insertQuery().table('posts').insert([
                {
                    user_id: user0.id,
                    title: 'Adonis 101',
                },
                {
                    user_id: user1.id,
                    title: 'Lucid 101',
                },
            ])

            const profiler = getProfiler(true)

            let profilerPacketIndex = 0
            profiler.process((packet) => {
                if (profilerPacketIndex === 1) {
                    expect(packet.data.relation).toEqual({ model: 'User', relatedModel: 'Post', type: 'hasMany' })
                }
                profilerPacketIndex++
            })


            await User.query({ profiler }).preload('posts')
        })

        test('do not run preload query when parent rows are empty', async () => {
            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }



            const users = await User.query().preload('posts', () => {
                throw new Error('not expected to be here')
            })

            expect(users).toHaveLength(0)
        })
    })

    describe('Model | HasMany | save', () => {
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
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const post = new Post()
            post.title = 'Adonis 101'

            await user.related('posts').save(post)

            expect(post.$isPersisted).toBeTruthy()
            expect(user.id).toBe(post.userId)

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('posts').count('*', 'total')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalPosts[0].total)).toBe(1)
        })
    })

    describe('Model | HasMany | saveMany', () => {
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

        test('save many related instances', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const post = new Post()
            post.title = 'Adonis 101'

            const post1 = new Post()
            post1.title = 'Lucid 101'

            await user.related('posts').saveMany([post, post1])

            expect(post.$isPersisted).toBeTruthy()
            expect(user.id).toBe(post.userId)

            expect(post1.$isPersisted).toBeTruthy()
            expect(user.id).toBe(post1.userId)

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('posts').count('*', 'total')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalPosts[0].total)).toBe(2)
        })

        test('wrap save many calls inside transaction', async () => {
            expect.assertions(6)

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            const user = new User()
            user.username = 'virk'

            const post = new Post()
            post.title = 'Adonis 101'

            const post1 = new Post()

            try {
                await user.related('posts').saveMany([post, post1])
            } catch (error) {
                expect(error).toBeDefined()
            }

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('posts').count('*', 'total')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalPosts[0].total)).toBe(0)
            expect(user.$trx).toBeUndefined()
            expect(post.$trx).toBeUndefined()
            expect(post1.$trx).toBeUndefined()
        })

        test('use parent model transaction when exists', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            const trx = await db.transaction()
            const user = new User()
            user.$trx = trx
            user.username = 'virk'

            const post = new Post()
            post.title = 'Adonis 101'

            try {
                await user.related('posts').saveMany([post])
            } catch (error) {
                console.log(error)
            }

            expect(user.$trx.isCompleted).toBeFalsy()
            await trx.rollback()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('posts').count('*', 'total')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalPosts[0].total)).toBe(0)
            expect(user.$trx).toBeUndefined()
            expect(post.$trx).toBeUndefined()
        })
    })

    describe('Model | HasMany | create', () => {
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
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const post = await user.related('posts').create({ title: 'Adonis 101' })

            expect(post.$isPersisted).toBeTruthy()
            expect(user.id).toBe(post.userId)

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('posts').count('*', 'total')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalPosts[0].total)).toBe(1)
        })
    })

    describe('Model | HasMany | createMany', () => {
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

        test('create many related instances', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const [post, post1] = await user.related('posts').createMany([
                {
                    title: 'Adonis 101',
                },
                {
                    title: 'Lucid 101',
                },
            ])

            expect(post.$isPersisted).toBeTruthy()
            expect(user.id).toBe(post.userId)

            expect(post1.$isPersisted).toBeTruthy()
            expect(user.id).toBe(post1.userId)

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('posts').count('*', 'total')

            expect(Number(totalUsers[0].total)).toBe(1)
            expect(Number(totalPosts[0].total)).toBe(2)
        })

        test('wrap create many calls inside transaction', async () => {
            expect.assertions(4)

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            const user = new User()
            user.username = 'virk'

            try {
                await user.related('posts').createMany([{ title: 'Adonis 101' }, {}])
            } catch (error) {
                expect(error).toBeDefined()
            }

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('posts').count('*', 'total')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalPosts[0].total)).toBe(0)
            expect(user.$trx).toBeUndefined()
        })

        test('use parent model transaction when already exists', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            const trx = await db.transaction()
            const user = new User()
            user.$trx = trx
            user.username = 'virk'

            const [post] = await user.related('posts').createMany([{ title: 'Adonis 101' }])
            expect(user.$trx.isCompleted).toBeFalsy()
            await trx.rollback()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('posts').count('*', 'total')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalPosts[0].total)).toBe(0)
            expect(user.$trx).toBeUndefined()
            expect(post.$trx).toBeUndefined()
        })
    })

    describe('Model | HasMany | firstOrCreate', () => {
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

        test('create related instance when there isn\'t any existing row', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('posts').insert({ title: 'Lucid 101' })
            const post = await user.related('posts').firstOrCreate({}, {
                title: 'Adonis 101',
            })

            expect(post.$isPersisted).toBeTruthy()
            expect(post.$isLocal).toBeTruthy()
            expect(user.id).toBe(post.userId)
            expect(post.title).toBe('Adonis 101')

            const posts = await db.query().from('posts').orderBy('id', 'asc')
            expect(posts).toHaveLength(2)
            expect(posts[1].user_id).toBe(user.id)
        })

        test('return existing instance vs creating one', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('posts').insert({ title: 'Lucid 101', user_id: user.id })
            const post = await user.related('posts').firstOrCreate({}, {
                title: 'Adonis 101',
            })

            expect(post.$isPersisted).toBeTruthy()
            expect(post.$isLocal).toBeFalsy()
            expect(user.id).toBe(post.userId)
            expect(post.title).toBe('Lucid 101')

            const posts = await db.query().from('posts').orderBy('id', 'asc')
            expect(posts).toHaveLength(1)
            expect(posts[0].user_id).toBe(user.id)
        })
    })

    describe('Model | HasMany | updateOrCreate', () => {
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

        test('create related instance when there isn\'t any existing row', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('posts').insert({ title: 'Lucid 101' })
            const post = await user.related('posts').updateOrCreate({}, {
                title: 'Adonis 101',
            })

            expect(post.$isPersisted).toBeTruthy()
            expect(post.$isLocal).toBeTruthy()
            expect(user.id).toBe(post.userId)
            expect(post.title).toBe('Adonis 101')

            const posts = await db.query().from('posts').orderBy('id', 'asc')
            expect(posts).toHaveLength(2)
            expect(posts[1].user_id).toBe(user.id)
        })

        test('update existing instance vs creating one', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('posts').insert({ title: 'Lucid 101', user_id: user.id })
            const post = await user.related('posts').updateOrCreate({}, {
                title: 'Adonis 101',
            })

            expect(post.$isPersisted).toBeTruthy()
            expect(post.$isLocal).toBeFalsy()
            expect(user.id).toBe(post.userId)
            expect(post.title).toBe('Adonis 101')

            const posts = await db.query().from('posts').orderBy('id', 'asc')
            expect(posts).toHaveLength(1)
            expect(posts[0].user_id).toBe(user.id)
            expect(posts[0].title).toBe('Adonis 101')
        })
    })

    describe('Model | HasMany | paginate', () => {
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
            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            const [ userId ] = await db.table('users').insert({ username: 'virk' }).returning('id')
            await db.table('posts').multiInsert(getPosts(18, userId))

            const user = await User.find(1)
            const posts = await user!.related('posts').query().paginate(1, 5)
            posts.baseUrl('/posts')

            expect(posts.all()).toHaveLength(5)
            expect(posts.all()[0]).toBeInstanceOf(Post)
            expect(posts.perPage).toBe(5)
            expect(posts.currentPage).toBe(1)
            expect(posts.lastPage).toBe(4)
            expect(posts.hasPages).toBeTruthy()
            expect(posts.hasMorePages).toBeTruthy()
            expect(posts.isEmpty).toBeFalsy()
            expect(Number(posts.total)).toBe(18)
            expect(posts.hasTotal).toBeTruthy()
            expect(posts.getMeta()).toEqual({
                total: 18,
                per_page: 5,
                current_page: 1,
                last_page: 4,
                first_page: 1,
                first_page_url: '/posts?page=1',
                last_page_url: '/posts?page=4',
                next_page_url: '/posts?page=2',
                previous_page_url: null,
            })
        })

        test('disallow paginate during preload', async () => {
            expect.assertions(1)

            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            await db.table('users').insert({ username: 'virk' })

            try {
                await User.query().preload('posts', (query) => {
                    query.paginate(1, 5)
                })
            } catch ({ message }) {
                expect(message).toBe('Cannot paginate relationship "posts" during preload')
            }
        })
    })

    describe('Model | HasMany | clone', () => {
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
            class Post extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            await db.table('users').insert({ username: 'virk' }).returning('id')

            const user = await User.find(1)
            const clonedQuery = user!.related('posts').query().clone()
            expect(clonedQuery).toBeInstanceOf(HasManyQueryBuilder)
        })
    })

    describe('Model | HasMany | scopes', () => {
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
            class Post extends BaseModel {
                @column()
                public userId: number

                @column()
                public title: string

                public static adonisOnly = scope((query) => {
                    query.where('title', 'Adonis 101')
                })
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            const [ userId ] = await db.table('users').insert({ username: 'virk' }).returning('id')
            await db.insertQuery().table('posts').insert({ user_id: userId, title: 'Lucid 101' })
            await db.insertQuery().table('posts').insert({ user_id: userId, title: 'Adonis 101' })

            const user = await User.query().preload('posts', (query) => {
                query.apply((scopes) => scopes.adonisOnly())
            }).firstOrFail()

            const userWithoutScope = await User.query().preload('posts').firstOrFail()

            expect(user.posts).toHaveLength(1)
            expect(userWithoutScope.posts).toHaveLength(2)
            expect(user.posts[0].title).toBe('Adonis 101')
        })

        test('apply scopes on related query', async () => {
            class Post extends BaseModel {
                @column()
                public userId: number

                @column()
                public title: string

                public static adonisOnly = scope((query) => {
                    query.where('title', 'Adonis 101')
                })
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post)
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            const [ userId ] = await db.table('users').insert({ username: 'virk' }).returning('id')
            await db.insertQuery().table('posts').insert({ user_id: userId, title: 'Lucid 101' })
            await db.insertQuery().table('posts').insert({ user_id: userId, title: 'Adonis 101' })

            const user = await User.findOrFail(1)

            const posts = await user.related('posts').query().apply((scopes) => scopes.adonisOnly())
            const postsWithoutScope = await user.related('posts').query()

            expect(posts).toHaveLength(1)
            expect(postsWithoutScope).toHaveLength(2)
            expect(posts[0].title).toBe('Adonis 101')
        })
    })

    describe('Model | HasMany | onQuery', () => {
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
            class Post extends BaseModel {
                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post, {
                    onQuery: (query) => query.where('title', 'Adonis 101'),
                })
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            const [ userId ] = await db.table('users').insert({ username: 'virk' }).returning('id')
            await db.insertQuery().table('posts').insert({ user_id: userId, title: 'Lucid 101' })
            await db.insertQuery().table('posts').insert({ user_id: userId, title: 'Adonis 101' })

            const user = await User.query().preload('posts').firstOrFail()
            expect(user.posts).toHaveLength(1)
            expect(user.posts[0].title).toBe('Adonis 101')
        })

        test('do not invoke onQuery method on preloading subqueries', async () => {
            expect.assertions(3)

            class Post extends BaseModel {
                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post, {
                    onQuery: (query) => {
                        expect(true).toBeTruthy()
                        query.where('title', 'Adonis 101')
                    },
                })
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            const [ userId ] = await db.table('users').insert({ username: 'virk' }).returning('id')
            await db.insertQuery().table('posts').insert({ user_id: userId, title: 'Lucid 101' })
            await db.insertQuery().table('posts').insert({ user_id: userId, title: 'Adonis 101' })

            const user = await User.query().preload('posts', (query) => query.where(() => {})).firstOrFail()
            expect(user.posts).toHaveLength(1)
            expect(user.posts[0].title).toBe('Adonis 101')
        })

        test('invoke onQuery method on related query', async () => {
            class Post extends BaseModel {
                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post, {
                    onQuery: (query) => query.where('title', 'Adonis 101'),
                })
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            const [ userId ] = await db.table('users').insert({ username: 'virk' }).returning('id')
            await db.insertQuery().table('posts').insert({ user_id: userId, title: 'Lucid 101' })
            await db.insertQuery().table('posts').insert({ user_id: userId, title: 'Adonis 101' })

            const user = await User.findOrFail(1)

            const posts = await user.related('posts').query()
            expect(posts).toHaveLength(1)
            expect(posts[0].title).toBe('Adonis 101')
        })

        test('do not invoke onQuery method on related query subqueries', async () => {
            class Post extends BaseModel {
                @column()
                public userId: number

                @column()
                public title: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Post, {
                    onQuery: (query) => query.where('title', 'Adonis 101'),
                })
                public posts: HasMany<typeof Post>
            }


            User.$getRelation('posts')!.boot()

            const [ userId ] = await db.table('users').insert({ username: 'virk' }).returning('id')
            await db.insertQuery().table('posts').insert({ user_id: userId, title: 'Lucid 101' })
            await db.insertQuery().table('posts').insert({ user_id: userId, title: 'Adonis 101' })

            const user = await User.findOrFail(1)

            const { sql, bindings } = user.related('posts').query().where((query) => {
                query.whereNotNull('created_at')
            }).toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .from('posts')
                                                               .where('title', 'Adonis 101')
                                                               .where((query) => query.whereNotNull('created_at'))
                                                               .where('user_id', 1)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })
})
