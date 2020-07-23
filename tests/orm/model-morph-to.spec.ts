/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 7/21/2020
 * Time: 4:16 PM
 */
import {cleanup, getBaseModel, getDb, getProfiler, ormAdapter, resetTables, setup} from "../helpers";
import {column, hasOne, morphTo} from "../../src/Orm/Decorators";
import {HasOne, MorphTo} from "../../src/Contracts/Orm/Relations/types";
import {HasOneQueryBuilder} from "../../src/Orm/Relations/HasOne/QueryBuilder";
import {MorphToQueryBuilder} from "../../src/Orm/Relations/MorphTo/QueryBuilder";

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>
describe('Model | MorphTo', () => {
    describe('Model | MorphTo | Options', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })
        it('raise error when localKey is missing', async () => {
            expect.assertions(1)

            try {
                class Post extends BaseModel {
                }

                class Comment extends BaseModel {
                    @morphTo({})
                    public commentable
                }

                Comment.$getRelation('commentable').bootTo();
            } catch (e) {
                expect(e.message).toBe(
                    'E_MISSING_MODEL_ATTRIBUTE: "Comment.commentable" expects "id" to exist on "Comment" model, but is missing'
                )
            }
        });

        it('raise error when foreignKey is missing', async () => {
            expect.assertions(1)

            try {
                class Post extends BaseModel {
                }

                class Comment extends BaseModel {
                    @column({ isPrimary: true })
                    public id: number

                    @morphTo({})
                    public commentable
                }

                Comment.$getRelation('commentable').boot();
            } catch (e) {
                expect(e.message).toBe(
                    'E_MISSING_MODEL_ATTRIBUTE: "Comment.commentable" expects "commentableId" to exist on "Comment" model, but is missing'
                )
            }
        });

        it('raise error when morphType is missing', async () => {
            expect.assertions(1)

            try {
                class Post extends BaseModel {
                }

                class Comment extends BaseModel {
                    @column({ isPrimary: true })
                    public id: number

                    @column()
                    public commentableId: number

                    @morphTo({})
                    public commentable
                }

                Comment.$getRelation('commentable').boot();
            } catch (e) {
                expect(e.message).toBe(
                    'E_MISSING_MODEL_ATTRIBUTE: "Comment.commentable" expects "commentableType" to exist on "Comment" model, but is missing'
                )
            }
        });

        it('use primary key is as the local key', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo({})
                public commentable
            }

            Comment.$getRelation('commentable').bootTo();

            expect(Comment.$getRelation('commentable')['localKey']).toBe('id');
        });

        it('compute foreign key from model name and primary key', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public uid: number
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo({localKey: 'uid'})
                public commentable
            }

            Comment.$getRelation('commentable').boot();

            expect(Comment.$getRelation('commentable')['foreignKey']).toBe('commentableId');
        });

        it('use pre defined foreign key', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public uid: number
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentId: number

                @column()
                public commentableType: number

                @morphTo({id: 'commentId'})
                public commentable
            }

            Comment.$getRelation('commentable').bootTo();

            expect(Comment.$getRelation('commentable')['foreignKey']).toBe('commentId');
        });

        it('compute morph type from model name and primary key', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public uid: number
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo({localKey: 'uid'})
                public commentable
            }

            Comment.$getRelation('commentable').boot();

            expect(Comment.$getRelation('commentable')['morphType']).toBe('commentableType');
        });

        it('use pre defined morph type', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public uid: number
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentType: number

                @morphTo({type: 'commentType'})
                public commentable
            }

            Comment.$getRelation('commentable').boot();

            expect(Comment.$getRelation('commentable')['morphType']).toBe('commentType');
        });
    });

    describe('Model | MorphTo | Set Relations', () => {
        let Post;
        let Comment;

        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))

            class PostModel extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public uid: number
            }

            class CommentModel extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo({localKey: 'uid'})
                public commentable: MorphTo<any>
            }

            CommentModel.$getRelation('commentable').boot();

            Post = PostModel;
            Comment = CommentModel;
        })

        it('set related model instance', async () => {
            const post = new Post();
            const comment = new Comment();
            Comment.$getRelation('commentable').setRelated(comment, post);
            expect(comment.commentable).toEqual(post)
        });

        it('push related model instance', async () => {
            const post = new Post();
            const comment = new Comment();
            Comment.$getRelation('commentable').pushRelated(comment, post);
            expect(comment.commentable).toEqual(post)
        });
    });

    describe('Model | MorphTo | bulk operations', () => {
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
                        'post': Post
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                {body: 'virk', commentable_id: '1', commentable_type: 'post'},
                // { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ]);

            const comment = await Comment.find(1);

            const { sql, bindings } = comment!.related('commentable').query().toSQL();

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                .getWriteClient()
                .from('posts')
                .where('id', 1)
                .limit(1)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        });

        it('generate correct sql for selecting related many rows', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number
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
                        'post': Post
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                {body: 'virk', commentable_id: '1', commentable_type: 'post'},
                { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ]);

            const comments = await Comment.all();
            Comment.$getRelation('commentable').boot();

            const relation = Comment.$getRelation('commentable');

            const related = relation.eagerQuery(comments, db.connection());
            db.enableQueryLog();
            await relation.getEager(related);

            const { sql, bindings } = db.getQueryLog()[0];

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                .getWriteClient()
                .from('posts')
                .whereIn('posts.id', [2,1])
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
                        'post': Post
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                {body: 'virk', commentable_id: '1', commentable_type: 'post'},
                // { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ]);

            const comment = await Comment.find(1);

            const { sql, bindings } = comment!.related('commentable').query().update({title: 'job'}).toSQL();

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                .getWriteClient()
                .from('posts')
                .where('id', 1)
                .update({title: 'job'})
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
                        'post': Post
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                {body: 'virk', commentable_id: '1', commentable_type: 'post'},
                // { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ]);

            const comment = await Comment.find(1);

            const { sql, bindings } = comment!.related('commentable').query().del().toSQL();

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                .getWriteClient()
                .from('posts')
                .where('id', 1)
                .del()
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        });
    });

    describe('Model | MorphTo | preload', () => {
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
            }

            class Friend extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                @morphTo({})
                public commentable

                static boot() {
                    this.morphMap({
                        'post': Post,
                        'friend': Friend
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post' },
                { body: 'nikk', commentable_id: '2', commentable_type: 'friend' }
            ])

            await db.insertQuery().table('friends').insert([
                { username: 'virk' },
                { username: 'nikk' }
            ])

            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                }
            ])

            db.enableQueryLog();
            const comments = await Comment.query().preload('commentable');
            expect(comments).toHaveLength(2);
            expect(Array.from(new Set(comments.map(x => x.commentableType)))).toHaveLength(2);

            const morphMap = {
                'post': Post,
                'friend': Friend
            }

            expect(comments[0].commentable.id).toBe(comments[0].commentableId)
            expect(comments[0].commentable.constructor.name).toBe(morphMap[comments[0].commentableType].name)
            expect(comments[1].commentable.constructor.name).toBe(morphMap[comments[1].commentableType].name)
            expect(comments[1].commentable.id).toBe(comments[1].commentableId)
        });

        it('preload nested relations', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo()
                public commentable: MorphTo<any>

                static boot() {
                    this.morphMap({
                        'post': Post
                    });
                }
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Comment)
                public comment: HasOne<typeof Comment>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                }
            ])
            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post', user_id: 1 }
            ])

            const user = await User.query()
                .preload('comment', (builder) => builder.preload('commentable'))
                .where('username', 'virk')
                .first()

            expect(user!.comment).toBeInstanceOf(Comment)
            expect(user!.comment!.commentable).toBeInstanceOf(Post)
        });

        it('preload self referenced relationship', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string

                @hasOne(() => Comment, {
                    foreignKey: 'commentableId'
                })
                comment: HasOne<typeof Comment>
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
                        'post': Post
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
                        'post': Post
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

            const comments = await Comment.query().preload('commentable', builder => builder.where('title', 'foo'));

            expect(comments).toHaveLength(2);
            expect(comments[0].commentable).toBeUndefined();
            expect(comments[1].commentable).toBeUndefined();
        });

        it('cherry pick columns during preload', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'id' })
                public uid: number

                @column()
                public title: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo({localKey: 'uid'})
                public commentable: MorphTo<any>

                static boot() {
                    this.morphMap({
                        'post': Post
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

            const comments = await Comment.query().preload('commentable', builder => builder.select('title'));
            expect(comments).toHaveLength(2);
            expect(comments[0].commentable.$extras).toEqual({})
            expect(comments[1].commentable.$extras).toEqual({})
        });

        it('do not repeat pk when already defined', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'id' })
                public uid: number

                @column()
                public title: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo({localKey: 'uid'})
                public commentable: MorphTo<any>

                static boot() {
                    this.morphMap({
                        'post': Post
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

            const comments = await Comment.query().preload('commentable', builder => builder.select('title', 'id'));
            expect(comments).toHaveLength(2);
            expect(comments[0].commentable.$extras).toEqual({})
            expect(comments[1].commentable.$extras).toEqual({})
        });

        it('pass sideloaded attributes to the relationship', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'id' })
                public uid: number

                @column()
                public title: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo({localKey: 'uid'})
                public commentable: MorphTo<any>

                static boot() {
                    this.morphMap({
                        'post': Post
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

            const comments = await Comment.query().preload('commentable').sideload({ id: 1 });
            expect(comments).toHaveLength(2);
            expect(comments[0].$sideloaded).toEqual({id: 1})
            expect(comments[1].$sideloaded).toEqual({id: 1})
            expect(comments[0].commentable.$sideloaded).toEqual({id: 1})
            expect(comments[1].commentable.$sideloaded).toEqual({id: 1})
        });

        it('preload using model instance', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string
            }

            class Friend extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: string

                @morphTo({})
                public commentable

                static boot() {
                    this.morphMap({
                        'post': Post,
                        'friend': Friend
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post' },
                { body: 'nikk', commentable_id: '2', commentable_type: 'friend' }
            ])

            await db.insertQuery().table('friends').insert([
                { username: 'virk' },
                { username: 'nikk' }
            ])

            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                }
            ])

            const comments = await Comment.all();
            expect(comments).toHaveLength(2);

            await comments[0].preload('commentable');
            await comments[1].preload('commentable');

            expect(comments[0].commentable.id).toEqual(comments[0].commentableId)
            expect(comments[1].commentable.id).toEqual(comments[1].commentableId)
        });

        it('raise exception when foreign key is not selected', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'id' })
                public uid: number

                @column()
                public title: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo({localKey: 'uid'})
                public commentable: MorphTo<any>

                static boot() {
                    this.morphMap({
                        'post': Post
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
                await Comment.query().select(['commentableType']).preload('commentable').where('body', 'virk').first()
            } catch ({ message }) {
                expect(message).toBe('Cannot select "commentable", value of "Comment.commentableId" is undefined')
            }
        });

        it('raise exception when morph type is not selected', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'id' })
                public uid: number

                @column()
                public title: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo({localKey: 'uid'})
                public commentable: MorphTo<any>

                static boot() {
                    this.morphMap({
                        'post': Post
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
                await Comment.query().select(['commentableId']).preload('commentable').where('body', 'virk').first()
            } catch ({ message }) {
                expect(message).toBe('Cannot select "commentable", value of "Comment.commentableType" is undefined')
            }
        });

        it('preload nested relations using model instance', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo()
                public commentable: MorphTo<any>

                static boot() {
                    this.morphMap({
                        'post': Post
                    });
                }
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Comment)
                public comment: HasOne<typeof Comment>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                }
            ])
            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post', user_id: 1 },
                { body: 'virk', commentable_id: '1', commentable_type: 'post', user_id: 2 }
            ])

            const users = await User.all()
            expect(users).toHaveLength(2);

            await users[0].preload((preloader) => {
                preloader.preload('comment', (builder) => builder.preload('commentable'))
            })

            await users[1].preload((preloader) => {
                preloader.preload('comment', (builder) => builder.preload('commentable'))
            })

            expect(users[0].comment).toBeInstanceOf(Comment)
            expect(users[0].comment!.commentable).toBeInstanceOf(Post)

            expect(users[1].comment).toBeInstanceOf(Comment)
            expect(users[1].comment!.commentable).toBeInstanceOf(Post)
        });

        it('pass main query options down the chain', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public title: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo()
                public commentable: MorphTo<any>

                static boot() {
                    this.morphMap({
                        'post': Post
                    });
                }
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Comment)
                public comment: HasOne<typeof Comment>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('posts').insert([
                {
                    title: 'virk'
                }
            ])
            await db.insertQuery().table('comments').insert([
                { body: 'virk', commentable_id: '1', commentable_type: 'post', user_id: 1 },
                { body: 'virk', commentable_id: '1', commentable_type: 'post', user_id: 2 }
            ])

            const query = User.query({ connection: 'secondary' })
                .preload('comment', (builder) => builder.preload('commentable'))
                .where('username', 'virk')

            const user = await query.first()
            expect(user!.comment).toBeInstanceOf(Comment)
            expect(user!.comment.commentable).toBeInstanceOf(Post)

            expect(user!.$options!.connection).toBe('secondary')
            expect(user!.comment.$options!.connection).toBe('secondary')
            expect(user!.comment.commentable.$options!.connection).toBe('secondary')
        });

        it('pass relationship metadata to the profiler', async () => {
            expect.assertions(1)

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'id' })
                public uid: number

                @column()
                public title: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo({localKey: 'uid'})
                public commentable: MorphTo<any>

                static boot() {
                    this.morphMap({
                        'post': Post
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
                    expect(packet.data.relation).toEqual({ model: 'Comment', relatedModel: 'Post', type: 'morphTo' })
                }
                profilerPacketIndex++
            })

            await Comment.query({ profiler }).preload('commentable')
        });

        it('do not run preload query when parent rows are empty', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'id' })
                public uid: number

                @column()
                public title: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo({localKey: 'uid'})
                public commentable: MorphTo<any>

                static boot() {
                    this.morphMap({
                        'post': Post
                    });
                }
            }

            const comments = await Comment.query().preload('commentable', () => {
                throw new Error('not expected to be here')
            })

            expect(comments).toHaveLength(0)
        });
    });

    describe('Model | MorphTo | pagination', () => {
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

                @column({ columnName: 'id' })
                public uid: number

                @column()
                public title: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo({localKey: 'uid'})
                public commentable: MorphTo<any>

                static boot() {
                    this.morphMap({
                        'post': Post
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                {body: 'virk', commentable_id: '1', commentable_type: 'post'},
                // { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ]);

            const comment = await Comment.find(1)
            try {
                await comment!.related('commentable').query().paginate(1)
            } catch ({ message }) {
                expect(message).toBe('Cannot paginate a hasOne relationship "(commentable)"')
            }
        })
    })

    describe('Model | MorphTo | clone', () => {
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

                @column({ columnName: 'id' })
                public uid: number

                @column()
                public title: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo({localKey: 'uid'})
                public commentable: MorphTo<any>

                static boot() {
                    this.morphMap({
                        'post': Post
                    });
                }
            }

            await db.insertQuery().table('comments').insert([
                {body: 'virk', commentable_id: '1', commentable_type: 'post'},
                // { body: 'nikk', commentable_id: '2', commentable_type: 'post' }
            ]);

            const comment = await Comment.find(1)
            const clonedQuery = comment!.related('commentable').query().clone()
            expect(clonedQuery).toBeInstanceOf(MorphToQueryBuilder)
        })
    })

    describe('Model | MorphTo | global scopes', () => {
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

                @column({ columnName: 'id' })
                public uid: number

                @column()
                public title: string

                static boot() {
                    this.addGlobalScope(query => {
                        query.where('title', 'twitter')
                    });
                }
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
                        'post': Post
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
            const comment = await Comment.query().preload('commentable').firstOrFail();
            const {sql} = db.getQueryLog()[1];
            const {sql: knenSql} = db.from('posts').whereIn('posts.id', [1]).where('title', 'twitter').toSQL();
            expect(sql).toEqual(knenSql);
        });

        it('apply scopes on related query', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'id' })
                public uid: number

                @column()
                public title: string

                static boot() {
                    this.addGlobalScope(query => {
                        query.where('title', 'twitter')
                    });
                }
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
                        'post': Post
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

            const comment = await Comment.findOrFail(1)

            db.enableQueryLog();
            const profile = await comment.related('commentable').query().first()
            const {sql} = db.getQueryLog()[0];
            const {sql: knenSql} = db.from('posts').where('title', 'twitter').where('id', 1).limit(1).toSQL();
            expect(sql).toEqual(knenSql);
        });
    });

    describe('Model | HasOne | onQuery', () => {
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

                @column({ columnName: 'id' })
                public uid: number

                @column()
                public title: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo({localKey: 'uid', onQuery: (query) =>{
                        query.where('title', 'twitter')
                    }})
                public commentable: MorphTo<any>

                static boot() {
                    this.morphMap({
                        'post': Post
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

            const comment = await Comment.query().preload('commentable').firstOrFail()
            expect(comment.commentable).toBeUndefined()
        })

        test('do not invoke onQuery method on preloading subqueries', async () => {
            expect.assertions(2)

            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'id' })
                public uid: number

                @column()
                public title: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo({localKey: 'uid', onQuery: (query) =>{
                        expect(true).toBeTruthy()
                        query.where('title', 'twitter')
                    }})
                public commentable: MorphTo<any>

                static boot() {
                    this.morphMap({
                        'post': Post
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

            const comment = await Comment.query().preload('commentable', (query) => query.where(() => {
            })).firstOrFail()
            expect(comment.commentable).toBeUndefined()
        })

        test('invoke onQuery method on related query builder', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'id' })
                public uid: number

                @column()
                public title: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo({localKey: 'uid', onQuery: (query) => query.where('title', 'twitter')})
                public commentable: MorphTo<any>

                static boot() {
                    this.morphMap({
                        'post': Post
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

            const comment = await Comment.findOrFail(1)
            const profile = await comment.related('commentable').query().first()
            expect(profile).toBeNull()
        })

        test('do not invoke onQuery method on related query builder subqueries', async () => {
            class Post extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'id' })
                public uid: number

                @column()
                public title: string
            }

            class Comment extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public commentableId: number

                @column()
                public commentableType: number

                @morphTo({localKey: 'uid', onQuery: (query) => query.where('type', 'twitter')})
                public commentable: MorphTo<any>

                static boot() {
                    this.morphMap({
                        'post': Post
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

            const comment = await Comment.findOrFail(1)
            const { sql, bindings } = comment.related('commentable').query().where((query) => {
                query.whereNotNull('created_at')
            }).toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                .from('posts')
                .where('type', 'twitter')
                .where((query) => query.whereNotNull('created_at'))
                .where('id', 1)
                .limit(1)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })
});