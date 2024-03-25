import path from 'path'
import fs from 'fs'
import type { DataProvider } from '../index.js'
import {
  compareMigrationSnapshot,
  emptySnapshot,
} from './compare-migration-snapshots.js'
import { updateMigrationsFile } from './update-migrations-ts-file.js'
import {
  type CanBuildMigrations,
  DefaultMigrationBuilder,
  type MigrationBuilder,
  type MigrationCode,
} from './migration-types.js'
import { isOfType } from '../src/isOfType.js'
import { initDataProvider } from '../server/initDataProvider.js'

export async function generateMigrations(options: {
  entities: any[]
  dataProvider:
    | DataProvider
    | Promise<DataProvider>
    | (() => Promise<DataProvider | undefined>)
  migrationsFolder?: string
  snapshotFile?: string
  migrationsTSFile?: string
  endConnection?: boolean
}) {
  const migrationDir =
    options.migrationsFolder ||
    path.join(process.cwd(), 'src/server/migrations')
  const snapshotFileName =
    options.snapshotFile || path.join(migrationDir, 'migrations-snapshot.json')
  const migrationsTSFilename =
    options.migrationsTSFile || path.join(migrationDir, 'migrations.ts')
  const dataProvider = await initDataProvider(options.dataProvider)

  for (const p of [snapshotFileName, migrationsTSFilename]) {
    if (!fs.existsSync(path.dirname(p))) {
      fs.mkdirSync(path.dirname(p), { recursive: true })
    }
  }

  let snapshot = emptySnapshot()
  if (fs.existsSync(snapshotFileName)) {
    snapshot = JSON.parse(fs.readFileSync(snapshotFileName).toString())
  }

  let hasSql = false
  let steps: string[] = []
  const code = {
    //https://marketplace.visualstudio.com/items?itemName=qufiwefefwoyn.inline-sql-syntax
    addSql: (sql) => {
      steps.push('await sql(`--sql\n' + sql + '`)')
      hasSql = true
    },
    addTypescriptCode: (code) => steps.push(code),
    addComment: (comment) =>
      steps.push(
        comment.indexOf('\n') >= 0 ? `/*${comment}*/` : `// ${comment}`,
      ),
  } satisfies MigrationCode

  let migrationBuilder: MigrationBuilder = new DefaultMigrationBuilder(code)
  if (isOfType<CanBuildMigrations>(dataProvider, 'provideMigrationBuilder')) {
    migrationBuilder = dataProvider.provideMigrationBuilder(code)
  }

  snapshot = await compareMigrationSnapshot({
    entities: options.entities,
    snapshot,

    migrationBuilder,
  })
  if (steps.length)
    await updateMigrationsFile(migrationsTSFilename, [
      `async (${hasSql ? '{sql}' : ''})=>{\n${steps.join('\n')}\n}`,
    ])
  fs.writeFileSync(snapshotFileName, JSON.stringify(snapshot, null, 2))
  if (options.endConnection !== false && isOfType(dataProvider, 'end')) {
    await dataProvider.end()
  }
}
