import { FieldMetadata } from '../src/column-interfaces'
import { Remult, allEntities } from '../src/context'
import { SqlDatabase } from '../src/data-providers/sql-database'
import {
  EntityDbNamesBase,
  dbNamesOf,
  isDbReadonly,
} from '../src/filter/filter-consumer-bridge-to-sql-request'
import { remult as defaultRemult } from '../src/remult-proxy'
import { EntityMetadata, isAutoIncrement } from '../src/remult3'
import { SqlCommand } from '../src/sql-command'
import { ValueConverters } from '../src/valueConverters'

export function postgresColumnSyntax(x: FieldMetadata, dbName: string) {
  let result = dbName
  if (x.valueType == Number) {
    if (!x.valueConverter.fieldTypeInDb)
      result += ' numeric' + (x.allowNull ? '' : ' default 0 not null')
    else
      result +=
        ' ' +
        x.valueConverter.fieldTypeInDb +
        (x.allowNull ? '' : ' default 0 not null')
  } else if (x.valueType == Date) {
    if (!x.valueConverter.fieldTypeInDb)
      if (x.valueConverter == ValueConverters.DateOnly) result += ' date'
      else result += ' timestamp'
    else result += ' ' + x.valueConverter.fieldTypeInDb
  } else if (x.valueType == Boolean)
    result += ' boolean' + (x.allowNull ? '' : ' default false not null')
  else if (x.valueConverter.fieldTypeInDb) {
    result += ' ' + x.valueConverter.fieldTypeInDb
    if (!x.allowNull && x.valueConverter.fieldTypeInDb == 'integer') {
      result += ' default 0 not null'
    }
  } else result += ' varchar' + (x.allowNull ? '' : " default '' not null")
  return result
}

export async function verifyStructureOfAllEntities(
  db: SqlDatabase,
  remult: Remult,
) {
  return await new PostgresSchemaBuilder(db).verifyStructureOfAllEntities(
    remult,
  )
}

export class PostgresSchemaBuilder {
  //@internal
  static logToConsole = true

  private removeQuotes(s: string) {
    if (s.startsWith('"') && s.endsWith('"')) {
      return s.substring(1, s.length - 1)
    }
    return s.toLocaleLowerCase()
  }

  private whereTableAndSchema(cmd: SqlCommand, e: EntityDbNamesBase) {
    let table = ''
    let schema = ''

    if (this.specifiedSchema) {
      schema = this.specifiedSchema
    }

    const splited = e.$entityName.split('.')

    // let's prioritize the specified schema at dbName level
    if (splited.length > 1) {
      schema = splited[0]
      table = splited[1]
    } else {
      table = splited[0]
    }

    const where = []
    if (schema) {
      where.push(
        `table_schema=${cmd.addParameterAndReturnSqlToken(
          this.removeQuotes(schema),
        )}`,
      )
    }
    where.push(
      `table_name=${cmd.addParameterAndReturnSqlToken(
        this.removeQuotes(table),
      )}`,
    )

    return where.join(' AND ')
  }

  private schemaAndName(e: EntityDbNamesBase) {
    if (e.$entityName.includes('.')) {
      return e.$entityName
    }
    if (this.specifiedSchema) {
      return `${this.specifiedSchema}.${e.$entityName}`
    }
    return e.$entityName
  }

  async verifyStructureOfAllEntities(remult?: Remult) {
    if (!remult) {
      remult = defaultRemult
    }
    const completed = new Set<string>()
    const entities: EntityMetadata[] = []
    for (const entityClass of [...allEntities].reverse()) {
      let entity = remult.repo(entityClass).metadata
      let e: EntityDbNamesBase = await dbNamesOf(entity)
      if (completed.has(e.$entityName)) continue
      completed.add(e.$entityName)
      entities.push(entity)
    }
    await this.ensureSchema(entities)
  }

