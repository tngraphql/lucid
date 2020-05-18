import { getDb } from '../tests/helpers';

/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/30/2020
 * Time: 6:50 AM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
const db: ReturnType<typeof getDb> = getDb();

async function createProfile(name: string) {
    let trx = await db.beginGlobalTransaction();

    await db.table('profiles').insert({ user_id: 1, display_name: name })
    await db.table('profiles').insert({ user_id: 1, display_name: name })
    await db.table('profiles').insert({ user_id: 1, display_name: name })
    await db.table('profiles').insert({ user_id: 1, display_name: name })
    await db.table('profiles').insert({ user_id: 1, display_name: name })
    await db.table('profiles').insert({ user_id: 1, display_name: name })
    await db.table('profiles').insert({ user_id: 1, display_name: name })
    await db.table('profiles').insert({ user_id: 1, display_name: name })
    await db.table('profiles').insert({ user_id: 1, display_name: name })
    await db.table('profiles').insert({ user_id: 1, display_name: name })
    await db.table('profiles').insert({ user_id: 1, display_name: name })
    await db.table('profiles').insert({ user_id: 1, display_name: name })
    await db.table('profiles').insert({ user_id: 1, display_name: name })
    await db.table('profiles').insert({ user_id: 1, display_name: name })
    await db.table('profiles').insert({ user_id: 1, display_name: name })
    await db.table('profiles').insert({ user_id: 1, display_name: name })

    if ( name === 'p1' ) {
        throw new Error();
    }
    await db.commitGlobalTransaction();
}

async function main() {
    createProfile('p1')
    createProfile('p2')
}

main();
