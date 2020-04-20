/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 9:48 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ManyToMany } from '../../src/Contracts/Orm/Relations/types';
import { scope } from '../../src/Helpers/scope';
import { column, manyToMany } from '../../src/Orm/Decorators';
import { ManyToManyQueryBuilder } from '../../src/Orm/Relations/ManyToMany/QueryBuilder';
import { cleanup, getBaseModel, getDb, getProfiler, ormAdapter, resetTables, setup } from '../helpers';

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Model | ManyToMany', () => {

    describe('Model | ManyToMany | Options', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })

        test('raise error when localKey is missing', () => {
            expect.assertions(1)

            try {
                class Skill extends BaseModel {
                }

                class User extends BaseModel {
                    @manyToMany(() => Skill)
                    public skills: ManyToMany<typeof Skill>
                }

                User.boot()
                User.$getRelation('skills')!.boot()
            } catch ({ message }) {
                expect(
                    message).toBe(                    'E_MISSING_MODEL_ATTRIBUTE: "User.skills" expects "id" to exist on "User" model, but is missing',
                )
            }
        })

        test('use primary key as the local key', () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.$getRelation('skills')!.boot()

            expect(User.$getRelation('skills')!['localKey']).toBe('id')
            expect(User.$getRelation('skills')!['localKeyColumnName']).toBe('id')
        })

        test('use custom defined local key', () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public uid: number

                @manyToMany(() => Skill, { localKey: 'uid' })
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            User.$getRelation('skills')!.boot()

            expect(User.$getRelation('skills')!['localKey']).toBe('uid')
            expect(User.$getRelation('skills')!['localKeyColumnName']).toBe('uid')
        })

        test('raise error when relatedKey is missing', () => {
            expect.assertions(1)

            try {
                class Skill extends BaseModel {
                }
                Skill.boot()

                class User extends BaseModel {
                    @column({ isPrimary: true })
                    public id: number

                    @manyToMany(() => Skill)
                    public skills: ManyToMany<typeof Skill>
                }

                User.boot()
                User.$getRelation('skills')!.boot()
            } catch ({ message }) {
                expect(
                    message).toBe(                    'E_MISSING_MODEL_ATTRIBUTE: "User.skills" expects "id" to exist on "Skill" model, but is missing',
                )
            }
        })

        test('use related model primary key as the related key', () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.$getRelation('skills')!.boot()

            expect(User.$getRelation('skills')!['relatedKey']).toBe('id')
            expect(User.$getRelation('skills')!['relatedKeyColumnName']).toBe('id')
        })

        test('use custom defined related key', () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public uid: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill, { relatedKey: 'uid' })
                public skills: ManyToMany<typeof Skill>
            }

            User.$getRelation('skills')!.boot()

            expect(User.$getRelation('skills')!['relatedKey']).toBe('uid')
            expect(User.$getRelation('skills')!['relatedKeyColumnName']).toBe('uid')
        })

        test('compute pivotForeignKey from table name + primary key', () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.$getRelation('skills')!.boot()

            expect(User.$getRelation('skills')!['pivotForeignKey']).toBe('user_id')
        })

        test('use custom defined pivotForeignKey', () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill, { pivotForeignKey: 'user_uid' })
                public skills: ManyToMany<typeof Skill>
            }

            User.$getRelation('skills')!.boot()

            expect(User.$getRelation('skills')!['pivotForeignKey']).toBe('user_uid')
        })

        test('compute relatedPivotForeignKey from related model name + primary key', () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            User.$getRelation('skills')!.boot()

            expect(User.$getRelation('skills')!['pivotRelatedForeignKey']).toBe('skill_id')
        })

        test('use custom defined relatedPivotForeignKey', () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill, { pivotRelatedForeignKey: 'skill_uid' })
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            User.$getRelation('skills')!.boot()

            expect(User.$getRelation('skills')!['pivotRelatedForeignKey']).toBe('skill_uid')
        })
    })

    describe('Model | ManyToMany | Set Relations', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })

        test('set related model instance', () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.$getRelation('skills')!.boot()

            const user = new User()
            const skill = new Skill()
            User.$getRelation('skills')!.setRelated(user, [skill])
            expect(user.skills).toEqual([skill])
        })

        test('push related model instance', () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.$getRelation('skills')!.boot()

            const user = new User()
            const skill = new Skill()
            const skill1 = new Skill()

            User.$getRelation('skills')!.setRelated(user, [skill])
            User.$getRelation('skills')!.pushRelated(user, [skill1])
            expect(user.skills).toEqual([skill, skill1])
        })

        test('set many of related instances', () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => User)
                public users: ManyToMany<typeof User>
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.$getRelation('skills')!.boot()
            Skill.$getRelation('users')!.boot()

            const user = new User()
            user.fill({ id: 1 })

            const user1 = new User()
            user1.fill({ id: 2 })

            const user2 = new User()
            user2.fill({ id: 3 })

            const skill = new Skill()
            skill.$extras = {
                pivot_user_id: 1,
            }

            const skill1 = new Skill()
            skill1.$extras = {
                pivot_user_id: 2,
            }

            const skill2 = new Skill()
            skill2.$extras = {
                pivot_user_id: 1,
            }

            User.$getRelation('skills')!.setRelatedForMany([user, user1, user2], [skill, skill1, skill2])
            expect(user.skills).toEqual([skill, skill2])
            expect(user1.skills).toEqual([skill1])
            expect(user2.skills).toEqual([] as any)
        })
    })

    describe('Model | ManyToMany | bulk operations', () => {
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').insert({ username: 'virk' })

            const user = await User.find(1)
            const { sql, bindings } = user!.related('skills').query().toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('skills')
                                                               .select('skills.*', 'skill_user.user_id as pivot_user_id', 'skill_user.skill_id as pivot_skill_id')
                                                               .innerJoin('skill_user', 'skills.id', 'skill_user.skill_id')
                                                               .where('skill_user.user_id', 1)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for selecting related for many rows', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').multiInsert([
                { username: 'virk' },
                { username: 'nikk' },
            ])

            const users = await User.all()
            User.$getRelation('skills')!.boot()

            const related = User.$getRelation('skills')!.eagerQuery(users, db.connection())
            const { sql, bindings } = related.toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('skills')
                                                               .select('skills.*', 'skill_user.user_id as pivot_user_id', 'skill_user.skill_id as pivot_skill_id')
                                                               .innerJoin('skill_user', 'skills.id', 'skill_user.skill_id')
                                                               .whereIn('skill_user.user_id', [2, 1])
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('select extra columns', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill, {
                    pivotColumns: ['score'],
                })
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').insert({ username: 'virk' })

            const user = await User.find(1)
            const { sql, bindings } = user!.related('skills').query().toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('skills')
                                                               .select(
                                                                   'skills.*',
                                                                   'skill_user.user_id as pivot_user_id',
                                                                   'skill_user.skill_id as pivot_skill_id',
                                                                   'skill_user.score as pivot_score',
                                                               )
                                                               .innerJoin('skill_user', 'skills.id', 'skill_user.skill_id')
                                                               .where('skill_user.user_id', 1)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('select extra columns at runtime', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').insert({ username: 'virk' })

            const user = await User.find(1)
            const { sql, bindings } = user!.related('skills').query().pivotColumns(['score']).toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('skills')
                                                               .select(
                                                                   'skill_user.score as pivot_score',
                                                                   'skills.*',
                                                                   'skill_user.user_id as pivot_user_id',
                                                                   'skill_user.skill_id as pivot_skill_id',
                                                               )
                                                               .innerJoin('skill_user', 'skills.id', 'skill_user.skill_id')
                                                               .where('skill_user.user_id', 1)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for updating rows', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').insert({ username: 'virk' })

            const user = await User.find(1)

            const now = new Date()
            const { sql, bindings } = user!.related('skills').query().update({ updated_at: now }).toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('skill_user')
                                                               .where('skill_user.user_id', 1)
                                                               .update({ updated_at: now })
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('generate correct sql for deleting rows', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').insert({ username: 'virk' })

            const user = await User.find(1)

            const { sql, bindings } = user!.related('skills').query().del().toSQL()
            const { sql: knexSql, bindings: knexBindings } = db.connection()
                                                               .getWriteClient()
                                                               .from('skill_user')
                                                               .where('skill_user.user_id', 1)
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').insert({ username: 'virk' })
            await db.table('skills').multiInsert([
                { name: 'Programming' },
                { name: 'Cooking' },
                { name: 'Dancing' },
            ])
            await db.table('skill_user').multiInsert([
                { user_id: 1, skill_id: 1 },
                { user_id: 1, skill_id: 2 },
                { user_id: 2, skill_id: 2 },
            ])

            const user = await User.find(1)
            const total = await user!.related('skills')
                                     .query()
                                     .count('* as total')

            expect(Number(total[0].total)).toEqual(2)
        })

        test('select extra columns with count', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').insert({ username: 'virk' })
            await db.table('skills').multiInsert([
                { name: 'Programming' },
                { name: 'Cooking' },
                { name: 'Dancing' },
            ])
            await db.table('skill_user').multiInsert([
                { user_id: 1, skill_id: 1 },
                { user_id: 1, skill_id: 2 },
                { user_id: 2, skill_id: 2 },
            ])

            const user = await User.find(1)
            const total = await user!.related('skills')
                                     .query()
                                     .select('name')
                                     .groupBy('skills.name')
                                     .count('* as total')

            expect(total).toHaveLength(2)
            expect(total[0].name).toBe('Cooking')
            expect(Number(total[0].total)).toBe(1)

            expect(total[1].name).toBe('Programming')
            expect(Number(total[1].total)).toBe(1)
        })

        test('select extra pivot columns with count', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').insert({ username: 'virk' })
            await db.table('skills').multiInsert([
                { name: 'Programming' },
                { name: 'Cooking' },
                { name: 'Dancing' },
            ])
            await db.table('skill_user').multiInsert([
                { user_id: 1, skill_id: 1, proficiency: 'Beginner' },
                { user_id: 1, skill_id: 2, proficiency: 'Advanced' },
                { user_id: 2, skill_id: 2, proficiency: 'Beginner' },
            ])

            const user = await User.find(1)
            const total = await user!.related('skills')
                                     .query()
                                     .pivotColumns(['proficiency'])
                                     .groupBy('skill_user.proficiency')
                                     .count('* as total')

            expect(total).toHaveLength(2)
            expect(total[0].pivot_proficiency).toBe('Advanced')
            expect(Number(total[0].total)).toBe(1)

            expect(total[1].pivot_proficiency).toBe('Beginner')
            expect(Number(total[1].total)).toBe(1)
        })
    })

    describe('Model | ManyToMany | preload', () => {
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            await db.insertQuery().table('users').insert([{ username: 'virk' }])
            await db.insertQuery().table('skills').insert([{ name: 'Programming' }, { name: 'Dancing' }])
            await db.insertQuery().table('skill_user').insert([
                {
                    user_id: 1,
                    skill_id: 1,
                },
            ])

            const users = await User.query().preload('skills')
            expect(users).toHaveLength(1)
            expect(users[0].skills).toHaveLength(1)
            expect(users[0].skills[0].name).toBe('Programming')
            expect(users[0].skills[0].$extras.pivot_user_id).toBe(1)
            expect(users[0].skills[0].$extras.pivot_skill_id).toBe(1)
        })

        test('preload relation for many', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('skills').insert([{ name: 'Programming' }, { name: 'Dancing' }])
            await db.insertQuery().table('skill_user').insert([
                {
                    user_id: 1,
                    skill_id: 1,
                },
                {
                    user_id: 1,
                    skill_id: 2,
                },
                {
                    user_id: 2,
                    skill_id: 2,
                },
            ])

            const users = await User.query().preload('skills')
            expect(users).toHaveLength(2)
            expect(users[0].skills).toHaveLength(2)
            expect(users[1].skills).toHaveLength(1)

            expect(users[0].skills[0].name).toBe('Programming')
            expect(users[0].skills[0].$extras.pivot_user_id).toBe(1)
            expect(users[0].skills[0].$extras.pivot_skill_id).toBe(1)

            expect(users[0].skills[1].name).toBe('Dancing')
            expect(users[0].skills[1].$extras.pivot_user_id).toBe(1)
            expect(users[0].skills[1].$extras.pivot_skill_id).toBe(2)

            expect(users[1].skills[0].name).toBe('Dancing')
            expect(users[1].skills[0].$extras.pivot_user_id).toBe(2)
            expect(users[1].skills[0].$extras.pivot_skill_id).toBe(2)
        })

        test('preload relation using model instance', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('skills').insert([{ name: 'Programming' }, { name: 'Dancing' }])
            await db.insertQuery().table('skill_user').insert([
                {
                    user_id: 1,
                    skill_id: 1,
                },
                {
                    user_id: 1,
                    skill_id: 2,
                },
                {
                    user_id: 2,
                    skill_id: 2,
                },
            ])

            const users = await User.query().orderBy('id', 'asc')
            expect(users).toHaveLength(2)

            await users[0].preload('skills')
            await users[1].preload('skills')

            expect(users[0].skills).toHaveLength(2)
            expect(users[1].skills).toHaveLength(1)

            expect(users[0].skills[0].name).toBe('Programming')
            expect(users[0].skills[0].$extras.pivot_user_id).toBe(1)
            expect(users[0].skills[0].$extras.pivot_skill_id).toBe(1)

            expect(users[0].skills[1].name).toBe('Dancing')
            expect(users[0].skills[1].$extras.pivot_user_id).toBe(1)
            expect(users[0].skills[1].$extras.pivot_skill_id).toBe(2)

            expect(users[1].skills[0].name).toBe('Dancing')
            expect(users[1].skills[0].$extras.pivot_user_id).toBe(2)
            expect(users[1].skills[0].$extras.pivot_skill_id).toBe(2)
        })

        test('select extra pivot columns', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string

                @column()
                public proficiency: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill, { pivotColumns: ['proficiency'] })
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('skills').insert([{ name: 'Programming' }, { name: 'Dancing' }])
            await db.insertQuery().table('skill_user').insert([
                {
                    user_id: 1,
                    skill_id: 1,
                    proficiency: 'expert',
                },
                {
                    user_id: 1,
                    skill_id: 2,
                    proficiency: 'beginner',
                },
                {
                    user_id: 2,
                    skill_id: 2,
                    proficiency: 'beginner',
                },
            ])

            const users = await User.query().preload('skills')
            expect(users).toHaveLength(2)
            expect(users[0].skills).toHaveLength(2)
            expect(users[1].skills).toHaveLength(1)

            expect(users[0].skills[0].name).toBe('Programming')
            expect(users[0].skills[0].$extras.pivot_user_id).toBe(1)
            expect(users[0].skills[0].$extras.pivot_skill_id).toBe(1)
            expect(users[0].skills[0].$extras.pivot_proficiency).toBe('expert')

            expect(users[0].skills[1].name).toBe('Dancing')
            expect(users[0].skills[1].$extras.pivot_user_id).toBe(1)
            expect(users[0].skills[1].$extras.pivot_skill_id).toBe(2)
            expect(users[0].skills[1].$extras.pivot_proficiency).toBe('beginner')

            expect(users[1].skills[0].name).toBe('Dancing')
            expect(users[1].skills[0].$extras.pivot_user_id).toBe(2)
            expect(users[1].skills[0].$extras.pivot_skill_id).toBe(2)
            expect(users[1].skills[0].$extras.pivot_proficiency).toBe('beginner')
        })

        test('select extra pivot columns at runtime', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string

                @column()
                public proficiency: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('skills').insert([{ name: 'Programming' }, { name: 'Dancing' }])
            await db.insertQuery().table('skill_user').insert([
                {
                    user_id: 1,
                    skill_id: 1,
                    proficiency: 'expert',
                },
                {
                    user_id: 1,
                    skill_id: 2,
                    proficiency: 'beginner',
                },
                {
                    user_id: 2,
                    skill_id: 2,
                    proficiency: 'beginner',
                },
            ])

            const users = await User.query().preload('skills', (builder) => {
                builder.pivotColumns(['proficiency'])
            })

            expect(users).toHaveLength(2)
            expect(users[0].skills).toHaveLength(2)
            expect(users[1].skills).toHaveLength(1)

            expect(users[0].skills[0].name).toBe('Programming')
            expect(users[0].skills[0].$extras.pivot_user_id).toBe(1)
            expect(users[0].skills[0].$extras.pivot_skill_id).toBe(1)
            expect(users[0].skills[0].$extras.pivot_proficiency).toBe('expert')

            expect(users[0].skills[1].name).toBe('Dancing')
            expect(users[0].skills[1].$extras.pivot_user_id).toBe(1)
            expect(users[0].skills[1].$extras.pivot_skill_id).toBe(2)
            expect(users[0].skills[1].$extras.pivot_proficiency).toBe('beginner')

            expect(users[1].skills[0].name).toBe('Dancing')
            expect(users[1].skills[0].$extras.pivot_user_id).toBe(2)
            expect(users[1].skills[0].$extras.pivot_skill_id).toBe(2)
            expect(users[1].skills[0].$extras.pivot_proficiency).toBe('beginner')
        })

        test('cherry pick columns during preload', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            await db.insertQuery().table('users').insert([{ username: 'virk' }])
            await db.insertQuery().table('skills').insert([{ name: 'Programming' }, { name: 'Dancing' }])
            await db.insertQuery().table('skill_user').insert([
                {
                    user_id: 1,
                    skill_id: 1,
                },
            ])

            const users = await User.query().preload('skills', (builder) => {
                return builder.select('name')
            })

            expect(users).toHaveLength(1)
            expect(users[0].skills).toHaveLength(1)
            expect(users[0].skills[0].name).toBe('Programming')
            expect(users[0].skills[0].$extras).toEqual({ pivot_user_id: 1, pivot_skill_id: 1 })
        })

        test('raise error when local key is not selected', async () => {
            expect.assertions(1)

            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()

            await db.insertQuery().table('users').insert([{ username: 'virk' }, { username: 'nikk' }])
            await db.insertQuery().table('skills').insert([{ name: 'Programming' }, { name: 'Dancing' }])
            await db.insertQuery().table('skill_user').insert([
                {
                    user_id: 1,
                    skill_id: 1,
                },
                {
                    user_id: 1,
                    skill_id: 2,
                },
                {
                    user_id: 2,
                    skill_id: 2,
                },
            ])

            try {
                await User.query().select('username').preload('skills')
            } catch ({ message }) {
                expect(message).toBe('Cannot preload "skills", value of "User.id" is undefined')
            }
        })

        test('do not run preload query when parent rows are empty', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()

            const users = await User.query().preload('skills', () => {
                throw new Error('not expected to be here')
            })
            expect(users).toHaveLength(0)
        })
    })

    describe('Model | ManyToMany | wherePivot', () => {
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .wherePivot('username', 'virk')
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .where('skill_user.username', 'virk')
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add where wrapped clause', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .where((builder) => builder.wherePivot('username', 'virk'))
                ['toSQL']()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .where((builder) => builder.where('skill_user.username', 'virk'))
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add where clause with operator', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .wherePivot('age', '>', 22)
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .where('skill_user.age', '>', 22)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add where clause as a raw query', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .wherePivot('age', '>', db.rawQuery('select min_age from ages limit 1;'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .where(
                                                                   'skill_user.age',
                                                                   '>',
                                                                   db.connection().getWriteClient().raw('select min_age from ages limit 1;'),
                                                               )
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add orWhere clause', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .wherePivot('age', '>', 22)
                .orWherePivot('age', 18)
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .where('skill_user.age', '>', 22)
                                                               .orWhere('skill_user.age', 18)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add orWhere wrapped clause', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .wherePivot('age', '>', 22)
                .orWhere((builder) => {
                    builder.wherePivot('age', 18)
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .where('skill_user.age', '>', 22)
                                                               .orWhere((builder) => {
                                                                   builder.where('skill_user.age', 18)
                                                               })
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('pass relationship metadata to the profiler', async () => {
            expect.assertions(1)

            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            await db.insertQuery().table('users').insert([{ username: 'virk' }])
            await db.insertQuery().table('skills').insert([{ name: 'Programming' }, { name: 'Dancing' }])
            await db.insertQuery().table('skill_user').insert([
                {
                    user_id: 1,
                    skill_id: 1,
                },
            ])

            const profiler = getProfiler(true)

            let profilerPacketIndex = 0
            profiler.process((packet) => {
                if (profilerPacketIndex === 1) {
                    expect(packet.data.relation).toEqual({
                        model: 'User',
                        relatedModel: 'Skill',
                        pivotTable: 'skill_user',
                        type: 'manyToMany',
                    })
                }
                profilerPacketIndex++
            })

            await User.query({ profiler }).preload('skills')
        })
    })

    describe('Model | ManyToMany | whereNotPivot', () => {
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true
            const { sql, bindings } = query.whereNotPivot('username', 'virk').toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereNot('skill_user.username', 'virk')
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add where not clause with operator', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .whereNotPivot('age', '>', 22)
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereNot('skill_user.age', '>', 22)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add where not clause as a raw query', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .whereNotPivot('age', '>', db.rawQuery('select min_age from ages limit 1;'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereNot(
                                                                   'skill_user.age',
                                                                   '>',
                                                                   db.connection().getWriteClient().raw('select min_age from ages limit 1;'),
                                                               )
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add orWhereNot clause', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .whereNotPivot('age', '>', 22)
                .orWhereNotPivot('age', 18)
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereNot('skill_user.age', '>', 22)
                                                               .orWhereNot('skill_user.age', 18)
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })

    describe('Model | ManyToMany | whereInPivot', () => {
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .whereInPivot('username', ['virk', 'nikk'])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereIn('skill_user.username', ['virk', 'nikk'])
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereIn as a query callback', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .whereInPivot('username', (builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereIn('skill_user.username', (builder) => {
                                                                   builder.from('accounts')
                                                               })
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereIn as a subquery', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .whereInPivot('username', db.query().select('id').from('accounts'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereIn('skill_user.username', db.connection().getWriteClient().select('id').from('accounts'))
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereIn as a rawquery', async () => {
            const ref = db.connection().getWriteClient().ref.bind(db.connection().getWriteClient())

            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .whereInPivot('username', [
                    db.rawQuery(`select ${ref('id')} from ${ref('accounts')}`),
                ])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereIn('skill_user.username', [
                                                                   db.connection().getWriteClient().raw(`select ${ref('id')} from ${ref('accounts')}`),
                                                               ])
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereIn as a subquery with array of keys', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .whereInPivot(
                    ['username', 'email'],
                    db.query().select('username', 'email').from('accounts'),
                )
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereIn(
                                                                   ['skill_user.username', 'skill_user.email'],
                                                                   db.connection().getWriteClient().select('username', 'email').from('accounts'),
                                                               )
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereIn as a 2d array', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .whereInPivot(['username', 'email'], [['foo', 'bar']])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereIn(['skill_user.username', 'skill_user.email'], [['foo', 'bar']])
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add orWhereIn clause', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .whereInPivot('username', ['virk', 'nikk'])
                .orWhereInPivot('username', ['foo'])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereIn('skill_user.username', ['virk', 'nikk'])
                                                               .orWhereIn('skill_user.username', ['foo'])
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add orWhereIn as a query callback', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .whereInPivot('username', (builder) => {
                    builder.from('accounts')
                })
                .orWhereInPivot('username', (builder) => {
                    builder.from('employees')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereIn('skill_user.username', (builder) => {
                                                                   builder.from('accounts')
                                                               })
                                                               .orWhereIn('skill_user.username', (builder) => {
                                                                   builder.from('employees')
                                                               })
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })

    describe('Model | ManyToMany | whereNotInPivot', () => {
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .whereNotInPivot('username', ['virk', 'nikk'])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereNotIn('skill_user.username', ['virk', 'nikk'])
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereNotIn as a query callback', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .whereNotInPivot('username', (builder) => {
                    builder.from('accounts')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereNotIn('skill_user.username', (builder) => {
                                                                   builder.from('accounts')
                                                               })
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereNotIn as a sub query', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .whereNotInPivot('username', db.query().select('username').from('accounts'))
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereNotIn(
                                                                   'skill_user.username',
                                                                   db.connection().getWriteClient().select('username').from('accounts'),
                                                               )
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add whereNotIn as a 2d array', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .whereNotInPivot(['username', 'email'], [['foo', 'bar']])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereNotIn(['skill_user.username', 'skill_user.email'], [['foo', 'bar']])
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add orWhereNotIn clause', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .whereNotInPivot('username', ['virk', 'nikk'])
                .orWhereNotInPivot('username', ['foo'])
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereNotIn('skill_user.username', ['virk', 'nikk'])
                                                               .orWhereNotIn('skill_user.username', ['foo'])
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('add orWhereNotIn as a subquery', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            User.boot()
            const user = new User()
            const query = user!.related('skills').query()

            query['appliedConstraints'] = true

            const { sql, bindings } = query
                .whereNotInPivot('username', (builder) => {
                    builder.from('accounts')
                })
                .orWhereNotInPivot('username', (builder) => {
                    builder.from('employees')
                })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = db.connection().getWriteClient()
                                                               .from('skills')
                                                               .whereNotIn('skill_user.username', (builder) => {
                                                                   builder.from('accounts')
                                                               })
                                                               .orWhereNotIn('skill_user.username', (builder) => {
                                                                   builder.from('employees')
                                                               })
                                                               .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    })

    describe('Model | ManyToMany | save', () => {
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const skill = new Skill()
            skill.name = 'Programming'

            await user.related('skills').save(skill)

            expect(user.$isPersisted).toBeTruthy()
            expect(skill.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(1)
            expect(totalPosts[0].total).toBe(1)

            expect(skillUsers).toHaveLength(1)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(skill.id)
            expect(user.$trx).toBeUndefined()
            expect(skill.$trx).toBeUndefined()
        })

        test('do not attach duplicates when save is called more than once', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const skill = new Skill()
            skill.name = 'Programming'

            await user.related('skills').save(skill)
            await user.related('skills').save(skill)

            expect(user.$isPersisted).toBeTruthy()
            expect(skill.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(1)
            expect(totalPosts[0].total).toBe(1)

            expect(skillUsers).toHaveLength(1)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(skill.id)

            expect(user.$trx).toBeUndefined()
            expect(skill.$trx).toBeUndefined()
        })

        test('attach duplicates when save is called more than once with with checkExisting = false', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const skill = new Skill()
            skill.name = 'Programming'

            await user.related('skills').save(skill)
            await user.related('skills').save(skill, false)

            expect(user.$isPersisted).toBeTruthy()
            expect(skill.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(1)
            expect(totalPosts[0].total).toBe(1)

            expect(skillUsers).toHaveLength(2)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(skill.id)

            expect(skillUsers[1].user_id).toBe(user.id)
            expect(skillUsers[1].skill_id).toBe(skill.id)

            expect(user.$trx).toBeUndefined()
            expect(skill.$trx).toBeUndefined()
        })

        test('attach when related pivot entry exists but for a different parent @sanityCheck', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const user1 = new User()
            user1.username = 'nikk'
            await user1.save()

            const skill = new Skill()
            skill.name = 'Programming'

            await user.related('skills').save(skill)
            await user1.related('skills').save(skill)

            expect(user.$isPersisted).toBeTruthy()
            expect(skill.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalSkills = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(2)
            expect(totalSkills[0].total).toBe(1)

            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(skill.id)

            expect(skillUsers[1].user_id).toBe(user1.id)
            expect(skillUsers[1].skill_id).toBe(skill.id)

            expect(user.$trx).toBeUndefined()
            expect(user1.$trx).toBeUndefined()
            expect(skill.$trx).toBeUndefined()
        })
    })

    describe('Model | ManyToMany | saveMany', () => {
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const skill = new Skill()
            skill.name = 'Programming'

            const skill1 = new Skill()
            skill1.name = 'Cooking'

            await user.related('skills').saveMany([skill, skill1])

            expect(user.$isPersisted).toBeTruthy()
            expect(skill.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(1)
            expect(totalPosts[0].total).toBe(2)

            expect(skillUsers).toHaveLength(2)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(skill.id)
            expect(skillUsers[1].user_id).toBe(user.id)
            expect(skillUsers[1].skill_id).toBe(skill1.id)

            expect(user.$trx).toBeUndefined()
            expect(skill.$trx).toBeUndefined()
            expect(skill1.$trx).toBeUndefined()
        })

        test('do not attach duplicates when saveMany is called more than once', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const skill = new Skill()
            skill.name = 'Programming'

            const skill1 = new Skill()
            skill1.name = 'Cooking'

            await user.related('skills').saveMany([skill, skill1])
            await user.related('skills').saveMany([skill, skill1])

            expect(user.$isPersisted).toBeTruthy()
            expect(skill.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(1)
            expect(totalPosts[0].total).toBe(2)

            expect(skillUsers).toHaveLength(2)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(skill.id)
            expect(skillUsers[1].user_id).toBe(user.id)
            expect(skillUsers[1].skill_id).toBe(skill1.id)

            expect(user.$trx).toBeUndefined()
            expect(skill.$trx).toBeUndefined()
            expect(skill1.$trx).toBeUndefined()
        })

        test('attach duplicates when saveMany is called more than once with checkExisting = false', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const skill = new Skill()
            skill.name = 'Programming'

            const skill1 = new Skill()
            skill1.name = 'Cooking'

            await user.related('skills').saveMany([skill, skill1])
            await user.related('skills').saveMany([skill, skill1], false)

            expect(user.$isPersisted).toBeTruthy()
            expect(skill.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(1)
            expect(totalPosts[0].total).toBe(2)

            expect(skillUsers).toHaveLength(4)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(skill.id)
            expect(skillUsers[1].user_id).toBe(user.id)
            expect(skillUsers[1].skill_id).toBe(skill1.id)

            expect(skillUsers[2].user_id).toBe(user.id)
            expect(skillUsers[2].skill_id).toBe(skill.id)
            expect(skillUsers[3].user_id).toBe(user.id)
            expect(skillUsers[3].skill_id).toBe(skill1.id)

            expect(user.$trx).toBeUndefined()
            expect(skill.$trx).toBeUndefined()
            expect(skill1.$trx).toBeUndefined()
        })

        test('attach when related pivot entry exists but for a different parent @sanityCheck', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const user1 = new User()
            user1.username = 'nikk'

            const skill = new Skill()
            skill.name = 'Programming'

            const skill1 = new Skill()
            skill1.name = 'Cooking'

            await user.related('skills').saveMany([skill, skill1])
            await user1.related('skills').saveMany([skill, skill1])

            expect(user.$isPersisted).toBeTruthy()
            expect(skill.$isPersisted).toBeTruthy()
            expect(user1.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(2)
            expect(totalPosts[0].total).toBe(2)

            expect(skillUsers).toHaveLength(4)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(skill.id)
            expect(skillUsers[1].user_id).toBe(user.id)
            expect(skillUsers[1].skill_id).toBe(skill1.id)

            expect(skillUsers[2].user_id).toBe(user1.id)
            expect(skillUsers[2].skill_id).toBe(skill.id)
            expect(skillUsers[3].user_id).toBe(user1.id)
            expect(skillUsers[3].skill_id).toBe(skill1.id)

            expect(user.$trx).toBeUndefined()
            expect(skill.$trx).toBeUndefined()
            expect(skill1.$trx).toBeUndefined()
        })

        test('wrap saveMany inside a custom transaction', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const trx = await db.transaction()

            const user = new User()
            user.username = 'virk'
            user.$trx = trx
            await user.save()

            const user1 = new User()
            user1.$trx = trx
            user1.username = 'nikk'

            const skill = new Skill()
            skill.name = 'Programming'

            const skill1 = new Skill()
            skill1.name = 'Cooking'

            await user.related('skills').saveMany([skill, skill1])
            await user1.related('skills').saveMany([skill, skill1])

            expect(user.$trx.isCompleted).toBeFalsy()
            expect(user1.$trx.isCompleted).toBeFalsy()

            await trx.rollback()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(0)
            expect(totalPosts[0].total).toBe(0)

            expect(skillUsers).toHaveLength(0)
        })
    })

    describe('Model | ManyToMany | create', () => {
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const skill = await user.related('skills').create({ name: 'Programming' })

            expect(user.$isPersisted).toBeTruthy()
            expect(skill.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(1)
            expect(totalPosts[0].total).toBe(1)

            expect(skillUsers).toHaveLength(1)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(skill.id)
            expect(user.$trx).toBeUndefined()
            expect(skill.$trx).toBeUndefined()
        })

        test('wrap create inside a custom transaction', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const trx = await db.transaction()

            const user = new User()
            user.username = 'virk'
            user.$trx = trx
            await user.save()

            const skill = await user.related('skills').create({ name: 'Programming' })
            expect(user.$trx.isCompleted).toBeFalsy()
            expect(skill.$trx!.isCompleted).toBeFalsy()

            await trx.commit()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(1)
            expect(totalPosts[0].total).toBe(1)

            expect(skillUsers).toHaveLength(1)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(skill.id)

            expect(user.$trx).toBeUndefined()
            expect(skill.$trx).toBeUndefined()
        })
    })

    describe('Model | ManyToMany | createMany', () => {
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            const [skill, skill1] = await user.related('skills').createMany([
                { name: 'Programming' },
                { name: 'Cooking' },
            ])

            expect(user.$isPersisted).toBeTruthy()
            expect(skill.$isPersisted).toBeTruthy()
            expect(skill1.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalSkills = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(1)
            expect(totalSkills[0].total).toBe(2)

            expect(skillUsers).toHaveLength(2)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(skill.id)

            expect(skillUsers[1].user_id).toBe(user.id)
            expect(skillUsers[1].skill_id).toBe(skill1.id)

            expect(user.$trx).toBeUndefined()
            expect(skill.$trx).toBeUndefined()
            expect(skill1.$trx).toBeUndefined()
        })

        test('wrap create many inside a custom transaction', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const trx = await db.transaction()

            const user = new User()
            user.username = 'virk'
            user.$trx = trx
            await user.save()

            const [skill, skill1] = await user.related('skills').createMany([
                { name: 'Programming' },
                { name: 'Cooking' },
            ])

            expect(user.$trx.isCompleted).toBeFalsy()
            expect(skill.$trx!.isCompleted).toBeFalsy()
            expect(skill1.$trx!.isCompleted).toBeFalsy()

            await trx.rollback()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalPosts = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(0)
            expect(totalPosts[0].total).toBe(0)
            expect(skillUsers).toHaveLength(0)
        })
    })

    describe('Model | ManyToMany | attach', () => {
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await user.related('skills').attach([1, 2])

            expect(user.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalSkills = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(1)
            expect(totalSkills[0].total).toBe(0)

            expect(skillUsers).toHaveLength(2)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(1)

            expect(skillUsers[1].user_id).toBe(user.id)
            expect(skillUsers[1].skill_id).toBe(2)
        })

        test('attach with extra attributes', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await user.related('skills').attach({
                1: {
                    proficiency: 'Beginner',
                },
                2: {
                    proficiency: 'Master',
                },
            })

            expect(user.$isPersisted).toBeTruthy()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalSkills = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(1)
            expect(totalSkills[0].total).toBe(0)

            expect(skillUsers).toHaveLength(2)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(1)
            expect(skillUsers[0].proficiency).toBe('Beginner')

            expect(skillUsers[1].user_id).toBe(user.id)
            expect(skillUsers[1].skill_id).toBe(2)
            expect(skillUsers[1].proficiency).toBe('Master')
        })
    })

    describe('Model | ManyToMany | detach', () => {
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('skill_user').multiInsert([
                {
                    user_id: user.id,
                    skill_id: 1,
                    proficiency: 'Beginner',
                },
                {
                    user_id: user.id,
                    skill_id: 2,
                    proficiency: 'Beginner',
                },
            ])

            await user.related('skills').detach([1])

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalSkills = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(1)
            expect(totalSkills[0].total).toBe(0)

            expect(skillUsers).toHaveLength(1)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(2)
        })

        test('scope detach self to @sanityCheck', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('skill_user').multiInsert([
                {
                    user_id: user.id,
                    skill_id: 1,
                    proficiency: 'Beginner',
                },
                {
                    user_id: 2,
                    skill_id: 2,
                    proficiency: 'Beginner',
                },
            ])

            await user.related('skills').detach([2])

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalSkills = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(1)
            expect(totalSkills[0].total).toBe(0)

            expect(skillUsers).toHaveLength(2)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(1)

            expect(skillUsers[1].user_id).toBe(2)
            expect(skillUsers[1].skill_id).toBe(2)
        })
    })

    describe('Model | ManyToMany | sync', () => {
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('skill_user').multiInsert([
                {
                    user_id: user.id,
                    skill_id: 1,
                    proficiency: 'Beginner',
                },
                {
                    user_id: user.id,
                    skill_id: 2,
                    proficiency: 'Master',
                },
                {
                    user_id: 2,
                    skill_id: 1,
                    proficiency: 'Master',
                },
            ])

            await user.related('skills').sync([1])

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalSkills = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(1)
            expect(totalSkills[0].total).toBe(0)

            expect(skillUsers[0].id).toBe(1)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(1)

            expect(skillUsers[1].id).toBe(3)
            expect(skillUsers[1].user_id).toBe(2)
            expect(skillUsers[1].skill_id).toBe(1)
        })

        test('update pivot rows when additional properties are changed', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('skill_user').multiInsert([
                {
                    user_id: user.id,
                    skill_id: 1,
                    proficiency: 'Beginner',
                },
                {
                    user_id: user.id,
                    skill_id: 2,
                    proficiency: 'Master',
                },
                {
                    user_id: 2,
                    skill_id: 1,
                    proficiency: 'Master',
                },
            ])

            await user.related('skills').sync({
                1: {
                    proficiency: 'Intermediate',
                },
            })

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalSkills = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user').orderBy('id', 'asc')

            expect(totalUsers[0].total).toBe(1)
            expect(totalSkills[0].total).toBe(0)

            expect(skillUsers[0].id).toBe(1)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(1)
            expect(skillUsers[0].proficiency).toBe('Intermediate')

            expect(skillUsers[1].id).toBe(3)
            expect(skillUsers[1].user_id).toBe(2)
            expect(skillUsers[1].skill_id).toBe(1)
        })

        test('do not update pivot row when no extra properties are defined', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('skill_user').multiInsert([
                {
                    user_id: user.id,
                    skill_id: 1,
                    proficiency: 'Beginner',
                },
                {
                    user_id: user.id,
                    skill_id: 2,
                    proficiency: 'Master',
                },
                {
                    user_id: 2,
                    skill_id: 1,
                    proficiency: 'Master',
                },
            ])

            await user.related('skills').sync({ 1: {} })

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalSkills = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(1)
            expect(totalSkills[0].total).toBe(0)

            expect(skillUsers[0].id).toBe(1)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(1)
            expect(skillUsers[0].proficiency).toBe('Beginner')

            expect(skillUsers[1].id).toBe(3)
            expect(skillUsers[1].user_id).toBe(2)
            expect(skillUsers[1].skill_id).toBe(1)
        })

        test('do not remove rows when detach = false', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('skill_user').multiInsert([
                {
                    user_id: user.id,
                    skill_id: 1,
                    proficiency: 'Beginner',
                },
                {
                    user_id: user.id,
                    skill_id: 2,
                    proficiency: 'Master',
                },
                {
                    user_id: 2,
                    skill_id: 1,
                    proficiency: 'Master',
                },
            ])

            await user.related('skills').sync([1], false)

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalSkills = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(1)
            expect(totalSkills[0].total).toBe(0)
            expect(skillUsers).toHaveLength(3)

            expect(skillUsers[0].id).toBe(1)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(1)
            expect(skillUsers[0].proficiency).toBe('Beginner')

            expect(skillUsers[1].id).toBe(2)
            expect(skillUsers[1].user_id).toBe(user.id)
            expect(skillUsers[1].skill_id).toBe(2)
            expect(skillUsers[1].proficiency).toBe('Master')

            expect(skillUsers[2].id).toBe(3)
            expect(skillUsers[2].user_id).toBe(2)
            expect(skillUsers[2].skill_id).toBe(1)
            expect(skillUsers[2].proficiency).toBe('Master')
        })

        test('use custom transaction', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            await db.insertQuery().table('skill_user').multiInsert([
                {
                    user_id: user.id,
                    skill_id: 1,
                    proficiency: 'Beginner',
                },
                {
                    user_id: user.id,
                    skill_id: 2,
                    proficiency: 'Master',
                },
                {
                    user_id: 2,
                    skill_id: 1,
                    proficiency: 'Master',
                },
            ])

            const trx = await db.transaction()
            await user.related('skills').sync({
                1: {
                    proficiency: 'Intermediate',
                },
                3: {
                    proficiency: 'Intermediate',
                },
            }, true, trx)

            await trx.rollback()

            const totalUsers = await db.query().from('users').count('*', 'total')
            const totalSkills = await db.query().from('skills').count('*', 'total')
            const skillUsers = await db.query().from('skill_user')

            expect(totalUsers[0].total).toBe(1)
            expect(totalSkills[0].total).toBe(0)
            expect(skillUsers).toHaveLength(3)

            expect(skillUsers[0].id).toBe(1)
            expect(skillUsers[0].user_id).toBe(user.id)
            expect(skillUsers[0].skill_id).toBe(1)
            expect(skillUsers[0].proficiency).toBe('Beginner')

            expect(skillUsers[1].id).toBe(2)
            expect(skillUsers[1].user_id).toBe(user.id)
            expect(skillUsers[1].skill_id).toBe(2)
            expect(skillUsers[1].proficiency).toBe('Master')

            expect(skillUsers[2].id).toBe(3)
            expect(skillUsers[2].user_id).toBe(2)
            expect(skillUsers[2].skill_id).toBe(1)
            expect(skillUsers[2].proficiency).toBe('Master')
        })
    })

    describe('Model | ManyToMany | pagination', () => {
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').insert({ username: 'virk' })
            await db.insertQuery().table('skills').insert([
                { name: 'Programming' },
                { name: 'Dancing' },
                { name: 'Singing' },
            ])
            await db.insertQuery().table('skill_user').insert([
                {
                    user_id: 1,
                    skill_id: 1,
                },
                {
                    user_id: 1,
                    skill_id: 2,
                },
            ])

            const user = await User.find(1)
            const skills = await user!.related('skills').query().paginate(1, 1)

            skills.baseUrl('/skills')

            expect(skills.all()).toHaveLength(1)
            expect(skills.all()[0]).toBeInstanceOf(Skill)
            expect(skills.all()[0].$extras).not.toHaveProperty('total');
            expect(skills.perPage).toBe(1)
            expect(skills.currentPage).toBe(1)
            expect(skills.lastPage).toBe(2)
            expect(skills.hasPages).toBeTruthy()
            expect(skills.hasMorePages).toBeTruthy()
            expect(skills.isEmpty).toBeFalsy()
            expect(skills.total).toBe(2)
            expect(skills.hasTotal).toBeTruthy()
            expect(skills.getMeta()).toEqual({
                total: 2,
                per_page: 1,
                current_page: 1,
                last_page: 2,
                first_page: 1,
                first_page_url: '/skills?page=1',
                last_page_url: '/skills?page=2',
                next_page_url: '/skills?page=2',
                previous_page_url: null,
            })
        })

        test('disallow paginate during preload', async () => {
            expect.assertions(1)

            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').insert({ username: 'virk' })
            await db.insertQuery().table('skills').insert([
                { name: 'Programming' },
                { name: 'Dancing' },
                { name: 'Singing' },
            ])
            await db.insertQuery().table('skill_user').insert([
                {
                    user_id: 1,
                    skill_id: 1,
                },
                {
                    user_id: 1,
                    skill_id: 2,
                },
            ])

            try {
                await User.query().preload('skills', (query) => {
                    query.paginate(1, 5)
                })
            } catch ({ message }) {
                expect(message).toBe('Cannot paginate relationship "skills" during preload')
            }
        })
    })

    describe('Model | ManyToMany | clone', () => {
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').insert({ username: 'virk' })
            await db.insertQuery().table('skills').insert([
                { name: 'Programming' },
                { name: 'Dancing' },
                { name: 'Singing' },
            ])
            await db.insertQuery().table('skill_user').insert([
                {
                    user_id: 1,
                    skill_id: 1,
                },
                {
                    user_id: 1,
                    skill_id: 2,
                },
            ])

            const user = await User.find(1)
            const clonedQuery = user!.related('skills').query().clone()
            expect(clonedQuery).toBeInstanceOf(ManyToManyQueryBuilder)
        })
    })

    describe('Model | ManyToMany | scopes', () => {
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string

                public static programmingOnly = scope((query) => {
                    query.where('name', 'Programming')
                })
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').insert({ username: 'virk' })
            await db.insertQuery().table('skills').insert([
                { name: 'Programming' },
                { name: 'Dancing' },
                { name: 'Singing' },
            ])
            await db.insertQuery().table('skill_user').insert([
                {
                    user_id: 1,
                    skill_id: 1,
                },
                {
                    user_id: 1,
                    skill_id: 2,
                },
            ])

            const user = await User.query().preload('skills', (query) => {
                query.apply((scopes) => scopes.programmingOnly())
            }).firstOrFail()

            const userWithoutScopes = await User.query().preload('skills').firstOrFail()

            expect(user.skills).toHaveLength(1)
            expect(userWithoutScopes.skills).toHaveLength(2)
            expect(user.skills[0].name).toBe('Programming')
        })

        test('apply scopes on related query', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string

                public static programmingOnly = scope((query) => {
                    query.where('name', 'Programming')
                })
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill)
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').insert({ username: 'virk' })
            await db.insertQuery().table('skills').insert([
                { name: 'Programming' },
                { name: 'Dancing' },
                { name: 'Singing' },
            ])
            await db.insertQuery().table('skill_user').insert([
                {
                    user_id: 1,
                    skill_id: 1,
                },
                {
                    user_id: 1,
                    skill_id: 2,
                },
            ])

            const user = await User.findOrFail(1)
            const skills = await user.related('skills').query().apply((scopes) => scopes.programmingOnly())
            const skillsWithoutScope = await user.related('skills').query()

            expect(skills).toHaveLength(1)
            expect(skillsWithoutScope).toHaveLength(2)
            expect(skills[0].name).toBe('Programming')
        })
    })

    describe('Model | ManyToMany | onQuery', () => {
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
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill, {
                    onQuery: (query) => query.where('name', 'Programming'),
                })
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').insert({ username: 'virk' })
            await db.insertQuery().table('skills').insert([
                { name: 'Programming' },
                { name: 'Dancing' },
                { name: 'Singing' },
            ])
            await db.insertQuery().table('skill_user').insert([
                {
                    user_id: 1,
                    skill_id: 1,
                },
                {
                    user_id: 1,
                    skill_id: 2,
                },
            ])

            const user = await User.query().preload('skills').firstOrFail()
            expect(user.skills).toHaveLength(1)
            expect(user.skills[0].name).toBe('Programming')
        })

        test('do not invoke onQuery method during preloading subqueries', async () => {
            expect.assertions(3)

            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill, {
                    onQuery: (query) => {
                        expect(true).toBeTruthy()
                        query.where('name', 'Programming')
                    },
                })
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').insert({ username: 'virk' })
            await db.insertQuery().table('skills').insert([
                { name: 'Programming' },
                { name: 'Dancing' },
                { name: 'Singing' },
            ])
            await db.insertQuery().table('skill_user').insert([
                {
                    user_id: 1,
                    skill_id: 1,
                },
                {
                    user_id: 1,
                    skill_id: 2,
                },
            ])

            const user = await User.query().preload('skills', (query) => {
                query.where(() => {})
            }).firstOrFail()

            expect(user.skills).toHaveLength(1)
            expect(user.skills[0].name).toBe('Programming')
        })

        test('invoke onQuery method on related query builder', async () => {
            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill, {
                    onQuery: (query) => query.where('name', 'Programming'),
                })
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').insert({ username: 'virk' })
            await db.insertQuery().table('skills').insert([
                { name: 'Programming' },
                { name: 'Dancing' },
                { name: 'Singing' },
            ])
            await db.insertQuery().table('skill_user').insert([
                {
                    user_id: 1,
                    skill_id: 1,
                },
                {
                    user_id: 1,
                    skill_id: 2,
                },
            ])

            const user = await User.findOrFail(1)
            const skills = await user.related('skills').query()
            expect(skills).toHaveLength(1)
            expect(skills[0].name).toBe('Programming')
        })

        test('invoke onQuery method on pivot query builder', async () => {
            expect.assertions(1)

            class Skill extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public name: string
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @manyToMany(() => Skill, {
                    onQuery: (query) => {
                        expect(query.isPivotOnlyQuery).toBeTruthy()
                    },
                })
                public skills: ManyToMany<typeof Skill>
            }

            await db.table('users').insert({ username: 'virk' })
            await db.insertQuery().table('skills').insert([
                { name: 'Programming' },
                { name: 'Dancing' },
                { name: 'Singing' },
            ])
            await db.insertQuery().table('skill_user').insert([
                {
                    user_id: 1,
                    skill_id: 1,
                },
                {
                    user_id: 1,
                    skill_id: 2,
                },
            ])

            const user = await User.findOrFail(1)
            await user.related('skills').pivotQuery()
        })
    })
})
