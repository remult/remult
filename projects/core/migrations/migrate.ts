import {
  Entity,
  type DataProvider,
  IdEntity,
  Fields,
  remult,
  Remult,
} from '../index.js'
import { doTransaction } from '../src/context.js'
import { cast } from '../src/isOfType.js'
import type { SqlCommandFactory } from '../src/sql-command.js'
import type { MigrationUtils, Migrations } from './migration-types.js'

export async function migrate(options: {
  migrations: Migrations
  dataProvider?: Promise<DataProvider> | DataProvider

  migrationTableName?: string
}) {
  let migrationTableName =
    options.migrationTableName || '__remult_migration_version'

  const dataProvider = options.dataProvider
    ? await options.dataProvider
    : remult.dataProvider
  const prev = remult.dataProvider
  remult.dataProvider = dataProvider
  try {
    @Entity(migrationTableName)
    class VersionInfo extends IdEntity {
      @Fields.number()
      version = -1
    }
    const repo = new Remult(dataProvider).repo(VersionInfo)

    if (dataProvider.ensureSchema) {
      await dataProvider.ensureSchema([repo.metadata])
    }
    let v = await repo.findFirst()
    if (!v) {
      v = repo.create()
      v.version = -1
    }
    const steps = Object.entries(options.migrations).sort(
      ([a], [b]) => parseInt(a) - parseInt(b),
    )

    for (const [stepText, action] of steps) {
      const step = parseInt(stepText)
      if (step < 0)
        throw new Error('Migration step number must be a non-negative integer')
      if (v.version >= step) continue
      console.info('Executing migration step', step)

      await doTransaction(remult, async (dp) => {
        const utils: MigrationUtils = {
          sql: async (sql) => {
            await cast<SqlCommandFactory>(dp, 'execute').execute(sql)
          },
        }
        await action(utils)
      })
      v.version = step
      await v.save()
    }
  } finally {
    remult.dataProvider = prev
  }
}
