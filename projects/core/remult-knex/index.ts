import type { Knex } from 'knex'
import type { Remult } from '../src/context.js'

import {
  CustomSqlFilterBuilder,
  dbNamesOfWithForceSqlExpression,
  type CustomSqlFilterObject,
  type EntityDbNamesBase,
} from '../src/filter/filter-consumer-bridge-to-sql-request.js'
import {
  dbNamesOf,
  isDbReadonly,
  shouldCreateEntity,
  shouldNotCreateField,
} from '../src/filter/filter-consumer-bridge-to-sql-request.js'
import type { FilterConsumer } from '../src/filter/filter-interfaces.js'
import {
  customDatabaseFilterToken,
  Filter,
} from '../src/filter/filter-interfaces.js'
import type { FieldMetadata } from '../src/column-interfaces.js'
import type {
  DataProvider,
  EntityDataProvider,
  EntityDataProviderGroupByOptions,
  EntityDataProviderFindOptions,
} from '../src/data-interfaces.js'
import { remult as remultContext } from '../src/remult-proxy.js'
import type { EntityFilter, EntityMetadata } from '../src/remult3/remult3.js'
import type { RepositoryOverloads } from '../src/remult3/RepositoryImplementation.js'
import {
  getRepository,
  isAutoIncrement,
} from '../src/remult3/RepositoryImplementation.js'
import { Sort } from '../src/sort.js'
import { ValueConverters } from '../src/valueConverters.js'
import type { StringFieldOptions } from '../src/remult3/Fields.js'
import { getRepositoryInternals } from '../src/remult3/repository-internals.js'
import { remultStatic } from '../src/remult-static.js'
import type {
  HasWrapIdentifier,
  SqlCommand,
  SqlCommandFactory,
  SqlResult,
} from '../src/sql-command.js'
import type {
  CanBuildMigrations,
  MigrationBuilder,
  MigrationCode,
} from '../migrations/migration-types.js'
import {
  groupByImpl,
  getRowAfterUpdate,
} from '../src/data-providers/sql-database.js'

export class KnexDataProvider
  implements
    DataProvider,
    HasWrapIdentifier,
    SqlCommandFactory,
    CanBuildMigrations
{
  constructor(public knex: Knex) {}
  end() {
    return this.knex.destroy()
  }
  provideMigrationBuilder(builder: MigrationCode): MigrationBuilder {
    var sb = new KnexSchemaBuilder(this.knex)
    return {
      async createTable(entity: EntityMetadata<any>): Promise<void> {
        let e: EntityDbNamesBase = await dbNamesOf(entity, (x) => x)
        sb.createTableKnexCommand(entity, e)
          .toSQL()
          .forEach((sql) => builder.addSql(sql.sql))
      },
      async addColumn(
        entity: EntityMetadata<any>,
        field: FieldMetadata<any, any>,
      ): Promise<void> {
        let e: EntityDbNamesBase = await dbNamesOf(entity, (x) => x)

        await sb
          .createColumnKnexCommand(e, field, e.$dbNameOf(field))
          .toSQL()
          .forEach((sql) => builder.addSql(sql.sql))
      },
    }
  }
  createCommand(): SqlCommand {
    return new KnexBridgeToSQLCommand(this.knex)
  }
  execute(sql: string): Promise<SqlResult> {
    return this.createCommand().execute(sql)
  }
  static getDb(dataProvider?: DataProvider) {
    const r = (dataProvider || remultContext.dataProvider) as KnexDataProvider
    if (!r.knex) throw 'the data provider is not an KnexDataProvider'
    return r.knex
  }
  wrapIdentifier: (name: string) => string = (x) => this.knex.ref(x) + ''

  getEntityDataProvider(entity: EntityMetadata<any>): EntityDataProvider {
    if (!supportsJsonLoadingAndSaving(this.knex))
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
    else if (this.knex.client.config.client === 'mysql2') {
      for (const f of entity.fields.toArray()) {
        if (f.valueConverter.fieldTypeInDb === 'json') {
          //@ts-ignore
          f.valueConverter = {
            ...f.valueConverter,
            toDb: ValueConverters.JsonString.toDb,
          }
        }
      }
    }

    return new KnexEntityDataProvider(
      entity,
      this.knex,
      this.wrapIdentifier,
      this,
    )
  }
  async transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void> {
    let t = await this.knex.transaction()
    try {
      await action(new KnexDataProvider(t))
      await t.commit()
    } catch (err) {
      await t.rollback()
      throw err
    }
  }

  static rawFilter(build: CustomKnexFilterBuilderFunction): EntityFilter<any> {
    return {
      [customDatabaseFilterToken]: {
        buildKnex: build,
      },
    }
  }
  static async filterToRaw<entityType>(
    entity: RepositoryOverloads<entityType>,
    condition: EntityFilter<entityType>,
    wrapIdentifier?: (name: string) => string,
  ) {
    if (!wrapIdentifier) wrapIdentifier = (x) => x
    const repo = getRepository(entity)
    var b = new FilterConsumerBridgeToKnexRequest(
      await dbNamesOfWithForceSqlExpression(repo.metadata, wrapIdentifier),
      wrapIdentifier ?? wrapIdentifier,
    )
    b._addWhere = false
    await (
      await getRepositoryInternals(repo)._translateWhereToFilter(condition)
    ).__applyToConsumer(b)
    let r = await b.resolveWhere()
    return (knex: Knex.QueryBuilder) => r.forEach((y) => y(knex))
  }
  isProxy?: boolean

  async ensureSchema(entities: EntityMetadata<any>[]): Promise<void> {
    var sb = new KnexSchemaBuilder(this.knex)
    await sb.ensureSchema(entities)
  }
}
export type CustomKnexFilterBuilderFunction = () => Promise<
  (builder: Knex.QueryBuilder) => void
