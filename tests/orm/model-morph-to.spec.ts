/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 7/20/2020
 * Time: 2:19 PM
 */
import {getBaseModel, getDb, ormAdapter} from "../helpers";
import {column, hasOne, manyToMany, morphTo} from "../../src/Orm/Decorators";
import {ManyToMany} from "../../src/Contracts/Orm/Relations/types";

let db: ReturnType<typeof getDb>
let BaseModel: ReturnType<typeof getBaseModel>

describe('Model | MorphTo', () => {
    describe('Model | MorphTo | Options', () => {
        beforeAll(async () => {
            db = getDb()
            BaseModel = getBaseModel(ormAdapter(db))
        })

        it('test', async () => {
            class Post extends BaseModel {
                @column({isPrimary: true})
                id: string;

            }

            class Comment extends BaseModel {
                @column({isPrimary: true})
                id: string;

                @column()
                commentableId: string;

                @column()
                commentableType: string;

                @morphTo()
                commentable
            }

            try {
                Comment.$getRelation('commentable')!.boot()

                console.log(Comment.$getRelation('commentable'));

            } catch (e) {
                console.log(e);
            }
        });
    });
});