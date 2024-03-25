import { repo } from '../index.js'
import {
  dbNamesOf,
  shouldCreateEntity,
  shouldNotCreateField,
} from '../src/filter/filter-consumer-bridge-to-sql-request.js'
import type { MigrationBuilder } from './migration-types.js'

export async function compareMigrationSnapshot({
  entities,
  snapshot,
  migrationBuilder: migrationBuilder,
}: {
  entities: any[]
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
        await migrationBuilder.createTable(meta)
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
            if (createColumns) await migrationBuilder.addColumn(meta, field)
            entitySnapshot.columns[e.$dbNameOf(field)] = { key: field.key }
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
