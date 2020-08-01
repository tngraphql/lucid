/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 7/23/2020
 * Time: 3:31 PM
 */

import {cleanup, getBaseModel, getDb, getProfiler, ormAdapter, resetTables, setup} from "../helpers";
import {column, hasOne, morphMany, morphOne, morphTo} from "../../src/Orm/Decorators";
import {HasOne, MorphMany, MorphOne, MorphTo} from "../../src/Contracts/Orm/Relations/types";
import {MorphOneQueryBuilder} from "../../src/Orm/Relations/MorphOne/QueryBuilder";


let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>
describe('Model | MorphOne', () => {
    describe('Model | MorphOne | Options', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })
        it('raise error when localKey is missing', async () => {
            expect.assertions(1)

            try {
                class Post extends BaseModel {
                    @morphOne(() => Comment, {name: 'commentable'})
                    public comment: MorphOne<typeof Comment>
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

                    @morphOne(() => Comment, {name: 'commentable'})
                    public comment: MorphOne<typeof Comment>
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

                    @morphOne(() => Comment, {name: 'commentable'})
                    public comment: MorphOne<typeof Comment>
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

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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

                @morphOne(() => Comment, {name: 'commentable', id: 'commentId'})
                public comment: MorphOne<typeof Comment>
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

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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

                @morphOne(() => Comment, {name: 'commentable', type: 'commentType'})
                public comment: MorphOne<typeof Comment>
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

    describe('Model | MorphOne | Set Relations', () => {
        let Post;
        let Comment;

        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))

            class PostModel extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @morphOne(() => CommentModel, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
            const comment = new Comment();
            Post.$getRelation('comment').setRelated(post, comment);
            expect(post.comment).toEqual(comment)
        });

        it('push related model instance', async () => {
            const post = new Post();
            const comment = new Comment();
            Post.$getRelation('comment').pushRelated(post, comment);
            expect(post.comment).toEqual(comment)
        });
    });

    describe('Model | MorphOne | bulk operations', () => {
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

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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

            const { sql, bindings } = post!.related('comment').query().toSQL();

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                .getWriteClient()
                .from('comments')
                .where('commentable_type', 'post')
                .where('commentable_id', 1)
                .limit(1)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        });

        it('generate correct sql for selecting related many rows', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
            Post.$getRelation('comment').boot();

            const relation = Post.$getRelation('comment');

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

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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

            const { sql, bindings } = post!.related('comment').query().update({body: 'job'}).toSQL();

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

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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

            const { sql, bindings } = post!.related('comment').query().del().toSQL();

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

    describe('Model | MorphOne | preload', () => {
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

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
            const posts = await Post.query().preload('comment');
            expect(posts).toHaveLength(2);

            expect(posts[0].comment.commentableId).toBe(posts[0].id);
            expect(posts[0].comment.commentableType).toBe('post');
            expect(posts[1].comment.commentableId).toBe(posts[1].id);
            expect(posts[1].comment.commentableType).toBe('post');
        });

        it('preload nested relations', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public title: string

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
                { body: 'virk', commentable_id: '1', commentable_type: 'post', user_id: 1 }
            ])

            const user = await User.query()
                .preload('post', (builder) => builder.preload('comment'))
                .where('username', 'virk')
                .first()

            expect(user!.post).toBeInstanceOf(Post)
            expect(user!.post!.comment).toBeInstanceOf(Comment)
        });

        it('preload self referenced relationship', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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

            const posts = await Post.query().preload('comment', builder => builder.preload('commentable'));

            expect(posts).toHaveLength(2)

            expect(posts[0].comment.commentable.id).toEqual(posts[0].id)
            expect(posts[1].comment.commentable.id).toEqual(posts[1].id)
        });

        it('add constraints during preload', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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

            const posts = await Post.query().preload('comment', builder => builder.where('body', 'foo'));

            expect(posts).toHaveLength(2);
            expect(posts[0].comment).toBeUndefined();
            expect(posts[1].comment).toBeUndefined();
        });

        it('cherry pick columns during preload', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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

            const posts = await Post.query().preload('comment', builder => builder.select('body'));
            expect(posts).toHaveLength(2);
            expect(posts[0].comment.$extras).toEqual({})
            expect(posts[1].comment.$extras).toEqual({})
        });

        it('do not repeat pk when already defined', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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

            const posts = await Post.query().preload('comment', builder => builder.select('body', 'id'));
            expect(posts).toHaveLength(2);
            expect(posts[0].comment.$extras).toEqual({})
            expect(posts[1].comment.$extras).toEqual({})
        });

        it('pass sideloaded attributes to the relationship', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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

            const posts = await Post.query().preload('comment').sideload({ id: 1 });
            expect(posts).toHaveLength(2);
            expect(posts[0].$sideloaded).toEqual({id: 1})
            expect(posts[1].$sideloaded).toEqual({id: 1})
            expect(posts[0].comment.$sideloaded).toEqual({id: 1})
            expect(posts[1].comment.$sideloaded).toEqual({id: 1})
        });

        it('preload using model instance', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
            await posts[0].preload('comment');
            await posts[1].preload('comment');

            expect(posts[0].comment.commentableId).toEqual(posts[0].id)
            expect(posts[1].comment.commentableId).toEqual(posts[1].id)
        });

        it('raise exception when local key is not selected', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
                await Post.query().select(['title']).preload('comment').where('title', 'virk').first()
            } catch ({ message }) {
                expect(message).toBe('Cannot preload "comment", value of "Post.id" is undefined')
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

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
                preloader.preload('post', (builder) => builder.preload('comment'))
            })

            await users[1].preload((preloader) => {
                preloader.preload('post', (builder) => builder.preload('comment'))
            })

            expect(users[0].post).toBeInstanceOf(Post)
            expect(users[0].post!.comment).toBeInstanceOf(Comment)

            expect(users[1].post).toBeInstanceOf(Post)
            expect(users[1].post!.comment).toBeInstanceOf(Comment)
        });

        it('pass main query options down the chain', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number
                @column()
                public userId: number
                @column()
                public title: string

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
                .preload('post', (builder) => builder.preload('comment'))
                .where('username', 'virk')

            const user = await query.first()
            expect(user!.post).toBeInstanceOf(Post)
            expect(user!.post.comment).toBeInstanceOf(Comment)

            expect(user!.$options!.connection).toBe('secondary')
            expect(user!.post.$options!.connection).toBe('secondary')
            expect(user!.post.comment.$options!.connection).toBe('secondary')
        });

        it('pass relationship metadata to the profiler', async () => {
            expect.assertions(1)

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
                    expect(packet.data.relation).toEqual({ model: 'Post', relatedModel: 'Comment', type: 'morphOne' })
                }
                profilerPacketIndex++
            })

            await Post.query({ profiler }).preload('comment')
        });

        it('do not run preload query when parent rows are empty', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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

            const posts = await Post.query().preload('comment', () => {
                throw new Error('not expected to be here')
            })

            expect(posts).toHaveLength(0)
        });
    });

    describe('Model | MorphOne | save', () => {
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

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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

            await post.related('comment').save(comment)

            expect(post.$isPersisted).toBeTruthy()
            expect(post.id).toBe(comment.commentableId)
            expect(comment.commentableType).toBe('post')
        });

        it('wrap save calls inside a managed transaction', async () => {
            expect.assertions(3)

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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

            try {
                const comment = new Comment()
                // @ts-ignore
                comment.id = 'asd';
                await post.related('comment').save(comment)
            } catch (error) {
                expect(error).toBeDefined()
            }

            const posts = await db.query().from('posts')
            const comments = await db.query().from('comments')

            expect(posts).toHaveLength(0)
            expect(comments).toHaveLength(0)
        });

        it('use parent model transaction when its defined', async () => {
            expect.assertions(4)

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
            post.title = 'virk'
            post.$trx = trx

            try {
                const comment = new Comment()
                // @ts-ignore
                comment.id = 'asd';
                await post.related('comment').save(comment)
            } catch (error) {
                expect(error).toBeDefined()
            }

            expect(post.$trx.isCompleted).toBeFalsy()
            await trx.rollback()

            const posts = await db.query().from('posts')
            const comments = await db.query().from('comments')

            expect(posts).toHaveLength(0)
            expect(comments).toHaveLength(0)
        });
    });

    describe('Model | MorphOne | create', () => {
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

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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

            const comment = await post.related('comment').create({ body: 'graphql 101' })

            expect(post.$isPersisted).toBeTruthy()
            expect(post.id).toBe(comment.commentableId)
            expect(comment.commentableType).toBe('post')

            const totalComments = await db.query().from('comments').count('*', 'total')
            const totalPosts = await db.query().from('posts').count('*', 'total')

            expect(Number(totalPosts[0].total)).toBe(1)
            expect(Number(totalComments[0].total)).toBe(1)
        });
    });

    describe('Model | MorphOne | firstOrCreate', () => {
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

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
            const comment = await post.related('comment').firstOrCreate({}, {
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

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
            const comment = await post.related('comment').firstOrCreate({}, {
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

    describe('Model | MorphOne | updateOrCreate', () => {
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

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
            const comment = await post.related('comment').updateOrCreate({}, {
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

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
            const comment = await post.related('comment').updateOrCreate({}, {
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

    describe('Model | MorphOne | pagination', () => {
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

        test('dis-allow pagination', async () => {
            expect.assertions(1)

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
            try {
                await post!.related('comment').query().paginate(1)
            } catch ({ message }) {
                expect(message).toBe('Cannot paginate a morphOne relationship "(comment)"')
            }
        })
    })

    describe('Model | MorphOne | clone', () => {
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

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
            const clonedQuery = post!.related('comment').query().clone()
            expect(clonedQuery).toBeInstanceOf(MorphOneQueryBuilder)
        })
    })

    describe('Model | MorphOne | global scopes', () => {
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

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
            const comment = await Post.query().preload('comment').firstOrFail();
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

                @morphOne(() => Comment, {name: 'commentable'})
                public comment: MorphOne<typeof Comment>
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
            const profile = await post.related('comment').query().first()
            const {sql} = db.getQueryLog()[0];
            const {sql: knenSql} = db.from('comments')
                .where('body', 'twitter')
                .where('commentable_type', 'post')
                .where('commentable_id', 1)
                .limit(1).toSQL();
            expect(sql).toEqual(knenSql);
        });
    });

    describe('Model | MorphOne | onQuery', () => {
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


                @morphOne(() => Comment, {
                    name: 'commentable',
                    onQuery: query => query.where('body', 'twitter')
                })
                public comment: MorphOne<typeof Comment>
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

            const post = await Post.query().preload('comment').firstOrFail()
            expect(post.comment).toBeUndefined()
        })

        test('do not invoke onQuery method on preloading subqueries', async () => {
            expect.assertions(2)

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string


                @morphOne(() => Comment, {
                    name: 'commentable',
                    onQuery: query => {
                        expect(true).toBeTruthy()
                        query.where('body', 'twitter')
                    }
                })
                public comment: MorphOne<typeof Comment>
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

            const post = await Post.query().preload('comment', (query) => query.where(() => {
            })).firstOrFail()
            expect(post.comment).toBeUndefined()
        })

        test('invoke onQuery method on related query builder', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphOne(() => Comment, {name: 'commentable', onQuery(query) {
                    query.where('body', 'twitter')
                    }})
                public comment: MorphOne<typeof Comment>
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
            const profile = await post.related('comment').query().first()
            expect(profile).toBeNull()
        })

        test('do not invoke onQuery method on related query builder subqueries', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @morphOne(() => Comment, {
                    name: 'commentable',
                    onQuery(query) {
                        query.where('body', 'twitter')
                    }
                })
                public comment: MorphOne<typeof Comment>
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
            const { sql, bindings } = post.related('comment').query().where((query) => {
                query.whereNotNull('created_at')
            }).toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                .from('comments')
                .where('body', 'twitter')
                .where((query) => query.whereNotNull('created_at'))
                .where('commentable_type', 'post')
                .where('commentable_id', 1)
                .limit(1)
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

                @morphOne(() => CommentModel, {name: 'commentable', localKey: 'uid'})
                public comment: MorphOne<typeof CommentModel>
            }

            class CommentModel extends BaseModel {
                static table = 'comments';

                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                @morphOne(() => CommentModel, {name: 'commentable', localKey: 'id'})
                public comment: MorphOne<typeof CommentModel>

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
            const {sql, bindings} = Post.query().where('id', 1).has('comment').toSQL();
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
            const {sql, bindings} = Post.query().where('id', 1).has('comment.comment.comment').toSQL();
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
            const {sql, bindings} = Post.query().where('id', 1).withCount('comment').toSQL();
            const q = db.from('comments')
                .where('commentable_type', 'post')
                .whereRaw('posts.uid = comments.commentable_id')
                .count('*')
            const {sql: knexSql} = db
                .from('posts')
                .select('posts.*')
                .where('id', 1)
                // @ts-ignore
                .select(db.raw('('+q.toSQL().sql+') as `comment_count`'))
                .toSQL();
            expect(sql).toBe(knexSql);
        });

        it('orHas query', async () => {
            const {sql, bindings} = Post.query().where('id', 1).orHas('comment').toSQL();
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
            const {sql, bindings} = Post.query().where('id', 1).whereHas('comment').toSQL();
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
            const {sql, bindings} = Post.query().where('id', 1).whereHas('comment', query => {
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
            const {sql, bindings} = Post.query().where('id', 1).orWhereHas('comment').toSQL();
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
            const {sql, bindings} = Post.query().where('id', 1).orWhereHas('comment', query => {
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
            const {sql, bindings} = Post.query().where('id', 1).doesntHave('comment').toSQL();
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
            const {sql, bindings} = Post.query().where('id', 1).orDoesntHave('comment').toSQL();
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
            const {sql, bindings} = Post.query().where('id', 1).whereDoesntHave('comment').toSQL();
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
            const {sql, bindings} = Post.query().where('id', 1).whereDoesntHave('comment', query => {
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
            const {sql, bindings} = Post.query().where('id', 1).orWhereDoesntHave('comment').toSQL();
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
            const {sql, bindings} = Post.query().where('id', 1).orWhereDoesntHave('comment', query => {
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

                @morphOne(() => Comment, {name: 'commentable', localKey: 'uid'})
                public comment: MorphOne<typeof Comment>
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

            const {sql, bindings} = Post.query().has('comment').toSQL();
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