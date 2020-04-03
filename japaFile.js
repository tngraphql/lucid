process.env.TS_NODE_FILES = 'true'
require('ts-node/register')

const { configure } = require('japa')
configure({
  files: [
    'test/**/*.spec.ts',
    // 'test/console/seed/*.spec.ts',
    // 'test/factory/factory.spec.ts',
    // 'test/factory/database.spec.ts',
    // 'test/factory/model-factory.spec.ts',
    // 'test/console/seed/seed.spec.ts',
    // 'test/console/seed/seed-make.spec.ts',
    // 'test/console/migrate.spec.ts',
    // 'test/console/migration/rollback.spec.ts',
    // 'test/console/migration/reset.spec.ts',
    // 'test/console/migration/refresh.spec.ts',
    // 'test/console/migration/fresh.spec.ts',
    // 'test/console/migration/status.spec.ts',
    // 'test/migrations/migration-source.spec.ts',
    // 'test/migrations/migrator.spec.ts',
    // 'test/migrations/schema.spec.ts',
    // 'test/commands/make-migration.spec.ts',
  ],
  after: [async () => {
    await require('fs-extra').remove(require('path').join(__dirname, 'test-helpers', 'tmp'))
  }],
})
