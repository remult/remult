import { CompoundIdField } from '../CompoundIdField.js'
import type { FieldMetadata } from '../column-interfaces.js'
import type {
  EntityDataProvider,
  EntityDataProviderGroupByOptions,
  EntityDataProviderFindOptions,
} from '../data-interfaces.js'
import {
  type EntityDbNamesBase,
  dbNamesOf,
  isDbReadonly,
} from '../filter/filter-consumer-bridge-to-sql-request.js'
import type { FilterConsumer } from '../filter/filter-interfaces.js'
import {
  Filter,
  customDatabaseFilterToken,
} from '../filter/filter-interfaces.js'
import {
  GroupByCountMember,
  GroupByOperators,
  type EntityFilter,
  type EntityMetadata,
} from '../remult3/remult3.js'
import { compareForSort, Sort } from '../sort.js'

export class ArrayEntityDataProvider implements EntityDataProvider {
  static rawFilter(filter: CustomArrayFilter): EntityFilter<any> {
    return {
      [customDatabaseFilterToken]: {
        arrayFilter: filter,
      },
    }
  }

  constructor(
    private entity: EntityMetadata,
    private rows: () => any[],
  ) {}
  async groupBy(options?: EntityDataProviderGroupByOptions): Promise<any[]> {
    const sort = new Sort()
    if (options?.group)
      for (const field of options?.group) {
        sort.Segments.push({ field: field })
      }
    const rows = await this.find({ orderBy: sort, where: options?.where })
    let result: any[] = []
    let group: any = {}
    let first = true
    let count = 0
    let aggregates: {
      process(row: any): void
      finishGroup(result: any): void
    }[] = []

    const operatorImpl: Record<
      (typeof GroupByOperators)[number],
      (key: string) => (typeof aggregates)[number]
    > = {
      sum: (key) => {
        let sum = 0
        return {
          process(row: any) {
            const val = row[key]
            if (val !== undefined && val !== null) sum += row[key]
          },
          finishGroup(result: any) {
            result[key] = { ...result[key], sum }
            sum = 0
          },
        }
      },
      avg: (key) => {
        let sum = 0
        let count = 0
        return {
          process(row: any) {
            const val = row[key]
            if (val !== undefined && val !== null) {
              sum += row[key]
              count++
            }
          },
          finishGroup(result: any) {
            result[key] = {
              ...result[key],
              avg: sum / count,
            }
            sum = 0
            count = 0
          },
        }
      },
      min: (key) => {
        let min: any = undefined
        return {
          process(row: any) {
            const val = row[key]
            if (val !== undefined && val !== null) {
              if (min === undefined || val < min) min = val
            }
          },
          finishGroup(result: any) {
            result[key] = { ...result[key], min }
            min = undefined
          },
        }
      },
      max: (key) => {
        let max: any = undefined
        return {
          process(row: any) {
            const val = row[key]
            if (val !== undefined && val !== null) {
              if (max === undefined || val > max) max = val
            }
          },
          finishGroup(result: any) {
            result[key] = { ...result[key], max }
            max = undefined
          },
        }
      },
      distinctCount: (key) => {
        let distinct = new Set<any>()
        return {
          process(row: any) {
            const val = row[key]
            if (val !== undefined && val !== null) distinct.add(val)
          },
          finishGroup(result: any) {
            result[key] = { ...result[key], distinctCount: distinct.size }
            distinct.clear()
          },
        }
      },
    }
    for (let operator of GroupByOperators) {
      if (options?.[operator]) {
        for (const element of options[operator]!) {
          aggregates.push(operatorImpl[operator](element.key))
        }
      }
    }

    function finishGroup() {
      const r: any = { ...group, $count: count }
      for (const a of aggregates) {
        a.finishGroup(r)
      }
      r[GroupByCountMember] = count
      result.push(r)
      first = true
      count = 0
    }
    for (const row of rows) {
      if (options?.group) {
        if (!first) {
          for (const field of options?.group) {
            if (group[field.key] != row[field.key]) {
              finishGroup()
              break
            }
          }
        }
        if (first) {
          for (const field of options?.group) {
            group[field.key] = row[field.key]
          }
        }
      }
      for (const a of aggregates) {
        a.process(row)
      }
      count++
      first = false
    }
    finishGroup()
    if (options?.orderBy) {
      result.sort((a, b) => {
        for (const x of options.orderBy!) {
          const getValue = (row: any) => {
            if (!x.field && x.operation == 'count') {
              return row[GroupByCountMember]
            } else {
              switch (x.operation) {
                case 'count':
                  return row[GroupByCountMember]
                case undefined:
                  return row[x.field!.key]
                default:
                  return row[x.field!.key][x.operation]
              }
            }
          }

          let compare = compareForSort(getValue(a), getValue(b), x.isDescending)
          if (compare != 0) return compare
        }
        return 0
      })
    }
    return pageArray(result, { page: options?.page, limit: options?.limit })
  }
  //@internal
  private __names?: EntityDbNamesBase
  //@internal
  async init() {
    if (this.__names) return this.__names
    this.__names = await dbNamesOf(this.entity, (x) => x)
    for (const r of this.rows()) {
      this.verifyThatRowHasAllNotNullColumns(r, this.__names)
    }
    return this.__names
  }
  //@internal
  private verifyThatRowHasAllNotNullColumns(r: any, names: EntityDbNamesBase) {
    for (const f of this.entity.fields) {
      const key = names.$dbNameOf(f)
      if (!f.isServerExpression)
        if (!f.allowNull) {
          if (r[key] === undefined || r[key] === null) {
            let val: any = undefined
            if (f.valueType === Boolean) val = false
            else if (f.valueType === Number) val = 0
            else if (f.valueType === String) val = ''
            r[key] = val
          }
        } else if (r[key] === undefined) r[key] = null
    }
  }
  async count(where?: Filter): Promise<number> {
    let rows = this.rows()
    const names = await this.init()
    let j = 0
    for (let i = 0; i < rows.length; i++) {
      if (!where) {
        j++
      } else {
        let x = new FilterConsumerBridgeToObject(rows[i], names)
        where.__applyToConsumer(x)
        if (x.ok) j++
      }
    }
    return j
  }
  async find(options?: EntityDataProviderFindOptions): Promise<any[]> {
    let rows = this.rows()
    const dbNames = await this.init()
    if (options) {
      if (options.where) {
        rows = rows.filter((i) => {
          let x = new FilterConsumerBridgeToObject(i, dbNames)
          options.where!.__applyToConsumer(x)
          return x.ok
        })
      }
      if (options.orderBy) {
        rows = rows.sort((a: any, b: any) => {
          return options.orderBy!.compare(a, b, dbNames.$dbNameOf)
        })
      }
      rows = pageArray(rows, options)
    }
    if (rows)
      return rows.map((i) => {
        return this.translateFromJson(i, dbNames, options?.select)
      })
    return []
  }
  //@internal
  translateFromJson(row: any, dbNames: EntityDbNamesBase, select?: string[]) {
    let result: any = {}
    for (const col of this.entity.fields) {
      if (select && !select.includes(col.key)) continue
      result[col.key] = col.valueConverter.fromJson(row[dbNames.$dbNameOf(col)])
    }
    return result
  }
  //@internal
  translateToJson(row: any, dbNames: EntityDbNamesBase) {
    let result: any = {}
    for (const col of this.entity.fields) {
      if (!isDbReadonly(col, dbNames))
        result[dbNames.$dbNameOf(col)] = col.valueConverter.toJson(row[col.key])
    }
    return result
  }
  //@internal
  private idMatches(id: any, names: EntityDbNamesBase): (item: any) => boolean {
    return (item) => {
      let x = new FilterConsumerBridgeToObject(item, names)
      Filter.fromEntityFilter(
        this.entity,
        this.entity.idMetadata.getIdFilter(id),
      ).__applyToConsumer(x)
      return x.ok
    }
  }
  async update(id: any, data: any): Promise<any> {
    const names = await this.init()
    let idMatches = this.idMatches(id, names)
    let keys = Object.keys(data)
    for (let i = 0; i < this.rows().length; i++) {
      let r = this.rows()[i]
      if (idMatches(r)) {
        let newR = { ...r }
        for (const f of this.entity.fields) {
          if (!isDbReadonly(f, names)) {
            if (keys.includes(f.key)) {
              newR[names.$dbNameOf(f)] = f.valueConverter.toJson(data[f.key])
            }
          }
        }
        if (
          this.entity.idMetadata.fields.find(
            (x) => newR[names.$dbNameOf(x)] != r[names.$dbNameOf(x)],
          ) &&
          this.rows().find((x) => {
            for (const f of this.entity.idMetadata.fields) {
              if (x[names.$dbNameOf(f)] != newR[names.$dbNameOf(f)])
                return false
            }
            return true
          })
        ) {
          throw Error('id already exists')
        }
        this.verifyThatRowHasAllNotNullColumns(newR, names)
        this.rows()[i] = newR
        return Promise.resolve(this.translateFromJson(this.rows()[i], names))
      }
    }
    throw new Error(
      `ArrayEntityDataProvider: Couldn't find row with id "${id}" in entity "${this.entity.key}" to update`,
    )
  }
  async delete(id: any): Promise<void> {
    const names = await this.init()
    let idMatches = this.idMatches(id, names)
    for (let i = 0; i < this.rows().length; i++) {
      if (idMatches(this.rows()[i])) {
        this.rows().splice(i, 1)
        return Promise.resolve()
      }
    }
    throw new Error(
      `ArrayEntityDataProvider: Couldn't find row with id "${id}" in entity "${this.entity.key}" to delete`,
    )
  }
  async insert(data: any): Promise<any> {
    const names = await this.init()
    let j = this.translateToJson(data, names)
    let idf = this.entity.idMetadata.field
    if (
      !(idf instanceof CompoundIdField) &&
      idf.valueConverter.fieldTypeInDb === 'autoincrement'
    ) {
      j[idf.key] = 1
      for (const row of this.rows()) {
        if (row[idf.key] >= j[idf.key]) j[idf.key] = row[idf.key] + 1
      }
    } else {
      if (
        this.rows().find((x) => {
          for (const f of this.entity.idMetadata.fields) {
            if (x[names.$dbNameOf(f)] != j[names.$dbNameOf(f)]) return false
          }
          return true
        })
      ) {
        throw Error('id already exists')
      }
    }

    this.verifyThatRowHasAllNotNullColumns(j, names)
    this.rows().push(j)
    return Promise.resolve(this.translateFromJson(j, names))
  }
}
function pageArray(rows: any[], options?: EntityDataProviderFindOptions) {
  if (!options) return rows
  if (!options.limit) return rows
  let page = 1
  if (options.page) page = options.page
  if (page < 1) page = 1
  let x = 0
  return rows.filter((i) => {
    x++
    let max = page * options.limit!
    let min = max - options.limit!
    return x > min && x <= max
  })
}
class FilterConsumerBridgeToObject implements FilterConsumer {
  ok = true
  constructor(
    private row: any,
    private dbNames: EntityDbNamesBase,
  ) {}
  databaseCustom(databaseCustom: CustomArrayFilterObject): void {
    if (databaseCustom && databaseCustom.arrayFilter) {
      if (!databaseCustom.arrayFilter(this.row)) this.ok = false
    }
  }
  custom(key: string, customItem: any): void {
    throw new Error('Custom Filter should be translated before it gets here')
  }
  or(orElements: Filter[]) {
    for (const element of orElements) {
      let filter = new FilterConsumerBridgeToObject(this.row, this.dbNames)
      element.__applyToConsumer(filter)
      if (filter.ok) {
        return
      }
    }
    this.ok = false
  }
  not(element: Filter) {
    let filter = new FilterConsumerBridgeToObject(this.row, this.dbNames)
    element.__applyToConsumer(filter)
    if (filter.ok) this.ok = false
  }
  isNull(col: FieldMetadata): void {
    if (this.row[this.dbNames.$dbNameOf(col)] != null) this.ok = false
  }
  isNotNull(col: FieldMetadata): void {
    if (this.row[this.dbNames.$dbNameOf(col)] == null) this.ok = false
  }
  isIn(col: FieldMetadata, val: any[]): void {
    for (const v of val) {
      if (
        this.row[this.dbNames.$dbNameOf(col)] == col.valueConverter.toJson(v)
      ) {
        return
      }
    }
    this.ok = false
  }
  public isEqualTo(col: FieldMetadata, val: any): void {
    if (this.row[this.dbNames.$dbNameOf(col)] != col.valueConverter.toJson(val))
      this.ok = false
  }

