import type { EntityMetadata, FieldMetadata } from '../index.js'

export type MigrationSteps = Record<
  number,
  (executeSql: (sql: string) => Promise<any>) => Promise<void>
>

export interface MigrationBuilder {
  createTable(
    meta: EntityMetadata,
    builder: MigrationStepBuilder,
  ): Promise<void>
  createColumn(
    meta: EntityMetadata,
    field: FieldMetadata,
    builder: MigrationStepBuilder,
  ): Promise<void>
}

export interface MigrationStepBuilder {
  addSql(sql: string): void
  addComment(comment: string): void
  addTypescriptCode(code: string): void
}
