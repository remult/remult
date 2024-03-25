import { dataProvider, entities } from './config.js'
import { KnexSchemaBuilder } from '../../../core/remult-knex/index.js'

import { migrations } from './migrations/migrations.js'
import { migrate, generateMigrations } from '../../../core/migrations/index.js'
;(async () => {
  if (true) {
    await generateMigrations({
      entities,
      dataProvider,
      migrationsDir: 'projects/play-with-migrations/src/server/migrations',
    })
  } else {
    const m = migrate({
      migrations,
      dataProvider,
    })
  }
  //
  // await dataProvider.knex.destroy()
  console.log('Done')
})()

/*Yoni Goldberg
- Each migration sql as separate steps (alter etc....)
- Migration code file
- what is the motivation for recording in the db each migration that was executed?
*/
