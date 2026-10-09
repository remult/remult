import type {
  DataProvider,
  EntityDataProvider,
  EntityDataProviderGroupByOptions,
  EntityDataProviderFindOptions,
} from '../data-interfaces.js'
import type {
  HasWrapIdentifier,
  SqlCommand,
  SqlCommandFactory,
  SqlCommandWithParameters,
  SqlImplementation,
  SqlResult,
} from '../sql-command.js'

import type { FieldMetadata } from '../column-interfaces.js'
import type {
  CustomSqlFilterBuilderFunction,
  EntityDbNamesBase,
} from '../filter/filter-consumer-bridge-to-sql-request.js'
import {
  FilterConsumerBridgeToSqlRequest,
  dbNamesOfWithForceSqlExpression,
  isDbReadonly,
  toDbSql,
} from '../filter/filter-consumer-bridge-to-sql-request.js'
import {
  Filter,
  customDatabaseFilterToken,
} from '../filter/filter-interfaces.js'
import { remult as defaultRemult } from '../remult-proxy.js'
import {
  GroupByCountMember,
  GroupByOperators,
  type EntityFilter,
  type EntityMetadata,
  type FindOptions,
  type GroupByOptions,
  type GroupByResult,
  type InsertOrUpdateOptions,
  type MembersOnly,
  type NumericKeys,
  type Repository,
} from '../remult3/remult3.js'
import type {
  EntityBase,
  RepositoryOverloads,
} from '../remult3/RepositoryImplementation.js'
import {
  getRepository,
  isAutoIncrement,
} from '../remult3/RepositoryImplementation.js'
import type { SortSegment } from '../sort.js'
import { Sort } from '../sort.js'
import { ValueConverters } from '../valueConverters.js'
import { getRepositoryInternals } from '../remult3/repository-internals.js'
import type {
  CanBuildMigrations,
  MigrationBuilder,
  MigrationCode,
} from '../../migrations/migration-types.js'
import { isOfType } from '../isOfType.js'
import { originalSqlExpressionKey } from '../filter/fieldDbName.js'

/**
 * A DataProvider for Sql Databases
 * @example
 * const db = new SqlDatabase(new PostgresDataProvider(pgPool))
* @see [Connecting a Database](https://remult.dev/docs/quickstart#connecting-a-database)

 */
