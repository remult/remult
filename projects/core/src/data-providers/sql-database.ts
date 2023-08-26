import {
  EntityDataProvider,
  EntityDataProviderFindOptions,
  DataProvider,
} from '../data-interfaces'
import {
  SqlCommand,
  SqlCommandWithParameters,
  SqlImplementation,
  SqlResult,
} from '../sql-command'
import { CompoundIdField } from '../column'

import {
  CustomSqlFilterBuilderFunction,
  CustomSqlFilterObject,
  dbNamesOf,
  EntityDbNames,
  EntityDbNamesBase,
  FilterConsumerBridgeToSqlRequest,
  isDbReadonly,
} from '../filter/filter-consumer-bridge-to-sql-request'
import { customDatabaseFilterToken, Filter } from '../filter/filter-interfaces'
import { Sort, SortSegment } from '../sort'
import {
  EntityMetadata,
  EntityFilter,
  OmitEB,
  Repository,
  RepositoryImplementation,
  RepositoryOverloads,
  getRepository,
  EntityBase,
} from '../remult3'
import { FieldMetadata } from '../column-interfaces'
import { Remult } from '../context'
import { remult as defaultRemult } from '../remult-proxy'
import { ValueConverters } from '../valueConverters'

// @dynamic
export class SqlDatabase implements DataProvider {
  static getDb(remult?: Remult) {
    const r = (remult || defaultRemult).dataProvider as SqlDatabase
    if (!r.createCommand) throw 'the data provider is not an SqlDatabase'
    return r
  }
  createCommand(): SqlCommand {
    return new LogSQLCommand(this.sql.createCommand(), SqlDatabase.LogToConsole)
  }
  async execute(sql: string) {
    return await this.createCommand().execute(sql)
  }
  /* @internal*/
  _getSourceSql() {
    return this.sql
  }
  async ensureSchema(entities: EntityMetadata<any>[]): Promise<void> {
    if (this.sql.ensureSchema) await this.sql.ensureSchema(entities)
  }
 
  getEntityDataProvider(entity: EntityMetadata): EntityDataProvider {
    if (!this.sql.supportsJsonColumnType) {
      for (const f of entity.fields.toArray()) {
        if (f.valueConverter.fieldTypeInDb === 'json') {
          //@ts-ignore
          f.valueConverter = {
            ...f.valueConverter,
            toDb: ValueConverters.JsonString.toDb,
            fromDb: ValueConverters.JsonString.fromDb,
          }
        }
      }
    }

    return new ActualSQLServerDataProvider(
      entity,
      this,
      async (dbName) => {
        if (this.createdEntities.indexOf(dbName.$entityName) < 0) {
          this.createdEntities.push(dbName.$entityName)
          await this.sql.entityIsUsedForTheFirstTime(entity)
        }
      },
      this.sql,
    )
  }
  transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void> {
    return this.sql.transaction(async (x) => {
      let completed = false
      try {
        await action(
          new SqlDatabase({
            createCommand: () => {
              let c = x.createCommand()
              return {
                addParameterAndReturnSqlToken: (x) =>
                  c.addParameterAndReturnSqlToken(x),
                execute: async (sql) => {
                  if (completed)
                    throw "can't run a command after the transaction was completed"
                  return c.execute(sql)
                },
              }
            },
            getLimitSqlSyntax: this.sql.getLimitSqlSyntax,
            entityIsUsedForTheFirstTime: (y) =>
              x.entityIsUsedForTheFirstTime(y),
            transaction: (z) => x.transaction(z),
            supportsJsonColumnType: this.sql.supportsJsonColumnType,
          }),
        )
      } finally {
        completed = true
      }
    })
  }
  static rawFilter(build: CustomSqlFilterBuilderFunction): EntityFilter<any> {
    return {
      [customDatabaseFilterToken]: {
        buildSql: build,
      },
    }
  }
  static async filterToRaw<entityType>(
    repo: RepositoryOverloads<entityType>,
    condition: EntityFilter<entityType>,
    sqlCommand?: SqlCommandWithParameters,
  ) {
    if (!sqlCommand) {
      sqlCommand = new myDummySQLCommand()
    }
    const r = getRepository(repo)

    var b = new FilterConsumerBridgeToSqlRequest(
      sqlCommand,
      await dbNamesOf(r.metadata),
    )
    b._addWhere = false
    await (
      await (r as RepositoryImplementation<entityType>).translateWhereToFilter(
        condition,
      )
    ).__applyToConsumer(b)
    return await b.resolveWhere()
  }
  /**
   * `false` _(default)_ - No logging
   *
   * `true` - to log all queries to the console
   *
   * `oneLiner` - to log all queries to the console as one line
   *
   * a `function` - to log all queries to the console as a custom format
   */
  public static LogToConsole:
    | boolean
    | 'oneLiner'
    | ((duration: number, query: string, args: Record<string, any>) => void) =
    false
  /**
   * Threshold in milliseconds for logging queries to the console.
   */
  public static durationThreshold = 0
  constructor(private sql: SqlImplementation) {}
  private createdEntities: string[] = []
}

