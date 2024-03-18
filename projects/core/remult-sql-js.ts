import type { EntityMetadata } from './src/remult3/remult3.js'
import type {
  SqlCommand,
  SqlImplementation,
  SqlResult,
} from './src/sql-command.js'
import type { Database, QueryExecResult } from 'sql.js'
import { SqlDatabase } from './src/data-providers/sql-database.js'
import {
  dbNamesOf,
  isDbReadonly,
} from './src/filter/filter-consumer-bridge-to-sql-request.js'
import { isAutoIncrement } from './src/remult3/RepositoryImplementation.js'
import type { FieldMetadata } from './src/column-interfaces.js'

export class SqlJsDataProvider implements SqlImplementation {
  constructor(private db: Promise<Database>) {}
  getLimitSqlSyntax(limit: number, offset: number) {
    return ' limit ' + limit + ' offset ' + offset
  }
  afterMutation?: VoidFunction
  createCommand(): SqlCommand {
    return new SqlJsCommand(this.db)
  }
  transaction(
    action: (sql: SqlImplementation) => Promise<void>,
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
  async entityIsUsedForTheFirstTime(entity: EntityMetadata) {
    await this.createTable(entity)
  }
  async ensureSchema(entities: EntityMetadata<any>[]): Promise<void> {
    for (const entity of entities) {
      await this.createTable(entity)
    }
  }

  async dropTable(entity: EntityMetadata) {
    let e = await dbNamesOf(entity)
    let sql = 'drop  table if exists ' + e.$entityName
    if (SqlDatabase.LogToConsole) console.info(sql)
    await this.createCommand().execute(sql)
  }
  private addColumnSqlSyntax(x: FieldMetadata, dbName: string) {
    let result = dbName
    const nullNumber = x.allowNull ? '' : ' default 0 not null'
    if (x.valueType == Date) result += ' integer'
    else if (x.valueType == Boolean) result += ' integer ' + nullNumber
    else if (x.valueType == Number) {
      if (!x.valueConverter.fieldTypeInDb) result += ' real ' + nullNumber
      else result += ' ' + x.valueConverter.fieldTypeInDb + ' ' + nullNumber
    } else result += ' text' + (x.allowNull ? ' ' : " default '' not null ")
    return result
  }
  async createTable(entity: EntityMetadata<any>) {
    let result = ''
    let e = await dbNamesOf(entity)
    for (const x of entity.fields) {
      if (!isDbReadonly(x, e) || isAutoIncrement(x)) {
        if (result.length != 0) result += ','
        result += '\r\n  '
        if (isAutoIncrement(x)) {
          if (x.key != entity.idMetadata.field.key)
            throw 'in web sql, autoincrement is only allowed for primary key'
          result += e.$dbNameOf(x) + ' integer primary key autoincrement'
        } else {
          result += this.addColumnSqlSyntax(x, e.$dbNameOf(x))
          if (x.key == entity.idMetadata.field.key) {
            result += ' primary key'
          }
        }
      }
    }
    let sql =
      'create table if not exists ' + e.$entityName + ' (' + result + '\r\n)'
    if (SqlDatabase.LogToConsole) console.log(sql)
    await this.createCommand().execute(sql)
  }

  supportsJsonColumnType?: boolean
  wrapIdentifier?(name: string): string {
    return name
  }
}
class SqlJsCommand implements SqlCommand {
  values: any = {}
  i = 0
  constructor(private db: Promise<Database>) {}
  async execute(sql: string): Promise<SqlResult> {
    if (this.i == 0) return new SqlJsSqlResult((await this.db).exec(sql))
    return new SqlJsSqlResult((await this.db).exec(sql, this.values))
  }
  addParameterAndReturnSqlToken(val: any) {
    return this.param(val)
  }
  param(val: any): string {
    if (val instanceof Date) val = val.valueOf()
    const key = ':' + ++this.i
    this.values[key] = val
    return key
  }
}

class SqlJsSqlResult implements SqlResult {
  constructor(private result: QueryExecResult[]) {
    this.rows =
      result[0]?.values.map((row) =>
        row.reduce(
          (prev, curr, i) => ({ ...prev, [result[0].columns[i]]: curr }),
          {},
        ),
      ) ?? []
  }
  rows: any[]
  getColumnKeyInResultForIndexInSelect(index: number): string {
    return this.result[0]?.columns[index]
  }
}