export class SqlDatabase
  implements
    DataProvider,
    HasWrapIdentifier,
    CanBuildMigrations,
    SqlCommandFactory
{
  /**
   * Gets the SQL database from the data provider.
   * @param dataProvider - The data provider.
   * @returns The SQL database.
   * @see [Direct Database Access](https://remult.dev/docs/running-sql-on-the-server)
   */
  static getDb(dataProvider?: DataProvider) {
    const r = (dataProvider || defaultRemult.dataProvider) as SqlDatabase
    if (isOfType<SqlCommandFactory>(r, 'createCommand')) return r
    else throw 'the data provider is not an SqlCommandFactory'
  }
  /**
   * Creates a new SQL command.
   * @returns The SQL command.
   * @see [Direct Database Access](https://remult.dev/docs/running-sql-on-the-server)
   */
  createCommand(): SqlCommand {
    return new LogSQLCommand(this.sql.createCommand(), SqlDatabase.LogToConsole)
  }
  /**
   * Executes a SQL command.
   * @param sql - The SQL command.
   * @returns The SQL result.
   * @see [Direct Database Access](https://remult.dev/docs/running-sql-on-the-server)
   */
  async execute(sql: string) {
    return await this.createCommand().execute(sql)
  }

  /**
   * Wraps an identifier with the database's identifier syntax.
   */

  wrapIdentifier: (name: string) => string = (x) => x
  /* @internal*/
  _getSourceSql() {
    return this.sql
  }
  async ensureSchema(entities: EntityMetadata[]): Promise<void> {
    if (this.sql.ensureSchema) await this.sql.ensureSchema(entities)
  }

  /**
   * Gets the entity data provider.
   * @param entity  - The entity metadata.
   * @returns The entity data provider.
   */
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

    return new ActualSQLEntityDataProvider(
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
  /**
   * Runs a transaction. Used internally by remult when transactions are required
   * @param action - The action to run in the transaction.
   * @returns The promise of the transaction.
   */
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
                addParameterAndReturnSqlToken: (val: any) => {
                  return c.param(val)
                },
                param: (x) => c.param(x),
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
            wrapIdentifier: this.wrapIdentifier,
            end: this.end,
            doesNotSupportReturningSyntax:
              this.sql.doesNotSupportReturningSyntax,
            doesNotSupportReturningSyntaxOnlyForUpdate:
              this.sql.doesNotSupportReturningSyntaxOnlyForUpdate,
            orderByNullsFirst: this.sql.orderByNullsFirst,
            afterMutation: this.sql.afterMutation,
            maxParametersInOneSqlStatement:
              this.sql.maxParametersInOneSqlStatement,
          }),
        )
      } finally {
        completed = true
      }
    })
  }
  /**
   * Creates a raw filter for entity filtering.
   * @param {CustomSqlFilterBuilderFunction} build - The custom SQL filter builder function.
   * @returns {EntityFilter<any>} - The entity filter with a custom SQL filter.
   * @example
   * SqlDatabase.rawFilter(({param}) =>
        `"customerId" in (select id from customers where city = ${param(customerCity)})`
      )
   * @see [Leveraging Database Capabilities with Raw SQL in Custom Filters](https://remult.dev/docs/custom-filter.html#leveraging-database-capabilities-with-raw-sql-in-custom-filters)
   */
  static rawFilter(build: CustomSqlFilterBuilderFunction): EntityFilter<any> {
    return {
      [customDatabaseFilterToken]: {
        buildSql: build,
      },
    }
  }
  /**
   *  Converts a filter to a raw SQL string.
   *  @see [Leveraging Database Capabilities with Raw SQL in Custom Filters](https://remult.dev/docs/running-sql-on-the-server#leveraging-entityfilter-for-sql-databases)
   
   */

  static async filterToRaw<entityType>(
    repo: RepositoryOverloads<entityType>,
    condition: EntityFilter<entityType>,
    sqlCommand?: SqlCommandWithParameters,
    dbNames?: EntityDbNamesBase,
    wrapIdentifier?: (name: string) => string,
  ) {
    if (!sqlCommand) {
      sqlCommand = new myDummySQLCommand()
    }
    const r = getRepository(repo)

    var b = new FilterConsumerBridgeToSqlRequest(
      sqlCommand,
      dbNames ||
        (await dbNamesOfWithForceSqlExpression(r.metadata, wrapIdentifier)),
    )
    b._addWhere = false
    await (
      await getRepositoryInternals(r)._translateWhereToFilter(condition)
    ).__applyToConsumer(b)
    return await b.resolveWhere()
  }
  /**
   * Builds the select that `repo.groupBy` would run, without running it - for a statement remult cannot run on its own, such as one `UNION ALL` over several databases.
   * @returns `sql`, and `toResult`, which maps a result row (read by column alias) to the shape `groupBy` returns.
   * @see [Building a select with remult](https://remult.dev/docs/running-sql-on-the-server#building-a-select-with-remult)
   */
  static async groupByToRaw<
    entityType,
    groupByFields extends
      | (keyof MembersOnly<entityType>)[]
      | undefined = undefined,
    sumFields extends NumericKeys<entityType>[] | undefined = undefined,
    averageFields extends NumericKeys<entityType>[] | undefined = undefined,
    minFields extends (keyof MembersOnly<entityType>)[] | undefined = undefined,
    maxFields extends (keyof MembersOnly<entityType>)[] | undefined = undefined,
    distinctCountFields extends
      | (keyof MembersOnly<entityType>)[]
      | undefined = undefined,
  >(
    repo: RepositoryOverloads<entityType>,
    options: GroupByOptions<
      entityType,
      groupByFields extends undefined ? never : groupByFields,
      sumFields extends undefined ? never : sumFields,
      averageFields extends undefined ? never : averageFields,
      minFields extends undefined ? never : minFields,
      maxFields extends undefined ? never : maxFields,
      distinctCountFields extends undefined ? never : distinctCountFields
    >,
    sql?: RawSelectOptions,
  ): Promise<{
    sql: string
    toResult: (
      row: Record<string, any>,
    ) => GroupByResult<
      entityType,
      groupByFields extends undefined ? never : groupByFields,
      sumFields extends undefined ? never : sumFields,
      averageFields extends undefined ? never : averageFields,
      minFields extends undefined ? never : minFields,
      maxFields extends undefined ? never : maxFields,
      distinctCountFields extends undefined ? never : distinctCountFields
    >
  }> {
    const r = getRepository(repo)
    const built = await buildGroupBySql(
      await getRepositoryInternals(r).__buildGroupByOptions(options),
      sql?.dbNames ??
        (await dbNamesOfWithForceSqlExpression(
          r.metadata,
          sql?.wrapIdentifier ?? wrapIdentifierOf(r),
        )),
      sql?.sqlCommand ?? new myDummySQLCommand(),
      false,
      sql?.limitSyntax ?? limitSyntaxRequired,
    )
    return {
      sql: built.select,
      toResult: (row) => built.toResult((_, alias) => row[alias]),
    }
  }
  /**
   * Builds the select that `repo.find` would run, without running it. Columns are aliased by field key; no default order is added, so the sql can be a branch of a `UNION`.
   * @returns `sql`, and `toResult`, which maps a result row (read by column alias) to the fields' values.
   * @see [Building a select with remult](https://remult.dev/docs/running-sql-on-the-server#building-a-select-with-remult)
   */
  static async selectToRaw<entityType>(
    repo: RepositoryOverloads<entityType>,
    options?: FindOptions<entityType>,
    sql?: RawSelectOptions,
  ): Promise<{
    sql: string
    toResult: (row: Record<string, any>) => Partial<MembersOnly<entityType>>
  }> {
    const r = getRepository(repo)
    const built = await buildFindSql(
      r.metadata,
      await getRepositoryInternals(r)._buildEntityDataProviderFindOptions(
        options ?? {},
      ),
      sql?.dbNames ??
        (await dbNamesOfWithForceSqlExpression(
          r.metadata,
          sql?.wrapIdentifier ?? wrapIdentifierOf(r),
        )),
      sql?.sqlCommand ?? new myDummySQLCommand(),
      false,
      sql?.limitSyntax ?? limitSyntaxRequired,
      { aliasColumns: true, defaultOrderBy: false },
    )
    return {
      sql: built.select,
      toResult: (row) => built.toResult((_, alias) => row[alias]),
    }
  }
  /**
   * `false` _(default)_ - No logging
   *
   * `true` - to log all queries to the console
   *
   * `oneLiner` - to log all queries to the console as one line
   *
   * a `function` - to log all queries to the console as a custom format
   * @example
   * SqlDatabase.LogToConsole = (duration, query, args) => { console.log("be crazy ;)") }
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
  /**
   * Creates a new SQL database.
   * @param sql - The SQL implementation.
   * @example
   * const db = new SqlDatabase(new PostgresDataProvider(pgPool))
   */
  constructor(private sql: SqlImplementation) {
    if (sql.wrapIdentifier) this.wrapIdentifier = (x) => sql.wrapIdentifier!(x)
    if (isOfType<CanBuildMigrations>(sql, 'provideMigrationBuilder')) {
      this.provideMigrationBuilder = (x) => sql.provideMigrationBuilder(x)
    }
    if (isOfType(sql, 'end')) this.end = () => sql.end()
  }
  provideMigrationBuilder!: (builder: MigrationCode) => MigrationBuilder
  private createdEntities: string[] = []

  end!: () => Promise<void>
}

