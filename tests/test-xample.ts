import { column } from '../src/Orm/Decorators';
import { getBaseModel, getDb, ormAdapter, setup } from './helpers';

/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/21/2020
 * Time: 10:04 AM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
async function main() {
    let db = getDb()
    let BaseModel = getBaseModel(ormAdapter(db))
    await setup();

    class User extends BaseModel {
        @column({ isPrimary: true })
        public id: number

        @column()
        public userName: string
    }

    const user = User.query();

    var knex = require('knex')({
        client: 'mysql',
        connection: {
            host: 'mysql',
            user: 'virk',
            password: 'password',
            database: 'lucid'
        }
    });

    const sql = knex.select('*').from('users')
                    .where(knex.raw('id = ?', [1]))
                    .toSQL();

    const count = await knex('users').count('* as total');
    console.log(count[0].total, typeof count[0].total);

    console.log(1, sql);
    console.log(2, user.toSQL());

    console.log(3, user.select('id').toSQL().sql);
}

main();
