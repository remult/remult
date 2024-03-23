import { updateMigrations } from 'rmb'
import { dataProvider, entities } from './config.js'
import { KnexSchemaBuilder } from '../../../core/remult-knex/index.js'
import { MigrationsManager } from '../../../core/migrations/index.js'
import { migrations } from './migrations/migrations.js'
;(async () => {
  if (false) {
    await updateMigrations({
      entities,
      migrationBuilder: new KnexSchemaBuilder(dataProvider.knex),
      migrationsDir: 'projects/play-with-migrations/src/server/migrations',
    })
  } else {
    const m = new MigrationsManager({
      steps: migrations,
      dataProvider: dataProvider,

      executeSql: (sql) => dataProvider.knex.raw(sql),
    })
    await m.setCurrentVersion(-1)
    await m.runMigrations()
  }
  //
  await dataProvider.knex.destroy()
  console.log('Done')
})()

/* [ ] - SqlDatabase has `execute` method, should knex have that as well? 
          SqlDatabase also has createCommand that supports parameters - 
          should knex support that for the sake of simplicity?

          If so, maybe there should be an easy and consistent way to 
          run raw sql across SqlDatabase and Knex - currently with use SqlDatabase.getDb() - 
          maybe there should be something shared or at least matching the api

          and them maybe migrations should get an sql command factory, so they can use parameters too

          or should they do it with Knex/Sql getDb()
      */
