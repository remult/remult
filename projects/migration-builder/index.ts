import path from 'path'
import fs from 'fs'
import { buildMigrations, emptySnapshot } from './build-migrations.js'
import { updateMigrationsFile } from './edit-migration-file.js'
import { MigrationBuilder } from '../core/migrations/index.js'

export async function updateMigrations(options: {
  entities: any[]
  migrationBuilder: MigrationBuilder
  migrationsDir?: string
}) {
  if (!options.migrationsDir) {
    options.migrationsDir = path.join(process.cwd(), 'src/server/migrations')
  }
  if (!fs.existsSync(options.migrationsDir)) {
    fs.mkdirSync(options.migrationsDir, { recursive: true })
  }
  const snapshotFileName = path.join(
    options.migrationsDir,
    'migrations-snapshot.json',
  )
  let snapshot = emptySnapshot()
  if (fs.existsSync(snapshotFileName)) {
    // make sure folder exists for file name

    snapshot = JSON.parse(fs.readFileSync(snapshotFileName).toString())
  }

  let steps: string[] = []

  buildMigrations({
    entities: options.entities,
    snapshot,
    stepsBuilder: {
      //https://marketplace.visualstudio.com/items?itemName=qufiwefefwoyn.inline-sql-syntax
      addSql: (sql) => steps.push('sql=>sql(`--sql\n' + sql + '`)'),
      addComment: (comment) => steps.push('()=>`/*' + comment + '`*/'),
      addTypescriptCode: (code) => steps.push('()=>' + code + ''),
    },
    migrationBuilder: options.migrationBuilder,
  }).then(async (snapshot) => {
    await updateMigrationsFile(
      path.join(options.migrationsDir, 'migrations.ts'),
      steps,
    )
    fs.writeFileSync(snapshotFileName, JSON.stringify(snapshot, null, 2))
  })
}
