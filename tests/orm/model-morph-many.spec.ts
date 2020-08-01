/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 7/23/2020
 * Time: 10:01 PM
 */
import {
    cleanup,
    getBaseModel,
    getComments,
    getDb,
    getPosts,
    getProfiler,
    ormAdapter,
    resetTables,
    setup
} from "../helpers";
import {column, hasOne, morphMany, morphOne, morphTo} from "../../src/Orm/Decorators";
import {HasOne, MorphMany, MorphOne, MorphTo} from "../../src/Contracts/Orm/Relations/types";
import {MorphOneQueryBuilder} from "../../src/Orm/Relations/MorphOne/QueryBuilder";
import {MorphManyQueryBuilder} from "../../src/Orm/Relations/MorphMany/QueryBuilder";


let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>
describe('Model | MorphMany', () => {
    describe('Model | MorphMany | Options', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })
        it('raise error when localKey is missing', async () => {
            expect.assertions(1)

            try {
                class Post extends BaseModel {
                    @morphMany(() => Comment, {name: 'commentable'})
                    public comment: MorphMany<typeof Comment>
                }

                class Comment extends BaseModel {

                }

                Post.$getRelation('comment').boot();
            } catch (e) {
                expect(e.message).toBe(
                    'E_MISSING_MODEL_ATTRIBUTE: "Post.comment" expects "id" to exist on "Post" model, but is missing'
                )
            }
        });

        it('raise error when foreignKey is missing', async () => {
            expect.assertions(1)

            try {
                class Post extends BaseModel {
                    @column({ isPrimary: true })
                    public id: number

                    @morphMany(() => Comment, {name: 'commentable'})
                    public comment: MorphMany<typeof Comment>
                }

                class Comment extends BaseModel {
                }
                Comment.bootIfNotBooted()

                Post.$getRelation('comment').boot();
            } catch (e) {
                expect(e.message).toBe(
                    'E_MISSING_MODEL_ATTRIBUTE: "Post.comment" expects "commentableId" to exist on "Comment" model, but is missing'
                )
            }
        });

        it('raise error when morphType is missing', async () => {
            expect.assertions(1)

            try {
                class Post extends BaseModel {
                    @column({ isPrimary: true })
                    public id: number

                    @morphMany(() => Comment, {name: 'commentable'})
                    public comment: MorphMany<typeof Comment>
                }

                class Comment extends BaseModel {
                    @column()
                    public commentableId: number
                }

                Post.$getRelation('comment').boot();
            } catch (e) {
                expect(e.message).toBe(
                    'E_MISSING_MODEL_ATTRIBUTE: "Post.comment" expects "commentableType" to exist on "Comment" model, but is missing'
                )
            }
        });

        it('use primary key is as the local key', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @morphMany(() => Comment, {name: 'commentable'})
                public comment: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number
            }

            Post.$getRelation('comment').boot();

            expect(Post.$getRelation('comment')['localKey']).toBe('id');
        });

        it('compute foreign key from model name and primary key', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @morphMany(() => Comment, {name: 'commentable'})
                public comment: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number
            }

            Post.$getRelation('comment').boot();

            expect(Post.$getRelation('comment')['foreignKey']).toBe('commentableId');
        });

        it('use pre defined foreign key', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @morphMany(() => Comment, {name: 'commentable', id: 'commentId'})
                public comment: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentId: number

                @column()
                public commentableType: number
            }

            Post.$getRelation('comment').boot();

            expect(Post.$getRelation('comment')['foreignKey']).toBe('commentId');
        });

        it('compute morph type from model name and primary key', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @morphMany(() => Comment, {name: 'commentable'})
                public comment: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number
            }

            Post.$getRelation('comment').boot();

            expect(Post.$getRelation('comment')['morphType']).toBe('commentableType');
        });

        it('use pre defined morph type', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @morphMany(() => Comment, {name: 'commentable', type: 'commentType'})
                public comment: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentType: number
            }

            Post.$getRelation('comment').boot();

            expect(Post.$getRelation('comment')['morphType']).toBe('commentType');
        });
    });

    describe('Model | MorphMany | Set Relations', () => {
        let Post;
        let Comment;

        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))

            class PostModel extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @morphMany(() => CommentModel, {name: 'commentable'})
                public comment: MorphMany<typeof CommentModel>
            }

            class CommentModel extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number
            }

            PostModel.$getRelation('comment').boot();

            Post = PostModel;
            Comment = CommentModel;
        })

        it('set related model instance', async () => {
            const post = new Post();
            post.fill({id: 1})
            const comments = new Array(1).fill(new Comment())
            comments.forEach(comment => comment.fill({commentableId: post.id}));

            Post.$getRelation('comment').setRelated(post, comments);
            expect(post.comment).toEqual(comments)
        });

        it('push related model instance', async () => {
            const post = new Post();
            post.fill({id: 1})
            const comments = new Array(1).fill(new Comment())
            comments.forEach(comment => comment.fill({commentableId: post.id}));

            Post.$getRelation('comment').pushRelated(post, comments);
            expect(post.comment).toEqual(comments)
        });

        it('set many of related instances', async () => {
            const post = new Post()
            post.fill({id: 1});
            const post1 = new Post()
            post1.fill({id: 2});
            const post2 = new Post()
            post2.fill({id: 3});

            const comment = new Comment();
            comment.fill({commentableId: 1})
            const comment1 = new Comment();
            comment1.fill({commentableId: 2})
            const comment2 = new Comment();
            comment2.fill({commentableId: 1})

            Post.$getRelation('comment').setRelatedForMany([post, post1, post2], [comment, comment1, comment2]);
            expect(post.comment).toEqual([comment, comment2])
            expect(post1.comment).toEqual([comment1])
            expect(post2.comment).toEqual([] as any)
        });
    });

    describe('Model | MorphMany | bulk operations', () => {
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

        it('generate correct sql for selecting related rows', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                }
            ])

            const post = await Post.find(1);

            const { sql, bindings } = post!.related('comments').query().toSQL();

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                .getWriteClient()
                .from('comments')
                .where('commentable_type', 'post')
                .where('commentable_id', 1)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        });

        it('generate correct sql for selecting related many rows', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                },
                {
                    title: 'nikk'
                }
            ])

            const comments = await Post.all();
            Post.$getRelation('comments').boot();

            const relation = Post.$getRelation('comments');

            const related = relation.eagerQuery(comments, db.connection());
            db.enableQueryLog();
            await relation.getEager(related);

            const { sql, bindings } = db.getQueryLog()[0];

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                .getWriteClient()
                .from('comments')
                .where('commentable_type', 'post')
                .whereIn('commentable_id', [2,1])
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        });

        it('generate correct sql for updating related row', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                }
            ])

            const post = await Post.find(1);

            const { sql, bindings } = post!.related('comments').query().update({body: 'job'}).toSQL();

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                .getWriteClient()
                .from('comments')
                .where('commentable_type', 'post')
                .where('commentable_id', 1)
                .update({body: 'job'})
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        });

        it('generate correct sql for deleting related row', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                }
            ])

            const post = await Post.find(1);

            const { sql, bindings } = post!.related('comments').query().del().toSQL();

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                .getWriteClient()
                .from('comments')
                .where('commentable_type', 'post')
                .where('commentable_id', 1)
                .del()
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        });
    });

    describe('Model | MorphMany | aggregates', () => {
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

        it('get total of all related rows', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post' },
                { body: 'nikk', commentable_id: '1', commentable_type: 'post' }
            ])

            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                },
                {
                    title: 'nikk'
                }
            ])

            Post.$getRelation('comments')!.boot()

            const post = await Post.find(1)
            const total = await post!.related('comments').query().count('* as total')
            expect(Number(total[0].total)).toBe(2)
        });
    });

    describe('Model | MorphMany | preload', () => {
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

        it('preload relationship', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                static boot() {
                    this.morphMap({
                        'post': () => Post,
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post' },
                { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ])

            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                },
                {
                    title: 'nikk'
                }
            ])

            db.enableQueryLog();
            const posts = await Post.query().preload('comments');
            expect(posts).toHaveLength(2);

            expect(posts[0].comments[0].commentableId).toBe(posts[0].id)
            expect(posts[1].comments[0].commentableId).toBe(posts[1].id)
        });

        it('preload relationship for many rows', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                static boot() {
                    this.morphMap({
                        'post': () => Post,
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post' },
                { body: 'nikk', commentable_id: '1', commentable_type: 'post' },
                { body: 'nikk', commentable_id: '2', commentable_type: 'post' },
            ])

            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                },
                {
                    title: 'nikk'
                }
            ])

            const posts = await Post.query().preload('comments')

            expect(posts[0]!.comments).toHaveLength(2)
            expect(posts[0].comments[0]).toBeInstanceOf(Comment)
            expect(posts[0].comments[0].commentableId).toBe(posts[0].id)
            expect(posts[0].comments[1]).toBeInstanceOf(Comment)
            expect(posts[0].comments[1].commentableId).toBe(posts[0].id)

            expect(posts[1]!.comments).toHaveLength(1)
            expect(posts[1].comments[0]).toBeInstanceOf(Comment)
            expect(posts[1].comments[0].commentableId).toBe(posts[1].id)
        });

        it('preload nested relations', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Post)
                public post: HasOne<typeof Post>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk',
                    user_id: '1'
                }
            ])
            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post', user_id: 1 },
                { body: 'virk2', commentable_id: '1', commentable_type: 'post', user_id: 1 },
            ])

            const user = await User.query()
                .preload('post', (builder) => builder.preload('comments'))
                .where('username', 'virk')
                .first()

            expect(user!.post).toBeInstanceOf(Post)
            expect(user!.post!.comments).toHaveLength(2)
            expect(user!.post!.comments[0]).toBeInstanceOf(Comment)
        });

        it('add constraints during preload', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                },
                {
                    title: 'nikk'
                }
            ])

            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post' },
                { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ])

            const posts = await Post.query().preload('comments', builder => builder.where('body', 'foo'));

            expect(posts).toHaveLength(2);
            expect(posts[0].comments).toHaveLength(0);
            expect(posts[1].comments).toHaveLength(0);
        });

        it('cherry pick columns during preload', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public body: string

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                },
                {
                    title: 'nikk'
                }
            ])

            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post' },
                { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ])

            const posts = await Post.query().preload('comments', builder => builder.select('body'));
            expect(posts).toHaveLength(2);
            expect(posts[0].comments[0].$extras).toEqual({})
            expect(posts[1].comments[0].$extras).toEqual({})
        });

        it('do not repeat pk when already defined', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public body: string

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                },
                {
                    title: 'nikk'
                }
            ])

            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post' },
                { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ])

            const posts = await Post.query().preload('comments', builder => builder.select('body', 'id'));
            expect(posts).toHaveLength(2);
            expect(posts[0].comments[0].$extras).toEqual({})
            expect(posts[1].comments[0].$extras).toEqual({})
        });

        it('pass sideloaded attributes to the relationship', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                },
                {
                    title: 'nikk'
                }
            ])

            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post' },
                { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ])

            const posts = await Post.query().preload('comments').sideload({ id: 1 });
            expect(posts).toHaveLength(2);
            expect(posts[0].$sideloaded).toEqual({id: 1})
            expect(posts[1].$sideloaded).toEqual({id: 1})
            expect(posts[0].comments[0].$sideloaded).toEqual({id: 1})
            expect(posts[1].comments[0].$sideloaded).toEqual({id: 1})
        });

        it('preload using model instance', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                static boot() {
                    this.morphMap({
                        'post': () => Post,
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post' },
                { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ])

            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                },
                {
                    title: 'nikk'
                }
            ])

            const posts = await Post.all();
            expect(posts).toHaveLength(2);
            await posts[0].preload('comments');
            await posts[1].preload('comments');

            expect(posts[0].comments[0].commentableId).toEqual(posts[0].id)
            expect(posts[1].comments[0].commentableId).toEqual(posts[1].id)
        });

        it('raise exception when local key is not selected', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                },
                {
                    title: 'nikk'
                }
            ])

            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post' },
                { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ])

            try {
                await Post.query().select(['title']).preload('comments').where('title', 'virk').first()
            } catch ({ message }) {
                expect(message).toBe('Cannot preload "comments", value of "Post.id" is undefined')
            }
        });

        it('preload nested relations using model instance', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Post)
                public post: HasOne<typeof Post>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk',
                    user_id: '1'
                },
                {
                    title: 'nikk',
                    user_id: '2'
                }
            ])
            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post', user_id: 1 },
                { body: 'virk', commentable_id: '2', commentable_type: 'post', user_id: 2 }
            ])

            const users = await User.all()
            expect(users).toHaveLength(2);

            await users[0].preload((preloader) => {
                preloader.preload('post', (builder) => builder.preload('comments'))
            })

            await users[1].preload((preloader) => {
                preloader.preload('post', (builder) => builder.preload('comments'))
            })

            expect(users[0].post).toBeInstanceOf(Post)
            expect(users[0].post!.comments[0]).toBeInstanceOf(Comment)

            expect(users[1].post).toBeInstanceOf(Post)
            expect(users[1].post!.comments[0]).toBeInstanceOf(Comment)
        });

        it('pass main query options down the chain', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number
                @column()
                public userId: number
                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number



                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo()
                public commentable: MorphTo<any>

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Post)
                public post: HasOne<typeof Post>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk',
                    user_id: '1'
                },
                {
                    title: 'nikk',
                    user_id: '2'
                }
            ])
            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post', user_id: 1 },
                { body: 'virk', commentable_id: '2', commentable_type: 'post', user_id: 2 }
            ])

            const query = User.query({ connection: 'secondary' })
                .preload('post', (builder) => builder.preload('comments'))
                .where('username', 'virk')

            const user = await query.first()
            expect(user!.post).toBeInstanceOf(Post)
            expect(user!.post.comments[0]).toBeInstanceOf(Comment)

            expect(user!.$options!.connection).toBe('secondary')
            expect(user!.post.$options!.connection).toBe('secondary')
            expect(user!.post.comments[0].$options!.connection).toBe('secondary')
        });

        it('pass relationship metadata to the profiler', async () => {
            expect.assertions(1)

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>

            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                },
                {
                    title: 'nikk'
                }
            ])

            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post' },
                { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ])

            const profiler = getProfiler(true)

            let profilerPacketIndex = 0
            profiler.process((packet) => {
                if ( profilerPacketIndex === 1 ) {
                    expect(packet.data.relation).toEqual({ model: 'Post', relatedModel: 'Comment', type: 'morphMany' })
                }
                profilerPacketIndex++
            })

            await Post.query({ profiler }).preload('comments')
        });

        it('do not run preload query when parent rows are empty', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            const posts = await Post.query().preload('comments', () => {
                throw new Error('not expected to be here')
            })

            expect(posts).toHaveLength(0)
        });
    });

    describe('Model | MorphMany | save', () => {
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

        it('save related instance', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                @column()
                public body: string

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            const post = new Post()
            post.title = 'virk'
            await post.save()

            const comment = new Comment()
            comment.body = 'simple text'

            await post.related('comments').save(comment)

            expect(post.$isPersisted).toBeTruthy()
            expect(post.id).toBe(comment.commentableId)
            expect(comment.commentableType).toBe('post')

            const totalPosts = await db.query().from('posts').count('*', 'total')
            const totalComments = await db.query().from('comments').count('*', 'total')

            expect(Number(totalPosts[0].total)).toBe(1)
            expect(Number(totalComments[0].total)).toBe(1)
        });
    });

    describe('Model | MorphMany | saveMany', () => {
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

        it('save many related instances', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                @column()
                public body: string

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            const post = new Post()
            post.title = 'virk'
            await post.save()

            const comment = new Comment()
            comment.body = 'Tngraphql 101'

            const comment1 = new Comment()
            comment1.body = 'Lucid 101'

            await post.related('comments').saveMany([comment, comment1])

            expect(comment.$isPersisted).toBeTruthy()
            expect(post.id).toBe(comment.commentableId)
            expect(comment.commentableType).toBe('post')

            expect(comment1.$isPersisted).toBeTruthy()
            expect(post.id).toBe(comment1.commentableId)
            expect(comment1.commentableType).toBe('post')

            const totalPosts = await db.query().from('posts').count('*', 'total')
            const totalComments = await db.query().from('comments').count('*', 'total')

            expect(Number(totalPosts[0].total)).toBe(1)
            expect(Number(totalComments[0].total)).toBe(2)
        });

        it('wrap save many calls inside transaction', async () => {
            expect.assertions(6)
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                @column()
                public body: string

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            const post = new Post()
            post.title = 'virk'

            const comment = new Comment()
            comment.body = 'tngraphql 101'

            const comment1 = new Comment()
            // @ts-ignore
            comment1['id'] = 'asdgasdg';

            try {
                await post.related('comments').saveMany([comment, comment1])
            } catch (error) {
                expect(error).toBeDefined()
            }

            const totalPosts = await db.query().from('posts').count('*', 'total')
            const totalComments = await db.query().from('comments').count('*', 'total')

            expect(Number(totalPosts[0].total)).toBe(0)
            expect(Number(totalComments[0].total)).toBe(0)
            expect(post.$trx).toBeUndefined()
            expect(comment.$trx).toBeUndefined()
            expect(comment1.$trx).toBeUndefined()
        });

        it('use parent model transaction when exists', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                @column()
                public body: string

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            const trx = await db.transaction()
            const post = new Post()
            post.$trx = trx
            post.title = 'virk'

            const comment = new Comment()
            comment.body = 'tngraphql 101'

            try {
                await post.related('comments').saveMany([comment])
            } catch (error) {
                console.log(error)
            }

            expect(post.$trx.isCompleted).toBeFalsy()
            await trx.rollback()

            const totalPosts = await db.query().from('posts').count('*', 'total')
            const totalComments = await db.query().from('comments').count('*', 'total')

            expect(Number(totalPosts[0].total)).toBe(0)
            expect(Number(totalComments[0].total)).toBe(0)
            expect(post.$trx).toBeUndefined()
            expect(comment.$trx).toBeUndefined()
        });
    });

    describe('Model | MorphMany | create', () => {
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

        it('create related instance', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                @column()
                public body: string

                static boot() {
                    this.morphMap({
                        'post': () => Post,
                    });
                }
            }

            const post = new Post()
            post.title = 'virk'
            await post.save()

            const comment = await post.related('comments').create({ body: 'graphql 101' })

            expect(post.$isPersisted).toBeTruthy()
            expect(post.id).toBe(comment.commentableId)
            expect(comment.commentableType).toBe('post')

            const totalComments = await db.query().from('comments').count('*', 'total')
            const totalPosts = await db.query().from('posts').count('*', 'total')

            expect(Number(totalPosts[0].total)).toBe(1)
            expect(Number(totalComments[0].total)).toBe(1)
        });
    });

    describe('Model | MorphMany | createMany', () => {
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

        it('create many related instances', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                @column()
                public body: string

                static boot() {
                    this.morphMap({
                        'post': () => Post,
                    });
                }
            }

            const post = new Post()
            post.title = 'virk'
            await post.save()

            const [comment, comment1] = await post.related('comments').createMany([
                {
                    body: 'Graphql 101',
                },
                {
                    body: 'Lucid 101',
                },
            ])

            expect(comment.$isPersisted).toBeTruthy()
            expect(post.id).toBe(comment.commentableId)
            expect(comment.commentableType).toBe('post')

            expect(comment1.$isPersisted).toBeTruthy()
            expect(post.id).toBe(comment1.commentableId)
            expect(comment1.commentableType).toBe('post')

            const totalComments = await db.query().from('comments').count('*', 'total')
            const totalPosts = await db.query().from('posts').count('*', 'total')

            expect(Number(totalPosts[0].total)).toBe(1)
            expect(Number(totalComments[0].total)).toBe(2)
        });

        it('wrap create many calls inside transaction', async () => {
            expect.assertions(4)

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                @column()
                public body: string



                static boot() {
                    this.morphMap({
                        'post': () => Post,
                    });
                }
            }

            const post = new Post()
            post.title = 'virk'

            try {
                // @ts-ignore
                await post.related('comments').createMany([{ body: 'graphql 101' }, {id: 'fsas'}])
            } catch (error) {
                expect(error).toBeDefined()
            }

            const totalComments = await db.query().from('comments').count('*', 'total')
            const totalPosts = await db.query().from('posts').count('*', 'total')

            expect(Number(totalPosts[0].total)).toBe(0)
            expect(Number(totalComments[0].total)).toBe(0)
            expect(post.$trx).toBeUndefined()
        });

        it('use parent model transaction when already exists', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                @column()
                public body: string



                static boot() {
                    this.morphMap({
                        'post': () => Post,
                    });
                }
            }

            const trx = await db.transaction()
            const post = new Post()
            post.$trx = trx
            post.title = 'virk'

            const [comment] = await post.related('comments').createMany([{ body: 'graphql 101' }])
            expect(post.$trx.isCompleted).toBeFalsy()
            await trx.rollback()

            const totalComments = await db.query().from('comments').count('*', 'total')
            const totalPosts = await db.query().from('posts').count('*', 'total')

            expect(Number(totalComments[0].total)).toBe(0)
            expect(Number(totalPosts[0].total)).toBe(0)
            expect(post.$trx).toBeUndefined()
            expect(comment.$trx).toBeUndefined()
        });
    });

    describe('Model | MorphMany | firstOrCreate', () => {
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

        it('create related instance when there isn\'t any existing row', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                @column()
                public body: string



                static boot() {
                    this.morphMap({
                        'post': () => Post,
                    });
                }
            }

            const post = new Post()
            post.title = 'virk'
            await post.save()

            await db.insertQuery().table('comments').insert({ body: 'Lucid 101' })
            const comment = await post.related('comments').firstOrCreate({}, {
                body: 'graphql 101',
            })

            expect(comment.$isPersisted).toBeTruthy()
            expect(comment.$isLocal).toBeTruthy()
            expect(post.id).toBe(comment.commentableId);
            expect(comment.commentableType).toBe('post')
            expect(comment.body).toBe('graphql 101')

            const comments = await db.query().from('comments').orderBy('id', 'asc')
            expect(comments).toHaveLength(2)
            expect(comments[1].commentable_id).toBe(post.id)
            expect(comments[1].commentable_type).toBe('post')
        });

        it('return existing instance vs creating one', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                @column()
                public body: string



                static boot() {
                    this.morphMap({
                        'post': () => Post,
                    });
                }
            }

            const post = new Post()
            post.title = 'virk'
            await post.save()

            await db.insertQuery().table('comments').insert({
                body: 'Lucid 101',
                commentable_id: post.id,
                commentable_type: 'post'
            })
            const comment = await post.related('comments').firstOrCreate({}, {
                body: 'graphql 101'
            });

            expect(comment.$isPersisted).toBeTruthy()
            expect(comment.$isLocal).toBeFalsy()
            expect(post.id).toBe(comment.commentableId)
            expect(comment.body).toBe('Lucid 101')

            const comments = await db.query().from('comments').orderBy('id', 'asc')
            expect(comments).toHaveLength(1)
            expect(comments[0].commentable_id).toBe(post.id)
        });
    });

    describe('Model | MorphMany | updateOrCreate', () => {
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

        it('create related instance when there isn\'t any existing row', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                @column()
                public body: string



                static boot() {
                    this.morphMap({
                        'post': () => Post,
                    });
                }
            }

            const post = new Post()
            post.title = 'virk'
            await post.save()

            await db.insertQuery().table('comments').insert({
                body: 'Lucid 101'
            })
            const comment = await post.related('comments').updateOrCreate({}, {
                body: 'graphql 101',
            })

            expect(comment.$isPersisted).toBeTruthy()
            expect(comment.$isLocal).toBeTruthy()
            expect(post.id).toBe(comment.commentableId)
            expect(comment.body).toBe('graphql 101')

            const comments = await db.query().from('comments').orderBy('id', 'asc')
            expect(comments).toHaveLength(2)
            expect(comments[1].commentable_id).toBe(post.id)
        });

        it('update existing instance vs creating one', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                @column()
                public body: string



                static boot() {
                    this.morphMap({
                        'post': () => Post,
                    });
                }
            }

            const post = new Post()
            post.title = 'virk'
            await post.save()

            await db.insertQuery().table('comments').insert({
                body: 'Lucid 101',
                commentable_id: post.id,
                commentable_type: 'post'
            })
            const comment = await post.related('comments').updateOrCreate({}, {
                body: 'tngraphql 101',
            })

            expect(comment.$isPersisted).toBeTruthy()
            expect(comment.$isLocal).toBeFalsy()
            expect(post.id).toBe(comment.commentableId)
            expect(comment.body).toBe('tngraphql 101')
            expect(comment.commentableType).toBe('post')

            const comments = await db.query().from('comments').orderBy('id', 'asc')
            expect(comments).toHaveLength(1)
            expect(comments[0].commentable_id).toBe(post.id)
            expect(comments[0].body).toBe('tngraphql 101')
        });
    });

    describe('Model | MorphMany | pagination', () => {
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
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            Post.$getRelation('comments')!.boot()

            const [ commentableId ] = await db.table('posts').insert({ title: 'virk' }).returning('id')
            await db.table('comments').multiInsert(getComments(18, commentableId, 'post'))

            const post = await Post.find(1)
            const comments = await post!.related('comments').query().paginate(1, 5)
            comments.baseUrl('/comments')

            expect(comments.all()).toHaveLength(5)
            expect(comments.all()[0]).toBeInstanceOf(Comment)
            expect(comments.perPage).toBe(5)
            expect(comments.currentPage).toBe(1)
            expect(comments.lastPage).toBe(4)
            expect(comments.hasPages).toBeTruthy()
            expect(comments.hasMorePages).toBeTruthy()
            expect(comments.isEmpty).toBeFalsy()
            expect(Number(comments.total)).toBe(18)
            expect(comments.hasTotal).toBeTruthy()
            expect(comments.getMeta()).toEqual({
                total: 18,
                per_page: 5,
                current_page: 1,
                last_page: 4,
                first_page: 1,
                first_page_url: '/comments?page=1',
                last_page_url: '/comments?page=4',
                next_page_url: '/comments?page=2',
                previous_page_url: null,
            })
        })

        it('disallow paginate during preload', async () => {
            expect.assertions(1)

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                @column()
                public body: string



                static boot() {
                    this.morphMap({
                        'post': () => Post,
                    });
                }
            }

            Post.$getRelation('comments')!.boot()

            await db.table('posts').insert({ title: 'virk' })

            try {
                await Post.query().preload('comments', (query) => {
                    query.paginate(1, 5)
                })
            } catch ({ message }) {
                expect(message).toBe('Cannot paginate relationship "comments" during preload')
            }
        });
    })

    describe('Model | MorphMany | clone', () => {
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

        test('clone related query builder', async () => {
            expect.assertions(1)

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                }
            ])

            const post = await Post.find(1)
            const clonedQuery = post!.related('comments').query().clone()
            expect(clonedQuery).toBeInstanceOf(MorphManyQueryBuilder)
        })
    })

    describe('Model | MorphMany | global scopes', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()

            const [userId] = await db.table('users').insert({ username: 'virk' }).returning('id')
            await db.table('profiles').multiInsert([
                { user_id: userId, display_name: 'virk', type: 'github' }
            ])
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        it('apply scopes during eagerload', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public body: string

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });

                    this.addGlobalScope(query => {
                        query.where('body', 'twitter')
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                {body: 'virk', commentable_id: '1', commentable_type: 'post'},
                // { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ]);
            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                }
            ])

            db.enableQueryLog();
            const comment = await Post.query().preload('comments').firstOrFail();
            const {sql} = db.getQueryLog()[1];
            const {sql: knenSql} = db.from('comments')
                .where('commentable_type', 'post')
                .whereIn('commentable_id', [1])
                .where('body', 'twitter').toSQL();
            expect(sql).toEqual(knenSql);
        });

        it('apply scopes on related query', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number
                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number
                @column()
                public body: string
                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                    this.addGlobalScope(query => {
                        query.where('body', 'twitter')
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                {body: 'virk', commentable_id: '1', commentable_type: 'post'},
                // { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ]);
            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                }
            ])

            const post = await Post.findOrFail(1)

            db.enableQueryLog();
            const profile = await post.related('comments').query().first()
            const {sql} = db.getQueryLog()[0];
            const {sql: knenSql} = db.from('comments')
                .where('body', 'twitter')
                .where('commentable_type', 'post')
                .where('commentable_id', 1)
                .limit(1).toSQL();
            expect(sql).toEqual(knenSql);
        });
    });

    describe('Model | MorphMany | onQuery', () => {
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
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable', onQuery: query => query.where('body', 'twitter')})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                {body: 'virk', commentable_id: '1', commentable_type: 'post'},
                // { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ]);
            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                }
            ])

            const post = await Post.query().preload('comments').firstOrFail()
            expect(post.comments).toHaveLength(0)
        })

        test('do not invoke onQuery method on preloading subqueries', async () => {
            expect.assertions(2)

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string


                @morphMany(() => Comment, {name: 'commentable', onQuery: query => {
                        expect(true).toBeTruthy()
                        query.where('body', 'twitter')
                    }})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                {body: 'virk', commentable_id: '1', commentable_type: 'post'},
                // { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ]);
            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                }
            ])

            const post = await Post.query().preload('comments', (query) => query.where(() => {
            })).firstOrFail()
            expect(post.comments).toHaveLength(0)
        })

        test('invoke onQuery method on related query builder', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable', onQuery: query => {
                        query.where('body', 'twitter')
                    }})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                {body: 'virk', commentable_id: '1', commentable_type: 'post'},
                // { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ]);
            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                }
            ])

            const post = await Post.findOrFail(1)
            const profile = await post.related('comments').query().first()
            expect(profile).toBeNull()
        })

        test('do not invoke onQuery method on related query builder subqueries', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable', onQuery: query => {
                        query.where('body', 'twitter')
                    }})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                static boot() {
                    this.morphMap({
                        'post': () => Post
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                {body: 'virk', commentable_id: '1', commentable_type: 'post'},
                // { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ]);
            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                }
            ])

            const post = await Post.findOrFail(1)
            const { sql, bindings } = post.related('comments').query().where((query) => {
                query.whereNotNull('created_at')
            }).toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                .from('comments')
                .where('body', 'twitter')
                .where((query) => query.whereNotNull('created_at'))
                .where('commentable_type', 'post')
                .where('commentable_id', 1)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })

    describe('Model HasQuery', () => {
        let Post;
        let Comment;

        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()

            class PostModel extends BaseModel {
                static table = 'posts';

                @column({ isPrimary: true })
                public id: number

                @column()
                public uid: number

                @column()
                public title: string

                @morphMany(() => CommentModel, {name: 'commentable', localKey: 'uid'})
                public comments: MorphMany<typeof CommentModel>
            }

            class CommentModel extends BaseModel {
                static table = 'comments';

                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                @morphMany(() => CommentModel, {name: 'commentable', localKey: 'id'})
                public comments: MorphMany<typeof CommentModel>

                static boot() {
                    this.morphMap({
                        'post': () => Post,
                    });
                }
            }

            Post = PostModel;
            Comment = CommentModel;
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        afterEach(async () => {
            await resetTables()
        })

        it('has query', async () => {
            const {sql, bindings} = Post.query().where('id', 1).has('comments').toSQL();
            const {sql: knexSql} = db
                .from('posts')
                .select('*')
                .where('id', 1)
                .whereExists(builder => {
                    builder
                        .from('comments')
                        .where('commentable_type', 'post')
                        .whereRaw('posts.uid = comments.commentable_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('has nested query', async () => {
            const {sql, bindings} = Post.query().where('id', 1).has('comments.comments.comments').toSQL();
            const {sql: knexSql} = db
                .from('posts')
                .select('*')
                .where('id', 1)
                .whereExists(builder => {
                    builder
                        .from('comments')
                        .where('commentable_type', 'post')
                        .whereRaw('posts.uid = comments.commentable_id')
                        .whereExists(builder => {
                            builder
                                .from('comments as lucid_reserved_0')
                                .where('commentable_type', 'post')
                                .whereRaw('comments.id = lucid_reserved_0.commentable_id')
                                .whereExists(builder => {
                                    builder
                                        .from('comments')
                                        .where('commentable_type', 'post')
                                        .whereRaw('lucid_reserved_0.id = comments.commentable_id')
                                })
                        })
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('withcount query', async () => {
            const {sql, bindings} = Post.query().where('id', 1).withCount('comments').toSQL();
            const q = db.from('comments')
                .count('*')
                .where('commentable_type', 1)
                .whereRaw('posts.uid = comments.commentable_id')
            const {sql: knexSql} = db
                .from('posts')
                .select('posts.*')
                .where('id', 1)
                // @ts-ignore
                .select(db.raw('('+q.toSQL().sql+') as `comments_count`'))
                .toSQL();
            expect(sql).toBe(knexSql);
        });

        it('orHas query', async () => {
            const {sql, bindings} = Post.query().where('id', 1).orHas('comments').toSQL();
            const {sql: knexSql} = db
                .from('posts')
                .select('*')
                .where('id', 1)
                .orWhereExists(builder => {
                    builder
                        .from('comments')
                        .where('commentable_type', 'post')
                        .whereRaw('posts.uid = comments.commentable_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('whereHas query', async () => {
            const {sql, bindings} = Post.query().where('id', 1).whereHas('comments').toSQL();
            const {sql: knexSql} = db
                .from('posts')
                .select('*')
                .where('id', 1)
                .whereExists(builder => {
                    builder
                        .from('comments')
                        .where('commentable_type', 'post')
                        .whereRaw('posts.uid = comments.commentable_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('whereHas use callback query', async () => {
            const {sql, bindings} = Post.query().where('id', 1).whereHas('comments', query => {
                query.where(query.qualifyColumn('id'), 1)
            }).toSQL();
            const {sql: knexSql} = db
                .from('posts')
                .select('*')
                .where('id', 1)
                .whereExists(builder => {
                    builder
                        .from('comments')
                        .where('commentable_type', 'post')
                        .whereRaw('posts.uid = comments.commentable_id')
                        .where('comments.id', 1)
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orWhereHas query', async () => {
            const {sql, bindings} = Post.query().where('id', 1).orWhereHas('comments').toSQL();
            const {sql: knexSql} = db
                .from('posts')
                .select('*')
                .where('id', 1)
                .orWhereExists(builder => {
                    builder
                        .from('comments')
                        .where('commentable_type', 'post')
                        .whereRaw('posts.uid = comments.commentable_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orWhereHas using callback query', async () => {
            const {sql, bindings} = Post.query().where('id', 1).orWhereHas('comments', query => {
                query.where(query.qualifyColumn('id'), 1)
            }).toSQL();
            const {sql: knexSql} = db
                .from('posts')
                .select('*')
                .where('id', 1)
                .orWhereExists(builder => {
                    builder
                        .from('comments')
                        .where('commentable_type', 'post')
                        .whereRaw('posts.uid = comments.commentable_id')
                        .where('comments.id', 1)
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('doesntHave query', async () => {
            const {sql, bindings} = Post.query().where('id', 1).doesntHave('comments').toSQL();
            const {sql: knexSql} = db
                .from('posts')
                .select('*')
                .where('id', 1)
                .whereNotExists(builder => {
                    builder
                        .from('comments')
                        .where('commentable_type', 'post')
                        .whereRaw('posts.uid = comments.commentable_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orDoesntHave query', async () => {
            const {sql, bindings} = Post.query().where('id', 1).orDoesntHave('comments').toSQL();
            const {sql: knexSql} = db
                .from('posts')
                .select('*')
                .where('id', 1)
                .orWhereNotExists(builder => {
                    builder
                        .from('comments')
                        .where('commentable_type', 'post')
                        .whereRaw('posts.uid = comments.commentable_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('whereDoesntHave query', async () => {
            const {sql, bindings} = Post.query().where('id', 1).whereDoesntHave('comments').toSQL();
            const {sql: knexSql} = db
                .from('posts')
                .select('*')
                .where('id', 1)
                .whereNotExists(builder => {
                    builder
                        .from('comments')
                        .where('commentable_type', 'post')
                        .whereRaw('posts.uid = comments.commentable_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('whereDoesntHave using callback query', async () => {
            const {sql, bindings} = Post.query().where('id', 1).whereDoesntHave('comments', query => {
                query.where(query.qualifyColumn('id'), 1)
            }).toSQL();
            const {sql: knexSql} = db
                .from('posts')
                .select('*')
                .where('id', 1)
                .whereNotExists(builder => {
                    builder
                        .from('comments')
                        .where('commentable_type', 'post')
                        .whereRaw('posts.uid = comments.commentable_id')
                        .where('comments.id', 1)
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orWhereDoesntHave query', async () => {
            const {sql, bindings} = Post.query().where('id', 1).orWhereDoesntHave('comments').toSQL();
            const {sql: knexSql} = db
                .from('posts')
                .select('*')
                .where('id', 1)
                .orWhereNotExists(builder => {
                    builder
                        .from('comments')
                        .where('commentable_type', 'post')
                        .whereRaw('posts.uid = comments.commentable_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orWhereDoesntHave using callback query', async () => {
            const {sql, bindings} = Post.query().where('id', 1).orWhereDoesntHave('comments', query => {
                query.where(query.qualifyColumn('id'), 1)
            }).toSQL();
            const {sql: knexSql} = db
                .from('posts')
                .select('*')
                .where('id', 1)
                .orWhereNotExists(builder => {
                    builder
                        .from('comments')
                        .where('commentable_type', 'post')
                        .whereRaw('posts.uid = comments.commentable_id')
                        .where('comments.id', 1)
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('has query when have global scope', async () => {

            class Post extends BaseModel {
                static table = 'posts';

                @column({ isPrimary: true })
                public id: number

                @column()
                public uid: number

                @column()
                public title: string

                @morphMany(() => Comment, {name: 'commentable', localKey: 'uid'})
                public comments: MorphMany<typeof Comment>
            }

            class Comment extends BaseModel {
                static table = 'comments';

                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                static boot() {
                    this.morphMap({
                        'post': () => Post,
                    });
                    this.addGlobalScope('name', query => {
                        query.where(query.qualifyColumn('type'), 'twitter')
                    });
                }
            }

            const {sql, bindings} = Post.query().has('comments').toSQL();
            const {sql: knexSql, bindings: knexBindings} = db
                .from('posts')
                .select('*')
                .whereExists(builder => {
                    builder
                        .from('comments')
                        .where('commentable_type', 'post')
                        .whereRaw('posts.uid = comments.commentable_id')
                        .where('comments.type', 'twitter')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
            expect(bindings).toEqual(knexBindings);
        });
    });
});