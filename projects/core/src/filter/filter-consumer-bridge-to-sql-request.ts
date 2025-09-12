import type { FieldMetadata } from '../column-interfaces.js'
import { SqlDatabase } from '../data-providers/sql-database.js'
import { remult } from '../remult-proxy.js'
import type {
  EntityMetadataOverloads,
  RepositoryOverloads,
} from '../remult3/RepositoryImplementation.js'
import { getEntityMetadata } from '../remult3/RepositoryImplementation.js'
import { getRelationFieldInfo } from '../remult3/relationInfoMember.js'
import type {
  EntityFilter,
  EntityMetadata,
  MembersOnly,
  RelationOptions,
} from '../remult3/remult3.js'
import type {
  HasWrapIdentifier,
  SqlCommandWithParameters,
} from '../sql-command.js'
import type { Filter, FilterConsumer } from './filter-interfaces.js'

export class FilterConsumerBridgeToSqlRequest implements FilterConsumer {
  private where = ''
  _addWhere = true
  promises: Promise<void>[] = []
  async resolveWhere() {
    while (this.promises.length > 0) {
      let p = this.promises
      this.promises = []
      for (const pr of p) {
        await pr
      }
    }
    return this.where
  }

  constructor(
    private r: SqlCommandWithParameters,
    private nameProvider: EntityDbNamesBase,
  ) {}

  custom(key: string, customItem: any): void {
    throw new Error('Custom filter should be translated before it gets here')
  }

