/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 9:41 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { BelongsTo } from '../../src/Contracts/Orm/Relations/types';
import { scope } from '../../src/Helpers/scope';
import { belongsTo, column } from '../../src/Orm/Decorators';
import { BelongsToQueryBuilder } from '../../src/Orm/Relations/BelongsTo/QueryBuilder';
import { cleanup, getBaseModel, getDb, getProfiler, ormAdapter, resetTables, setup } from '../helpers';

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Model | BelongsTo | Options', () => {
    describe('Model | BelongsTo | Options', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })

        test('raise error when localKey is missing', () => {
            expect.assertions(1)

            try {
                class User extends BaseModel {
                }

                User.boot()

                class Profile extends BaseModel {
                    @belongsTo(() => User)
                    public user: BelongsTo<typeof User>
                }

                Profile.boot()
                Profile.$getRelation('user')!.boot()
            } catch ({ message }) {
                expect(
                    message).toBe(                    'E_MISSING_MODEL_ATTRIBUTE: "Profile.user" expects "id" to exist on "User" model, but is missing'
                )
            }
        })

        test('raise error when foreignKey is missing', () => {
            expect.assertions(1)

            try {
                class User extends BaseModel {
                    @column({ isPrimary: true })
                    public id: number
                }

                User.boot()

                class Profile extends BaseModel {
                    @belongsTo(() => User)
                    public user: BelongsTo<typeof User>
                }

                Profile.boot()
                Profile.$getRelation('user')!.boot()
            } catch ({ message }) {
                expect(
                    message).toBe(                    'E_MISSING_MODEL_ATTRIBUTE: "Profile.user" expects "userId" to exist on "Profile" model, but is missing'
                )
            }
        })

        test('use primary key is as the local key', () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            Profile.$getRelation('user')!.boot()

            expect(Profile.$getRelation('user')!['localKey']).toBe('id')
        })

        test('use custom defined local key', () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'user_uid' })
                public uid: number
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User, { localKey: 'uid' })
                public user: BelongsTo<typeof User>
            }

            Profile.$getRelation('user')!.boot()

            expect(Profile.$getRelation('user')!['localKey']).toBe('uid')
        })

        test('compute foreign key from model name and primary key', () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            Profile.$getRelation('user')!.boot()

            expect(Profile.$getRelation('user')!['foreignKey']).toBe('userId')
        })

        test('use pre defined foreign key', () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class Profile extends BaseModel {
                @column({ columnName: 'user_id' })
                public userUid: number

                @belongsTo(() => User, { foreignKey: 'userUid' })
                public user: BelongsTo<typeof User>
            }

            Profile.$getRelation('user')!.boot()

            expect(Profile.$getRelation('user')!['foreignKey']).toBe('userUid')
        })
    })

    describe('Model | BelongsTo | Set Relations', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })

        test('set related model instance', () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            Profile.$getRelation('user')!.boot()

            const user = new User()
            user.fill({ id: 1 })

            const profile = new Profile()
            profile.fill({ userId: 1 })

            Profile.$getRelation('user')!.setRelated(profile, user)
            expect(profile.user).toEqual(user)
        })

        test('push related model instance', () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            Profile.$getRelation('user')!.boot()

            const profile = new Profile()

            const user = new User()

            const user1 = new User()

            profile.fill({ userId: 1 })
            user.fill({ id: 1 })
            Profile.$getRelation('user')!.setRelated(profile, user)

            profile.fill({ userId: 2 })
            user1.fill({ id: 2 })
            Profile.$getRelation('user')!.pushRelated(profile, user1)

            expect(profile.user).toEqual(user1)
        })

        test('set many of related instances', () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            Profile.$getRelation('user')!.boot()

            const profile = new Profile()
            profile.fill({ userId: 1 })

            const profile1 = new Profile()
            profile1.fill({ userId: 2 })

            const profile2 = new Profile()

            const user = new User()
            user.fill({ id: 1 })

            const user1 = new User()
            user1.fill({ id: 2 })

            Profile.$getRelation('user')!.setRelatedForMany([profile, profile1, profile2], [user, user1])

            expect(profile.user).toEqual(user)
            expect(profile1.user).toEqual(user1)
            expect(profile2.user).toBeUndefined()
        })
    })

    describe('Model | BelongsTo | bulk operations', () => {
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
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            await db.table('profiles').insert({ user_id: 4, display_name: 'Hvirk' })

            const profile = await Profile.find(1)
            const { sql, bindings } = profile!.related('user').query().toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('users')
                                                               .where('id', 4)
                                                               .limit(1)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for selecting many related rows', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            await db.table('profiles').multiInsert([
                { display_name: 'virk', user_id: 2 },
                { display_name: 'nikk', user_id: 3 }
            ])

            const profiles = await Profile.all()
            Profile.$getRelation('user')!.boot()

            const query = Profile.$getRelation('user')!.eagerQuery(profiles, db.connection())
            const { sql, bindings } = query.toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('users')
                                                               .whereIn('id', [3, 2])
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for updating related row', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            await db.table('profiles').insert({ user_id: 2, display_name: 'virk' })

            const profile = await Profile.find(1)
            const { sql, bindings } = profile!.related('user').query().update({
                display_name: 'nikk'
            }).toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('users')
                                                               .where('id', 2)
                                                               .update({ display_name: 'nikk' })
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for deleting related row', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            await db.table('profiles').insert({ user_id: 2, display_name: 'virk' })

            const profile = await Profile.find(1)
            const { sql, bindings } = profile!.related('user').query().del().toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('users')
                                                               .where('id', 2)
                                                               .del()
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })

    describe('Model | BelongsTo | preload', () => {
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
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ display_name: 'Hvirk', user_id: 1 })

            Profile.boot()

            const profiles = await Profile.query().preload('user')
            expect(profiles).toHaveLength(1)

            expect(profiles[0].user.id).toBe(profiles[0].userId)
        })

        test('preload relationship for many rows', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: 1,
                    display_name: 'Hvirk'
                },
                {
                    user_id: 1,
                    display_name: 'Nikk'
                }
            ])

            Profile.boot()
            const profiles = await Profile.query().preload('user')

            expect(profiles).toHaveLength(2)
            expect(profiles[0].user.id).toBe(profiles[0].userId)
            expect(profiles[1].user.id).toBe(profiles[1].userId)
        })

        test('add runtime constraints to related query', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: 1,
                    display_name: 'Hvirk'
                },
                {
                    user_id: 1,
                    display_name: 'Nikk'
                }
            ])

            Profile.boot()
            const profiles = await Profile.query().preload('user', (builder) => builder.where('username', 'foo'))

            expect(profiles).toHaveLength(2)
            expect(profiles[0].user).toBeUndefined()
            expect(profiles[1].user).toBeUndefined()
        })

        test('cherry pick columns during preload', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: 1,
                    display_name: 'Hvirk'
                },
                {
                    user_id: 1,
                    display_name: 'Nikk'
                }
            ])

            Profile.boot()

            const profiles = await Profile.query().preload('user', (builder) => {
                return builder.select('username')
            })

            expect(profiles).toHaveLength(2)
            expect(profiles[0].user.$extras).toEqual({})
            expect(profiles[1].user.$extras).toEqual({})
        })

        test('do not repeat fk when already defined', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: 1,
                    display_name: 'Hvirk'
                },
                {
                    user_id: 1,
                    display_name: 'Nikk'
                }
            ])

            Profile.boot()

            const profiles = await Profile.query().preload('user', (builder) => {
                return builder.select('username', 'id')
            })

            expect(profiles).toHaveLength(2)
            expect(profiles[0].user.$extras).toEqual({})
            expect(profiles[1].user.$extras).toEqual({})
        })

        test('raise exception when local key is not selected', async () => {
            expect.assertions(1)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: 1,
                    display_name: 'Hvirk'
                },
                {
                    user_id: 1,
                    display_name: 'Nikk'
                }
            ])

            Profile.boot()

            try {
                await Profile.query().select('display_name').preload('user')
            } catch ({ message }) {
                expect(
                    message).toBe(                    [
                        'Cannot preload "user", value of "Profile.userId" is undefined.',
                        'Make sure to set "null" as the default value for foreign keys'
                    ].join(' ')
                )
            }
        })

        test('preload using model instance', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

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

            await db.insertQuery().table('users').insert([{ username: 'virk' }])

            const users = await db.query().from('users')
            await db.insertQuery().table('profiles').insert([
                {
                    user_id: users[0].id,
                    display_name: 'virk'
                },
                {
                    user_id: users[0].id,
                    display_name: 'virk'
                }
            ])

            const profile = await Profile.findOrFail(1)
            await profile.preload('user')

            expect(profile.user).toBeInstanceOf(User)
            expect(profile.user.id).toBe(profile.userId)
        })

        test('preload nested relations', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

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

            class Identity extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public profileId: number

                @column()
                public identityName: string

                @belongsTo(() => Profile)
                public profile: BelongsTo<typeof Profile>
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

            const identity = await Identity.query()
                                           .preload('profile', (builder) => builder.preload('user'))
                                           .where('identity_name', 'virk')
                                           .first()

            expect(identity!.profile).toBeInstanceOf(Profile)
            expect(identity!.profile!.user).toBeInstanceOf(User)
        })

        test('preload nested relations using model instance', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

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

            class Identity extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public profileId: number

                @column()
                public identityName: string

                @belongsTo(() => Profile)
                public profile: BelongsTo<typeof Profile>
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

            const identity = await Identity.query().firstOrFail()
            await identity.preload((preloader) => {
                preloader.preload('profile', (builder) => builder.preload('user'))
            })

            expect(identity!.profile).toBeInstanceOf(Profile)
            expect(identity!.profile!.user).toBeInstanceOf(User)
        })

        test('pass main query options down the chain', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

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

            class Identity extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public profileId: number

                @column()
                public identityName: string

                @belongsTo(() => Profile)
                public profile: BelongsTo<typeof Profile>
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

            const query = Identity.query({ connection: 'secondary' })
                                  .preload('profile', (builder) => builder.preload('user'))
                                  .where('identity_name', 'virk')

            const identity = await query.first()
            expect(identity!.profile).toBeInstanceOf(Profile)
            expect(identity!.profile!.user).toBeInstanceOf(User)

            expect(identity!.$options!.connection).toBe('secondary')
            expect(identity!.profile.$options!.connection).toBe('secondary')
            expect(identity!.profile.user.$options!.connection).toBe('secondary')
        })

        test('pass relationship metadata to the profiler', async () => {
            expect.assertions(1)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            const profiler = getProfiler(true)

            let profilerPacketIndex = 0
            profiler.process((packet) => {
                if ( profilerPacketIndex === 1 ) {
                    expect(packet.data.relation).toEqual({
                        model: 'Profile',
                        relatedModel: 'User',
                        type: 'belongsTo'
                    })
                }
                profilerPacketIndex++
            })

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ display_name: 'Hvirk', user_id: 1 })
            await Profile.query({ profiler }).preload('user')
        })

        test('work fine when foreign key is null', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            await db.insertQuery().table('profiles').insert({ display_name: 'Hvirk', user_id: null })

            Profile.boot()

            const profiles = await Profile.query().preload('user')
            expect(profiles).toHaveLength(1)

            expect(profiles[0].user).toBeUndefined()
        })

        test('do not run preload query when parent rows are empty', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            Profile.boot()

            const profiles = await Profile.query().preload('user', () => {
                throw new Error('not expected to be here')
            })
            expect(profiles).toHaveLength(0)
        })
    })

    describe('Model | BelongsTo | associate', () => {
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

        test('associate related instance', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @column()
                public displayName: string

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            const user = new User()
            user.username = 'virk'

            const profile = new Profile()
            profile.displayName = 'Hvirk'

            await profile.related('user').associate(user)

            expect(profile.$isPersisted).toBeTruthy()
            expect(user.id).toBe(profile.userId)

            const profiles = await db.query().from('profiles')
            expect(profiles).toHaveLength(1)
            expect(profiles[0].user_id).toBe(user.id)
        })

        test('wrap associate call inside transaction', async () => {
            expect.assertions(3)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @column()
                public displayName: string

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            const user = new User()
            user.username = 'virk'

            const profile = new Profile()

            try {
                await profile.related('user').associate(user)
            } catch (error) {
                expect(error).toBeDefined()
            }

            const profiles = await db.query().from('profiles')
            const users = await db.query().from('users')
            expect(profiles).toHaveLength(0)
            expect(users).toHaveLength(0)
        })
    })

    describe('Model | BelongsTo | dissociate', () => {
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

        test('dissociate relation', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @column()
                public displayName: string

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            const [user] = await db.insertQuery().table('users').insert({ username: 'virk' }).returning('id')
            await db.insertQuery().table('profiles').insert({ display_name: 'Hvirk', user_id: user.id })

            const profile = await Profile.query().first()
            await profile!.related('user').dissociate()

            expect(profile!.$isPersisted).toBeTruthy()
            expect(profile!.userId).toBeNull()

            const profiles = await db.query().from('profiles')
            expect(profiles).toHaveLength(1)
            expect(profiles[0].user_id).toBeNull()
        })
    })

    describe('Model | BelongsTo | bulk operations', () => {
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

        test('disallow pagination', async () => {
            expect.assertions(1)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class Profile extends BaseModel {
                @column()
                public userId: number

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            await db.table('profiles').insert({ user_id: 4, display_name: 'Hvirk' })

            const profile = await Profile.find(1)
            try {
                await profile!.related('user').query().paginate(1)
            } catch ({ message }) {
                expect(message).toBe('Cannot paginate a belongsTo relationship "(user)"')
            }
        })
    })

    describe('Model | BelongsTo | clone', () => {
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
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            User.boot()

            class Profile extends BaseModel {
                @column()
                public userId: number

                @column()
                public displayName: string

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            Profile.boot()

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ display_name: 'Hvirk', user_id: 1 })

            const profile = await Profile.findOrFail(1)

            const clonedQuery = profile.related('user').query().clone()
            expect(clonedQuery).toBeInstanceOf(BelongsToQueryBuilder)
        })
    })

    describe('Model | BelongsTo | scopes', () => {
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
                public username: string

                public static fromCountry = scope((query, countryId) => {
                    query.where('country_id', countryId)
                })
            }

            User.boot()

            class Profile extends BaseModel {
                @column()
                public userId: number

                @column()
                public displayName: string

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            Profile.boot()

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ display_name: 'Hvirk', user_id: 1 })

            const profile = await Profile.query().preload('user', (builder) => {
                builder.apply((scopes) => scopes.fromCountry(1))
            }).first()

            const profileWithoutScope = await Profile.query().preload('user').first()
            expect(profile?.user).toBeUndefined()
            expect(profileWithoutScope?.user).toBeInstanceOf(User)
        })

        test('apply scopes on related query', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                public static fromCountry = scope((query, countryId) => {
                    query.where('country_id', countryId)
                })
            }

            User.boot()

            class Profile extends BaseModel {
                @column()
                public userId: number

                @column()
                public displayName: string

                @belongsTo(() => User)
                public user: BelongsTo<typeof User>
            }

            Profile.boot()

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ display_name: 'Hvirk', user_id: 1 })

            const profile = await Profile.query().firstOrFail()
            const profileUser = await profile.related('user').query().apply((scopes) => {
                scopes.fromCountry(1)
            }).first()
            const profileUserWithoutScopes = await profile.related('user').query().first()

            expect(profileUser).toBeNull()
            expect(profileUserWithoutScopes).toBeInstanceOf(User)
        })
    })

    describe('Model | BelongsTo | onQuery', () => {
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
                public username: string
            }

            User.boot()

            class Profile extends BaseModel {
                @column()
                public userId: number

                @column()
                public displayName: string

                @belongsTo(() => User, {
                    onQuery: (builder) => {
                        builder.where('country_id', 1)
                    }
                })
                public user: BelongsTo<typeof User>
            }

            Profile.boot()

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ display_name: 'Hvirk', user_id: 1 })

            const profile = await Profile.query().preload('user').first()
            expect(profile?.user).toBeUndefined()
        })

        test('do not run onQuery hook on subqueries', async () => {
            expect.assertions(2)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            User.boot()

            class Profile extends BaseModel {
                @column()
                public userId: number

                @column()
                public displayName: string

                @belongsTo(() => User, {
                    onQuery: (builder) => {
                        expect(true).toBeTruthy()
                        builder.where('country_id', 1)
                    }
                })
                public user: BelongsTo<typeof User>
            }

            Profile.boot()

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ display_name: 'Hvirk', user_id: 1 })

            const profile = await Profile.query().preload('user', (query) => {
                query.where((_) => {
                })
            }).first()

            expect(profile?.user).toBeUndefined()
        })

        test('invoke onQuery method on related query builder', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            User.boot()

            class Profile extends BaseModel {
                @column()
                public userId: number

                @column()
                public displayName: string

                @belongsTo(() => User, {
                    onQuery: (builder) => {
                        builder.where('country_id', 1)
                    }
                })
                public user: BelongsTo<typeof User>
            }

            Profile.boot()

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ display_name: 'Hvirk', user_id: 1 })
            const profile = await Profile.findOrFail(1)
            const user = await profile.related('user').query().first()
            expect(user).toBeNull()
        })

        test('do not run onQuery hook on related query builder subqueries', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            User.boot()

            class Profile extends BaseModel {
                @column()
                public userId: number

                @column()
                public displayName: string

                @belongsTo(() => User, {
                    onQuery: (builder) => {
                        builder.where('country_id', 1)
                    }
                })
                public user: BelongsTo<typeof User>
            }

            Profile.boot()

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await db.insertQuery().table('profiles').insert({ display_name: 'Hvirk', user_id: 1 })
            const profile = await Profile.findOrFail(1)

            const { sql, bindings } = profile.related('user').query().where((builder) => {
                builder.where('score', '>', 0)
            }).toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .from('users')
                                                               .where('country_id', 1)
                                                               .where((query) => query.where('score', '>', 0))
                                                               .where('id', 1)
                                                               .limit(1)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })
})
