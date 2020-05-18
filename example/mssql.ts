/**
 * Created by Phan Trung Nguyên.
 * User: nguyenpl117
 * Date: 5/16/2020
 * Time: 12:41 PM
 */

async function f() {
    const sql = require('mssql')

    await sql.connect({
        user: 'admin',
        server: 'localhost',
        password: '123123As',
        database: 'master',
        options: {
            enableArithAbort: false
        }
    });

    const result = await sql.query`select * from test`
    console.log(result);

    await sql.close();
}

f();