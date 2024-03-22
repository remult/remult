import { updateMigrations } from 'rmb'
import { dataProvider, entities } from './config.js'
import { KnexSchemaBuilder } from '../../../core/remult-knex/index.js'
updateMigrations({
  entities,
  migrationBuilder: new KnexSchemaBuilder(dataProvider.knex),
  migrationsDir: 'projects/play-with-migrations/src/server/migrations',
})
