/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/20/2020
 * Time: 8:44 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Filesystem } from '@poppinss/dev-utils/build';
import { Application } from '@tngraphql/illuminate';
import { join } from 'path';
import { MigrationSource } from '../../src/Migrator/MigrationSource';
import { cleanup, getDb, resetTables, setup } from '../helpers';

let db: ReturnType<typeof getDb>
let fs = new Filesystem(join(__dirname, 'app'))

describe('MigrationSource', () => {
    beforeAll(async () => {
        db = getDb()
        await setup()
    })

    afterAll(async () => {
        await cleanup()
        await db.manager.closeAll()
    })

    afterEach(async () => {
        await resetTables()
        await fs.cleanup()
        jest.resetModules();
    })

    test('get list of migration files from database/migrations.js', async () => {
        const app = new Application(fs.basePath)
        const migrationSource = new MigrationSource(db.getRawConnection('primary')!.config, app)

        await fs.add('database/migrations/foo.js', 'module.exports = class Foo {}')
        await fs.add('database/migrations/bar.js', 'module.exports = class Bar {}')

        const directories = await migrationSource.getMigrations()

        expect(directories.map((file) => {
            return { absPath: join(file.absPath), name: join(file.name) }
        })).toEqual([
            {
                absPath: join(fs.basePath, 'database/migrations/bar.js'),
                name: join('database/migrations/bar')
            },
            {
                absPath: join(fs.basePath, 'database/migrations/foo.js'),
                name: join(join('database/migrations/foo'))
            }
        ])
    })

    test('only use javascript files for migration', async () => {
        const app = new Application(fs.basePath)
        const migrationSource = new MigrationSource(db.getRawConnection('primary')!.config, app)

        await fs.add('database/migrations/foo.js', 'module.exports = class Foo {}')
        await fs.add('database/migrations/foo.js.map', '{}')

        const directories = await migrationSource.getMigrations()

        expect(directories.map((file) => {
            return { absPath: join(file.absPath), name: file.name }
        })).toEqual([
            {
                absPath: join(fs.basePath, 'database/migrations/foo.js'),
                name: join('database/migrations/foo')
            }
        ])
    })

    test('sort multiple migration directories seperately', async () => {
        const app = new Application(fs.basePath)
        const config = Object.assign({}, db.getRawConnection('primary')!.config, {
            migrations: {
                paths: ['database/secondary', 'database/primary']
            }
        })

        const migrationSource = new MigrationSource(config, app)

        await fs.add('database/secondary/a.js', 'module.exports = class Foo {}')
        await fs.add('database/secondary/c.js', 'module.exports = class Bar {}')

        await fs.add('database/primary/b.js', 'module.exports = class Foo {}')
        await fs.add('database/primary/d.js', 'module.exports = class Bar {}')

        const files = await migrationSource.getMigrations()

        expect(files.map((file) => {
            return { absPath: join(file.absPath), name: file.name }
        })).toEqual([
            {
                absPath: join(fs.basePath, 'database/primary/b.js'),
                name: join('database/primary/b')
            },
            {
                absPath: join(fs.basePath, 'database/primary/d.js'),
                name: join('database/primary/d')
            },
            {
                absPath: join(fs.basePath, 'database/secondary/a.js'),
                name: join('database/secondary/a')
            },
            {
                absPath: join(fs.basePath, 'database/secondary/c.js'),
                name: join('database/secondary/c')
            }
        ])
    })

    test('handle esm default exports properly', async () => {
        const app = new Application(fs.basePath)
        const migrationSource = new MigrationSource(db.getRawConnection('primary')!.config, app)

        await fs.add('database/migrations/foo.ts', 'export default class Foo {}')
        const directories = await migrationSource.getMigrations()
        expect(directories[0].source.name).toBe('Foo')
    })
});
