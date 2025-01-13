import type { EntityMetadata } from './src/remult3/remult3.js'
import type {
  SqlCommand,
  SqlImplementation,
  SqlResult,
} from './src/sql-command.js'

import { SqlDatabase } from './src/data-providers/sql-database.js'
import {
  dbNamesOf,
  isDbReadonly,
  shouldNotCreateField,
  type EntityDbNamesBase,
} from './src/filter/filter-consumer-bridge-to-sql-request.js'
import { isAutoIncrement } from './src/remult3/RepositoryImplementation.js'
import type { FieldMetadata } from './src/column-interfaces.js'
import type {
  CanBuildMigrations,
  MigrationBuilder,
  MigrationCode,
} from './migrations/migration-types.js'

export class SqliteCoreDataProvider
  implements SqlImplementation, CanBuildMigrations
{
  constructor(
    public createCommand: () => SqlCommand,
    public end: () => Promise<void>,
    public doesNotSupportReturningSyntax = false,
    public doesNotSupportReturningSyntaxOnlyForUpdate = false,
  ) {}

  orderByNullsFirst?: boolean

  getLimitSqlSyntax(limit: number, offset: number) {
    return ' limit ' + limit + ' offset ' + offset
  }

  afterMutation?: VoidFunction

  provideMigrationBuilder(builder: MigrationCode): MigrationBuilder {
    let self = this
    return {
      createTable: async (entity: EntityMetadata<any>) => {
        await (await self.getCreateTableSql(entity)).map(builder.addSql)
      },
      addColumn: async (entity: EntityMetadata<any>, field: FieldMetadata) => {
        let e = await dbNamesOf(entity, this.wrapIdentifier)
        let sql = `alter table ${
          e.$entityName
        } add column ${self.addColumnSqlSyntax(
          field,
          e.$dbNameOf(field),
          true,
        )}`
        builder.addSql(sql)
      },
    }
  }

  async transaction(
    action: (sql: SqlImplementation) => Promise<void>,
  ): Promise<void> {
    await this.createCommand().execute('Begin Transaction')
    try {
      await action(this)
      await this.createCommand().execute('Commit')
    } catch (err) {
      await this.createCommand().execute('Rollback')
      throw err
    }
  }
  async entityIsUsedForTheFirstTime(entity: EntityMetadata) {}
  async ensureSchema(entities: EntityMetadata<any>[]): Promise<void> {
    for (const entity of entities) {
      await this.createTableIfNotExist(entity)
      await this.verifyAllColumns(entity)
    }
  }
  async verifyAllColumns<T extends EntityMetadata>(entity: T) {
    try {
      let cmd = this.createCommand()
      let e: EntityDbNamesBase = await dbNamesOf(entity, this.wrapIdentifier)

      let cols = (
        await cmd.execute(`PRAGMA table_info(${e.$entityName})`)
      ).rows.map((x) => this.wrapIdentifier(x.name.toLocaleLowerCase()))
      for (const col of entity.fields) {
        if (!shouldNotCreateField(col, e)) {
          let colName = e.$dbNameOf(col).toLocaleLowerCase()
          if (!cols.includes(colName)) {
            let sql =
              `ALTER table ${e.$entityName} ` +
              `add column ${this.addColumnSqlSyntax(
                col,
                e.$dbNameOf(col),
                true,
              )}`
            await this.createCommand().execute(sql)
          }
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  async dropTable(entity: EntityMetadata) {
    let e = await dbNamesOf(entity, this.wrapIdentifier)
    let sql = 'drop  table if exists ' + e.$entityName
    if (SqlDatabase.LogToConsole) console.info(sql)
    await this.createCommand().execute(sql)
  }
  addColumnSqlSyntax(x: FieldMetadata, dbName: string, isAlterTable: boolean) {
    let result = dbName
    const nullNumber = x.allowNull ? '' : ' default 0 not null'
    if (x.valueType == Date) result += ' integer'
    else if (x.valueType == Boolean) result += ' integer ' + nullNumber
    else if (x.valueType == Number) {
      if (!x.valueConverter.fieldTypeInDb) result += ' numeric ' + nullNumber
      else result += ' ' + x.valueConverter.fieldTypeInDb + ' ' + nullNumber
    } else result += ' text' + (x.allowNull ? ' ' : " default '' not null ")
    return result
  }
  async createTableIfNotExist(entity: EntityMetadata<any>) {
    let sql = await this.getCreateTableSql(entity)
    for (const element of sql) {
      await this.createCommand().execute(element)
    }
  }

  supportsJsonColumnType?: boolean
  async getCreateTableSql(entity: EntityMetadata<any>) {
    let result = ''
    let e = await dbNamesOf(entity, this.wrapIdentifier)
    for (const x of entity.fields) {
      if (!shouldNotCreateField(x, e) || isAutoIncrement(x)) {
        if (result.length != 0) result += ','
        result += '\r\n  '
        if (isAutoIncrement(x)) {
          if (x.key != entity.idMetadata.field.key)
            throw 'in sqlite, autoincrement is only allowed for primary key'
          result += e.$dbNameOf(x) + ' integer primary key autoincrement'
        } else {
          result += this.addColumnSqlSyntax(x, e.$dbNameOf(x), false)
          if (x.key == entity.idMetadata.field.key) {
            result += ' primary key'
          }
        }
      }
    }

    let sql = [
      'create table if not exists ' + e.$entityName + ' (' + result + '\r\n)',
    ]
    if (entity.idMetadata.fields.length > 1) {
      sql.push(
        `create unique index if not exists ${this.wrapIdentifier(
          entity.dbName + '_primary_key',
        )} on ${e.$entityName}  (${entity.idMetadata.fields
          .map((x) => e.$dbNameOf(x))
          .join(',')})`,
      )
    }

    return sql
  }

  wrapIdentifier(name: string): string {
    //return name
    return '`' + name + '`'
  }
}
