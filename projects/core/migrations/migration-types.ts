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
/**
 * Represents a set of migrations, each identified by a unique number.
 *
 * Each migration function takes a `MigrationUtils` object as a parameter, which provides utility methods for executing SQL statements and other migration-related operations.
 *
 * Migrations are executed in a transaction, meaning that all changes within a single migration are either fully applied or fully rolled back in case of an error. This ensures the consistency of the database state.
 *
 * Note: Some databases, like MySQL, do not support rolling back structural changes (e.g., table creation or alteration) as part of a transaction. Developers should be aware of this when designing migrations for such databases.
 *
 * @example
 * export const migrations: Migrations = {
 *   1: async ({ sql }) => {
 *     await sql(`CREATE TABLE example (id SERIAL PRIMARY KEY, name VARCHAR(255))`);
 *   },
 *   2: async ({ sql }) => {
 *     await sql(`ALTER TABLE example ADD COLUMN description TEXT`);
 *   },
 * };
 * @see [Migrations](http://remult.dev/docs/migrations.html)
 */
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