>

class KnexEntityDataProvider implements EntityDataProvider {
  constructor(
    private entity: EntityMetadata<any>,
    private knex: Knex,
    private rawSqlWrapIdentifier: (name: string) => string,
    private dp: KnexDataProvider,
  ) {}
  async groupBy(options?: EntityDataProviderGroupByOptions): Promise<any[]> {
    return groupByImpl(
      options,
      await dbNamesOf(this.entity, this.dp.wrapIdentifier),
      this.dp.createCommand(),
      false,
      (limit, offset) => ' limit ' + limit + ' offset ' + offset,
    )
  }
  getEntityFrom(e: EntityDbNamesBase): Knex.QueryBuilder {
    if (this.entity.options.sqlExpression)
      return this.knex.fromRaw(e.$entityName)
    return this.knex(e.$entityName)
  }
  async count(where: Filter): Promise<number> {
    const e = await this.init()
    const br = new FilterConsumerBridgeToKnexRequest(
      e,
      this.rawSqlWrapIdentifier,
    )
    where.__applyToConsumer(br)
    let r = await br.resolveWhere()
    const result = await this.getEntityFrom(e)
      .count()
      .where((b) => r.forEach((w) => w(b)))
    var row = result[0]
    for (const key in row) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        const element = row[key]
        return +element
      }
    }
    throw Error("couldn't find count member")
  }
  async find(options: EntityDataProviderFindOptions): Promise<any[]> {
    const e = await this.init()
    let cols = [] as any[]
    let colKeys: FieldMetadata[] = []
    for (const x of this.entity.fields) {
      if (options.select && !options.select.includes(x.key)) continue
      if (x.isServerExpression) {
      } else {
        let name = e.$dbNameOf(x)
        if (x.options.sqlExpression)
          name = this.knex.raw('?? as ' + x.key, [name]) as any
        cols.push(name)
        colKeys.push(x)
      }
    }
    let query = this.getEntityFrom(e).select(cols)

    if (options?.where) {
      const br = new FilterConsumerBridgeToKnexRequest(
        e,
        this.rawSqlWrapIdentifier,
      )
      options.where.__applyToConsumer(br)
      let r = await br.resolveWhere()
      query.where((b) => r.forEach((y) => y(b)))
    }
    if (!options.orderBy) {
      options.orderBy = Sort.createUniqueSort(this.entity, new Sort())
    }
    if (options.orderBy) {
      query = query.orderBy(
        options.orderBy.Segments.map((s) => ({
          column: e.$dbNameOf(s.field),
          order: s.isDescending ? 'desc' : 'asc',
        })),
      )
    }
    if (options.limit) {
      query = query.limit(options.limit)
      if (options.page) query = query.offset((options.page - 1) * options.limit)
    }
    const r = await query

    return r.map((y: any) => {
      let result: any = {}

      let i = 0
      for (let m in y) {
        let field = colKeys[i++]
        try {
          result[field.key] = field.valueConverter.fromDb(y[m])
        } catch (err) {
          throw new Error('Failed to load from db:' + field.key + '\r\n' + err)
        }
      }

      return result
    })
  }
  async init() {
    const r = (await dbNamesOfWithForceSqlExpression(
      this.entity,
      (x) => x,
    )) as EntityDbNamesBase
    return {
      $dbNameOf: (f) => {
        let fm = f as FieldMetadata
        if (fm.options.sqlExpression)
          return this.knex.raw(r.$dbNameOf(f)) as unknown as string
        return r.$dbNameOf(f)
      },
      $entityName: r.$entityName,
      wrapIdentifier: r.wrapIdentifier,
    } satisfies EntityDbNamesBase
  }
  async update(id: any, data: any): Promise<any> {
    const e = await this.init()
    let f = new FilterConsumerBridgeToKnexRequest(e, this.rawSqlWrapIdentifier)
    Filter.fromEntityFilter(
      this.entity,
      this.entity.idMetadata.getIdFilter(id),
    ).__applyToConsumer(f)

    let updateObject: any = {}
    for (const x of this.entity.fields) {
      if (isDbReadonly(x, e)) {
      } else if (data[x.key] !== undefined) {
        let v = translateValueAndHandleArrayAndHandleArray(x, data[x.key])
        if (v !== undefined) {
          let key = await e.$dbNameOf(x)
          updateObject[key] = v
        }
      }
    }

    let where = await f.resolveWhere()
    await this.getEntityFrom(e)
      .update(updateObject)
      .where((b) => where.forEach((w) => w(b)))
    return getRowAfterUpdate(this.entity, this, data, id, 'update')
  }
  async delete(id: any): Promise<void> {
    const e = await this.init()
    let f = new FilterConsumerBridgeToKnexRequest(e, this.rawSqlWrapIdentifier)
    Filter.fromEntityFilter(
      this.entity,
      this.entity.idMetadata.getIdFilter(id),
    ).__applyToConsumer(f)
    let where = await f.resolveWhere()
    await this.getEntityFrom(e)
      .delete()
      .where((b) => where.forEach((w) => w(b)))
  }
  async insert(data: any): Promise<any> {
    const e = await this.init()

    let insertObject: any = {}
    for (const x of this.entity.fields) {
      if (isDbReadonly(x, e)) {
      } else {
        let v = translateValueAndHandleArrayAndHandleArray(x, data[x.key])
        if (v != undefined) {
          let key = await e.$dbNameOf(x)
          insertObject[key] = v
        }
      }
    }

    let insert = this.getEntityFrom(e).insert(insertObject)
    if (isAutoIncrement(this.entity.idMetadata.field)) {
      let newId
      if (
        this.knex.client.config.client === 'mysql2' ||
        this.knex.client.config.client === 'mysql'
      ) {
        let result = await insert
        newId = result[0]
      } else {
        let result = await insert.returning(this.entity.idMetadata.field.dbName)
        newId = result[0][this.entity.idMetadata.field.dbName]
      }

      return this.find({
        where: new Filter((x) =>
          x.isEqualTo(this.entity.idMetadata.field, newId),
        ),
      }).then((y) => y[0])
    } else await insert
    return getRowAfterUpdate(this.entity, this, data, undefined, 'insert')
  }
}
class FilterConsumerBridgeToKnexRequest implements FilterConsumer {
  _addWhere = true
  promises: Promise<void>[] = []
  result = [] as ((builder: Knex.QueryBuilder) => void)[]
  async resolveWhere() {
    while (this.promises.length > 0) {
      let p = this.promises
      this.promises = []
      for (const pr of p) {
        await pr
      }
    }
    return this.result
  }