const defaultMaxParametersInOneSqlStatement = 2000

function splitByMaxParameters<T>(
  items: T[],
  parametersInItem: (item: T) => number,
  maxParameters: number,
): T[][] {
  const batches: T[][] = []
  let batch: T[] = []
  let params = 0
  for (const item of items) {
    const n = parametersInItem(item)
    if (batch.length > 0 && params + n > maxParameters) {
      batches.push(batch)
      batch = []
      params = 0
    }
    batch.push(item)
    params += n
  }
  if (batch.length) batches.push(batch)
  return batches
}

function countInsertBindParameters(
  entity: EntityMetadata,
  e: EntityDbNamesBase,
  row: any,
): number {
  let n = 0
  for (const x of entity.fields) {
    if (isDbReadonly(x, e)) continue
    if (x.valueConverter.toDb(row[x.key]) != undefined) n++
  }
  return n
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
  addParameterAndReturnSqlToken(val: any) {
    return this.param(val)
  }
  param(val: any, name?: string): string {
    let r = this.origin.param(val)
    this.args[r] = val
    return r
  }
  async execute(sql: string): Promise<SqlResult> {
    try {
      let start = new Date()
      let r = await this.origin.execute(sql)
      if (this.logToConsole !== false) {
        var d = new Date().valueOf() - start.valueOf()
        if (d >= SqlDatabase.durationThreshold) {
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
            console.info(sql + '\n', { arguments: this.args, duration })
          }
        }
      }
      return r
    } catch (err: any) {
      console.error((err.message || 'Sql Error') + ':\n', sql, {
        arguments: this.args,
        error: err,
      })
      throw err
    }
  }
}

