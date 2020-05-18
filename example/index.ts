/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/21/2020
 * Time: 10:27 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import { HasOne } from '../src/Contracts/Orm/Relations/types';
import { ISOLATION_LEVELS } from '../src/Database/customTransaction';
import { Database } from '../src/Database/Database';
import { scope } from '../src/Helpers/scope';
import { BaseModel } from '../src/Orm/BaseModel/BaseModel';
import { column, hasOne } from '../src/Orm/Decorators';
import { getDb, ormAdapter, setup } from '../tests/helpers';

const db: ReturnType<typeof getDb>= getDb();
const cls = require('continuation-local-storage');
const namespace = cls.createNamespace('my-very-own-namespace');
const writer = cls.createNamespace('my-very-own-namespace');

BaseModel.$adapter = ormAdapter(db);
BaseModel._cls = namespace;
Database._cls = namespace;
// patch bluebird to bind all promise callbacks to CLS namespace

class Profile extends BaseModel {
    @column({isPrimary: true})
    public id: string;

    @column()
    public userId: string

    @column()
    public displayName: string

    @column()
    public user: HasOne<typeof User>
}

export class User extends BaseModel {
    @column({isPrimary: true})
    public id: string

    @column()
    public username: string

    @hasOne(() => Profile, {
        onQuery: (builder) => builder.preload('user'),
    })
    public profile: HasOne<typeof Profile>

    public static active = scope<typeof User>((builder) => {
        builder.apply((scopes) => scopes.country('India'))
    })
    public static country = scope((builder, _country: string) => {
        builder.whereIn('', [])
    })
}

async function start(v: string| number =0) {
    const context = writer.createContext();
    writer.enter(context);
    writer.set('value', v);

    try {
        if (v === 't1') await start('t2');

        await Promise.resolve();
        console.log(writer.get('value'));
    } catch (e) {

    } finally {
        writer.exit(context);
    }


}

async function start2(v: string| number =0) {
    await writer.run(async () => {
        writer.set('value', v);

        if (v === 't1') await start2('t2');

        await Promise.resolve();
        console.log(writer.get('value'));
    });
}

async function main() {
    // await setup();

    await Profile.truncate(true);

    // await start('t1');
    // console.log(writer.get('value'));

    // start('t2');
    // console.log(writer.get('value'));

    // namespace.run(() => {
    //     Promise.all([
    //         createProfile('p1'),
    //         // createProfile2('p2')
    //     ])
    // })
    await createProfile2('p1');

//

    // namespace.run(() => {
    //     cate('c1', 1);
    //     cate('c2', 0);
    // })
}

async function tx(callback, options?: any) {

    if ( options && options.transaction ) {
        if ( namespace.get('transaction') ) {
            return callback(options.transaction);
        }
        return namespace.run(async (tx) => {
            namespace.set('transaction', options.transaction);

            console.log('start');
            return callback(tx)
        });
    }
    return namespace.run(async (tx) => {
        namespace.set('transaction', options?.name || 'tx1');

        return callback(tx);
    });
}

async function cate(name: string | number, t: number) {
    tx(async () => {
        tx(async () => {
            console.log(2, namespace.get('transaction'));
            console.log(2, namespace.get('transaction'));
            tx(async () => {
                console.log(3, namespace.get('transaction'));
                console.log(3, namespace.get('transaction'));
            }, {transaction: namespace.get('transaction')});
        }, {transaction: namespace.get('transaction')});
        console.log(1, namespace.get('transaction'));
        console.log(1, namespace.get('transaction'));
    }, {name})

}

async function create() {
    await User.truncate(true);

    await db.beginGlobalTransaction();

    await User.create({ id: '1', username: 'a' })
    await User.create({ username: 'virk' });
    await createProfile('23523');

    await db.commitGlobalTransaction();
}

async function createUser() {
    await User.create({ username: 'virk' });
}

async function createProfile(name: string) {
    let trx = await db.connection().getWriteClient().transaction();

    await trx.table('profiles').insert({ user_id: 1, display_name: name })//.knexQuery.transacting(trx)
    if ( name === 'p2' ) {
        await createProfile('p1');
    }
    await trx.table('profiles').insert({ user_id: 1, display_name: name })//.knexQuery.transacting(trx)

    // if ( name === 'p1' ) {
    //     throw new Error('error not commit');
    // }
    // await trx.commit();
}
// You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'READ UNCOMMITTED' at lin
// e
async function createProfile2(name: string, t?) {
    // await db.rawQuery('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;');
    // . - SQLITE_MISUSE: not an error
    await db.transaction({transaction: t, isolationLevel: ISOLATION_LEVELS.SERIALIZABLE}, async (client) => {
        await Profile.create({ userId: 1, displayName: name });


        await Profile.create({ userId: 1, displayName: name });
        await Profile.create({ userId: 1, displayName: name });
        if ( name === 'p1' ) {
            // throw new Error('error not commit');
        }
    })
    if ( name === 'p1' ) {
        await createProfile2('p2')
    }
}

main();
