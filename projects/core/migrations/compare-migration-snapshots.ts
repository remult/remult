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
  migrationBuilder,
  reporter,
}: {
  entities: any[]
  snapshot: EntitiesSnapshot
  migrationBuilder: Required<MigrationBuilder>
  reporter: (what: string) => void
}) {
  snapshot = JSON.parse(JSON.stringify(snapshot))
  let processedEntities = new Set<string>()
  for (const entity of entities) {
    const meta = repo(entity).metadata
    const e = await dbNamesOf(meta, (x) => x)
    processedEntities.add(e.$entityName)
    if (shouldCreateEntity(meta, e)) {
      let entitySnapshot = snapshot.entities[e.$entityName]
      let createColumns = true
      if (!entitySnapshot) {
        createColumns = false
        reporter('create table ' + e.$entityName)
        await migrationBuilder.createTable(meta)
        entitySnapshot = snapshot.entities[e.$entityName] = {
          key: meta.key,
          className: meta.entityType.name,
          columns: {},
        }
      }
      const processedColumns = new Set<string>()
      for (const field of meta.fields) {
        if (!shouldNotCreateField(field, e)) {
          const columnDbName = e.$dbNameOf(field)
          processedColumns.add(columnDbName)
          const column = entitySnapshot.columns[columnDbName]
          if (!column) {
            if (createColumns) {
              reporter('add column ' + e.$entityName + '.' + columnDbName)
              await migrationBuilder.addColumn(meta, field)
            }
            entitySnapshot.columns[columnDbName] = { key: field.key }
          }
        }
      }
      for (const columnDbName of Object.keys(entitySnapshot.columns)) {
        if (!processedColumns.has(columnDbName)) {
          reporter('remove column ' + e.$entityName + '.' + columnDbName)
          await migrationBuilder.removeColumn(e.$entityName, columnDbName)
          delete entitySnapshot.columns[columnDbName]
        }
      }
    }
  }
  for (const entityDbName of Object.keys(snapshot.entities)) {
    if (!processedEntities.has(entityDbName)) {
      reporter('remove table ' + entityDbName)
      await migrationBuilder.removeTable(entityDbName)
      delete snapshot.entities[entityDbName]
    }
  }
  return snapshot
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
