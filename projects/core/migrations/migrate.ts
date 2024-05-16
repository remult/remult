import {
  Entity,
  type DataProvider,
  IdEntity,
  Fields,
  remult,
  Remult,
} from '../index.js'
import { initDataProviderOrJson } from '../server/initDataProviderOrJson.js'
import { doTransaction } from '../src/context.js'
import { cast, isOfType } from '../src/isOfType.js'
import type { SqlCommandFactory } from '../src/sql-command.js'
import type { MigrationUtils, Migrations } from './migration-types.js'

/**
 * Applies migration scripts to update the database schema.
 *
 * @param options - Configuration options for applying migrations.
 * @param options.migrations - An object containing the migration scripts, each keyed by a unique identifier.
 * @param options.dataProvider - The data provider instance or a function returning a promise of the data provider.
 * @param options.migrationsTable - (Optional) The name of the table that tracks applied migrations. Default is '__remult_migrations_version'.
 * @param options.endConnection - (Optional) Determines whether to close the database connection after applying migrations. Default is false.
 * @param options.beforeMigration - (Optional) A callback function that is called before each migration is applied. Receives an object with the migration index.
 * @param options.afterMigration - (Optional) A callback function that is called after each migration is applied. Receives an object with the migration index and the duration of the migration.
 * @see [Migrations](https://remult.dev/docs/migrations.html)
 */
export async function migrate(options: {
  migrations: Migrations
  dataProvider:
    | DataProvider
    | Promise<DataProvider>
    | (() => Promise<DataProvider | undefined>)

  migrationsTable?: string
  endConnection?: boolean
  beforeMigration?: (info: { index: number }) => void | Promise<void>
  afterMigration?: (info: {
    index: number
    duration: number
  }) => void | Promise<void>
}) {
  let migrationTableName =
    options.migrationsTable || '__remult_migrations_version'

  const dataProvider = await initDataProviderOrJson(options.dataProvider)

  const prev = remult.dataProvider
  remult.dataProvider = dataProvider
  try {
    @Entity(migrationTableName)
    class VersionInfo extends IdEntity {
      @Fields.number()
      version = -1
    }

    const steps = Object.entries(options.migrations).sort(
      ([a], [b]) => parseInt(a) - parseInt(b),
    )

    if (dataProvider.ensureSchema) {
      await dataProvider.ensureSchema([
        new Remult(dataProvider).repo(VersionInfo).metadata,
      ])
    }

    await doTransaction(remult, async (dp) => {
      const repo = new Remult(dataProvider).repo(VersionInfo, dp)

      let v = await repo.findFirst()
      if (!v) {
        v = repo.create()
        v.version = -1
      }
      for (const [stepText, action] of steps) {
        const step = parseInt(stepText)
        if (step < 0)
          throw new Error(
            'Migration step number must be a non-negative integer',
          )
        if (v.version >= step) continue
        if (options.beforeMigration) {
          await options.beforeMigration({ index: step })
        }
        const startTime = Date.now()
        console.info('Executing migration step ' + step)
        console.time('Completed migration step ' + step)
        try {
          const utils: MigrationUtils = {
            sql: async (sql) => {
              return await cast<SqlCommandFactory>(dp, 'execute').execute(sql)
            },
          }
          await action(utils)

          if (options.afterMigration) {
            await options.afterMigration({
              index: step,
              duration: Date.now() - startTime,
            })
          }
          console.timeEnd('Completed migration step ' + step)
        } catch (err) {
          console.error('Failed to execute migration step ' + step)
          console.error(err)
          throw err
        }
        v.version = step
        await v.save()
      }
    })
  } finally {
    remult.dataProvider = prev
  }
  if (options.endConnection && isOfType(dataProvider, 'end')) {
    await dataProvider.end()
  }
}
