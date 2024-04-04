import type { EntityMetadata, FieldMetadata } from '../index.js'

export interface CanBuildMigrations {
  provideMigrationBuilder(builder: MigrationCode): MigrationBuilder
}

export interface MigrationBuilder {
  createTable(meta: EntityMetadata): Promise<void>
  addColumn(meta: EntityMetadata, field: FieldMetadata): Promise<void>
  removeTable?(entityDbName: string): unknown
  removeColumn?($entityName: string, columnDbName: string): unknown
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

export class DefaultMigrationBuilder implements Required<MigrationBuilder> {
  constructor(
    public code: MigrationCode,
    private wrapped?: MigrationBuilder,
  ) {}
  async createTable(meta: EntityMetadata): Promise<void> {
    if (this.wrapped?.createTable) {
      await this.wrapped.createTable(meta)
    } else this.code.addComment('TODO: implement create table ' + meta.dbName)
  }

  async addColumn(meta: EntityMetadata, field: FieldMetadata): Promise<void> {
    if (this.wrapped?.addColumn) {
      await this.wrapped.addColumn(meta, field)
    } else
      this.code.addComment(
        'TODO: implement add column ' + meta.dbName + '.' + field.dbName,
      )
  }
  async removeTable(entityDbName: string): Promise<void> {
    if (this.wrapped?.removeTable) {
      await this.wrapped.removeTable(entityDbName)
    } else this.code.addComment('TODO: implement remove table ' + entityDbName)
  }
  async removeColumn(entityName: string, columnDbName: string): Promise<void> {
    if (this.wrapped?.removeColumn) {
      await this.wrapped.removeColumn(entityName, columnDbName)
    } else
      this.code.addComment(
        'TODO: implement remove column ' + entityName + '.' + columnDbName,
      )
  }
}