const icons = new Map<string, string>([
  // CRUD
  ['INSERT', '⚪'], // Used to insert new data into a database.
  ['SELECT', '🔵'], // Used to select data from a database and retrieve it.
  ['UPDATE', '🟣'], // Used to update existing data within a database.
  ['DELETE', '🟤'], // Used to delete existing data from a database.
  // Additional
  ['CREATE', '🟩'], // Used to create a new table, or database.
  ['ALTER', '🟨'], // Used to modify an existing database object, such as a table.
  ['DROP', '🟥'], // Used to delete an entire table or database.
  ['TRUNCATE', '⬛'], // Used to remove all records from a table, including all spaces allocated for the records are removed.
  ['GRANT', '🟪'], // Used to give a specific user permission to perform certain tasks.
  ['REVOKE', '🟫'], // Used to take back permissions from a user.
])

class LogSQLCommand implements SqlCommand {
  constructor(
    private origin: SqlCommand,
    private logToConsole: typeof SqlDatabase.LogToConsole,
  ) {}

  args: any = {}
  addParameterAndReturnSqlToken(val: any): string {
    let r = this.origin.addParameterAndReturnSqlToken(val)
    this.args[r] = val
    return r
  }
  async execute(sql: string): Promise<SqlResult> {
    try {
      let start = new Date()
      let r = await this.origin.execute(sql)
      if (this.logToConsole !== false) {
        var d = new Date().valueOf() - start.valueOf()
        if (d > SqlDatabase.durationThreshold) {
          const duration = d / 1000
          if (this.logToConsole === 'oneLiner') {
            const rawSql = sql
              .replace(/(\r\n|\n|\r|\t)/gm, ' ')
              .replace(/  +/g, ' ')
              .trim()
            const first = rawSql.split(' ')[0].toUpperCase()
            console.info(
              `${icons.get(first) || '💢'} (${duration.toFixed(
                3,
              )}) ${rawSql} ${JSON.stringify(this.args)}`,
            )
          } else if (typeof this.logToConsole === 'function') {
            this.logToConsole(duration, sql, this.args)
          } else {
            console.info({ query: sql, arguments: this.args, duration })
          }
        }
      }
      return r
    } catch (err) {
      console.error({ error: err, query: sql, arguments: this.args })
      throw err
    }
  }
}

class ActualSQLServerDataProvider implements EntityDataProvider {
  public static LogToConsole = false
  constructor(
    private entity: EntityMetadata,
    private sql: SqlDatabase,
    private iAmUsed: (e: EntityDbNamesBase) => Promise<void>,
    private strategy: SqlImplementation,
  ) {}
  async init() {
    let dbNameProvider: EntityDbNamesBase = await dbNamesOf(this.entity)
    await this.iAmUsed(dbNameProvider)
    return dbNameProvider
  }

  async count(where: Filter): Promise<number> {
    let e = await this.init()

    let select = 'select count(*) count from ' + e.$entityName
    let r = this.sql.createCommand()
    if (where) {
      let wc = new FilterConsumerBridgeToSqlRequest(r, e)
      where.__applyToConsumer(wc)
      select += await wc.resolveWhere()
    }

    return r.execute(select).then((r) => {
      return Number(r.rows[0].count)
    })
  }
  async find(options?: EntityDataProviderFindOptions): Promise<any[]> {
    let e = await this.init()

    let { colKeys, select } = this.buildSelect(e)
    select = 'select ' + select

    select += '\n from ' + e.$entityName
    let r = this.sql.createCommand()
    if (options) {
      if (options.where) {
        let where = new FilterConsumerBridgeToSqlRequest(r, e)
        options.where.__applyToConsumer(where)
        select += await where.resolveWhere()
      }
      if (options.limit) {
        options.orderBy = Sort.createUniqueSort(this.entity, options.orderBy)
      }
      if (!options.orderBy) {
        options.orderBy = Sort.createUniqueSort(this.entity, new Sort())
      }
      if (options.orderBy) {
        let first = true
        let segs: SortSegment[] = []
        for (const s of options.orderBy.Segments) {
          if (s.field instanceof CompoundIdField) {
            segs.push(
              ...s.field.fields.map((c) => ({
                field: c,
                isDescending: s.isDescending,
              })),
            )
          } else segs.push(s)
        }
        for (const c of segs) {
          if (first) {
            select += ' Order By '
            first = false
          } else select += ', '

          select += e.$dbNameOf(c.field)
          if (c.isDescending) select += ' desc'
        }
      }

      if (options.limit) {
        let page = 1
        if (options.page) page = options.page
        if (page < 1) page = 1
        select +=
          ' ' +
          this.strategy.getLimitSqlSyntax(
            options.limit,
            (page - 1) * options.limit,
          )
      }
    }

    return r.execute(select).then((r) => {
      return r.rows.map((y) => {
        return this.buildResultRow(colKeys, y, r)
      })
    })
  }

