/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/10/2020
 * Time: 10:06 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { DateTime } from 'luxon'
import { LucidRow } from '../../src/Contracts/Model/LucidRow';
import { HasMany, HasOne } from '../../src/Contracts/Orm/Relations/types';
import {
    afterCreate,
    afterDelete,
    afterFetch,
    afterFind,
    afterSave,
    afterUpdate,
    beforeCreate,
    beforeDelete,
    beforeFetch,
    beforeFind,
    beforeSave,
    beforeUpdate,
    column,
    computed,
    hasMany,
    hasOne
} from '../../src/Orm/Decorators';
import { ModelQueryBuilder } from '../../src/Orm/QueryBuilder/ModelQueryBuilder';
import { cleanup, FakeAdapter, getBaseModel, getDb, getUsers, ormAdapter, resetTables, setup } from '../helpers';

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Base model', () => {
    describe('Base model | boot', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        });

        afterAll(async () => {
            await db.manager.closeAll();
        });

        it('should create table name when no settings table name', async () => {
            class User extends BaseModel {
                @column()
                id: string;
            }

            expect(User.getTable()).toBe('users');
        });

        it('allow overriding table name', async () => {
            class User extends BaseModel {
                static table: string = 'usercustom';

                @column()
                id: string;
            }

            expect(User.getTable()).toBe('usercustom');
        });

        /*it.todo('initiate all required static properties', async () => {
            class User extends BaseModel {
            }

            User.boot()
            expect(mapToObj(User.$columnsDefinitions)).toEqual({});
            // expect(mapToObj(User.$relationsDefinitions)).toEqual({});
            // expect(mapToObj(User.$computedDefinitions)).toEqual({});
        });*/

        it('resolve column name from attribute name', async () => {
            class User extends BaseModel {
                public static $increments = false

                @column({ isPrimary: true })
                public id: number

                @column()
                public userName: string
            }

            expect(User.$keys.attributesToColumns.get('userName')).toBe('user_name');
        });

        it('resolve attribute name from column name', async () => {
            class User extends BaseModel {
                public static $increments = false

                @column({ isPrimary: true })
                public id: number

                @column()
                public userName: string
            }

            expect(User.$keys.columnsToAttributes.get('user_name')).toBe('userName');
        });
    });

    describe('Base Model | getter-setters', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        });

        afterAll(async () => {
            await db.manager.closeAll();
        });

        it('set property on $attributes when defined on model instance', async () => {
            class User extends BaseModel {
                @column()
                public username: string
            }

            const user = new User()
            user.username = 'virk'

            expect(user.$attributes).toEqual({ username: 'virk' });
        });

        it('pass value to setter when defined', async () => {
            class User extends BaseModel {
                @column()
                public set username(value: any) {
                    this.$setAttribute('username', value.toUpperCase())
                }
            }

            const user = new User()
            user.username = 'virk'

            expect(user.$attributes).toEqual({ username: 'VIRK' });
        })

        it('set value on model instance when is not a column', async () => {
            class User extends BaseModel {
                public username: string
            }

            User.boot()

            const user = new User()
            user.username = 'virk'

            expect(user.$attributes).toEqual({});
            expect(user.username).toBe('virk');
        })

        it('get value from attributes', () => {
            class User extends BaseModel {
                @column()
                public username: string
            }

            const user = new User()
            user.$attributes = { username: 'virk' }

            expect(user.username).toBe('virk');
        })

        it('rely on getter when column is defined as a getter', () => {
            class User extends BaseModel {
                @column()
                public get username() {
                    return this.$getAttribute('username').toUpperCase()
                }
            }

            const user = new User()
            user.$attributes = { username: 'virk' }

            expect(user.username).toBe('VIRK');
        })

        it('get value from model instance when is not a column', () => {
            class User extends BaseModel {
                public username = 'virk'
            }

            const user = new User()
            expect(user.username).toBe('virk');
        })

        it('get value for primary key', () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            const user = new User()
            user.$attributes = { username: 'virk', id: 1 }

            expect(user.$primaryKeyValue).toBe(1);
        });

        it('invoke getter when accessing value using primaryKeyValue', () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public get id() {
                    return String(this.$getAttribute('id'))
                }

                @column()
                public username: string
            }

            const user = new User()
            user.$attributes = { username: 'virk', id: 1 }

            expect(user.$primaryKeyValue).toBe('1');
        })

        it('invoke column serialize method when serializing model', () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public get id() {
                    return String(this.$getAttribute('id'))
                }

                @column({
                    serialize(value) {
                        return value.toUpperCase()
                    }
                })
                public username: string
            }

            const user = new User()
            user.$attributes = { username: 'virk', id: 1 }

            expect(user.username).toBe('virk');
            expect(user.toJSON().username).toBe('VIRK');
        })
    });

    describe('Base Model | dirty', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        });

        afterAll(async () => {
            await db.manager.closeAll();
        });

        test('get dirty properties on a fresh model', () => {
            class User extends BaseModel {
                @column()
                public username: string
            }

            const user = new User()
            user.username = 'virk'

            expect(user.$dirty).toEqual({ username: 'virk' });
            expect(user.$isDirty).toBeTruthy();
        })

        test('get empty object when model is not dirty', () => {
            class User extends BaseModel {
                @column()
                public username: string
            }

            const user = new User()
            user.$attributes = { username: 'virk' }
            user.$original = { username: 'virk' }

            user.$isPersisted = true

            expect(user.$dirty).toEqual({});
            expect(user.$isDirty).toBeFalsy();
        })

        test('get empty object when model is not dirty with null values', () => {
            class User extends BaseModel {
                @column()
                public username: string
            }

            const user = new User()

            user.$attributes = { username: null }
            user.$original = { username: null }
            user.$isPersisted = true

            expect(user.$dirty).toEqual({});
            expect(user.$isDirty).toBeFalsy();
        })

        test('get empty object when model is not dirty with false values', () => {
            class User extends BaseModel {
                @column()
                public username: string
            }

            const user = new User()

            user.$attributes = { username: false }
            user.$original = { username: false }
            user.$isPersisted = true

            expect(user.$dirty).toEqual({});
            expect(user.$isDirty).toBeFalsy();
        })

        test('get values removed as a side-effect of fill as dirty', async () => {
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column()
                public username: string

                @column()
                public age: number
            }

            User.$adapter = adapter

            const user = new User()
            user.username = 'virk'
            user.age = 22
            await user.save()

            expect(user.$dirty).toEqual({});
            expect(user.$isDirty).toBeFalsy();
            expect(user.$isPersisted).toBeTruthy();

            user.fill({ username: 'virk' })
            expect(user.$dirty).toEqual({ age: null });
        })
    });

    describe('Base Model | persist', () => {
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

        test('persist model with the column name', async () => {
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column({ columnName: 'full_name' })
                public fullName: string
            }

            User.$adapter = adapter
            adapter.on('insert', (model) => {
                model.$consumeAdapterResult({ id: 1 })
            })

            const user = new User()
            user.username = 'virk'
            user.fullName = 'H virk'

            await user.save()

            expect(user.$isPersisted).toBeTruthy();
            expect(user.$isDirty).toBeFalsy();
            expect(adapter.operations).toEqual([{
                type: 'insert',
                instance: user,
                attributes: { username: 'virk', full_name: 'H virk' }
            }])

            expect(user.$attributes).toEqual({ username: 'virk', fullName: 'H virk', id: 1 })
            expect(user.$original).toEqual({ username: 'virk', fullName: 'H virk', id: 1 })
        })

        test('merge adapter insert return value with attributes', async () => {
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column()
                public username: string

                @column()
                public id: number
            }

            User.$adapter = adapter
            adapter.on('insert', (model) => {
                model.$consumeAdapterResult({ id: 1 })
            })

            const user = new User()
            user.username = 'virk'

            await user.save()
            expect(user.$isPersisted).toBeTruthy();
            expect(user.$isDirty).toBeFalsy();
            expect(adapter.operations).toEqual([{
                type: 'insert',
                instance: user,
                attributes: { username: 'virk' }
            }])

            expect(user.$attributes).toEqual({ username: 'virk', id: 1 })
            expect(user.$original).toEqual({ username: 'virk', id: 1 })
        })

        test('do not merge adapter results when not part of model columns', async () => {
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column()
                public username: string
            }

            User.$adapter = adapter
            adapter.on('insert', () => {
                return { id: 1 }
            })

            const user = new User()
            user.username = 'virk'

            await user.save()
            expect(user.$isPersisted).toBeTruthy();
            expect(user.$isDirty).toBeFalsy();

            expect(adapter.operations).toEqual([{
                type: 'insert',
                instance: user,
                attributes: { username: 'virk' }
            }])

            expect(user.$attributes).toEqual({ username: 'virk' })
            expect(user.$original).toEqual({ username: 'virk' })
        })

        test('issue update when model has already been persisted', async () => {
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column()
                public username: string
            }

            User.$adapter = adapter

            const user = new User()
            user.username = 'virk'
            user.$isPersisted = true

            await user.save()
            expect(user.$isPersisted).toBeTruthy();
            expect(user.$isDirty).toBeFalsy();

            expect(adapter.operations).toEqual([{
                type: 'update',
                instance: user,
                attributes: { username: 'virk' }
            }])

            expect(user.$attributes).toEqual({ username: 'virk' })
            expect(user.$original).toEqual({ username: 'virk' })
        })

        test('merge return values from update', async () => {
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column()
                public username: string

                @column({ columnName: 'updated_at' })
                public updatedAt: string
            }

            adapter.on('update', (model) => {
                return model.$consumeAdapterResult({ updated_at: '2019-11-20' })
            })

            User.$adapter = adapter

            const user = new User()
            user.username = 'virk'
            user.$isPersisted = true

            await user.save()

            expect(user.$isPersisted).toBeTruthy();
            expect(user.$isDirty).toBeFalsy();

            expect(adapter.operations).toEqual([{
                type: 'update',
                instance: user,
                attributes: { username: 'virk' }
            }])

            expect(user.$attributes).toEqual({ username: 'virk', updatedAt: '2019-11-20' })
            expect(user.$original).toEqual({ username: 'virk', updatedAt: '2019-11-20' })
        })

        test('do not issue update when model is not dirty', async () => {
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column()
                public username: string

                @column({ columnName: 'updated_at' })
                public updatedAt: string
            }

            User.$adapter = adapter

            const user = new User()
            user.$isPersisted = true

            await user.save()
            expect(user.$isPersisted).toBeTruthy();
            expect(user.$isDirty).toBeFalsy();

            expect(adapter.operations).toEqual([])
            expect(user.$attributes).toEqual({})
            expect(user.$original).toEqual({})
        })

        test('refresh model instance', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public createdAt: string

                @column({ columnName: 'updated_at' })
                public updatedAt: string
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            expect(user.$isPersisted).toBeTruthy();
            expect(user.$isDirty).toBeFalsy();
            expect(user.updatedAt).toBeUndefined();

            await user.refresh()
            expect(user.$isPersisted).toBeTruthy();
            expect(user.$isDirty).toBeFalsy();
            expect(user.updatedAt).toBeDefined();
        })

        test('raise exception when attempted to refresh deleted row', async () => {
            expect.assertions(4)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public createdAt: string

                @column({ columnName: 'updated_at' })
                public updatedAt: string
            }

            const user = new User()
            user.username = 'virk'
            await user.save()

            expect(user.$isPersisted).toBeTruthy();
            expect(user.$isDirty).toBeFalsy();
            expect(user.updatedAt).toBeUndefined();

            await db.from('users').del()

            try {
                await user.refresh()
            } catch ({ message }) {
                expect(message).toBe('"Model.refresh" failed. Unable to lookup "users" table where "id" = 1')
            }
        })

        test('invoke column prepare method before passing values to the adapter', async () => {
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column()
                public username: string

                @column({ columnName: 'full_name', prepare: (value) => value.toUpperCase() })
                public fullName: string
            }

            User.$adapter = adapter

            const user = new User()
            user.username = 'virk'
            user.fullName = 'H virk'

            await user.save()

            expect(user.$isPersisted).toBeTruthy();
            expect(user.$isDirty).toBeFalsy();
            expect(adapter.operations).toEqual([{
                type: 'insert',
                instance: user,
                attributes: { username: 'virk', full_name: 'H VIRK' }
            }])

            expect(user.$attributes).toEqual({ username: 'virk', fullName: 'H virk' })
            expect(user.$original).toEqual({ username: 'virk', fullName: 'H virk' })
        })
    });

    describe('Base Model | create from adapter results', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        test('create model instance using $createFromAdapterResult method', async () => {
            class User extends BaseModel {
                @column()
                public username: string

                @column({ columnName: 'full_name' })
                public fullName: string
            }

            const user = User.$createFromAdapterResult({ username: 'virk' })
            user!.username = 'virk'

            expect(user!.$isPersisted).toBeTruthy();
            expect(user!.$isDirty).toBeFalsy();
            expect(user!.$isLocal).toBeFalsy();
            expect(user!.$attributes).toEqual({ username: 'virk' })
            expect(user!.$original).toEqual({ username: 'virk' })
        })

        test('set options on model instance passed to $createFromAdapterResult', async () => {
            class User extends BaseModel {
                @column()
                public username: string

                @column({ columnName: 'full_name' })
                public fullName: string
            }

            const user = User.$createFromAdapterResult({ username: 'virk' }, [], { connection: 'foo' })

            expect(user!.$options).toEqual({ connection: 'foo' })
            expect(user!.$isPersisted).toBeTruthy();
            expect(user!.$isDirty).toBeFalsy();
            expect(user!.$isLocal).toBeFalsy();
            expect(user!.$attributes).toEqual({ username: 'virk' })
            expect(user!.$original).toEqual({ username: 'virk' })
        })

        test('return null from $createFromAdapterResult when input is not object', () => {
            class User extends BaseModel {
                @column()
                public username: string

                @column({ columnName: 'full_name' })
                public fullName: string
            }

            const user = User.$createFromAdapterResult([])
            expect(user).toBeNull();
        })

        test('create multiple model instance using $createMultipleFromAdapterResult', async () => {
            class User extends BaseModel {
                @column()
                public username: string

                @column({ columnName: 'full_name' })
                public fullName: string
            }

            const users = User.$createMultipleFromAdapterResult([
                { username: 'virk', full_name: 'H virk' },
                { username: 'prasan' }
            ])
            expect(users).toHaveLength(2);

            expect(users[0].$isPersisted).toBeTruthy();
            expect(users[0].$isDirty).toBeFalsy();
            expect(users[0].$isLocal).toBeFalsy();
            expect(users[0].$attributes).toEqual({ username: 'virk', fullName: 'H virk' })
            expect(users[0].$original).toEqual({ username: 'virk', fullName: 'H virk' })

            expect(users[1].$isPersisted).toBeTruthy();
            expect(users[1].$isDirty).toBeFalsy();
            expect(users[1].$isLocal).toBeFalsy();
            expect(users[1].$attributes).toEqual({ username: 'prasan' })
            expect(users[1].$original).toEqual({ username: 'prasan' })
        })

        test('pass model options via $createMultipleFromAdapterResult', async () => {
            class User extends BaseModel {
                @column()
                public username: string

                @column({ columnName: 'full_name' })
                public fullName: string
            }

            const users = User.$createMultipleFromAdapterResult(
                [{ username: 'virk', full_name: 'H virk' }, { username: 'prasan' }],
                [],
                { connection: 'foo' }
            )

            expect(users).toHaveLength(2);

            expect(users[0].$isPersisted).toBeTruthy();
            expect(users[0].$isDirty).toBeFalsy();
            expect(users[0].$isLocal).toBeFalsy();
            expect(users[0].$options).toEqual({ connection: 'foo' })
            expect(users[0].$attributes).toEqual({ username: 'virk', fullName: 'H virk' })
            expect(users[0].$original).toEqual({ username: 'virk', fullName: 'H virk' })

            expect(users[1].$isPersisted).toBeTruthy();
            expect(users[1].$isDirty).toBeFalsy();
            expect(users[1].$isLocal).toBeFalsy();
            expect(users[1].$options).toEqual({ connection: 'foo' })
            expect(users[1].$attributes).toEqual({ username: 'prasan' })
            expect(users[1].$original).toEqual({ username: 'prasan' })
        })

        test('skip rows that are not valid objects inside array', async () => {
            class User extends BaseModel {
                @column()
                public username: string

                @column({ columnName: 'full_name' })
                public fullName: string
            }

            const users = User.$createMultipleFromAdapterResult([
                { username: 'virk', full_name: 'H virk' },
                null as any]
            )
            expect(users).toHaveLength(1);

            expect(users[0].$isPersisted).toBeTruthy();
            expect(users[0].$isDirty).toBeFalsy();
            expect(users[0].$isLocal).toBeFalsy();
            expect(users[0].$attributes).toEqual({ username: 'virk', fullName: 'H virk' })
            expect(users[0].$original).toEqual({ username: 'virk', fullName: 'H virk' })
        })

        test('invoke column consume method', async () => {
            class User extends BaseModel {
                @column()
                public username: string

                @column({
                    consume: (value) => value.toUpperCase()
                })
                public fullName: string
            }

            const user = User.$createFromAdapterResult({ full_name: 'virk' })

            expect(user!.$isPersisted).toBeTruthy();
            expect(user!.$isDirty).toBeFalsy();
            expect(user!.$isLocal).toBeFalsy();
            expect(user!.$attributes).toEqual({ fullName: 'VIRK' })
            expect(user!.$original).toEqual({ fullName: 'VIRK' })
        })
    });

    describe('Base Model | delete', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        test('delete model instance using adapter', async () => {
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column()
                public username: string
            }

            User.$adapter = adapter

            const user = new User()
            await user.delete()
            expect(adapter.operations).toEqual([{
                type: 'delete',
                instance: user
            }])

            expect(user.$isDeleted).toBeTruthy()
        })

        test('raise exception when trying to mutate model after deletion', async () => {
            const adapter = new FakeAdapter()
            expect.assertions(1)

            class User extends BaseModel {
                @column()
                public username: string
            }

            User.$adapter = adapter

            const user = new User()
            await user.delete()

            try {
                user.username = 'virk'
            } catch ({ message }) {
                expect(message).toBe('E_MODEL_DELETED: Cannot mutate delete model instance')
            }
        })
    });

    describe('Base Model | serializeAttributes', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        test('serialize attributes', async () => {
            class User extends BaseModel {
                @column()
                public username: string
            }

            const user = new User()
            user.username = 'virk'

            expect(user.serializeAttributes()).toEqual({ username: 'virk' })
        })

        test('invoke custom serialize method when serializing attributes', async () => {
            class User extends BaseModel {
                @column({ serialize: (value) => value.toUpperCase() })
                public username: string
            }

            const user = new User()
            user.username = 'virk'

            expect(user.serializeAttributes()).toEqual({ username: 'VIRK' })
        })

        test('use custom serializeAs key', async () => {
            class User extends BaseModel {
                @column({ serializeAs: 'uname' })
                public username: string
            }

            const user = new User()
            user.username = 'virk'

            expect(user.serializeAttributes()).toEqual({ uname: 'virk' })
        })

        test('do not serialize when serializeAs key is null', async () => {
            class User extends BaseModel {
                @column({ serializeAs: null })
                public username: string
            }

            const user = new User()
            user.username = 'virk'

            expect(user.serializeAttributes()).toEqual({})
        })

        test('cherry pick fields', async () => {
            class User extends BaseModel {
                @column()
                public username: string

                @column()
                public id: string
            }

            const user = new User()
            user.username = 'virk'
            user.id = '1'

            expect(user.serializeAttributes({ id: true })).toEqual({ id: '1' })
        })

        test('ignore fields marked as false', async () => {
            class User extends BaseModel {
                @column()
                public username: string

                @column()
                public id: string
            }

            const user = new User()
            user.username = 'virk'
            user.id = '1'

            expect(user.serializeAttributes({ id: true, username: false })).toEqual({ id: '1' })
        })

        test('ignore fields that has serializeAs = null, even when part of cherry picking object', async () => {
            class User extends BaseModel {
                @column()
                public username: string

                @column({ serializeAs: null })
                public id: string
            }

            const user = new User()
            user.username = 'virk'
            user.id = '1'

            expect(user.serializeAttributes({ id: true })).toEqual({})
        })

        test('do not invoke custom serialize method when raw flag is on', async () => {
            class User extends BaseModel {
                @column({ serialize: (value) => value.toUpperCase() })
                public username: string
            }

            const user = new User()
            user.username = 'virk'

            expect(user.serializeAttributes(undefined, true)).toEqual({ username: 'virk' })
        })

        test('use custom serializeAs key when raw flag is on', async () => {
            class User extends BaseModel {
                @column({ serializeAs: 'uname' })
                public username: string
            }

            const user = new User()
            user.username = 'virk'

            expect(user.serializeAttributes(undefined, true)).toEqual({ uname: 'virk' })
        })

        test('do not serialize with serializeAs = null, when raw flag is on', async () => {
            class User extends BaseModel {
                @column({ serializeAs: null })
                public username: string
            }

            const user = new User()
            user.username = 'virk'

            expect(user.serializeAttributes(undefined, true)).toEqual({})
        })

        test('cherry pick fields in raw mode', async () => {
            class User extends BaseModel {
                @column()
                public username: string

                @column()
                public id: string
            }

            const user = new User()
            user.username = 'virk'
            user.id = '1'

            expect(user.serializeAttributes({ id: true }, true)).toEqual({ id: '1' })
        })

        test('ignore fields marked as false in raw mode', async () => {
            class User extends BaseModel {
                @column()
                public username: string

                @column()
                public id: string
            }

            const user = new User()
            user.username = 'virk'
            user.id = '1'

            expect(user.serializeAttributes({ id: true, username: false }, true)).toEqual({ id: '1' })
        })
    });

    describe('Base Model | serializeRelations', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        test('serialize relations', async () => {
            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            const profile = new Profile()
            profile.username = 'virk'
            profile.userId = 1

            user.$setRelated('profile', profile)
            expect(user.serializeRelations()).toEqual({
                profile: {
                    username: 'virk',
                    user_id: 1
                }
            })
        })

        test('use custom serializeAs key when raw flag is on', async () => {
            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile, { serializeAs: 'userProfile' })
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            const profile = new Profile()
            profile.username = 'virk'
            profile.userId = 1

            user.$setRelated('profile', profile)
            expect(user.serializeRelations()).toEqual({
                userProfile: {
                    username: 'virk',
                    user_id: 1
                }
            })
        })

        test('do not serialize relations when serializeAs is null', async () => {
            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile, { serializeAs: null })
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            const profile = new Profile()
            profile.username = 'virk'
            profile.userId = 1

            user.$setRelated('profile', profile)
            expect(user.serializeRelations()).toEqual({})
        })

        test('do not recursively serialize relations when raw is true', async () => {
            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            const profile = new Profile()
            profile.username = 'virk'
            profile.userId = 1

            user.$setRelated('profile', profile)
            expect(user.serializeRelations(undefined, true)).toEqual({
                profile: profile
            })
        })

        test('use custom serializeAs key when raw flag is on', async () => {
            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile, { serializeAs: 'userProfile' })
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            const profile = new Profile()
            profile.username = 'virk'
            profile.userId = 1

            user.$setRelated('profile', profile)
            expect(user.serializeRelations(undefined, true)).toEqual({
                userProfile: profile
            })
        })

        test('do not serialize relations with serializeAs is null when raw flag is on', async () => {
            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile, { serializeAs: null })
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            const profile = new Profile()
            profile.username = 'virk'
            profile.userId = 1

            user.$setRelated('profile', profile)
            expect(user.serializeRelations(undefined, true)).toEqual({})
        })

        test('cherry pick relationship fields', async () => {
            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            const profile = new Profile()
            profile.username = 'virk'
            profile.userId = 1

            user.$setRelated('profile', profile)
            expect(user.serializeRelations({ profile: { user_id: true } })).toEqual({
                profile: {
                    user_id: 1
                }
            })
        })

        test('select all fields when relationship node value is a boolean', async () => {
            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            const profile = new Profile()
            profile.username = 'virk'
            profile.userId = 1

            user.$setRelated('profile', profile)
            expect(user.serializeRelations({ profile: true })).toEqual({
                profile: {
                    user_id: 1,
                    username: 'virk'
                }
            })
        })

        test('do not select any fields when relationship node value is an object', async () => {
            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            const profile = new Profile()
            profile.username = 'virk'
            profile.userId = 1

            user.$setRelated('profile', profile)
            expect(user.serializeRelations({ profile: {} })).toEqual({
                profile: {}
            })
        })
    });

    describe('Base Model | toJSON', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        test('convert model to its JSON representation', async () => {
            class User extends BaseModel {
                @column()
                public username: string
            }

            const user = new User()
            user.username = 'virk'

            expect(user.toJSON()).toEqual({ username: 'virk' })
        })

        test('use serializeAs key when converting model to JSON', async () => {
            class User extends BaseModel {
                @column({ serializeAs: 'theUsername' })
                public username: string
            }

            const user = new User()
            user.username = 'virk'

            expect(user.toJSON()).toEqual({ theUsername: 'virk' })
        })

        test('do not serialize when serializeAs is set to null', async () => {
            class User extends BaseModel {
                @column({ serializeAs: null })
                public username: string
            }

            const user = new User()
            user.username = 'virk'

            expect(user.toJSON()).toEqual({})
        })

        test('add computed properties to toJSON result', async () => {
            class User extends BaseModel {
                @column()
                public username: string

                @computed()
                public get fullName() {
                    return this.username.toUpperCase()
                }
            }

            const user = new User()
            user.username = 'virk'

            expect(user.toJSON()).toEqual({ username: 'virk', fullName: 'VIRK' })
        })

        test('do not add computed property when it returns undefined', async () => {
            class User extends BaseModel {
                @column()
                public username: string

                @computed()
                public get fullName() {
                    return undefined
                }
            }

            const user = new User()
            user.username = 'virk'

            expect(user.toJSON()).toEqual({ username: 'virk' })
        })

        test('cherry pick keys during serialization', async () => {
            class User extends BaseModel {
                @column()
                public username: string

                @computed()
                public get fullName() {
                    return this.username.toUpperCase()
                }
            }

            const user = new User()
            user.username = 'virk'

            expect(user.serialize({ username: true })).toEqual({ username: 'virk' })
        })
    });

    describe('Base Model | cache', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        test('cache getter value', () => {
            let invokedCounter = 0

            class User extends BaseModel {
                @column()
                public get username() {
                    return this.$getAttributeFromCache('username', (value) => {
                        invokedCounter++
                        return value.toUpperCase()
                    })
                }
            }

            const user = new User()
            user.$attributes = { username: 'virk' }

            expect(user.username).toBe('VIRK')
            expect(user.username).toBe('VIRK')
            expect(user.username).toBe('VIRK')
            expect(user.username).toBe('VIRK')
            expect(user.username).toBe('VIRK')
            expect(invokedCounter).toBe(1)
        })

        test('re-call getter function when attribute value changes', () => {
            let invokedCounter = 0

            class User extends BaseModel {
                @column()
                public get username() {
                    return this.$getAttributeFromCache('username', (value) => {
                        invokedCounter++
                        return value.toUpperCase()
                    })
                }
            }

            const user = new User()
            user.$attributes = { username: 'virk' }

            expect(user.username).toBe('VIRK')

            user.$attributes.username = 'Prasanjit'
            expect(user.username).toBe('PRASANJIT')
            expect(user.username).toBe('PRASANJIT')
            expect(user.username).toBe('PRASANJIT')
            expect(user.username).toBe('PRASANJIT')

            expect(invokedCounter).toBe(2)
        })
    });

    describe('BaseModel | fill/merge', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        test('fill model instance with bulk attributes', () => {
            class User extends BaseModel {
                @column()
                public username: string
            }

            const user = new User()
            user.fill({ username: 'virk' })
            expect(user.$attributes).toEqual({ username: 'virk' })
        })

        test('raise error when extra properties are defined', () => {
            class User extends BaseModel {
                @column()
                public username: string
            }

            const user = new User()
            const fn = () => user.fill({ username: 'virk', isAdmin: true } as any)
            expect(fn).toThrow('Cannot define "isAdmin" on "User" model, since it is not defined as a model property')
        })

        test('set extra properties via fill when allowExtraProperties is true', () => {
            class User extends BaseModel {
                @column()
                public username: string
            }

            const user = new User()
            user.fill({ username: 'virk', isAdmin: true } as any, true)
            expect(user.$attributes).toEqual({ username: 'virk' })
            expect(user.$extras).toEqual({ isAdmin: true })
        })

        test('overwrite existing values when using fill', () => {
            class User extends BaseModel {
                @column()
                public username: string

                @column()
                public age: number
            }

            const user = new User()
            user.age = 22

            expect(user.$attributes).toEqual({ age: 22 })
            user.fill({ username: 'virk' })
            expect(user.$attributes).toEqual({ username: 'virk' })
        })

        test('merge to existing when using merge instead of fill', () => {
            class User extends BaseModel {
                @column()
                public username: string

                @column()
                public age: number
            }

            const user = new User()
            user.age = 22

            expect(user.$attributes).toEqual({ age: 22 })
            user.merge({ username: 'virk' })
            expect(user.$attributes).toEqual({ username: 'virk', age: 22 })
        })

        test('set properties with explicit undefined values', () => {
            class User extends BaseModel {
                @column()
                public username: string

                @column()
                public age: number
            }

            const user = new User()
            user.age = 22

            expect(user.$attributes).toEqual({ age: 22 })
            user.merge({ username: 'virk', age: undefined })
            expect(user.$attributes).toEqual({ username: 'virk', age: undefined })
        })

        test('invoke setter when using fill', () => {
            class User extends BaseModel {
                @column()
                public username: string

                @column()
                public get age(): number {
                    return this.$getAttribute('age')
                }

                public set age(age: number) {
                    this.$setAttribute('age', age + 1)
                }
            }

            const user = new User()
            user.age = 22

            expect(user.$attributes).toEqual({ age: 23 })
            user.fill({ username: 'virk', age: 22 })
            expect(user.$attributes).toEqual({ username: 'virk', age: 23 })
        })

        test('fill using the column name', () => {
            class User extends BaseModel {
                @column()
                public firstName: string
            }

            const user = new User()
            user.fill({ first_name: 'virk' } as any)
            expect(user.$attributes).toEqual({ firstName: 'virk' })
        })

        test('invoke setter during fill when using column name', () => {
            class User extends BaseModel {
                @column()
                public username: string

                @column({ columnName: 'user_age' })
                public get age(): number {
                    return this.$getAttribute('age')
                }

                public set age(age: number) {
                    this.$setAttribute('age', age + 1)
                }
            }

            const user = new User()
            user.fill({ user_age: 22 } as any)
            expect(user.$attributes).toEqual({ age: 23 })
        })
    });

    describe('Base | apdater', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        test('pass model instance with attributes to the adapter insert method', async () => {
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column()
                public username: string
            }

            User.$adapter = adapter
            const user = new User()
            user.username = 'virk'
            user.$options = { connection: 'foo' }

            await user.save()

            expect(adapter.operations).toEqual([{
                type: 'insert',
                instance: user,
                attributes: { username: 'virk' }
            }])
        })

        test('pass model instance with attributes to the adapter update method', async () => {
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column()
                public username: string
            }

            User.$adapter = adapter
            const user = new User()
            user.username = 'virk'
            user.$options = { connection: 'foo' }

            await user.save()

            user.username = 'nikk'
            await user.save()

            expect(adapter.operations).toEqual([
                {
                    type: 'insert',
                    instance: user,
                    attributes: { username: 'virk' }
                },
                {
                    type: 'update',
                    instance: user,
                    attributes: { username: 'nikk' }
                }
            ])
        })

        test('pass model instance to the adapter delete method', async () => {
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column()
                public username: string
            }

            User.$adapter = adapter
            const user = new User()
            user.username = 'virk'
            user.$options = { connection: 'foo' }

            await user.save()
            await user.delete()

            expect(adapter.operations).toEqual([
                {
                    type: 'insert',
                    instance: user,
                    attributes: { username: 'virk' }
                },
                {
                    type: 'delete',
                    instance: user
                }
            ])
        })

        test('fill model instance with bulk attributes via column name is different', async () => {
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column({ columnName: 'first_name' })
                public firstName: string
            }

            User.$adapter = adapter

            const user = new User()
            user.fill({ firstName: 'virk' })
            await user.save()

            expect(adapter.operations).toEqual([
                {
                    type: 'insert',
                    instance: user,
                    attributes: { first_name: 'virk' }
                }
            ])
        })
    });

    describe('Base Model | sideloaded', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        test('define sideloaded properties using $consumeAdapterResults method', () => {
            class User extends BaseModel {
                @column()
                public username: string
            }

            const user = new User()
            user.$consumeAdapterResult({ username: 'virk' }, { loggedInUser: { id: 1 } })

            expect(user.$attributes).toEqual({ username: 'virk' })
            expect(user.$sideloaded).toEqual({ loggedInUser: { id: 1 } })
        })

        test('define sideloaded properties using $createFromAdapterResult method', () => {
            class User extends BaseModel {
                @column()
                public username: string
            }

            const user = User.$createFromAdapterResult({ username: 'virk' }, { loggedInUser: { id: 1 } })!
            expect(user.$attributes).toEqual({ username: 'virk' })
            expect(user.$sideloaded).toEqual({ loggedInUser: { id: 1 } })
        })

        test('define sideloaded properties using $createMultipleFromAdapterResult method', () => {
            class User extends BaseModel {
                @column()
                public username: string
            }

            const users = User.$createMultipleFromAdapterResult(
                [{ username: 'virk' }, { username: 'nikk' }],
                { loggedInUser: { id: 1 } }
            )

            expect(users[0].$attributes).toEqual({ username: 'virk' })
            expect(users[0].$sideloaded).toEqual({ loggedInUser: { id: 1 } })

            expect(users[1].$attributes).toEqual({ username: 'nikk' })
            expect(users[1].$sideloaded).toEqual({ loggedInUser: { id: 1 } })
        })
    });

    describe('Base Model | relations', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
        })

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        })

        test('set hasOne relation', async () => {
            const adapter = new FakeAdapter()

            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            Profile.$adapter = adapter
            user.$consumeAdapterResult({ id: 1 })
            user.$setRelated('profile', await Profile.create({ username: 'virk' }))

            expect(user.profile.username).toEqual('virk')
            expect(user.$preloaded.profile).toBeInstanceOf(Profile)
        })

        test('return undefined when relation is not preloaded', () => {
            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            user.$consumeAdapterResult({
                id: 1
            })

            expect(user.profile).toBeUndefined()
            expect(user.$preloaded).toEqual({})
        })

        test('serialize relation toJSON', async () => {
            const adapter = new FakeAdapter()

            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            Profile.$adapter = adapter
            user.$consumeAdapterResult({ id: 1 })
            user.$setRelated('profile', await Profile.create({ username: 'virk' }))

            expect(user.toJSON()).toEqual({
                id: 1,
                profile: {
                    username: 'virk'
                }
            })
        })

        test('cherry pick relationship keys during serialize', async () => {
            const adapter = new FakeAdapter()

            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            Profile.$adapter = adapter
            user.$consumeAdapterResult({ id: 1 })

            const profile = await Profile.create({ username: 'virk' })
            user.$setRelated('profile', profile)
            profile.userId = 1

            expect(user.serialize({ id: true, profile: { username: true } })).toEqual({
                id: 1,
                profile: {
                    username: 'virk'
                }
            })
        })

        test('serialize relation toJSON with custom serializeAs key', async () => {
            const adapter = new FakeAdapter()

            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile, { serializeAs: 'social' })
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            Profile.$adapter = adapter
            user.$consumeAdapterResult({ id: 1 })
            user.$setRelated('profile', await Profile.create({ username: 'virk' }))

            expect(user.toJSON()).toEqual({
                id: 1,
                social: {
                    username: 'virk'
                }
            })
        })

        test('push relationship', async () => {
            const adapter = new FakeAdapter()

            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Profile)
                public profiles: HasMany<typeof Profile>
            }

            const user = new User()
            Profile.$adapter = adapter
            user.$consumeAdapterResult({ id: 1 })
            user.$pushRelated('profiles', await Profile.create({ username: 'nikk' }))

            expect(user.toJSON()).toEqual({
                id: 1,
                profiles: [
                    {
                        username: 'nikk'
                    }
                ]
            })
        })

        test('push relationship to existing list', async () => {
            const adapter = new FakeAdapter()

            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Profile)
                public profiles: HasMany<typeof Profile>
            }

            const user = new User()
            Profile.$adapter = adapter
            user.$consumeAdapterResult({ id: 1 })
            user.$setRelated('profiles', [await Profile.create({ username: 'virk' })])
            user.$pushRelated('profiles', await Profile.create({ username: 'nikk' }))

            expect(user.toJSON()).toEqual({
                id: 1,
                profiles: [
                    {
                        username: 'virk'
                    },
                    {
                        username: 'nikk'
                    }
                ]
            })
        })

        test('push an array of relationships', async () => {
            const adapter = new FakeAdapter()

            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Profile)
                public profiles: HasMany<typeof Profile>
            }

            const user = new User()
            Profile.$adapter = adapter
            user.$consumeAdapterResult({ id: 1 })
            user.$pushRelated('profiles', [
                await Profile.create({ username: 'virk' }),
                await Profile.create({ username: 'nikk' })
            ])

            expect(user.toJSON()).toEqual({
                id: 1,
                profiles: [
                    {
                        username: 'virk'
                    },
                    {
                        username: 'nikk'
                    }
                ]
            })
        })

        test('raise error when pushing an array of relationships for hasOne', async () => {
            const adapter = new FakeAdapter()

            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasOne(() => Profile)
                public profile: HasOne<typeof Profile>
            }

            const user = new User()
            Profile.$adapter = adapter
            user.$consumeAdapterResult({ id: 1 })

            const profile = await Profile.create({ username: 'virk' })
            const profile1 = await Profile.create({ username: 'virk' })

            const fn = () => user.$pushRelated('profile', [profile, profile1] as any)
            expect(fn).toThrow('"User.profile" cannot reference more than one instance of "Profile" model')
        })

        test('raise error when setting single relationships for hasMany', async () => {
            const adapter = new FakeAdapter()

            class Profile extends BaseModel {
                @column()
                public username: string

                @column()
                public userId: number
            }

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @hasMany(() => Profile)
                public profiles: HasMany<typeof Profile>
            }

            const user = new User()
            Profile.$adapter = adapter
            user.$consumeAdapterResult({ id: 1 })

            const profile = await Profile.create({ username: 'virk' })

            const fn = () => user.$setRelated('profiles', profile as any)
            expect(fn).toThrow('"User.profiles" must be an array when setting "hasMany" relationship')
        })
    });

    describe('Base Model | hooks', () => {
        beforeAll(async () => {
            db = getDb()
            await setup();
            BaseModel = getBaseModel(ormAdapter(db));
        });

        afterAll(async () => {
            await db.manager.closeAll();
            await cleanup();
        });

        afterEach(async () => {
            await resetTables()
        })

        test('invoke before and after create hooks', async () => {
            expect.assertions(9)
            const stack: string[] = []

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @beforeCreate()
                public static beforeCreateHook(model: User) {
                    stack.push('beforeCreateHook')
                    expect(model).toBeInstanceOf(User)
                    expect(model.$isPersisted).toBeFalsy()
                }

                @beforeSave()
                public static beforeSaveHook(model: User) {
                    stack.push('beforeSaveHook')
                    expect(model).toBeInstanceOf(User)
                    expect(model.$isPersisted).toBeFalsy()
                }

                @afterCreate()
                public static afterCreateHook(model: User) {
                    stack.push('afterCreateHook')
                    expect(model).toBeInstanceOf(User)
                    expect(model.$isPersisted).toBeTruthy()
                }

                @afterSave()
                public static afterSaveHook(model: User) {
                    stack.push('afterSaveHook')
                    expect(model).toBeInstanceOf(User)
                    expect(model.$isPersisted).toBeTruthy()
                }
            }

            const user = new User()
            user.username = 'virk'
            await user.save()
            expect(stack).toEqual([
                'beforeCreateHook',
                'beforeSaveHook',
                'afterCreateHook',
                'afterSaveHook'
            ])
        })

        test('abort create when before hook raises exception', async () => {
            expect.assertions(3)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                public static boot() {
                    if ( this.booted ) {
                        return
                    }

                    super.boot()

                    this.before('create', (model) => {
                        expect(model).toBeInstanceOf(User)
                        expect(model.$isPersisted).toBeFalsy()
                        throw new Error('Wait')
                    })

                    this.before('save', (model) => {
                        expect(model).toBeInstanceOf(User)
                        expect(model.$isPersisted).toBeFalsy()
                    })

                    this.after('create', (model) => {
                        expect(model).toBeInstanceOf(User)
                        expect(model.$isPersisted).toBeTruthy()
                    })

                    this.after('save', (model) => {
                        expect(model).toBeInstanceOf(User)
                        expect(model.$isPersisted).toBeTruthy()
                    })
                }
            }

            const user = new User()
            user.username = 'virk'

            try {
                await user.save()
            } catch ({ message }) {
                expect(message).toBe('Wait')
            }
        })

        test('listen for trx on after save commit', async () => {
            expect.assertions(1)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @afterSave()
                public static afterSaveHook(model: User) {
                    if ( model.$trx ) {
                        model.$trx.on('commit', () => {
                            expect(true).toBeTruthy()
                        })
                    }
                }
            }

            const trx = await db.transaction()

            const user = new User()
            user.username = 'virk'
            user.$trx = trx
            await user.save()

            await trx.commit()
        })

        test('listen for trx on after save rollback', async () => {
            expect.assertions(1)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @afterSave()
                public static afterSaveHook(model: User) {
                    if ( model.$trx ) {
                        model.$trx.on('rollback', () => {
                            expect(true).toBeTruthy()
                        })
                    }
                }
            }

            const trx = await db.transaction()

            const user = new User()
            user.username = 'virk'
            user.$trx = trx
            await user.save()

            await trx.rollback()
        })

        test('invoke before and after update hooks', async () => {
            expect.assertions(10)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @beforeUpdate()
                public static beforeUpdateHook(model: User) {
                    expect(model).toBeInstanceOf(User)
                    expect(model.$isDirty).toBeTruthy()
                }

                @beforeSave()
                public static beforeSaveHook(model: User) {
                    expect(model).toBeInstanceOf(User)
                    expect(model.$isDirty).toBeTruthy()
                }

                @afterUpdate()
                public static afterUpdateHook(model: User) {
                    expect(model).toBeInstanceOf(User)
                    expect(model.$isDirty).toBeFalsy()
                }

                @afterSave()
                public static afterSaveHook(model: User) {
                    expect(model).toBeInstanceOf(User)
                    expect(model.$isDirty).toBeFalsy()
                }
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const user = await User.findOrFail(1)

            user.username = 'nikk'
            await user.save()

            const users = await db.from('users')
            expect(users).toHaveLength(1)
            expect(users[0].username).toBe('nikk')
        })

        test('abort update when before hook raises exception', async () => {
            expect.assertions(5)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                public static boot() {
                    if ( this.booted ) {
                        return
                    }

                    super.boot()

                    this.before('update', (model) => {
                        expect(model).toBeInstanceOf(User)
                        expect(model.$isDirty).toBeTruthy()
                        throw new Error('Wait')
                    })

                    this.before('save', (model) => {
                        expect(model).toBeInstanceOf(User)
                        expect(model.$isDirty).toBeTruthy()
                    })

                    this.after('update', (model) => {
                        expect(model).toBeInstanceOf(User)
                        expect(model.$isDirty).toBeFalsy()
                    })

                    this.after('save', (model) => {
                        expect(model).toBeInstanceOf(User)
                        expect(model.$isDirty).toBeFalsy()
                    })
                }
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const user = await User.findOrFail(1)

            user.username = 'nikk'

            try {
                await user.save()
            } catch ({ message }) {
                expect(message).toBe('Wait')
            }

            const users = await db.from('users')
            expect(users).toHaveLength(1)
            expect(users[0].username).toBe('virk')
        })

        test('invoke before and after delete hooks', async () => {
            expect.assertions(3)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @beforeDelete()
                public static beforeDeleteHook(model: User) {
                    expect(model).toBeInstanceOf(User)
                }

                @afterDelete()
                public static afterDeleteHook(model: User) {
                    expect(model).toBeInstanceOf(User)
                }
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const user = await User.findOrFail(1)
            await user.delete()

            const usersCount = await db.from('users').count('*', 'total')
            expect(Number(usersCount[0].total)).toBe(0)
        })

        test('abort delete when before hook raises exception', async () => {
            expect.assertions(3)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                public static boot() {
                    if ( this.booted ) {
                        return
                    }

                    super.boot()

                    this.before('delete', (model) => {
                        expect(model).toBeInstanceOf(User)
                        throw new Error('Wait')
                    })

                    this.after('delete', (model) => {
                        expect(model).toBeInstanceOf(User)
                    })
                }
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const user = await User.findOrFail(1)

            try {
                await user.delete()
            } catch ({ message }) {
                expect(message).toBe('Wait')
            }

            const usersCount = await db.from('users').count('*', 'total')
            expect(Number(usersCount[0].total)).toBe(1)
        })

        test('invoke before and after fetch hooks', async () => {
            expect.assertions(3)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @beforeFetch()
                public static beforeFetchHook(query: ModelQueryBuilder) {
                    expect(query).toBeInstanceOf(ModelQueryBuilder)
                }

                @afterFetch()
                public static afterFetchHook(users: User[]) {
                    expect(users).toHaveLength(1)
                    expect(users[0].username).toBe('virk')
                }
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await User.query()
        })

        test('invoke before and after find hooks', async () => {
            expect.assertions(2)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @beforeFind()
                public static beforeFindHook(query: ModelQueryBuilder) {
                    expect(query).toBeInstanceOf(ModelQueryBuilder)
                }

                @afterFind()
                public static afterFindHook(user: User) {
                    expect(user.username).toBe('virk')
                }
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await User.find(1)
        })

        test('invoke before and after find hooks when .first method is used', async () => {
            expect.assertions(2)

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @beforeFind()
                public static beforeFindHook(query: ModelQueryBuilder) {
                    expect(query).toBeInstanceOf(ModelQueryBuilder)
                }

                @afterFind()
                public static afterFindHook(user: User) {
                    expect(user.username).toBe('virk')
                }
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            await User.query().where('id', 1).first()
        })
    });

    describe('Base model | extend', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        });

        afterAll(async () => {
            await db.manager.closeAll();
        });

        test('extend model query builder', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string
            }

            User.boot()

            db.ModelQueryBuilder.macro('whereActive', function() {
                this.where('is_active', true)
                return this
            })

            const knexClient = db.connection().getReadClient()
            const { sql, bindings } = User.query()['whereActive']().toSQL()
            const { sql: knexSql, bindings: knexBindings } = knexClient
                .from('users')
                .where('is_active', true)
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })

        test('extend model insert query builder', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                public $getQueryFor(_, client) {
                    return client.insertQuery().table('users').withId()
                }
            }

            User.boot()

            db.InsertQueryBuilder.macro('withId', function() {
                this.returning('id')
                return this
            })

            const knexClient = db.connection().getReadClient()
            const user = new User()

            const { sql, bindings } = user
                .$getQueryFor('insert', db.connection())
                .insert({ id: 1 })
                .toSQL()

            const { sql: knexSql, bindings: knexBindings } = knexClient
                .from('users')
                .returning('id')
                .insert({ id: 1 })
                .toSQL()

            expect(sql).toBe(knexSql)
            expect(bindings).toEqual(knexBindings)
        })
    });

    describe('Base Model | aggregates', () => {
        beforeAll(async () => {
            db = getDb()
            await setup();
            BaseModel = getBaseModel(ormAdapter(db))
        });

        afterAll(async () => {
            await db.manager.closeAll();
            await cleanup();
        });

        afterEach(async () => {
            await resetTables()
        })

        test('count *', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string
            }

            await db.insertQuery().table('users').multiInsert([{ username: 'virk' }, { username: 'nikk' }])
            const usersCount = await User.query().count('* as total')
            expect(usersCount.map((row) => {
                row.total = Number(row.total)
                return row
            })).toEqual([{ total: 2 }])
        })

        test('count * distinct', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string
            }

            await db.insertQuery().table('users').multiInsert([{ username: 'virk' }, { username: 'nikk' }])
            const usersCount = await User.query().countDistinct('username as total')
            expect(usersCount.map((row) => {
                row.total = Number(row.total)
                return row
            })).toEqual([{ total: 2 }])
        })
    });

    describe('Base Model | date', () => {
        beforeAll(async () => {
            db = getDb();
            await setup();
            BaseModel = getBaseModel(ormAdapter(db))
        });

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll();
        });

        afterEach(async () => {
            await resetTables()
        })

        test('define date column', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date()
                public dob: DateTime
            }

            expect(User.$getColumn('dob')!.meta).toEqual({
                autoCreate: false,
                autoUpdate: false,
                type: 'date'
            })
        })

        test('define date column and turn on autoCreate flag', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date({ autoCreate: true })
                public dob: DateTime
            }

            expect(User.$getColumn('dob')!.meta).toEqual({
                autoCreate: true,
                autoUpdate: false,
                type: 'date'
            })
        })

        test('define date column and turn on autoUpdate flag', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date({ autoUpdate: true })
                public dob: DateTime
            }

            expect(User.$getColumn('dob')!.meta).toEqual({
                autoCreate: false,
                autoUpdate: true,
                type: 'date'
            })
        })

        test('initiate date column values with current date when missing', async () => {
            expect.assertions(1)

            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date({ autoCreate: true })
                public dob: DateTime
            }

            const user = new User()
            User.$adapter = adapter

            adapter.on('insert', (model: any) => {
                expect(model.dob).toBeInstanceOf(DateTime)
            })

            user.username = 'virk'
            await user.save()
        })

        test('do initiate date column values with current date when autoCreate is off', async () => {
            expect.assertions(2)

            const adapter = new FakeAdapter()

            class User extends BaseModel implements LucidRow {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date({ autoCreate: true })
                public dob: DateTime

                @column.date()
                public createdAt: DateTime
            }

            const user = new User()
            User.$adapter = adapter
            adapter.on('insert', (model: User) => {
                expect(model.dob).toBeInstanceOf(DateTime)
                expect(model.createdAt).toBeUndefined()
            })

            user.username = 'virk'
            await user.save()
        })

        test('always update date column value when autoUpdate is on', async () => {
            expect.assertions(1)

            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date({ autoUpdate: true })
                public updatedAt: DateTime
            }

            const user = new User()
            User.$adapter = adapter
            adapter.on('insert', (model: User) => {
                expect(model.updatedAt).not.toStrictEqual(localTime);
            })

            const localTime = DateTime.local(2010)
            user.username = 'virk'
            user.updatedAt = localTime
            await user.save()
        })

        test('only register one hook, regardless of date columns a model has', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date()
                public dob: DateTime

                @column.date()
                public createdAt: DateTime
            }

            expect(User.$hooks['hooks'].before.get('save').size).toBe(1)
        })

        test('format date instance to string before sending to the adapter', async () => {
            expect.assertions(1)
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date({ autoCreate: true })
                public dob: DateTime
            }

            const user = new User()
            User.$adapter = adapter
            adapter.on('insert', (_: User, attributes) => {
                expect(attributes).toEqual({ username: 'virk', dob: DateTime.local().toISODate() })
            })

            user.username = 'virk'
            await user.save()
        })

        test('leave date untouched when it is defined as string', async () => {
            expect.assertions(1)
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date()
                public dob: DateTime
            }

            const user = new User()
            User.$adapter = adapter
            adapter.on('insert', (_: User, attributes) => {
                expect(attributes).toEqual({ username: 'virk', dob: '2010-11-20' })
            })

            user.username = 'virk'
            user.dob = '2010-11-20' as any
            await user.save()
        })

        test('do not attempt to format undefined values', async () => {
            expect.assertions(1)
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date()
                public dob: DateTime
            }

            const user = new User()
            User.$adapter = adapter
            adapter.on('insert', (_: User, attributes) => {
                expect(attributes).toEqual({ username: 'virk' })
            })

            user.username = 'virk'
            await user.save()
        })

        test('raise error when date column value is unprocessable', async () => {
            expect.assertions(1)

            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date()
                public dob: DateTime
            }

            const user = new User()
            User.$adapter = adapter

            user.username = 'virk'
            user.dob = 10 as any
            try {
                await user.save()
            } catch ({ message }) {
                expect(
                    message).toBe('E_INVALID_DATE_COLUMN_VALUE: The value for "User.dob" must be an instance of "luxon.DateTime"'
                )
            }
        })

        test('raise error when datetime is invalid', async () => {
            expect.assertions(1)

            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date()
                public dob: DateTime
            }

            const user = new User()
            user.dob = DateTime.fromISO('hello-world')
            User.$adapter = adapter

            user.username = 'virk'
            try {
                await user.save()
            } catch ({ message }) {
                expect(
                    message).toBe('E_INVALID_DATE_COLUMN_VALUE: Invalid value for "User.dob". unparsable'
                )
            }
        })

        test('allow overriding prepare method', async () => {
            expect.assertions(1)
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date({
                    autoCreate: true,
                    prepare: (value: DateTime) => value.toISOWeekDate()
                })
                public dob: DateTime
            }

            const user = new User()
            User.$adapter = adapter
            adapter.on('insert', (_: User, attributes) => {
                expect(attributes).toEqual({ username: 'virk', dob: DateTime.local().toISOWeekDate() })
            })

            user.username = 'virk'
            await user.save()
        })

        test('convert date to datetime instance during fetch', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date()
                public createdAt: DateTime
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const user = await User.find(1)
            expect(user!.createdAt).toBeInstanceOf(DateTime)
        })

        test('ignore null or empty values during fetch', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date()
                public updatedAt: DateTime
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const user = await User.find(1)
            expect(user!.updatedAt).toBeNull()
        })

        test('convert date to toISODate during serialize', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date()
                public createdAt: DateTime
            }

            await db.insertQuery().table('users').insert({
                username: 'virk',
                created_at: DateTime.local().toISODate()
            })
            const user = await User.find(1)
            expect(user!.toJSON().created_at).toMatch(/\d{4}-\d{2}-\d{2}/);
        })

        test('do not attempt to serialize, when already a string', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date({
                    consume: (value) => typeof (value) === 'string'
                        ? DateTime.fromSQL(value).minus({ day: 1 }).toISODate()
                        : DateTime.fromJSDate(value).minus({ day: 1 }).toISODate()
                })
                public createdAt: DateTime
            }

            await db.insertQuery().table('users').insert({
                username: 'virk',
                created_at: DateTime.local().toISODate()
            })
            const user = await User.find(1)
            expect(user!.toJSON().created_at).toBe(DateTime.local().minus({ day: 1 }).toISODate())
        })
    });

    describe('Base Model | datetime', () => {
        beforeAll(async () => {
            db = getDb()
            await setup();
            BaseModel = getBaseModel(ormAdapter(db))
        });

        afterAll(async () => {
            await db.manager.closeAll();
            await cleanup();
        });

        afterEach(async () => {
            await resetTables()
        })

        test('define datetime column', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.dateTime()
                public dob: DateTime
            }

            expect(User.$getColumn('dob')!.meta).toEqual({
                autoCreate: false,
                autoUpdate: false,
                type: 'datetime'
            })
        })

        test('define datetime column and turn on autoCreate flag', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.dateTime({ autoCreate: true })
                public dob: DateTime
            }

            expect(User.$getColumn('dob')!.meta).toEqual({
                autoCreate: true,
                autoUpdate: false,
                type: 'datetime'
            })
        })

        test('define datetime column and turn on autoUpdate flag', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.dateTime({ autoUpdate: true })
                public dob: DateTime
            }

            expect(User.$getColumn('dob')!.meta).toEqual({
                autoCreate: false,
                autoUpdate: true,
                type: 'datetime'
            })
        })

        test('initiate datetime column values with current date when missing', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.dateTime({ autoCreate: true })
                public joinedAt: DateTime
            }

            const user = new User()
            user.username = 'virk'
            await user.save()
            expect(user.joinedAt).toBeInstanceOf(DateTime)

            const createdUser = await db.from('users').select('*').first()

            const clientDateFormat = User.query().client.dialect.dateTimeFormat
            const fetchedJoinedAt = createdUser.joined_at instanceof Date
                ? DateTime.fromJSDate(createdUser.joined_at)
                : DateTime.fromSQL(createdUser.joined_at)

            expect(
                fetchedJoinedAt.toFormat(clientDateFormat)).toBe(user.joinedAt.toFormat(clientDateFormat)
            )
        })

        test('ignore undefined values', async () => {
            expect.assertions(1)

            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.dateTime()
                public dob: DateTime
            }

            const user = new User()
            User.$adapter = adapter


            // Error:(2786, 24) TS2769: No overload matches this call.
            //   The last overload gave the following error.
            //     Argument of type '"insert"' is not assignable to parameter of type '"findAll"'.
            adapter.on('insert', (_: User, attributes) => {
                expect(attributes.dob).toBeUndefined()
            })

            user.username = 'virk'
            await user.save()
        })

        test('ignore string values', async () => {
            expect.assertions(1)

            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.dateTime()
                public dob: DateTime
            }

            const user = new User()
            User.$adapter = adapter
            adapter.on('insert', (_: User, attributes) => {
                expect(attributes.dob).toBe(localTime)
            })

            const localTime = DateTime.local().toISO()
            user.username = 'virk'
            user.dob = localTime as any
            await user.save()
        })

        test('raise error when datetime column value is unprocessable', async () => {
            expect.assertions(1)

            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.dateTime()
                public dob: DateTime
            }

            const user = new User()
            User.$adapter = adapter

            user.username = 'virk'
            user.dob = 10 as any
            try {
                await user.save()
            } catch ({ message }) {
                expect(
                    message).toBe('E_INVALID_DATETIME_COLUMN_VALUE: The value for "User.dob" must be an instance of "luxon.DateTime"'
                )
            }
        })

        test('only register one hook, regardless of date columns a model has', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.date()
                public dob: DateTime

                @column.dateTime()
                public createdAt: DateTime
            }

            expect(User.$hooks['hooks'].before.get('save').size).toBe(1)
        })

        test('allow overriding prepare method', async () => {
            expect.assertions(1)
            const adapter = new FakeAdapter()

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.dateTime({
                    autoCreate: true,
                    prepare: (value: DateTime) => value.toISOWeekDate()
                })
                public dob: DateTime
            }

            const user = new User()
            User.$adapter = adapter
            adapter.on('insert', (_: User, attributes) => {
                expect(attributes).toEqual({ username: 'virk', dob: DateTime.local().toISOWeekDate() })
            })

            user.username = 'virk'
            await user.save()
        })

        test('convert timestamp to datetime instance during fetch', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.dateTime()
                public createdAt: DateTime
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const user = await User.find(1)
            expect(user!.createdAt).toBeInstanceOf(DateTime)
        })

        test('ignore null or empty values during fetch', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column.dateTime()
                public updatedAt: DateTime
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const user = await User.find(1)
            expect(user!.updatedAt).toBeNull()
        })
    });

    describe('Query', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        });

        afterAll(async () => {
            await db.manager.closeAll();
        });

        it('get instance of query builder for the given model', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public userName: string
            }

            const user = User.query();

            expect(user).toBeInstanceOf(ModelQueryBuilder);
            if ( process.env.DB === 'mysql' ) {
                expect(user.toSQL().sql).toBe('select * from "users"');
                expect(user.select('id').toSQL().sql).toBe(['select `id`', ' from `users`'].join(''));
            }
        });
    });

    describe('Base Model | paginate', () => {
        beforeAll(async () => {
            db = getDb();
            await setup();
            BaseModel = getBaseModel(ormAdapter(db))
        });

        afterAll(async () => {
            await cleanup();
            await db.manager.closeAll();
        });

        afterEach(async () => {
            await resetTables()
        })

        test('paginate through rows', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string
            }

            await db.insertQuery().table('users').multiInsert(getUsers(18))
            const users = await User.query().paginate(1, 5)
            users.baseUrl('/users')

            expect(users.all()).toHaveLength(5)
            expect(users.all()[0]).toBeInstanceOf(User)
            expect(users.perPage).toBe(5)
            expect(users.currentPage).toBe(1)
            expect(users.lastPage).toBe(4)
            expect(users.hasPages).toBeTruthy()
            expect(users.hasMorePages).toBeTruthy()
            expect(users.isEmpty).toBeFalsy()
            expect(Number(users.total)).toBe(18)
            expect(users.hasTotal).toBeTruthy()
            expect(users.getMeta()).toEqual({
                total: 18,
                per_page: 5,
                current_page: 1,
                last_page: 4,
                first_page: 1,
                first_page_url: '/users?page=1',
                last_page_url: '/users?page=4',
                next_page_url: '/users?page=2',
                previous_page_url: null
            })
        })
    });

    describe('Base Model | fetch', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
            await setup()
        });

        afterAll(async () => {
            await cleanup()
            await db.manager.closeAll()
        });

        afterEach(async () => {
            await resetTables()
        });

        test('find using the primary key', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const user = await User.find(1)

            expect(user).toBeInstanceOf(User);
            expect(user!.$primaryKeyValue).toBe(1);
        })

        test('raise exception when row is not found', async () => {
            expect.assertions(1);

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string
            }

            try {
                await User.findOrFail(1)
            } catch ({ message }) {
                expect(message).toBe('E_ROW_NOT_FOUND: Row not found');
            }
        })

        test('find many using the primary key', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string
            }

            await db.insertQuery().table('users').multiInsert([
                { username: 'virk' },
                { username: 'nikk' }
            ])

            const users = await User.findMany([1, 2]);
            expect(users).toHaveLength(2);
            expect(users[0].$primaryKeyValue).toBe(2);
            expect(users[1].$primaryKeyValue).toBe(1);
        });

        test('return the existing row when search criteria matches', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'username' })
                public userName: string

                @column()
                public email: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const user = await User.firstOrCreate({ userName: 'virk' })

            const totalUsers = await db.query().from('users').count('*', 'total')

            expect(Number(totalUsers[0].total)).toBe(1);
            expect(user.$primaryKeyValue).toBe(1);
            expect(user.$isPersisted).toBe(true);
            expect(user).toBeInstanceOf(User);
        });

        test('create new row when search criteria doesn\'t match', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'username' })
                public userName: string

                @column()
                public email: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const user = await User.firstOrCreate({ userName: 'nikk' }, { email: 'nikk@gmail.com' })

            const totalUsers = await db.query().from('users').count('*', 'total');

            expect(Number(totalUsers[0].total)).toBe(2);
            expect(user).toBeInstanceOf(User);

            expect(user!.$primaryKeyValue).toBe(2);
            expect(user!.$isPersisted).toBe(true);
            expect(user!.email).toBe('nikk@gmail.com');
            expect(user!.userName).toBe('nikk');
        });

        test('return the existing row when search criteria matches using firstOrNew', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'username' })
                public userName: string

                @column()
                public email: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const user = await User.firstOrNew({ userName: 'virk' })

            const totalUsers = await db.query().from('users').count('*', 'total')

            expect(Number(totalUsers[0].total)).toBe(1);
            expect(user).toBeInstanceOf(User);

            expect(user!.$primaryKeyValue).toBe(1);
            expect(user!.$isPersisted).toBe(true);
        })

        test('instantiate new row when search criteria doesn\'t match using firstOrNew', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'username' })
                public userName: string

                @column()
                public email: string
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const user = await User.firstOrNew({ userName: 'nikk' }, { email: 'nikk@gmail.com' })

            const totalUsers = await db.query().from('users').count('*', 'total')

            expect(Number(totalUsers[0].total)).toBe(1);
            expect(user).toBeInstanceOf(User);

            expect(user!.$primaryKeyValue).toBeUndefined();
            expect(user!.$isPersisted).toBe(false);
            expect(user!.email).toBe('nikk@gmail.com');
            expect(user!.userName).toBe('nikk');
        })

        test('update the existing row when search criteria matches', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'username' })
                public userName: string

                @column()
                public email: string

                @column()
                public points: number
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const user = await User.updateOrCreate({ userName: 'virk' }, { points: 20 })
            expect(user!.$isPersisted).toBe(true);
            expect(user!.points).toBe(20);
            expect(user!.userName).toBe('virk');

            const users = await db.query().from('users')

            expect(users).toHaveLength(1);
            expect(users[0].points).toBe(20);
        })

        test('execute updateOrCreate update action inside a transaction', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'username' })
                public userName: string

                @column()
                public email: string

                @column()
                public points: number
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const trx = await db.transaction()

            const user = await User.updateOrCreate({ userName: 'virk' }, { points: 20 }, { client: trx })

            expect(user!.$isPersisted).toBe(true);
            expect(user!.points).toBe(20);
            expect(user!.userName).toBe('virk');

            await trx.rollback()

            const users = await db.query().from('users')
            expect(users).toHaveLength(1);
            expect(users[0]!.points).toBe(0);
            expect(users[0]!.username).toBe('virk');
        })

        test('create a new row when search criteria fails', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @column()
                public points: number
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const user = await User.updateOrCreate({ username: 'nikk' }, { points: 20 })

            expect(user!.$isPersisted).toBe(true);
            expect(user!.points).toBe(20);
            expect(user!.username).toBe('nikk');

            const users = await db.query().from('users')
            expect(users).toHaveLength(2);

            expect(users[0].points).toBe(0);
            expect(users[0].username).toBe('virk');

            expect(users[1].points).toBe(20);
            expect(users[1].username).toBe('nikk');
        })

        test('execute updateOrCreate create action inside a transaction', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @column()
                public points: number
            }

            await db.insertQuery().table('users').insert({ username: 'virk' })
            const trx = await db.transaction()

            const user = await User.updateOrCreate({ username: 'nikk' }, { points: 20 }, { client: trx })

            expect(user!.$isPersisted).toBe(true);
            expect(user!.points).toBe(20);
            expect(user!.username).toBe('nikk');

            await trx.rollback()

            const users = await db.query().from('users')
            expect(users).toHaveLength(1);

            expect(users[0].points).toBe(0);
            expect(users[0].username).toBe('virk');
        })

        test('persist records to db when find call returns zero rows', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @column()
                public points: number
            }

            const users = await User.fetchOrCreateMany(
                'username',
                [
                    {
                        username: 'virk',
                        email: 'virk@gmail.com'
                    },
                    {
                        username: 'nikk',
                        email: 'nikk@gmail.com'
                    },
                    {
                        username: 'romain',
                        email: 'romain@gmail.com'
                    }
                ]
            )
            expect(users).toHaveLength(3);

            expect(users[0].$isPersisted).toBe(true);
            expect(users[0].username).toBe('virk');
            expect(users[0].email).toBe('virk@gmail.com');

            expect(users[1].$isPersisted).toBe(true);
            expect(users[1].username).toBe('nikk');
            expect(users[1].email).toBe('nikk@gmail.com');

            expect(users[2].$isPersisted).toBe(true);
            expect(users[2].username).toBe('romain');
            expect(users[2].email).toBe('romain@gmail.com');

            const usersList = await db.query().from('users')
            expect(usersList).toHaveLength(3);
        })

        test('sync records by avoiding duplicates', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @column()
                public points: number
            }

            await db.insertQuery().table('users').insert({
                username: 'virk',
                email: 'virk@gmail.com',
                points: 10
            })

            const users = await User.fetchOrCreateMany(
                'username',
                [
                    {
                        username: 'virk',
                        email: 'virk@gmail.com'
                    },
                    {
                        username: 'nikk',
                        email: 'nikk@gmail.com'
                    },
                    {
                        username: 'romain',
                        email: 'romain@gmail.com'
                    }
                ]
            )

            expect(users).toHaveLength(3);

            expect(users[0].$isPersisted).toBe(true);
            expect(users[0].username).toBe('virk');
            expect(users[0].email).toBe('virk@gmail.com');
            expect(users[0].points).toBe(10);

            expect(users[1].$isPersisted).toBe(true);
            expect(users[1].username).toBe('nikk');
            expect(users[1].email).toBe('nikk@gmail.com');
            expect(users[1].points).toBeUndefined();

            expect(users[2].$isPersisted).toBe(true);
            expect(users[2].username).toBe('romain');
            expect(users[2].email).toBe('romain@gmail.com');
            expect(users[2].points).toBeUndefined()

            const usersList = await db.query().from('users')
            expect(usersList).toHaveLength(3);
        })

        test('wrap create calls inside a transaction', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @column()
                public points: number
            }

            await db.insertQuery().table('users').insert({
                username: 'virk',
                email: 'virk@adonisjs.com',
                points: 10
            })

            const trx = await db.transaction()

            await User.fetchOrCreateMany(
                'username',
                [
                    {
                        username: 'virk',
                        email: 'virk@adonisjs.com'
                    },
                    {
                        username: 'nikk',
                        email: 'nikk@adonisjs.com'
                    },
                    {
                        username: 'romain',
                        email: 'romain@adonisjs.com'
                    }
                ],
                {
                    client: trx
                }
            )

            await trx.rollback()
            const usersList = await db.query().from('users')
            expect(usersList).toHaveLength(1);
        })

        test('handle columns with different cast key name', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({ columnName: 'username' })
                public userName: string

                @column()
                public email: string

                @column()
                public points: number
            }

            await db.insertQuery().table('users').insert({
                username: 'virk',
                email: 'virk@gmail.com',
                points: 10
            })

            const users = await User.fetchOrCreateMany(
                'userName',
                [
                    {
                        userName: 'virk',
                        email: 'virk@gmail.com'
                    },
                    {
                        userName: 'nikk',
                        email: 'nikk@gmail.com'
                    },
                    {
                        userName: 'romain',
                        email: 'romain@gmail.com'
                    }
                ]
            )

            expect(users).toHaveLength(3);

            expect(users[0].$isPersisted).toBe(true);
            expect(users[0].userName).toBe('virk');
            expect(users[0].email).toBe('virk@gmail.com');
            expect(users[0].points).toBe(10);

            expect(users[1].$isPersisted).toBe(true);
            expect(users[1].userName).toBe('nikk');
            expect(users[1].email).toBe('nikk@gmail.com');
            expect(users[1].points).toBeUndefined();

            expect(users[2].$isPersisted).toBe(true);
            expect(users[2].userName).toBe('romain');
            expect(users[2].email).toBe('romain@gmail.com');
            expect(users[2].points).toBeUndefined()

            const usersList = await db.query().from('users')
            expect(usersList).toHaveLength(3);
        })

        test('raise exception when one or more rows fails', async () => {
            expect.assertions(2);

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @column()
                public points: number
            }

            await db.insertQuery().table('users').insert({
                username: 'virk',
                email: 'virk@adonisjs.com',
                points: 10
            })

            const trx = await db.transaction()

            try {
                await User.fetchOrCreateMany(
                    'username',
                    [
                        {
                            username: 'nikk',
                            email: 'virk@adonisjs.com'
                        },
                        {
                            username: 'romain',
                            email: 'romain@adonisjs.com'
                        }
                    ],
                    {
                        client: trx
                    }
                )
            } catch (error) {
                expect(error).toBeDefined();
                await trx.rollback()
            }

            const usersList = await db.query().from('users')
            expect(usersList).toHaveLength(1);
        })

        test('raise exception when value of unique key inside payload is undefined', async () => {
            expect.assertions(2);

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @column()
                public points: number
            }

            await db.insertQuery().table('users').insert({
                username: 'virk',
                email: 'virk@adonisjs.com',
                points: 10
            })

            try {
                await User.fetchOrCreateMany(
                    'username',
                    [
                        {
                            email: 'virk@adonisjs.com'
                        },
                        {
                            username: 'romain',
                            email: 'romain@adonisjs.com'
                        }
                    ]
                )
            } catch ({ message }) {
                expect(message).toBe('Value for the "username" is null or undefined inside "fetchOrNewUpMany" payload');
            }

            const usersList = await db.query().from('users')
            expect(usersList).toHaveLength(1);
        })

        test('raise exception when key is not defined on the model', async () => {
            expect.assertions(2);

            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public email: string

                @column()
                public points: number
            }

            await db.insertQuery().table('users').insert({
                username: 'virk',
                email: 'virk@adonisjs.com',
                points: 10
            })

            try {
                await User.fetchOrCreateMany(
                    'username' as any,
                    [
                        {
                            email: 'virk@adonisjs.com'
                        },
                        {
                            username: 'romain',
                            email: 'romain@adonisjs.com'
                        } as any
                    ]
                )
            } catch ({ message }) {
                expect(message).toBe('Value for the \"username\" is null or undefined inside \"fetchOrNewUpMany\" payload')
            }

            const usersList = await db.query().from('users')
            expect(usersList).toHaveLength(1);
        })

        test('update records and avoiding duplicates', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @column()
                public points: number
            }

            await db.insertQuery().table('users').insert({
                username: 'virk',
                email: 'virk@gmail.com',
                points: 10
            })

            const users = await User.updateOrCreateMany(
                'username',
                [
                    {
                        username: 'virk',
                        email: 'virk@gmail.com',
                        points: 4
                    },
                    {
                        username: 'nikk',
                        email: 'nikk@gmail.com'
                    },
                    {
                        username: 'romain',
                        email: 'romain@gmail.com'
                    }
                ]
            )

            expect(users).toHaveLength(3);

            expect(users[0].$isPersisted).toBe(true);
            expect(users[0].username).toBe('virk');
            expect(users[0].email).toBe('virk@gmail.com');
            expect(users[0].points).toBe(4);

            expect(users[1].$isPersisted).toBe(true);
            expect(users[1].username).toBe('nikk');
            expect(users[1].email).toBe('nikk@gmail.com');
            expect(users[1].points).toBeUndefined();

            expect(users[2].$isPersisted).toBe(true);
            expect(users[2].username).toBe('romain');
            expect(users[2].email).toBe('romain@gmail.com');
            expect(users[2].points).toBeUndefined();

            const usersList = await db.query().from('users')
            expect(usersList).toHaveLength(3);
        })

        test('wrap create calls inside a transaction using updateOrCreateMany', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @column()
                public points: number
            }

            await db.insertQuery().table('users').insert({
                username: 'virk',
                email: 'virk@adonisjs.com',
                points: 10
            })

            const trx = await db.transaction()

            await User.updateOrCreateMany(
                'username',
                [
                    {
                        username: 'virk',
                        email: 'virk@adonisjs.com'
                    },
                    {
                        username: 'nikk',
                        email: 'nikk@adonisjs.com'
                    },
                    {
                        username: 'romain',
                        email: 'romain@adonisjs.com'
                    }
                ],
                {
                    client: trx
                }
            )

            await trx.rollback()
            const usersList = await db.query().from('users')
            expect(usersList).toHaveLength(1)
        })

        test('wrap update calls inside a transaction using updateOrCreateMany', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column()
                public username: string

                @column()
                public email: string

                @column()
                public points: number
            }

            await db.insertQuery().table('users').insert({
                username: 'virk',
                email: 'virk@adonisjs.com',
                points: 10
            })

            const trx = await db.transaction()

            await User.updateOrCreateMany(
                'username',
                [
                    {
                        username: 'virk',
                        email: 'virk@adonisjs.com',
                        points: 4
                    },
                    {
                        username: 'nikk',
                        email: 'nikk@adonisjs.com'
                    },
                    {
                        username: 'romain',
                        email: 'romain@adonisjs.com'
                    }
                ],
                {
                    client: trx
                }
            )

            await trx.rollback()
            const usersList = await db.query().from('users')
            expect(usersList).toHaveLength(1);
            expect(usersList[0].points).toBe(10);
        })
    });
})