  public isDifferentFrom(col: FieldMetadata, val: any): void {
    if (this.row[this.dbNames.$dbNameOf(col)] == col.valueConverter.toJson(val))
      this.ok = false
  }

  public isGreaterOrEqualTo(col: FieldMetadata, val: any): void {
    if (this.row[this.dbNames.$dbNameOf(col)] < col.valueConverter.toJson(val))
      this.ok = false
  }

  public isGreaterThan(col: FieldMetadata, val: any): void {
    if (this.row[this.dbNames.$dbNameOf(col)] <= col.valueConverter.toJson(val))
      this.ok = false
  }

  public isLessOrEqualTo(col: FieldMetadata, val: any): void {
    if (this.row[this.dbNames.$dbNameOf(col)] > col.valueConverter.toJson(val))
      this.ok = false
  }

  public isLessThan(col: FieldMetadata, val: any): void {
    if (this.row[this.dbNames.$dbNameOf(col)] >= col.valueConverter.toJson(val))
      this.ok = false
  }
  public containsCaseInsensitive(col: FieldMetadata, val: any): void {
    let v = this.row[this.dbNames.$dbNameOf(col)]
    if (!v) {
      this.ok = false
      return
    }

    let s = '' + v
    if (val) val = col.valueConverter.toJson(val)
    if (val) val = val.toString().toLowerCase()
    if (s.toLowerCase().indexOf(val) < 0) this.ok = false
  }
  public notContainsCaseInsensitive(col: FieldMetadata, val: any): void {
    let v = this.row[this.dbNames.$dbNameOf(col)]
    if (!v) {
      this.ok = false
      return
    }

    let s = '' + v
    if (val) val = col.valueConverter.toJson(val)
    if (val) val = val.toString().toLowerCase()
    if (s.toLowerCase().indexOf(val) >= 0) this.ok = false
  }
  public startsWithCaseInsensitive(col: FieldMetadata, val: any): void {
    let v = this.row[this.dbNames.$dbNameOf(col)]
    if (!v) {
      this.ok = false
      return
    }

    let s = '' + v
    if (val) val = col.valueConverter.toJson(val)
    if (val) val = val.toString().toLowerCase()
    if (!s.toLowerCase().startsWith(val)) this.ok = false
  }
  public endsWithCaseInsensitive(col: FieldMetadata, val: any): void {
    let v = this.row[this.dbNames.$dbNameOf(col)]
    if (!v) {
      this.ok = false
      return
    }

    let s = '' + v
    if (val) val = col.valueConverter.toJson(val)
    if (val) val = val.toString().toLowerCase()
    if (!s.toLowerCase().endsWith(val)) this.ok = false
  }
}

export type CustomArrayFilter = (item: any) => boolean
export interface CustomArrayFilterObject {
  arrayFilter: CustomArrayFilter
}