  constructor(
    private innerNameProvider: EntityDbNamesBase,
    private rawSqlWrapIdentifier: (name: string) => string,
  ) {}

  custom(key: string, customItem: any): void {
    throw new Error('Custom filter should be translated before it gets here')
  }

  or(orElements: Filter[]) {
    this.promises.push(
      (async () => {
        const result = [] as ((builder: Knex.QueryBuilder) => void)[]
        for (const element of orElements) {
          let f = new FilterConsumerBridgeToKnexRequest(
            this.innerNameProvider,
            this.rawSqlWrapIdentifier,
          )
          f._addWhere = false
          element.__applyToConsumer(f)
          let where = await f.resolveWhere()
          if (where.length > 0) {
            result.push((b) => {
              b.orWhere((b) => {
                where.forEach((x) => x(b))
              })
            })
          } else return //empty or means all rows
        }
        if (result.length > 0) {
          this.result.push((b) => b.where((x) => result.find((y) => y(x))))
        }
      })(),
    )
  }
  not(element: Filter) {
    this.promises.push(
      (async () => {
        let f = new FilterConsumerBridgeToKnexRequest(
          this.innerNameProvider,
          this.rawSqlWrapIdentifier,
        )
        f._addWhere = false
        element.__applyToConsumer(f)
        let where = await f.resolveWhere()
        if (where.length > 0) {
          this.result.push((b) => {
            b.whereNot((b) => {
              where.forEach((x) => x(b))
            })
          })
        } else return //empty or means all rows
      })(),
    )
  }
  isNull(col: FieldMetadata): void {
    this.result.push((b) => b.whereNull(this.innerNameProvider.$dbNameOf(col)))
  }
  isNotNull(col: FieldMetadata): void {
    this.result.push((b) =>
      b.whereNotNull(this.innerNameProvider.$dbNameOf(col)),
    )
  }
  isIn(col: FieldMetadata, val: any[]): void {
    this.result.push((knex) =>
      knex.whereIn(
        this.innerNameProvider.$dbNameOf(col),
        val.map((x) => translateValueAndHandleArrayAndHandleArray(col, x)),
      ),
    )
  }
  isEqualTo(col: FieldMetadata, val: any): void {
    this.add(col, val, '=')
  }
  isDifferentFrom(col: FieldMetadata, val: any): void {
    this.add(col, val, '<>')
  }
  isGreaterOrEqualTo(col: FieldMetadata, val: any): void {
    this.add(col, val, '>=')
  }
  isGreaterThan(col: FieldMetadata, val: any): void {
    this.add(col, val, '>')
  }
  isLessOrEqualTo(col: FieldMetadata, val: any): void {
    this.add(col, val, '<=')
  }
  isLessThan(col: FieldMetadata, val: any): void {
    this.add(col, val, '<')
  }
  public containsCaseInsensitive(col: FieldMetadata, val: any): void {
    this.result.push((b) =>
      b.whereRaw(
        'lower (' +
          b.client.ref(this.innerNameProvider.$dbNameOf(col)) +
          ") like lower ('%" +
          val.replace(/'/g, "''") +
          "%')",
      ),
    )
    this.promises.push((async () => {})())
  }
  public notContainsCaseInsensitive(col: FieldMetadata, val: any): void {
    this.result.push((b) =>
      b.whereRaw(
        'not lower (' +
          b.client.ref(this.innerNameProvider.$dbNameOf(col)) +
          ") like lower ('%" +
          val.replace(/'/g, "''") +
          "%')",
      ),
    )
    this.promises.push((async () => {})())
  }
  public startsWithCaseInsensitive(col: FieldMetadata, val: any): void {
    this.result.push((b) =>
      b.whereRaw(
        'lower (' +
          b.client.ref(this.innerNameProvider.$dbNameOf(col)) +
          ") like lower ('" +
          val.replace(/'/g, "''") +
          "%')",
      ),
    )
    this.promises.push((async () => {})())
  }
  public endsWithCaseInsensitive(col: FieldMetadata, val: any): void {
    this.result.push((b) =>
      b.whereRaw(
        'lower (' +
          b.client.ref(this.innerNameProvider.$dbNameOf(col)) +
          ") like lower ('%" +
          val.replace(/'/g, "''") +
          "')",
      ),
    )
    this.promises.push((async () => {})())
  }

  private add(col: FieldMetadata, val: any, operator: string) {
    this.result.push((b) =>
      b.where(
        this.innerNameProvider.$dbNameOf(col),
        operator,
        translateValueAndHandleArrayAndHandleArray(col, val),
      ),
    )
  }

  databaseCustom(
    databaseCustom: {
      buildKnex: CustomKnexFilterBuilderFunction
    } & CustomSqlFilterObject,
  ): void {
    this.promises.push(
      (async () => {
        if (databaseCustom?.buildKnex) {
          this.result.push(await databaseCustom.buildKnex())
        }
        if (databaseCustom?.buildSql) {
          let r = new KnexCommandHelper()
          const item = new CustomSqlFilterBuilder(r, this.rawSqlWrapIdentifier)
          let sql = await databaseCustom.buildSql(item)
          if (typeof sql !== 'string') sql = item.sql

          if (sql) {
            this.result.push((b) => b.whereRaw(sql as string, r.values))
          }
        }
      })(),
    )
  }
}

export class KnexSchemaBuilder {
  //@internal
  static logToConsole = true

  async ensureSchema(entities: EntityMetadata<any>[]) {
    for (const entity of entities) {
      let e: EntityDbNamesBase = await dbNamesOf(entity, (x) => x)
      try {
        if (shouldCreateEntity(entity, e)) {
          await this.createIfNotExist(entity)
          await this.verifyAllColumns(entity)
        }
      } catch (err) {
        console.error('failed ensure schema of ' + e.$entityName + ' ', err)
        throw err
      }
    }
  }
  async createIfNotExist(entity: EntityMetadata): Promise<void> {
    const e: EntityDbNamesBase = await dbNamesOf(entity, (x) => x)
    if (!(await this.knex.schema.hasTable(e.$entityName))) {
      await logSql(this.createTableKnexCommand(entity, e))
    }
  }

  createTableKnexCommand(entity: EntityMetadata, e: EntityDbNamesBase) {
    let cols = new Map<FieldMetadata, { name: string; readonly: boolean }>()
    for (const f of entity.fields) {
      cols.set(f, {
        name: e.$dbNameOf(f),
        readonly: shouldNotCreateField(f, e),
      })
    }

    return this.knex.schema.createTable(e.$entityName, (b) => {
      for (const x of entity.fields) {
        if (!cols.get(x)!.readonly || isAutoIncrement(x)) {
          if (isAutoIncrement(x)) b.increments(cols.get(x)!.name)
          else {
            buildColumn(
              x,
              cols.get(x)!.name,
              b,
              supportsJsonDataStorage(this.knex),
            )
          }
        }
      }
      b.primary(entity.idMetadata.fields.map((f) => e.$dbNameOf(f)))
    })
  }

  async addColumnIfNotExist(
    entity: EntityMetadata,
    c: (e: EntityMetadata) => FieldMetadata,
  ) {
    let e: EntityDbNamesBase = await dbNamesOf(entity, (x) => x)
    if (shouldNotCreateField(c(entity), e)) return

    let col = c(entity)
    let colName = e.$dbNameOf(col)

    if (!(await this.knex.schema.hasColumn(e.$entityName, colName))) {
      await logSql(this.createColumnKnexCommand(e, col, colName))
    }
  }
  createColumnKnexCommand(
    e: EntityDbNamesBase,
    col: FieldMetadata<any, any>,
    colName: string,
  ): Knex.SchemaBuilder {
    return this.knex.schema.alterTable(e.$entityName, (b) => {
      buildColumn(col, colName, b, supportsJsonDataStorage(this.knex))
    })
  }

  async verifyAllColumns<T extends EntityMetadata>(entity: T) {
    let e = await dbNamesOf(entity, (x) => x)
    try {
      for (const col of entity.fields.toArray()) {
        if (!shouldNotCreateField(col, e)) {
          await this.addColumnIfNotExist(entity, () => col)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }
  additionalWhere = ''
  constructor(private knex: Knex) {}
}
function supportsJsonDataStorage(knex: Knex) {
  const client: string = knex.client.config.client
  if (client?.includes('sqlite3') || client?.includes('mssql')) return false
  return true
}
function supportsJsonLoadingAndSaving(knex: Knex) {
  const client: string = knex.client.config.client
  if (
    client?.includes('sqlite3') ||
    client?.includes('mssql') ||
    client == 'mysql'
  )
    return false
  return true
}

export function buildColumn(
  x: FieldMetadata,
  dbName: string,
  b: Knex.CreateTableBuilder,
  supportsJson = true,
) {
  if (x.valueType == Number) {
    if (!x.valueConverter.fieldTypeInDb) {
      let c = b.decimal(dbName, 18, 2)
      if (!x.allowNull) {
        c.defaultTo(0).notNullable()
      }
    } else if (x.valueConverter.fieldTypeInDb == 'integer') {
      let c = b.integer(dbName)
      if (!x.allowNull) {
        c.defaultTo(0).notNullable()
      }
    } else b.specificType(dbName, x.valueConverter.fieldTypeInDb)
  } else if (x.valueType == Date) {
    if (!x.valueConverter.fieldTypeInDb)
      if (x.valueConverter == ValueConverters.DateOnly) b.date(dbName)
      else b.dateTime(dbName)
    else if (x.valueConverter.fieldTypeInDb == 'date') b.date(dbName)
    else b.specificType(dbName, x.valueConverter.fieldTypeInDb)
  } else if (x.valueType == Boolean) {
    let c = b.boolean(dbName)
    if (!x.allowNull) c.defaultTo(false).notNullable()
  } else if (x.valueConverter.fieldTypeInDb) {
    if (x.valueConverter.fieldTypeInDb == 'integer') {
      let c = b.integer(dbName)
      if (!x.allowNull) {
        c.defaultTo(0).notNullable()
      }
    } else if (x.valueConverter.fieldTypeInDb == 'json')
      if (supportsJson) b.json(dbName)
      else {
        let c = b.text(dbName)
        if (!x.allowNull) c.defaultTo('').notNullable()
      }
    else b.specificType(dbName, x.valueConverter.fieldTypeInDb)
  } else if (x.valueType === String) {
    let c = b.string(dbName, (<StringFieldOptions>x.options).maxLength)
    if (!x.allowNull) c.defaultTo('').notNullable()
  } else {
    let c = b.text(dbName)
    if (!x.allowNull) c.defaultTo('').notNullable()
  }
}
function logSql<
  T extends {
    toSQL(): any
  },
>(who: T) {
  if (KnexSchemaBuilder.logToConsole) console.info(who.toSQL())
  return who
}

export async function createKnexDataProvider(config: Knex.Config) {
  let k = (await import('knex')).default(config)
  let result = new KnexDataProvider(k)
  return result
}
function translateValueAndHandleArrayAndHandleArray(
  field: FieldMetadata<any>,
  val: any,
) {
  let result = field.valueConverter.toDb(val)
  if (Array.isArray(result)) return JSON.stringify(result)
  return result
}
class KnexCommandHelper {
  values: any = {}
  i = 0
  addParameterAndReturnSqlToken(val: any) {
    return this.param(val)
  }
  param(val: any): string {
    if (Array.isArray(val)) val = JSON.stringify(val)
    const key = ':' + this.i++
    this.values[key.substring(1)] = val
    return key
  }
}

class KnexBridgeToSQLCommand extends KnexCommandHelper implements SqlCommand {
  constructor(private source: Knex) {
    super()
  }
  values: any = {}
  i = 0
  addParameterAndReturnSqlToken(val: any) {
    return this.param(val)
  }
  param(val: any): string {
    if (Array.isArray(val)) val = JSON.stringify(val)
    const key = ':' + this.i++
    this.values[key.substring(1)] = val
    return key
  }

  async execute(sql: string): Promise<SqlResult> {
    return await this.source.raw(sql, this.values).then((r) => {
      switch (this.source.client.config.client) {
        case 'mysql':
        case 'mysql2':
          return new KnexPostgresBridgeToSQLQueryResult({
            fields: r[1],
            rows: r[0],
          })
        case 'pg':
          return new KnexPostgresBridgeToSQLQueryResult(r)
        default:
        case 'better-sqlite3':
        case 'mssql':
          return new KnexPostgresBridgeToSQLQueryResult({
            rows: r,
          })
      }
    })
  }
}
class KnexPostgresBridgeToSQLQueryResult implements SqlResult {
  getColumnKeyInResultForIndexInSelect(index: number): string {
    if (this.r.fields) return this.r.fields[index].name
    if (this.rows.length == 0) throw Error('No rows')
    let i = 0
    for (let m in this.rows[0]) {
      if (i++ == index) return m
    }
    throw Error('index not found')
  }
  constructor(public r: any) {
    this.rows = r.rows
  }
  rows: any[]
}
