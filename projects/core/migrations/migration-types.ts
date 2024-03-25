import type { EntityMetadata, FieldMetadata } from '../index.js'

export interface CanBuildMigrations {
  provideMigrationBuilder(builder: MigrationCode): MigrationBuilder
}

export interface MigrationBuilder {
  createTable(meta: EntityMetadata): Promise<void>
  addColumn(meta: EntityMetadata, field: FieldMetadata): Promise<void>
}

export interface MigrationCode {
  addSql(sql: string): void
  addComment(comment: string): void
  addTypescriptCode(code: string): void
}

export type Migrations = Record<
  number,
  (utils: MigrationUtils) => Promise<unknown>
>
export type MigrationUtils = {
  sql(sql: string): Promise<unknown>
}

export class DefaultMigrationBuilder implements MigrationBuilder {
  constructor(public code: MigrationCode) {}
  async createTable(meta: EntityMetadata): Promise<void> {
    this.code.addComment('create table ' + meta.entityType.name)
  }

  async addColumn(meta: EntityMetadata, field: FieldMetadata): Promise<void> {
    this.code.addComment('add column ' + meta.entityType.name + '.' + field.key)
  }
}