  or(orElements: Filter[]) {
    let statement = ''
    this.promises.push(
      (async () => {
        for (const element of orElements) {
          let f = new FilterConsumerBridgeToSqlRequest(
            this.r,
            this.nameProvider,
          )
          f._addWhere = false
          element.__applyToConsumer(f)
          let where = await f.resolveWhere()
          if (!where) return //since if any member of or is empty, then the entire or is irrelevant
          if (where.length > 0) {
            if (statement.length > 0) {
              statement += ' or '
            }
            if (orElements.length > 1) {
              statement += '(' + where + ')'
            } else statement += where
          }
        }
        this.addToWhere('(' + statement + ')')
      })(),
    )
  }
  isNull(col: FieldMetadata): void {
    this.promises.push(
      (async () =>
        this.addToWhere(this.nameProvider.$dbNameOf(col) + ' is null'))(),
    )
  }
  isNotNull(col: FieldMetadata): void {
    this.promises.push(
      (async () =>
        this.addToWhere(this.nameProvider.$dbNameOf(col) + ' is not null'))(),
    )
  }
  isIn(col: FieldMetadata, val: any[]): void {
    this.promises.push(
      (async () => {
        if (val && val.length > 0)
          this.addToWhere(
            this.nameProvider.$dbNameOf(col) +
              ' in (' +
              val
                .map((x) => this.r.param(col.valueConverter.toDb(x)))
                .join(',') +
              ')',
          )
        else this.addToWhere('1 = 0 /*isIn with no values*/')
      })(),
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
    this.promises.push(
      (async () => {
        this.addToWhere(
          'lower (' +
            this.nameProvider.$dbNameOf(col) +
            ") like lower ('%" +
            val.replace(/'/g, "''") +
            "%')",
        )
      })(),
    )
  }
  public notContainsCaseInsensitive(col: FieldMetadata, val: any): void {
    this.promises.push(
      (async () => {
        this.addToWhere(
          'not lower (' +
            this.nameProvider.$dbNameOf(col) +
            ") like lower ('%" +
            val.replace(/'/g, "''") +
            "%')",
        )
      })(),
    )
  }

  private add(col: FieldMetadata, val: any, operator: string) {
    this.promises.push(
      (async () => {
        let x =
          this.nameProvider.$dbNameOf(col) +
          ' ' +
          operator +
          ' ' +
          this.r.param(col.valueConverter.toDb(val))
        this.addToWhere(x)
      })(),
    )
  }

  private addToWhere(x: string) {
    if (this.where.length == 0) {
      if (this._addWhere) this.where += ' where '
    } else this.where += ' and '
    this.where += x
  }
  databaseCustom(databaseCustom: CustomSqlFilterObject): void {
    this.promises.push(
      (async () => {
        if (databaseCustom?.buildSql) {
          let item = new CustomSqlFilterBuilder(
            this.r,
            this.nameProvider.wrapIdentifier,
          )
          let sql = await databaseCustom.buildSql(item)
          if (typeof sql !== 'string') sql = item.sql

          if (sql) {
            this.addToWhere('(' + sql + ')')
          }
        }
      })(),
    )
  }
}
export interface CustomSqlFilterObject {
  buildSql: CustomSqlFilterBuilderFunction
}
/**
 * Represents a custom SQL filter builder function.
 * @callback CustomSqlFilterBuilderFunction
 * @param {CustomSqlFilterBuilder} builder - The custom SQL filter builder instance.
 * @returns {void | string | Promise<string | void> } - The result of the custom SQL filter builder function.
 */
export type CustomSqlFilterBuilderFunction = (
  builder: CustomSqlFilterBuilder,
) => void | string | Promise<string | void>

/**
 * Represents a custom SQL filter builder.
 */
export class CustomSqlFilterBuilder
  implements SqlCommandWithParameters, HasWrapIdentifier
{
  constructor(
    private r: SqlCommandWithParameters,
    public wrapIdentifier: (name: string) => string,
  ) {
    this.param.bind(this)
    this.filterToRaw.bind(this)
  }

  sql: string = ''
  /** @deprecated  use `param` instead*/
  addParameterAndReturnSqlToken(val: any) {
    return this.param(val)
  }
  /**
   * Adds a parameter value.
   * @param {valueType} val - The value to add as a parameter.
   * @param {FieldMetadata<valueType>} [field] - The field metadata.
   * @returns {string} - The SQL token.
   */
  param = <valueType>(val: valueType, field?: FieldMetadata<valueType>) => {
    if (typeof field === 'object' && field.valueConverter.toDb) {
      val = field.valueConverter.toDb(val)
    }

    return this.r.param(val)
  }
  /**
   * Converts an entity filter into a raw SQL condition - and appends to it any `backendPrefilter` and `backendPreprocessFilter`
   * @param {RepositoryOverloads<entityType>} repo - The repository.
   * @param {EntityFilter<entityType>} condition - The entity filter.
   * @returns {Promise<string>} - The raw SQL.
   */
  filterToRaw = async <entityType>(
    repo: RepositoryOverloads<entityType>,
    condition: EntityFilter<entityType>,
  ) => {
    return SqlDatabase.filterToRaw(
      repo,
      condition,
      this,
      undefined,
      this.wrapIdentifier,
    )
  }
}

export function isDbReadonly<entityType>(
  field: FieldMetadata,
  dbNames: EntityDbNames<entityType>,
) {
  return (
    field.dbReadOnly ||
    field.isServerExpression ||
    (field.options.sqlExpression && field.dbName != dbNames.$dbNameOf(field))
  )
}
export function shouldNotCreateField<entityType>(
  field: FieldMetadata,
  dbNames: EntityDbNames<entityType>,
) {
  return (
    field.isServerExpression ||
    (field.options.sqlExpression && field.dbName != dbNames.$dbNameOf(field))
  )
}
export function shouldCreateEntity(
  entity: EntityMetadata<any>,
  e: EntityDbNamesBase,
) {
  return (
    !entity.options.sqlExpression &&
    e.$entityName.toLowerCase().indexOf('from ') < 0
  )
}

export declare type EntityDbNamesBase = {
  $entityName: string
  $dbNameOf(field: FieldMetadata<any> | string): string
  toString(): string
  wrapIdentifier: (name: string) => string
}
export declare type EntityDbNames<entityType> = {
  [Properties in keyof Required<MembersOnly<entityType>>]: string
} & EntityDbNamesBase

export interface dbNamesOfOptions {
  wrapIdentifier?: (name: string) => string
  tableName?: boolean | string
}
export async function dbNamesOf<entityType>(
  repo: EntityMetadataOverloads<entityType>,
  wrapIdentifierOrOptions?: ((name: string) => string) | dbNamesOfOptions,
): Promise<EntityDbNames<entityType>> {
  let options =
    typeof wrapIdentifierOrOptions === 'function'
      ? { wrapIdentifier: wrapIdentifierOrOptions }
      : wrapIdentifierOrOptions || {}
  var meta = getEntityMetadata(repo)
  if (!options.wrapIdentifier) {
    options.wrapIdentifier = (
      remult.dataProvider as HasWrapIdentifier
    ).wrapIdentifier
  }
  if (!options.wrapIdentifier) options.wrapIdentifier = (x) => x
  const result: EntityDbNamesBase = {
    $entityName: await entityDbName(meta, options.wrapIdentifier),
    toString: () => result.$entityName,
    $dbNameOf: (field: FieldMetadata | string) => {
      var key: string
      if (typeof field === 'string') key = field
      else key = field.key
      return result[key]
    },
    wrapIdentifier: options.wrapIdentifier,
  }
  for (const field of meta.fields) {
    let r = await fieldDbName(field, meta, options.wrapIdentifier)
    if (!field.options.sqlExpression)
      if (typeof options.tableName === 'string')
        r = options.wrapIdentifier(options.tableName) + '.' + r
      else if (options.tableName === true) {
        r = result.$entityName + '.' + r
      }
    result[field.key] = r
  }
  return result as EntityDbNames<entityType>
}

export async function entityDbName(
  metadata: EntityMetadata,
  wrapIdentifier: (name: string) => string = (x) => x,
) {
  if (metadata.options.sqlExpression) {
    if (typeof metadata.options.sqlExpression === 'string')
      return metadata.options.sqlExpression
    else if (typeof metadata.options.sqlExpression === 'function') {
      const prev = metadata.options.sqlExpression
      try {
        metadata.options.sqlExpression =
          "recursive sqlExpression call for entity '" + metadata.key + "'. "
        return await prev(metadata)
      } finally {
        metadata.options.sqlExpression = prev
      }
    }
  }
  return wrapIdentifier(metadata.dbName)
}
export async function fieldDbName(
  f: FieldMetadata,
  meta: EntityMetadata,
  wrapIdentifier: (name: string) => string = (x) => x,
) {
  try {
    if (f.options.sqlExpression) {
      let result: string = f.options[sqlExpressionCacheKey]
      if (result) return result
      if (typeof f.options.sqlExpression === 'function') {
        const prev = f.options.sqlExpression
        try {
          f.options.sqlExpression =
            "recursive sqlExpression call for field '" + f.key + "'. "
          //@ts-expect-error handle later
          result = await prev(meta)
          f.options[sqlExpressionCacheKey] = result
        } finally {
          f.options.sqlExpression = prev
        }
      } else result = f.options.sqlExpression
      if (!result) return f.dbName
      return result
    }
    const rel = getRelationFieldInfo(f)
    let field =
      rel?.type === 'toOne' &&
      ((f.options as RelationOptions<any, any, any>).field as string)
    if (field) {
      let fInfo = meta.fields.find(field)
      if (fInfo) return fieldDbName(fInfo, meta, wrapIdentifier)
    }
    return wrapIdentifier(f.dbName)
  } finally {
  }
}
const sqlExpressionCacheKey = Symbol.for('sqlExpressionCacheKey')
