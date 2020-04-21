import { Connection } from '../src/Connection/Connection';
import { ConnectionManager } from '../src/Connection/ConnectionManager';
import { column } from '../src/Orm/Decorators';
import { getBaseModel, getConfig, getDb, getEmitter, getLogger, ormAdapter, setup } from './helpers';

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
    // await setup();


    /*class User extends BaseModel {
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
    // var knex = require('knex')({
    //     client: 'mysql',
    //     connection: {
    //         host: "localhost",
    //         user: "root",
    //         password: "123123As",
    //         database: "lucid"
    //     }
    // });

    const hasUsersTable = await knex.schema.hasTable('users')
    if ( ! hasUsersTable ) {
        await knex.schema.createTable('users', (table) => {
            table.increments()
            table.integer('country_id')
            table.string('username', 100).unique()
            table.string('email', 100).unique()
            table.integer('points').defaultTo(0)
            table.dateTime('joined_at', { useTz: false })
            table.timestamp('created_at').defaultTo(knex.fn.now())
            table.timestamp('updated_at').nullable()
        })
    }

    const sql = knex.select('*').from('users')
                    .where(knex.raw('id = ?', [1]))
                    .toSQL();

    const count = await knex('users').count('* as total');
    console.log(count[0].total, typeof count[0].total);

    console.log(1, sql);
    console.log(2, user.toSQL());

    console.log(3, user.select('id').toSQL().sql);

    const manager = new ConnectionManager(getLogger(), getEmitter())
    manager.add('primary', getConfig())
    manager.connect('primary');
    const primary: any = manager.get('primary').connection;

    console.log('primary', primary.client.select('*').from('users').toSQL());
    console.log('primary2', primary.client.queryBuilder().from('users').toSQL());

    console.log('primary3', primary.client2.select('*').from('users').toSQL());
    console.log('primary4', primary.client2.queryBuilder().from('users').toSQL());

    process.exit(1);*/
}

main();