class ActualSQLEntityDataProvider implements EntityDataProvider {
  public static LogToConsole = false
  constructor(
    private entity: EntityMetadata,
    private sql: SqlDatabase,
    private iAmUsed: (e: EntityDbNamesBase) => Promise<void>,
    private strategy: SqlImplementation,
  ) {}

  async init() {
    let dbNameProvider: EntityDbNamesBase =
      await dbNamesOfWithForceSqlExpression(this.entity, (x) =>
        this.sql.wrapIdentifier(x),
      )
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
  async groupBy(options?: EntityDataProviderGroupByOptions): Promise<any[]> {
    return await groupByImpl(
      options,
      await this.init(),
      this.sql.createCommand(),
      this.sql._getSourceSql().orderByNullsFirst,
      this.sql._getSourceSql().getLimitSqlSyntax,
    )
  }

  async find(options?: EntityDataProviderFindOptions): Promise<any[]> {
    const e = await this.init()
    const r = this.sql.createCommand()
    const { select, toResult } = await buildFindSql(
      this.entity,
      options,
      e,
      r,
      this.sql._getSourceSql().orderByNullsFirst,
      (limit, offset) => this.strategy.getLimitSqlSyntax(limit, offset),
    )
    const result = await r.execute(select)
    return result.rows.map((y) =>
      toResult((i) => y[result.getColumnKeyInResultForIndexInSelect(i)]),
    )
  }

  private buildResultRow(colKeys: FieldMetadata<any>[], y: any, r: SqlResult) {
    return resultRow(
      colKeys,
      (i) => y[r.getColumnKeyInResultForIndexInSelect(i)],
    )
  }

  private async buildSelect(
    e: EntityDbNamesBase,
    r: SqlCommand,
    selectedFields?: string[],
    args?: any,
  ) {
    return selectColumns(this.entity, e, r, selectedFields, args, false)
  }

  async update(
    id: any,
    data: any,
    options?: InsertOrUpdateOptions,
  ): Promise<any> {
    let e = await this.init()
    let r = this.sql.createCommand()

    let statement = 'update ' + e.$entityName + ' set '
    let added = false

    for (const x of this.entity.fields) {
      if (isDbReadonly(x, e)) {
      } else if (data[x.key] !== undefined) {
        let v = x.valueConverter.toDb(data[x.key])
        if (v !== undefined) {
          if (!added) added = true
          else statement += ', '

          statement += e.$dbNameOf(x) + ' = ' + toDbSql(r, x, v)
        }
      }
    }
    const idFilter = this.entity.idMetadata.getIdFilter(id)

    let f = new FilterConsumerBridgeToSqlRequest(r, e)
    Filter.fromEntityFilter(this.entity, idFilter).__applyToConsumer(f)
    statement += await f.resolveWhere()
    let { colKeys, select } = await this.buildSelect(e, r, undefined, undefined)
    let returning = true
    if (this.sql._getSourceSql().doesNotSupportReturningSyntax)
      returning = false
    if (options?.select === 'none') returning = false
    if (
      returning &&
      this.sql._getSourceSql().doesNotSupportReturningSyntaxOnlyForUpdate
    )
      returning = false
    if (returning) statement += ' returning ' + select

    return r.execute(statement).then((sqlResult) => {
      this.sql._getSourceSql().afterMutation?.()
      if (!returning) {
        if (options?.select === 'none') return undefined!
        return getRowAfterUpdate(this.entity, this, data, id, 'update')
      }
      if (sqlResult.rows.length != 1)
        throw new Error(
          'Failed to update row with id ' +
            id +
            ', rows updated: ' +
            sqlResult.rows.length,
        )
      return this.buildResultRow(colKeys, sqlResult.rows[0], sqlResult)
    })
  }

  async delete(ids: any[]): Promise<void> {
    if (ids.length === 0) return
    let e = await this.init()
    let r = this.sql.createCommand()
    let f = new FilterConsumerBridgeToSqlRequest(r, e)
    Filter.fromEntityFilter(
      this.entity,
      this.entity.idMetadata.getIdFilter(...ids),
    ).__applyToConsumer(f)
    let statement = 'delete from ' + e.$entityName
    statement += await f.resolveWhere()
    return r.execute(statement).then(() => {
      this.sql._getSourceSql().afterMutation?.()
    })
  }
  async insert(data: any[], options?: InsertOrUpdateOptions): Promise<any[]> {
    if (data.length === 0) return []
    let e = await this.init()
    const maxParams =
      this.strategy.maxParametersInOneSqlStatement ??
      defaultMaxParametersInOneSqlStatement
    const batches = splitByMaxParameters(
      data,
      (row) => countInsertBindParameters(this.entity, e, row),
      maxParams,
    )
    const result: any[] = []
    for (const batch of batches)
      result.push(...(await this.insertBatch(batch, e, options)))
    return result
  }
  //@internal
  async insertOne(data: any, options?: InsertOrUpdateOptions): Promise<any> {
    return (await this.insert([data], options))[0]
  }

  private async insertBatch(
    batch: any[],
    e: EntityDbNamesBase,
    options?: InsertOrUpdateOptions,
  ): Promise<any[]> {
    let r = this.sql.createCommand()
    const cols: FieldMetadata[] = []
    for (const x of this.entity.fields) {
      if (isDbReadonly(x, e)) continue
      if (batch.some((row) => x.valueConverter.toDb(row[x.key]) != undefined))
        cols.push(x)
    }

    let colSql = ''
    let vals = ''
    for (let i = 0; i < cols.length; i++) {
      if (i) colSql += ', '
      colSql += e.$dbNameOf(cols[i])
    }
    for (let i = 0; i < batch.length; i++) {
      if (i) vals += ','
      vals += '('
      for (let j = 0; j < cols.length; j++) {
        if (j) vals += ', '
        const x = cols[j]
        const v = x.valueConverter.toDb(batch[i][x.key])
        if (v != undefined) vals += toDbSql(r, x, v)
        else if (x.allowNull) vals += 'null'
        else vals += 'DEFAULT'
      }
      vals += ')'
    }

    let statement = `insert into ${e.$entityName} (${colSql}) values ${vals}`
    let { colKeys, select } = await this.buildSelect(e, r, undefined, undefined)
    const source = this.sql._getSourceSql()
    const wantRows = options?.select !== 'none'
    if (!source.doesNotSupportReturningSyntax && wantRows)
      statement += ' returning ' + select

    const sql = await r.execute(statement)
    source.afterMutation?.()
    if (!wantRows) return batch.map(() => undefined!)

    if (source.doesNotSupportReturningSyntax) {
      if (isAutoIncrement(this.entity.idMetadata.field)) {
        const lastId = sql.rows[0] as number
        if (typeof lastId !== 'number')
          throw new Error(
            'Auto increment, for a database that is does not support returning syntax, should return an array with the single last added id. Instead it returned: ' +
              JSON.stringify(lastId),
          )
        const ids: number[] = []
        for (let id = lastId - batch.length + 1; id <= lastId; id++)
          ids.push(id)
        return this.loadRowsByIds(ids)
      }
      return this.loadRowsByIds(
        batch.map((row) => this.entity.idMetadata.getId(row)),
      )
    }
    return sql.rows.map((row) => this.buildResultRow(colKeys, row, sql))
  }

  private async loadRowsByIds(ids: any[]): Promise<any[]> {
    const found = await this.find({
      where: Filter.fromEntityFilter(
        this.entity,
        this.entity.idMetadata.getIdFilter(...ids),
      ),
    })
    const byId = new Map(
      found.map((row) => [this.entity.idMetadata.getId(row) + '', row]),
    )
    return ids.map((id) => {
      const row = byId.get(id + '')
      if (!row)
        throw new Error(
          `Failed to insert row - result contained ${found.length} rows`,
        )
      return row
    })
  }
}

/** Where a raw select is built: the command that collects its parameters, the names it addresses the table and columns by, and the dialect's paging syntax. */
export interface RawSelectOptions {
  sqlCommand?: SqlCommandWithParameters
  /** Replace `$entityName` here to address another database or an alias: `{ ...await dbNamesOf(Task), $entityName: '[other].dbo.tasks' }`. */
  dbNames?: EntityDbNamesBase
  wrapIdentifier?: (name: string) => string
  /** Required only with `limit`: `(limit, offset) => 'limit 10 offset 20'`. */
  limitSyntax?: (limit: number, offset: number) => string
}

/** The quoting of the repository's own data provider, so a raw select matches the SQL remult would run against it. */
function wrapIdentifierOf(r: Repository<any>) {
  const dp = getRepositoryInternals(r)._dataProvider
  if (isOfType<HasWrapIdentifier>(dp, 'wrapIdentifier'))
    return dp.wrapIdentifier?.bind(dp)
  return undefined
}

function limitSyntaxRequired(): string {
  throw new Error(
    'A raw select with a limit needs limitSyntax, for example SqlDatabase.getDb()._getSourceSql().getLimitSqlSyntax',
  )
}

class myDummySQLCommand implements SqlCommand {
  execute(sql: string): Promise<SqlResult> {
    throw new Error('Method not implemented.')
  }
  addParameterAndReturnSqlToken(val: any) {
    return this.param(val)
  }
  param(val: any): string {
    if (val === null) return 'null'
    if (val instanceof Date) val = val.toISOString()
    if (typeof val == 'string') {
      if (val == undefined) val = ''
      return "'" + val.replace(/'/g, "''") + "'"
    }
    return val.toString()
  }
}

export function getRowAfterUpdate<entityType>(
  meta: EntityMetadata<entityType>,
  dataProvider: EntityDataProvider,
  data: any,
  id: any,
  operation: string,
): any {
  const idFilter: any = id !== undefined ? meta.idMetadata.getIdFilter(id) : {}
  return dataProvider
    .find({
      where: new Filter((x) => {
        for (const field of meta.idMetadata.fields) {
          x.isEqualTo(field, data[field.key] ?? idFilter[field.key])
        }
      }),
    })
    .then((r) => {
      if (r.length != 1)
        throw new Error(
          `Failed to ${operation} row - result contained ${r.length} rows`,
        )
      return r[0]
    })
}

/** The select that `find` runs, and the mapping of one result row to field values. With `aliasColumns`, every column is aliased through `wrapIdentifier`, so a row can be read by alias as well as by position. */
export async function buildFindSql(
  entity: EntityMetadata,
  options: EntityDataProviderFindOptions | undefined,
  e: EntityDbNamesBase,
  r: SqlCommandWithParameters,
  orderByNullsFirst: boolean | undefined,
  limitSyntax: (limit: number, offset: number) => string,
  { aliasColumns = false, defaultOrderBy = true } = {},
) {
  const { colKeys, select: columns } = await selectColumns(
    entity,
    e,
    r,
    options?.select,
    options?.args,
    aliasColumns,
  )
  let select = 'select ' + columns + '\n from ' + e.$entityName
  if (options) {
    if (options.where) {
      let where = new FilterConsumerBridgeToSqlRequest(r, e)
      options.where.__applyToConsumer(where)
      select += await where.resolveWhere()
    }
    if (options.limit) {
      options.orderBy = Sort.createUniqueSort(entity, options.orderBy)
    }
    if (!options.orderBy && defaultOrderBy) {
      options.orderBy = Sort.createUniqueSort(entity, new Sort())
    }
    if (options.orderBy) {
      let first = true
      for (const c of options.orderBy.Segments) {
        if (first) {
          select += ' Order By '
          first = false
        } else select += ', '

        select += c.field.options.sqlExpression
          ? c.field.options.key
          : await e.$dbNameOf(c.field)
        if (c.isDescending) select += ' desc'
        if (orderByNullsFirst) {
          if (c.isDescending) select += ' nulls last'
          else select += ' nulls first'
        }
      }
    }

    if (options.limit) {
      let page = 1
      if (options.page) page = options.page
      if (page < 1) page = 1
      select += ' ' + limitSyntax(options.limit, (page - 1) * options.limit)
    }
  }
  return {
    select,
    colKeys,
    /** `valueAt` reads one column of a result row, by its position in the select or by its alias (the field key). */
    toResult(valueAt: (indexInSelect: number, alias: string) => any) {
      return resultRow(colKeys, valueAt)
    },
  }
}

async function selectColumns(
  entity: EntityMetadata,
  e: EntityDbNamesBase,
  r: SqlCommandWithParameters,
  selectedFields: string[] | undefined,
  args: any,
  aliasColumns: boolean,
) {
  let select = ''
  let colKeys: FieldMetadata[] = []
  for (const x of entity.fields) {
    if (selectedFields && !selectedFields.includes(x.key)) continue
    if (x.isServerExpression) {
    } else {
      if (colKeys.length > 0) select += ', '
      if (typeof x.options.sqlExpression === 'function') {
        let sql = await (x as any)[originalSqlExpressionKey](entity, args, r)
        if (sql.includes(' ')) select += '(' + sql + ')'
        else select += sql
      } else select += e.$dbNameOf(x)
      if (aliasColumns) select += ' as ' + e.wrapIdentifier(x.key)
      else if (x.options.sqlExpression) select += ' as ' + x.key
      colKeys.push(x)
    }
  }
  return { colKeys, select }
}

function resultRow(
  colKeys: FieldMetadata[],
  valueAt: (indexInSelect: number, alias: string) => any,
) {
  let result: any = {}
  colKeys.forEach((col, index) => {
    try {
      result[col.key] = col.valueConverter.fromDb(valueAt(index, col.key))
    } catch (err) {
      throw new Error('Failed to load from db:' + col.key + '\r\n' + err)
    }
  })
  return result
}

export async function groupByImpl(
  options: EntityDataProviderGroupByOptions | undefined,
  e: EntityDbNamesBase,
  r: SqlCommand,
  orderByNullFirst: boolean | undefined,
  limitSyntax: (limit: number, offset: number) => string,
) {
  const { select, toResult } = await buildGroupBySql(
    options,
    e,
    r,
    orderByNullFirst,
    limitSyntax,
  )
  const result = await r.execute(select)
  return result.rows.map((sql) =>
    toResult((i) => sql[result.getColumnKeyInResultForIndexInSelect(i)]),
  )
}

/** The select that `groupBy` runs, and the mapping of one result row back to a `GroupByResult`. Every column is aliased through `wrapIdentifier`, so a row can be read by alias as well as by position. */
export async function buildGroupBySql(
  options: EntityDataProviderGroupByOptions | undefined,
  e: EntityDbNamesBase,
  r: SqlCommandWithParameters,
  orderByNullFirst: boolean | undefined,
  limitSyntax: (limit: number, offset: number) => string,
) {
  const aliases: string[] = []
  function alias(name: string) {
    aliases.push(name)
    return e.wrapIdentifier(name)
  }
  let select = 'select count(*) as ' + alias('count')
  let groupBy = ''
  const groupByCols: string[] = []
  const processResultRow: ((sqlResult: any, theResult: any) => void)[] = []
  processResultRow.push((sqlVal, theResult) => {
    theResult[GroupByCountMember] = Number(sqlVal)
  })

  if (options?.group)
    for (const x of options?.group) {
      if (x.isServerExpression) {
      } else {
        select += ', ' + e.$dbNameOf(x) + ' as ' + alias(x.key)
        if (groupBy == '') groupBy = ' group by '
        else groupBy += ', '
        groupBy += e.$dbNameOf(x)
        groupByCols.push(e.$dbNameOf(x))
      }
      processResultRow.push((sqlResult, theResult) => {
        theResult[x.key] = x.valueConverter.fromDb(sqlResult)
      })
    }

  for (const operator of GroupByOperators) {
    const fields = options?.[operator] as FieldMetadata[] | undefined
    if (fields)
      for (const x of fields) {
        if (x.isServerExpression) {
        } else {
          const dbName = await e.$dbNameOf(x)
          select += `, ${aggregateSqlSyntax(operator, dbName)} as ${alias(
            x.key + '_' + operator,
          )}`
        }

        const turnToNumber =
          x.valueType === Number || operator == 'distinctCount'
        processResultRow.push((sqlResult, theResult) => {
          if (turnToNumber) sqlResult = Number(sqlResult)
          if (operator === 'max' || operator === 'min')
            sqlResult = x.valueConverter.fromDb(sqlResult)
          theResult[x.key] = { ...theResult[x.key], [operator]: sqlResult }
        })
      }
  }
  select += '\n from ' + e.$entityName
  if (options?.where) {
    let where = new FilterConsumerBridgeToSqlRequest(r, e)
    options?.where.__applyToConsumer(where)
    select += await where.resolveWhere()
  }
  if (groupBy) select += groupBy
  let orderBy = ''
  if (options?.orderBy) {
    for (const x of options?.orderBy) {
      if (orderBy == '') orderBy = ' order by '
      else orderBy += ', '
      let field = x.field && (await e.$dbNameOf(x.field))
      switch (x.operation) {
        case 'count':
          field = x.operation + '(*)'
          break
        case undefined:
          break
        default:
          field = aggregateSqlSyntax(x.operation, field!)
      }
      orderBy += field
      if (x.isDescending) orderBy += ' desc'
      if (orderByNullFirst) {
        if (x.isDescending) orderBy += ' nulls last'
        else orderBy += ' nulls first'
      }
    }
    if (orderBy) select += orderBy
  }
  // Skip paging for a pure aggregate (single row); OFFSET/FETCH without an
  // ORDER BY is also invalid on SQL Server.
  if (options?.limit && groupByCols.length) {
    // SQL Server requires an ORDER BY alongside OFFSET/FETCH; default to the
    // group columns so paging is valid and deterministic on every dialect.
    if (!orderBy) select += ' order by ' + groupByCols.join(', ')
    let page = 1
    if (options.page) page = options.page
    if (page < 1) page = 1
    select += ' ' + limitSyntax(options.limit, (page - 1) * options.limit)
  }

  return {
    select,
    /** `valueAt` reads one column of a result row, by its position in the select or by its alias. */
    toResult(valueAt: (indexInSelect: number, alias: string) => any) {
      let theResult: any = {}
      processResultRow.forEach((x, i) => x(valueAt(i, aliases[i]), theResult))
      return theResult
    },
  }

  function aggregateSqlSyntax(
    operator: (typeof GroupByOperators)[number],
    dbName: string,
  ) {
    return operator === 'distinctCount'
      ? `count (distinct ${dbName})`
      : `${operator}( ${dbName} )`
  }
}