  private buildResultRow(colKeys: FieldMetadata<any>[], y: any, r: SqlResult) {
    let result: any = {}
    for (let index = 0; index < colKeys.length; index++) {
      const col = colKeys[index]
      try {
        result[col.key] = col.valueConverter.fromDb(
          y[r.getColumnKeyInResultForIndexInSelect(index)],
        )
      } catch (err) {
        throw new Error('Failed to load from db:' + col.key + '\r\n' + err)
      }
    }
    return result
  }

  private buildSelect(e: EntityDbNamesBase) {
    let select = ''
    let colKeys: FieldMetadata[] = []
    for (const x of this.entity.fields) {
      if (x.isServerExpression) {
      } else {
        if (colKeys.length > 0) select += ', '
        select += e.$dbNameOf(x)
        colKeys.push(x)
      }
    }
    return { colKeys, select }
  }

  async update(id: any, data: any): Promise<any> {
    let e = await this.init()
    let r = this.sql.createCommand()
    let f = new FilterConsumerBridgeToSqlRequest(r, e)
    Filter.fromEntityFilter(
      this.entity,
      this.entity.idMetadata.getIdFilter(id),
    ).__applyToConsumer(f)

    let statement = 'update ' + e.$entityName + ' set '
    let added = false

    for (const x of this.entity.fields) {
      if (x instanceof CompoundIdField) {
      }
      if (isDbReadonly(x, e)) {
      } else if (data[x.key] !== undefined) {
        let v = x.valueConverter.toDb(data[x.key])
        if (v !== undefined) {
          if (!added) added = true
          else statement += ', '

          statement +=
            e.$dbNameOf(x) + ' = ' + r.addParameterAndReturnSqlToken(v)
        }
      }
    }

    statement += await f.resolveWhere()
    let { colKeys, select } = this.buildSelect(e)
    statement += ' returning ' + select

    return r.execute(statement).then((sqlResult) => {
      return this.buildResultRow(colKeys, sqlResult.rows[0], sqlResult)
    })
  }
  async delete(id: any): Promise<void> {
    let e = await this.init()
    let r = this.sql.createCommand()
    let f = new FilterConsumerBridgeToSqlRequest(r, e)
    Filter.fromEntityFilter(
      this.entity,
      this.entity.idMetadata.getIdFilter(id),
    ).__applyToConsumer(f)
    let statement = 'delete from ' + e.$entityName
    statement += await f.resolveWhere()
    return r.execute(statement).then(() => {})
  }
  async insert(data: any): Promise<any> {
    let e = await this.init()

    let r = this.sql.createCommand()
    let cols = ''
    let vals = ''
    let added = false

    for (const x of this.entity.fields) {
      if (isDbReadonly(x, e)) {
      } else {
        let v = x.valueConverter.toDb(data[x.key])
        if (v != undefined) {
          if (!added) added = true
          else {
            cols += ', '
            vals += ', '
          }

          cols += e.$dbNameOf(x)
          vals += r.addParameterAndReturnSqlToken(v)
        }
      }
    }

    let statement = `insert into ${e.$entityName} (${cols}) values (${vals})`

    let { colKeys, select } = this.buildSelect(e)
    statement += ' returning ' + select
    return await r
      .execute(statement)
      .then((sql) => this.buildResultRow(colKeys, sql.rows[0], sql))
  }
}

class myDummySQLCommand implements SqlCommand {
  execute(sql: string): Promise<SqlResult> {
    throw new Error('Method not implemented.')
  }
  addParameterAndReturnSqlToken(val: any): string {
    if (val === null) return 'null'
    if (val instanceof Date) val = val.toISOString()
    if (typeof val == 'string') {
      if (val == undefined) val = ''
      return "'" + val.replace(/'/g, "''") + "'"
    }
    return val.toString()
  }
}

async function bulkInsert<entityType extends EntityBase>(
  array: entityType[],
  db: SqlDatabase,
) {
  if (array.length == 0) return

  const chunkSize = 250
  for (let i = 0; i < array.length; i += chunkSize) {
    const items = array.slice(i, i + chunkSize)
    // do whatever

    const c = db.createCommand()
    let sql =
      'insert into ' +
      (await items[0]._.metadata.getDbName()) +
      ' (' +
      (
        await Promise.all(
          items[0]._.metadata.fields.toArray().map((f) => f.getDbName()),
        )
      ).join(',') +
      ') values '

    sql += items
      .map(
        (row) =>
          '(' +
          row.$.toArray()
            .map((f) =>
              c.addParameterAndReturnSqlToken(
                f.metadata.valueConverter.toDb!(f.value),
              ),
            )
            .join(', ') +
          ')',
      )
      .join(',')

    await c.execute(sql)
  }
}