  async ensureSchema(entities: EntityMetadata<any>[]) {
    for (const entity of entities) {
      let e: EntityDbNamesBase = await dbNamesOf(entity)
      try {
        if (!entity.options.sqlExpression) {
          if (e.$entityName.toLowerCase().indexOf('from ') < 0) {
            await this.createIfNotExist(entity)
            await this.verifyAllColumns(entity)
          }
        }
      } catch (err) {
        console.error('failed verify structure of ' + e.$entityName + ' ', err)
      }
    }
  }

  async createIfNotExist(entity: EntityMetadata): Promise<void> {
    var c = this.pool.createCommand()
    let e: EntityDbNamesBase = await dbNamesOf(entity)

    await c
      .execute(
        `SELECT 1 FROM information_Schema.tables WHERE ` +
          `${this.whereTableAndSchema(c, e)}`,
      )
      .then(async (r) => {
        if (r.rows.length == 0) {
          let result = ''
          for (const x of entity.fields) {
            if (!isDbReadonly(x, e) || isAutoIncrement(x)) {
              if (result.length != 0) result += ','
              result += '\r\n  '

              if (isAutoIncrement(x)) result += e.$dbNameOf(x) + ' serial'
              else {
                result += postgresColumnSyntax(x, e.$dbNameOf(x))
              }
              if (x == entity.idMetadata.field) result += ' primary key'
            }
          }

          let sql = `CREATE table ${this.schemaAndName(e)} (${result}\r\n)`
          if (PostgresSchemaBuilder.logToConsole) console.info(sql)
          await this.pool.execute(sql)
        }
      })
  }

  async addColumnIfNotExist<T extends EntityMetadata>(
    entity: T,
    c: (e: T) => FieldMetadata,
  ) {
    let e: EntityDbNamesBase = await dbNamesOf(entity)
    if (isDbReadonly(c(entity), e)) return
    try {
      let cmd = this.pool.createCommand()

      const colName = e.$dbNameOf(c(entity))
      if (
        (
          await cmd.execute(
            `SELECT 1 FROM information_schema.columns WHERE ` +
              `${this.whereTableAndSchema(cmd, e)} ` +
              `AND column_name=${cmd.addParameterAndReturnSqlToken(
                colName.toLocaleLowerCase(),
              )}`,
          )
        ).rows.length == 0
      ) {
        let sql =
          `ALTER table ${this.schemaAndName(e)} ` +
          `ADD column ${postgresColumnSyntax(c(entity), colName)}`
        if (PostgresSchemaBuilder.logToConsole) console.info(sql)
        await this.pool.execute(sql)
      }
    } catch (err) {
      console.error(err)
    }
  }

  async verifyAllColumns<T extends EntityMetadata>(entity: T) {
    try {
      let cmd = this.pool.createCommand()
      let e: EntityDbNamesBase = await dbNamesOf(entity)

      let cols = (
        await cmd.execute(
          `SELECT column_name FROM information_schema.columns WHERE ` +
            `${this.whereTableAndSchema(cmd, e)}`,
        )
      ).rows.map((x) => x.column_name.toLocaleLowerCase())
      for (const col of entity.fields) {
        if (!isDbReadonly(col, e)) {
          let colName = e.$dbNameOf(col).toLocaleLowerCase()
          if (colName.startsWith('"') && colName.endsWith('"'))
            colName = colName.substring(1, colName.length - 1)
          if (!cols.includes(colName)) {
            let sql =
              `ALTER table ${this.schemaAndName(e)} ` +
              `add column ${postgresColumnSyntax(col, e.$dbNameOf(col))}`
            if (PostgresSchemaBuilder.logToConsole) console.info(sql)
            await this.pool.execute(sql)
          }
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  specifiedSchema = ''
  constructor(
    private pool: SqlDatabase,
    schema?: string,
  ) {
    if (schema) {
      this.specifiedSchema = schema
    }
  }
}
