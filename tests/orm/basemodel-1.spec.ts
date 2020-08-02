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
import {BelongsTo, HasMany, HasOne} from '../../src/Contracts/Orm/Relations/types';
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
    beforeUpdate, belongsTo,
    column,
    computed,
    hasMany,
    hasOne,
    afterPaginate,
    beforePaginate,
} from '../../src/Orm/Decorators';
import { ModelQueryBuilder } from '../../src/Orm/QueryBuilder/ModelQueryBuilder';
import {
    cleanup,
    FakeAdapter,
    getBaseModel,
    getDb,
    getUsers,
    hasMysql,
    ormAdapter,
    resetTables,
    setup,
    getProfiler
} from '../helpers';
import {SimplePaginator} from '../../src/Database/Paginator/SimplePaginator'

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Base model', () => {
    describe('Base model | QueryBuilder', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        });

        afterAll(async () => {
            await db.manager.closeAll();
        });

        it('update column using resolve column name from attribute name', async () => {
            class User extends BaseModel {
                public static $increments = false

                @column({ isPrimary: true })
                public id: number

                @column()
                public userName: string
            }

            const update = User.query().update({userName: 'name'}).toQuery();
            const update2 = db.from('users').update({'user_name': 'name'}).toQuery();
            expect(update).toEqual(update2);
        });

        it('increment column using resolve column name from attribute name', async () => {
            class User extends BaseModel {
                public static $increments = false

                @column({ isPrimary: true })
                public id: number

                @column()
                public countComment: string
            }

            const update = User.query().increment('countComment', 1).toQuery();
            const update2 = db.from('users').increment('count_comment', 1).toQuery();
            expect(update).toEqual(update2);
        });

        it('decrement column using resolve column name from attribute name', async () => {
            class User extends BaseModel {
                public static $increments = false

                @column({ isPrimary: true })
                public id: number

                @column()
                public countComment: string
            }

            const update = User.query().decrement('countComment', 1).toQuery();
            const update2 = db.from('users').decrement('count_comment', 1).toQuery();
            expect(update).toEqual(update2);
        });
    });

    describe('Base model | default value', () => {
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

        it('should create success', async () => {
            class User extends BaseModel {
                @column({ isPrimary: true })
                public id: number

                @column({
                    defaultValue: 'nguyen'
                })
                public username: string
            }

            const user = new User()
            await user.save()

            expect(user.username).toBe('nguyen');
        });
    });
})
