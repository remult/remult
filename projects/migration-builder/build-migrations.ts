import { dbNamesOf, repo } from 'remult'
import {
  shouldCreateEntity,
  shouldNotCreateField,
} from '../core/src/filter/filter-consumer-bridge-to-sql-request.js'
import {
  MigrationBuilder,
  MigrationStepBuilder,
} from '../core/migrations/index.js'

export async function buildMigrations({
  entities,
  stepsBuilder,
  snapshot,
  migrationBuilder: sb,
}: {
  entities: any[]
  stepsBuilder: MigrationStepBuilder
  snapshot: EntitiesSnapshot
  migrationBuilder: MigrationBuilder
}) {
  snapshot = JSON.parse(JSON.stringify(snapshot))

  for (const entity of entities) {
    const meta = repo(entity).metadata
    const e = await dbNamesOf(meta, (x) => x)
    if (shouldCreateEntity(meta, e)) {
      let entitySnapshot = snapshot.entities[e.$entityName]
      let createColumns = true
      if (!entitySnapshot) {
        createColumns = false
        await sb.createTable(meta, stepsBuilder)
        entitySnapshot = snapshot.entities[e.$entityName] = {
          key: meta.key,
          className: meta.entityType.name,
          columns: {},
        }
      }
      for (const field of meta.fields) {
        if (!shouldNotCreateField(field, e)) {
          const column = entitySnapshot.columns[e.$dbNameOf(field)]
          if (!column) {
            entitySnapshot.columns[e.$dbNameOf(field)] = { key: field.key }
            await sb.createColumn(meta, field, stepsBuilder)
          }
        }
      }
    }
    return snapshot
  }
}

export function emptySnapshot() {
  return {
    version: 1,
    entities: {} as Record<
      string,
      {
        key: string
        className: string
        columns: Record<
          string,
          {
            key: string
          }
        >
      }
    >,
  }
}

export type EntitiesSnapshot = ReturnType<typeof emptySnapshot>
