import { dataProvider, entities } from './config.js'
import { KnexSchemaBuilder } from '../../../core/remult-knex/index.js'

import { migrations } from './migrations/migrations.js'
import { migrate, generateMigrations } from '../../../core/migrations/index.js'
;(async () => {
  if (true) {
    await generateMigrations({
      entities,
      dataProvider,
      migrationsFolder: 'projects/play-with-migrations/src/server/migrations',
      endConnection: false,
    })
  } else {
    const m = migrate({
      migrations,
      dataProvider,
      endConnection: false,
    })
  }
  //
  // await dataProvider.knex.destroy()
  console.log('Done')
})()
