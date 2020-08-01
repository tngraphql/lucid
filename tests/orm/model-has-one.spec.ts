/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 9:48 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import { BelongsTo, HasOne } from '../../src/Contracts/Orm/Relations/types';
import { scope } from '../../src/Helpers/scope';
import { belongsTo, column, hasOne } from '../../src/Orm/Decorators';
import { HasOneQueryBuilder } from '../../src/Orm/Relations/HasOne/QueryBuilder';
import { cleanup, getBaseModel, getDb, getProfiler, ormAdapter, resetTables, setup } from '../helpers';

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Model | HasOne', () => {
    describe('Model | HasOne | Options', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })

        test('raise error when localKey is missing', () => {
            expect.assertions(1)

            try {
                class Profile extends BaseModel {
                }

                class User extends BaseModel {
                    @hasOne(() => Profile)
                    public profile: HasOne<typeof Profile>
                }

                User.$getRelation('profile')!.boot()
            } catch ({ message }) {
                expect(
                    message).toBe('E_MISSING_MODEL_ATTRIBUTE: "User.profile" expects "id" to exist on "User" model, but is missing'
                )
            }
        })

        test('raise error when foreignKey is missing', () => {
            expect.assertions(1)

            try {
                class Profile extends BaseModel {
                }

                Profile.bootIfNotBooted();

                class User extends BaseModel {
                    @column({ isPrimary: true })
                    public id: number

                    @hasOne(() => Profile)
                    public profile: HasOne<typeof Profile>
                }

                User.$getRelation('profile')!.boot()
            } catch ({ message }) {
                expect(
                    message).toBe('E_MISSING_MODEL_ATTRIBUTE: "User.profile" expects "userId" to exist on "Profile" model, but is missing'
                )
            }
        })

        test('use primary key is as the local key', () => {
            class Profile extends BaseModel {
                @column()
                public userId: number
            }



            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            User.$getRelation('profile')!.boot()

            expect(User.$getRelation('profile')!['localKey']).toBe('id')
        })

        test('use custom defined local key', () => {
            class Profile extends BaseModel {
                @column()
                public userId: number
            }



            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'user_uid' })
                public uid: number

                @hasOne(() => Profile, { localKey: 'uid' })
                public profile: HasOne<typeof Profile>
            }

            User.$getRelation('profile')!.boot()

            expect(User.$getRelation('profile')!['localKey']).toBe('uid')
        })

        test('compute foreign key from model name and primary key', () => {
            class Profile extends BaseModel {
                @column()
                public userId: number
            }



            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            User.$getRelation('profile')!.boot()

            expect(User.$getRelation('profile')!['foreignKey']).toBe('userId')
        })

        test('use pre defined foreign key', () => {
            class Profile extends BaseModel {
                @column({ columnName: 'user_id' })
                public userUid: number
            }



            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile, { foreignKey: 'userUid' })
                public profile: HasOne<typeof Profile>
            }

            User.$getRelation('profile')!.boot()

            expect(User.$getRelation('profile')!['foreignKey']).toBe('userUid')
        })
    })

    describe('Model | HasOne | Set Relations', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })

        test('set related model instance', () => {
            class Profile extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column()
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            User.$getRelation('profile')!.boot()

            const user = new User()
            const profile = new Profile()
            User.$getRelation('profile')!.setRelated(user, profile)
            expect(user.profile).toEqual(profile)
        })

        test('push related model instance', () => {
            class Profile extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column()
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            User.$getRelation('profile')!.boot()

            const user = new User()
            const profile = new Profile()
            User.$getRelation('profile')!.pushRelated(user, profile)
            expect(user.profile).toEqual(profile)
        })

        test('set many of related instances', () => {
            class Profile extends BaseModel {
                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column()
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            User.$getRelation('profile')!.boot()

            const user = new User()
            user.fill({ id: 1 })

            const user1 = new User()
            user1.fill({ id: 2 })

            const user2 = new User()
            user2.fill({ id: 3 })

            const profile = new Profile()
            profile.fill({ userId: 1 })

            const profile1 = new Profile()
            profile1.fill({ userId: 2 })

            User.$getRelation('profile')!.setRelatedForMany([user, user1, user2], [profile, profile1])
            expect(user.profile).toEqual(profile)
            expect(user1.profile).toEqual(profile1)
            expect(user2.profile).toBeUndefined()
        })
    })

    describe('Model | HasOne | bulk operations', () => {
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
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.table('users').insert({ username: 'virk' })

            const user = await User.find(1)
            const { sql, bindings } = user!.related('profile').query().toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('profiles')
                                                               .where('user_id', 1)
                                                               .limit(1)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for selecting related many rows', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.table('users').multiInsert([
                { username: 'virk' },
                { username: 'nikk' }
            ])

            const users = await User.all()
            User.$getRelation('profile')!.boot()

            const related = User.$getRelation('profile')!.eagerQuery(users, db.connection())
            const { sql, bindings } = related.toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('profiles')
                                                               .whereIn('user_id', [2, 1])
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for updating related row', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.table('users').insert({ username: 'virk' })

            const user = await User.find(1)
            const { sql, bindings } = user!.related('profile').query().update({
                username: 'nikk'
            }).toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('profiles')
                                                               .where('user_id', 1)
                                                               .update({ username: 'nikk' })
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for deleting related row', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.table('users').insert({ username: 'virk' })

            const user = await User.find(1)
            const { sql, bindings } = user!.related('profile').query().del().toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('profiles')
                                                               .where('user_id', 1)
                                                               .del()
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })

    describe('Model | HasOne | preload', () => {
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
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

            const [user0, user1] = await db.query().from('users')
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: user0.id,
                    display_name: 'virk'
                },
                {
                    user_id: user1.id,
                    display_name: 'nikk'
                }
            ])


            const users = await User.query().preload('profile')
            expect(users).toHaveLength(2)

            expect(users[0].profile.userId).toBe(users[0].id)
            expect(users[1].profile.userId).toBe(users[1].id)
        })

        test('preload nested relations', async () => {
            class Identity extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public profileId: number

                @column()
                public identityName: string
            }

            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string

                @hasOne(() => Identity)
                public identity: HasOne<typeof Identity>
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: 1,
                    display_name: 'virk'
                },
                {
                    user_id: 2,
                    display_name: 'nikk'
                }
            ])

            await db.insertQuery().table('identities').insert([
                {
                    profile_id: 1,
                    identity_name: 'virk'
                },
                {
                    profile_id: 2,
                    identity_name: 'nikk'
                }
            ])


            const user = await User.query()
                                   .preload('profile', (builder) => builder.preload('identity'))
                                   .where('username', 'virk')
                                   .first()

            expect(user!.profile).toBeInstanceOf(Profile)
            expect(user!.profile!.identity).toBeInstanceOf(Identity)
        })

        test('preload self referenced relationship', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

            const [user0, user1] = await db.query().from('users')
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: user0.id,
                    display_name: 'virk'
                },
                {
                    user_id: user1.id,
                    display_name: 'nikk'
                }
            ])


            const users = await User.query().preload('profile', (builder) => builder.preload('user'))
            expect(users).toHaveLength(2)

            expect(users[0].profile.user.id).toEqual(users[0].id)
            expect(users[1].profile.user.id).toEqual(users[1].id)
        })

        test('add constraints during preload', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

            const [user0, user1] = await db.query().from('users')
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: user0.id,
                    display_name: 'virk'
                },
                {
                    user_id: user1.id,
                    display_name: 'nikk'
                }
            ])


            const users = await User.query().preload('profile', (builder) => builder.where('display_name', 'foo'))
            expect(users).toHaveLength(2)

            expect(users[0].profile).toBeUndefined()
            expect(users[1].profile).toBeUndefined()
        })

        test('cherry pick columns during preload', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

            const [user0, user1] = await db.query().from('users')
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: user0.id,
                    display_name: 'virk'
                },
                {
                    user_id: user1.id,
                    display_name: 'nikk'
                }
            ])


            const users = await User.query().preload('profile', (builder) => {
                return builder.select('display_name')
            })

            expect(users).toHaveLength(2)
            expect(users[0].profile.$extras).toEqual({})
            expect(users[1].profile.$extras).toEqual({})
        })

        test('do not repeat fk when already defined', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

            const [user0, user1] = await db.query().from('users')
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: user0.id,
                    display_name: 'virk'
                },
                {
                    user_id: user1.id,
                    display_name: 'nikk'
                }
            ])


            const users = await User.query().preload('profile', (builder) => {
                return builder.select('display_name', 'user_id')
            })

            expect(users).toHaveLength(2)
            expect(users[0].profile.$extras).toEqual({})
            expect(users[1].profile.$extras).toEqual({})
        })

        test('pass sideloaded attributes to the relationship', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

            const [user0, user1] = await db.query().from('users')
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: user0.id,
                    display_name: 'virk'
                },
                {
                    user_id: user1.id,
                    display_name: 'nikk'
                }
            ])


            const users = await User.query().preload('profile').sideload({ id: 1 })
            expect(users).toHaveLength(2)

            expect(users[0].$sideloaded).toEqual({ id: 1 })
            expect(users[1].$sideloaded).toEqual({ id: 1 })
            expect(users[0].profile.$sideloaded).toEqual({ id: 1 })
            expect(users[1].profile.$sideloaded).toEqual({ id: 1 })
        })

        test('preload using model instance', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: 1,
                    display_name: 'virk'
                },
                {
                    user_id: 2,
                    display_name: 'nikk'
                }
            ])


            const users = await User.all()
            expect(users).toHaveLength(2)

            await users[0].preload('profile')
            await users[1].preload('profile')

            expect(users[0].profile.userId).toBe(users[0].id)
            expect(users[1].profile.userId).toBe(users[1].id)
        })

        test('raise exception when local key is not selected', async () => {
            expect.assertions(1)

            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

            const users = await db.query().from('users')
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: users[0].id,
                    display_name: 'virk'
                },
                {
                    user_id: users[1].id,
                    display_name: 'nikk'
                }
            ])

            try {
                await User.query().select('username').preload('profile').where('username', 'virk').first()
            } catch ({ message }) {
                expect(message).toBe('Cannot preload "profile", value of "User.id" is undefined')
            }
        })

        test('preload nested relations using model instance', async () => {
            class Identity extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public profileId: number

                @column()
                public identityName: string
            }

            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string

                @hasOne(() => Identity)
                public identity: HasOne<typeof Identity>
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: 1,
                    display_name: 'virk'
                },
                {
                    user_id: 2,
                    display_name: 'nikk'
                }
            ])

            await db.insertQuery().table('identities').insert([
                {
                    profile_id: 1,
                    identity_name: 'virk'
                },
                {
                    profile_id: 2,
                    identity_name: 'nikk'
                }
            ])


            const users = await User.all()
            expect(users).toHaveLength(2)

            await users[0].preload((preloader) => {
                preloader.preload('profile', (builder) => builder.preload('identity'))
            })

            await users[1].preload((preloader) => {
                preloader.preload('profile', (builder) => builder.preload('identity'))
            })

            expect(users[0].profile).toBeInstanceOf(Profile)
            expect(users[0].profile!.identity).toBeInstanceOf(Identity)

            expect(users[1].profile).toBeInstanceOf(Profile)
            expect(users[1].profile!.identity).toBeInstanceOf(Identity)
        })

        test('pass main query options down the chain', async () => {
            class Identity extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public profileId: number

                @column()
                public identityName: string
            }

            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string

                @hasOne(() => Identity)
                public identity: HasOne<typeof Identity>
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: 1,
                    display_name: 'virk'
                },
                {
                    user_id: 2,
                    display_name: 'nikk'
                }
            ])

            await db.insertQuery().table('identities').insert([
                {
                    profile_id: 1,
                    identity_name: 'virk'
                },
                {
                    profile_id: 2,
                    identity_name: 'nikk'
                }
            ])


            const query = User.query({ connection: 'secondary' })
                              .preload('profile', (builder) => builder.preload('identity'))
                              .where('username', 'virk')

            const user = await query.first()
            expect(user!.profile).toBeInstanceOf(Profile)
            expect(user!.profile.identity).toBeInstanceOf(Identity)

            expect(user!.$options!.connection).toBe('secondary')
            expect(user!.profile.$options!.connection).toBe('secondary')
            expect(user!.profile.identity.$options!.connection).toBe('secondary')
        })

        test('pass relationship metadata to the profiler', async () => {
            expect.assertions(1)

            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])

            const [user0, user1] = await db.query().from('users')
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: user0.id,
                    display_name: 'virk'
                },
                {
                    user_id: user1.id,
                    display_name: 'nikk'
                }
            ])

            const profiler = getProfiler(true)

            let profilerPacketIndex = 0
            profiler.process((packet) => {
                if ( profilerPacketIndex === 1 ) {
                    expect(packet.data.relation).toEqual({ model: 'User', relatedModel: 'Profile', type: 'hasOne' })
                }
                profilerPacketIndex++
            })

            await User.query({ profiler }).preload('profile')
        })

        test('do not run preload query when parent rows are empty', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }


            const users = await User.query().preload('profile', () => {
                throw new Error('not expected to be here')
            })

            expect(users).toHaveLength(0)
        })
    })

    describe('Model | HasOne | save', () => {
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
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const profile = new Profile()
            profile.displayName = 'Hvirk'

            await user.related('profile').save(profile)

            expect(profile.$isPersisted).toBeTruthy()
            expect(user.id).toBe(profile.userId)
        })

        test('wrap save calls inside a managed transaction', async () => {
            expect.assertions(3)

            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            user.username = 'virk'

            try {
                const profile = new Profile()
                await user.related('profile').save(profile)
            } catch (error) {
                expect(error).toBeDefined()
            }

            const users = await db.query().from('users')
            const profiles = await db.query().from('profiles')

            expect(users).toHaveLength(0)
            expect(profiles).toHaveLength(0)
        })

        test('use parent model transaction when its defined', async () => {
            expect.assertions(4)

            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const trx = await db.transaction()
            const user = new User()
            user.username = 'virk'
            user.$trx = trx

            try {
                const profile = new Profile()
                await user.related('profile').save(profile)
            } catch (error) {
                expect(error).toBeDefined()
            }

            expect(user.$trx.isCompleted).toBeFalsy()
            await trx.rollback()

            const users = await db.query().from('users')
            const profiles = await db.query().from('profiles')

            expect(users).toHaveLength(0)
            expect(profiles).toHaveLength(0)
        })
    })

    describe('Model | HasOne | create', () => {
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
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const profile = await user.related('profile').create({
                displayName: 'Hvirk'
            })

            expect(profile.$isPersisted).toBeTruthy()
            expect(user.id).toBe(profile.userId)
        })

        test('wrap create call inside a managed transaction', async () => {
            expect.assertions(3)

            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            user.username = 'virk'

            try {
                await user.related('profile').create({})
            } catch (error) {
                expect(error).toBeDefined()
            }

            const users = await db.query().from('users')
            const profiles = await db.query().from('profiles')

            expect(users).toHaveLength(0)
            expect(profiles).toHaveLength(0)
        })

        test('use parent model transaction during create', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const trx = await db.transaction()

            const user = new User()
            user.username = 'virk'
            user.$trx = trx

            const profile = await user.related('profile').create({ displayName: 'Hvirk' })

            expect(user.$trx.isCompleted).toBeFalsy()
            await trx.rollback()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalProfiles = await db.query().from('profiles').count('*', 'total')

            expect(Number(totalUsers[0].total)).toBe(0)
            expect(Number(totalProfiles[0].total)).toBe(0)
            expect(user.$trx).toBeUndefined()
            expect(profile.$trx).toBeUndefined()
        })
    })

    describe('Model | HasOne | firstOrCreate', () => {
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
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const profile = await user.related('profile').firstOrCreate({}, {
                displayName: 'Hvirk'
            })

            expect(profile.$isPersisted).toBeTruthy()
            expect(profile.$isLocal).toBeTruthy()
            expect(user.id).toBe(profile.userId)
            expect(profile.displayName).toBe('Hvirk')
        })

        test('return the existing row vs creating a new one', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('profiles').insert({ user_id: user.id, display_name: 'Hvirk' })
            const profile = await user.related('profile').firstOrCreate({}, {
                displayName: 'Hvirk'
            })

            expect(profile.$isPersisted).toBeTruthy()
            expect(profile.$isLocal).toBeFalsy()
            expect(user.id).toBe(profile.userId)
            expect(profile.displayName).toBe('Hvirk')

            const profiles = await db.query().from('profiles')
            expect(profiles).toHaveLength(1)
        })
    })

    describe('Model | HasOne | updateOrCreate', () => {
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
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const profile = await user.related('profile').updateOrCreate({}, {
                displayName: 'Virk'
            })

            expect(profile.$isPersisted).toBeTruthy()
            expect(profile.$isLocal).toBeTruthy()
            expect(user.id).toBe(profile.userId)
            expect(profile.displayName).toBe('Virk')

            const profiles = await db.query().from('profiles')
            expect(profiles).toHaveLength(1)
            expect(profiles[0].display_name).toBe('Virk')
        })

        test('update the existing row vs creating a new one', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('profiles').insert({ user_id: user.id, display_name: 'Hvirk' })
            const profile = await user.related('profile').updateOrCreate({}, {
                displayName: 'Virk'
            })

            expect(profile.$isPersisted).toBeTruthy()
            expect(profile.$isLocal).toBeFalsy()
            expect(user.id).toBe(profile.userId)
            expect(profile.displayName).toBe('Virk')

            const profiles = await db.query().from('profiles')
            expect(profiles).toHaveLength(1)
            expect(profiles[0].display_name).toBe('Virk')
        })
    })

    describe('Model | HasOne | pagination', () => {
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

            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.table('users').insert({ username: 'virk' })

            const user = await User.find(1)
            try {
                await user!.related('profile').query().paginate(1)
            } catch ({ message }) {
                expect(message).toBe('Cannot paginate a hasOne relationship "(profile)"')
            }
        })
    })

    describe('Model | HasOne | clone', () => {
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

            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            await db.table('users').insert({ username: 'virk' })

            const user = await User.find(1)
            const clonedQuery = user!.related('profile').query().clone()
            expect(clonedQuery).toBeInstanceOf(HasOneQueryBuilder)
        })
    })

    describe('Model | HasOne | scopes', () => {
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
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string

                public static twitter = scope((query) => {
                    query.where('type', 'twitter')
                })
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const [userId] = await db.table('users').insert({ username: 'virk' }).returning('id')
            await db.table('profiles').multiInsert([
                { user_id: userId, display_name: 'virk', type: 'github' }
            ])

            const user = await User.query().preload('profile', (query) => {
                query.apply((scopes) => scopes.twitter())
            }).firstOrFail()
            const userWithScopes = await User.query().preload('profile').firstOrFail()

            expect(user.profile).toBeUndefined()
            expect(userWithScopes.profile).toBeInstanceOf(Profile)
        })

        test('apply scopes on related query', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string

                public static twitter = scope((query) => {
                    query.where('type', 'twitter')
                })
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const [userId] = await db.table('users').insert({ username: 'virk' }).returning('id')
            await db.table('profiles').multiInsert([
                { user_id: userId, display_name: 'virk', type: 'github' }
            ])

            const user = await User.findOrFail(1)

            const profile = await user.related('profile').query().apply((scopes) => scopes.twitter()).first()
            const profileWithoutScopes = await user.related('profile').query().first()

            expect(profile).toBeNull()
            expect(profileWithoutScopes).toBeInstanceOf(Profile)
        })
    })

    describe('Model | HasOne | global scopes', () => {
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
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string

                public static boot(){
                    super.boot();

                    this.addGlobalScope(query => {
                        query.where('type', 'twitter')
                    });
                }
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            db.enableQueryLog();
            const user = await User.query().preload('profile').firstOrFail();
            const {sql} = db.getQueryLog()[1];
            const {sql: knenSql} = db.from('profiles').whereIn('user_id', [1]).where('type', 'twitter').toSQL();
            expect(sql).toEqual(knenSql);
        });

        it('apply scopes on related query', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string

                public static boot(){
                    super.boot();

                    this.addGlobalScope(query => {
                        query.where('type', 'twitter')
                    });
                }
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = await User.findOrFail(1)

            db.enableQueryLog();
            const profile = await user.related('profile').query().first()
            const {sql} = db.getQueryLog()[0];
            const {sql: knenSql} = db.from('profiles').where('type', 'twitter').where('user_id', 1).limit(1).toSQL();
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
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile, {
                    onQuery: (query) => query.where('type', 'twitter')
                })
                public profile: HasOne<typeof Profile>
            }

            const [userId] = await db.table('users').insert({ username: 'virk' }).returning('id')
            await db.table('profiles').multiInsert([
                { user_id: userId, display_name: 'virk', type: 'github' }
            ])

            const user = await User.query().preload('profile').firstOrFail()
            expect(user.profile).toBeUndefined()
        })

        test('do not invoke onQuery method on preloading subqueries', async () => {
            expect.assertions(2)

            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile, {
                    onQuery: (query) => {
                        expect(true).toBeTruthy()
                        query.where('type', 'twitter')
                    }
                })
                public profile: HasOne<typeof Profile>
            }

            const [userId] = await db.table('users').insert({ username: 'virk' }).returning('id')
            await db.table('profiles').multiInsert([
                { user_id: userId, display_name: 'virk', type: 'github' }
            ])

            const user = await User.query().preload('profile', (query) => query.where(() => {
            })).firstOrFail()
            expect(user.profile).toBeUndefined()
        })

        test('invoke onQuery method on related query builder', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile, {
                    onQuery: (query) => query.where('type', 'twitter')
                })
                public profile: HasOne<typeof Profile>
            }

            const [userId] = await db.table('users').insert({ username: 'virk' }).returning('id')
            await db.table('profiles').multiInsert([
                { user_id: userId, display_name: 'virk', type: 'github' }
            ])

            const user = await User.findOrFail(1)
            const profile = await user.related('profile').query().first()
            expect(profile).toBeNull()
        })

        test('do not invoke onQuery method on related query builder subqueries', async () => {
            class Profile extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userId: number

                @column()
                public displayName: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @hasOne(() => Profile, {
                    onQuery: (query) => query.where('type', 'twitter')
                })
                public profile: HasOne<typeof Profile>
            }

            const [userId] = await db.table('users').insert({ username: 'virk' }).returning('id')
            await db.table('profiles').multiInsert([
                { user_id: userId, display_name: 'virk', type: 'github' }
            ])

            const user = await User.findOrFail(1)
            const { sql, bindings } = user.related('profile').query().where((query) => {
                query.whereNotNull('created_at')
            }).toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .from('profiles')
                                                               .where('type', 'twitter')
                                                               .where((query) => query.whereNotNull('created_at'))
                                                               .where('user_id', 1)
                                                               .limit(1)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })

    describe('Model HasQuery', () => {
        let Profile;
        let User;

        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()

            class ProfileModel extends BaseModel {
                static table = 'profiles';

                @column({isPrimary: true})
                public id: number

                @column()
                public uid: number

                @column()
                public userId: number

                @column()
                public displayName: string

                @hasOne(() => ProfileModel, {foreignKey: 'id', localKey: 'uid'})
                public user: HasOne<typeof ProfileModel>

                // static boot() {
                //     this.addGlobalScope('name', query => {
                //         query.where(query.qualifyColumn('type'), 'twitter')
                //     });
                //     this.withoutGlobalScope('name');
                // }
            }

            class UserModel extends BaseModel {
                static table = 'users';

                @column({isPrimary: true})
                public id: number

                @column()
                public uid: number

                @column()
                public username: string

                @hasOne(() => ProfileModel, {localKey: 'uid'})
                public profile: HasOne<typeof ProfileModel>
            }

            User = UserModel;
            Profile = ProfileModel;
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        afterEach(async () => {
            await resetTables()
        })

        it('has query', async () => {
            const {sql, bindings} = User.query().where('id', 1).has('profile').toSQL();
            const {sql: knexSql} = db
                .from('users')
                .select('*')
                .where('id', 1)
                .whereExists(builder => {
                    builder
                        .from('profiles')
                        .whereRaw('users.uid = profiles.user_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('has nested query', async () => {
            const {sql, bindings} = User.query().where('id', 1).has('profile.user.user').toSQL();
            const {sql: knexSql} = db
                .from('users')
                .select('*')
                .where('id', 1)
                .whereExists(builder => {
                    builder
                        .from('profiles')
                        .whereRaw('users.uid = profiles.user_id')
                        .whereExists(builder => {
                            builder
                                .from('profiles as lucid_reserved_0')
                                .whereRaw('profiles.uid = lucid_reserved_0.id')
                                .whereExists(builder => {
                                    builder
                                        .from('profiles')
                                        .whereRaw('lucid_reserved_0.uid = profiles.id')
                                })
                        })
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('withcount query', async () => {
            const {sql, bindings} = User.query().where('id', 1).withCount('profile').toSQL();
            const q = db.from('profiles')
                .count('*')
                .whereRaw('users.uid = profiles.user_id')
            const {sql: knexSql} = db
                .from('users')
                .select('users.*')
                .where('id', 1)
                // @ts-ignore
                .select(db.raw('('+q.toSQL().sql+') as `profile_count`'))
                .toSQL();
            expect(sql).toBe(knexSql);
        });

        it('orHas query', async () => {
            const {sql, bindings} = User.query().where('id', 1).orHas('profile').toSQL();
            const {sql: knexSql} = db
                .from('users')
                .select('*')
                .where('id', 1)
                .orWhereExists(builder => {
                    builder
                        .from('profiles')
                        .whereRaw('users.uid = profiles.user_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('whereHas query', async () => {
            const {sql, bindings} = User.query().where('id', 1).whereHas('profile').toSQL();
            const {sql: knexSql} = db
                .from('users')
                .select('*')
                .where('id', 1)
                .whereExists(builder => {
                    builder
                        .from('profiles')
                        .whereRaw('users.uid = profiles.user_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('whereHas use callback query', async () => {
            const {sql, bindings} = User.query().where('id', 1).whereHas('profile', query => {
                query.where(query.qualifyColumn('id'), 1)
            }).toSQL();
            const {sql: knexSql} = db
                .from('users')
                .select('*')
                .where('id', 1)
                .whereExists(builder => {
                    builder
                        .from('profiles')
                        .whereRaw('users.uid = profiles.user_id')
                        .where('profiles.id', 1)
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orWhereHas query', async () => {
            const {sql, bindings} = User.query().where('id', 1).orWhereHas('profile').toSQL();
            const {sql: knexSql} = db
                .from('users')
                .select('*')
                .where('id', 1)
                .orWhereExists(builder => {
                    builder
                        .from('profiles')
                        .whereRaw('users.uid = profiles.user_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orWhereHas using callback query', async () => {
            const {sql, bindings} = User.query().where('id', 1).orWhereHas('profile', query => {
                query.where(query.qualifyColumn('id'), 1)
            }).toSQL();
            const {sql: knexSql} = db
                .from('users')
                .select('*')
                .where('id', 1)
                .orWhereExists(builder => {
                    builder
                        .from('profiles')
                        .whereRaw('users.uid = profiles.user_id')
                        .where('profiles.id', 1)
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('doesntHave query', async () => {
            const {sql, bindings} = User.query().where('id', 1).doesntHave('profile').toSQL();
            const {sql: knexSql} = db
                .from('users')
                .select('*')
                .where('id', 1)
                .whereNotExists(builder => {
                    builder
                        .from('profiles')
                        .whereRaw('users.uid = profiles.user_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orDoesntHave query', async () => {
            const {sql, bindings} = User.query().where('id', 1).orDoesntHave('profile').toSQL();
            const {sql: knexSql} = db
                .from('users')
                .select('*')
                .where('id', 1)
                .orWhereNotExists(builder => {
                    builder
                        .from('profiles')
                        .whereRaw('users.uid = profiles.user_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('whereDoesntHave query', async () => {
            const {sql, bindings} = User.query().where('id', 1).whereDoesntHave('profile').toSQL();
            const {sql: knexSql} = db
                .from('users')
                .select('*')
                .where('id', 1)
                .whereNotExists(builder => {
                    builder
                        .from('profiles')
                        .whereRaw('users.uid = profiles.user_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('whereDoesntHave using callback query', async () => {
            const {sql, bindings} = User.query().where('id', 1).whereDoesntHave('profile', query => {
                query.where(query.qualifyColumn('id'), 1)
            }).toSQL();
            const {sql: knexSql} = db
                .from('users')
                .select('*')
                .where('id', 1)
                .whereNotExists(builder => {
                    builder
                        .from('profiles')
                        .whereRaw('users.uid = profiles.user_id')
                        .where('profiles.id', 1)
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orWhereDoesntHave query', async () => {
            const {sql, bindings} = User.query().where('id', 1).orWhereDoesntHave('profile').toSQL();
            const {sql: knexSql} = db
                .from('users')
                .select('*')
                .where('id', 1)
                .orWhereNotExists(builder => {
                    builder
                        .from('profiles')
                        .whereRaw('users.uid = profiles.user_id')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('orWhereDoesntHave using callback query', async () => {
            const {sql, bindings} = User.query().where('id', 1).orWhereDoesntHave('profile', query => {
                query.where(query.qualifyColumn('id'), 1)
            }).toSQL();
            const {sql: knexSql} = db
                .from('users')
                .select('*')
                .where('id', 1)
                .orWhereNotExists(builder => {
                    builder
                        .from('profiles')
                        .whereRaw('users.uid = profiles.user_id')
                        .where('profiles.id', 1)
                })
                .toSQL();

            expect(sql).toBe(knexSql);
        });

        it('has query when have global scope', async () => {
            class Profile extends BaseModel {
                static table = 'profiles';

                @column({isPrimary: true})
                public id: number

                @column()
                public uid: number

                @column()
                public userId: number

                @column()
                public displayName: string

                @hasOne(() => Profile, {foreignKey: 'id', localKey: 'uid'})
                public user: HasOne<typeof Profile>

                static boot() {
                    this.addGlobalScope('name', query => {
                        query.where(query.qualifyColumn('type'), 'twitter')
                    });
                }
            }

            class User extends BaseModel {
                static table = 'users';

                @column({isPrimary: true})
                public id: number

                @column()
                public uid: number

                @column()
                public username: string

                @hasOne(() => Profile, {localKey: 'uid'})
                public profile: HasOne<typeof Profile>
            }

            const {sql, bindings} = User.query().has('profile').toSQL();
            const {sql: knexSql, bindings: knexBindings} = db
                .from('users')
                .select('*')
                .whereExists(builder => {
                    builder
                        .from('profiles')
                        .whereRaw('users.uid = profiles.user_id')
                        .where('profiles.type', 'twitter')
                })
                .toSQL();

            expect(sql).toBe(knexSql);
            expect(bindings).toEqual(knexBindings);
        });
    });
})
