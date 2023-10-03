import { CompoundIdField } from '../CompoundIdField'
import type { FieldMetadata } from '../column-interfaces'
import type {
  EntityDataProvider,
  EntityDataProviderFindOptions,
} from '../data-interfaces'
import {
  type EntityDbNamesBase,
  dbNamesOf,
  isDbReadonly,
} from '../filter/filter-consumer-bridge-to-sql-request'
import type { FilterConsumer } from '../filter/filter-interfaces'
import { Filter, customDatabaseFilterToken } from '../filter/filter-interfaces'
import type { EntityFilter, EntityMetadata } from '../remult3/remult3'

export class ArrayEntityDataProvider implements EntityDataProvider {
  static rawFilter(filter: CustomArrayFilter): EntityFilter<any> {
    return {
      [customDatabaseFilterToken]: {
        arrayFilter: filter,
      },
    }
  }
  private rows: any[]
  constructor(
    private entity: EntityMetadata,
    rows?: any[],
  ) {
    if (rows === undefined) this.rows = []
    else this.rows = rows
  }
  __names: EntityDbNamesBase
  async init() {
    if (this.__names) return this.__names
    this.__names = await dbNamesOf(this.entity)
    for (const r of this.rows) {
      this.verifyThatRowHasAllNotNullColumns(r, this.__names)
    }
    return this.__names
  }
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
    let rows = this.rows
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
    let rows = this.rows
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
        return this.translateFromJson(i, dbNames)
      })
    return []
  }
  translateFromJson(row: any, dbNames: EntityDbNamesBase) {
    let result = {}
    for (const col of this.entity.fields) {
      result[col.key] = col.valueConverter.fromJson(row[dbNames.$dbNameOf(col)])
    }
    return result
  }
  translateToJson(row: any, dbNames: EntityDbNamesBase) {
    let result = {}
    for (const col of this.entity.fields) {
      if (!isDbReadonly(col, dbNames))
        result[dbNames.$dbNameOf(col)] = col.valueConverter.toJson(row[col.key])
    }
    return result
  }

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
    for (let i = 0; i < this.rows.length; i++) {
      let r = this.rows[i]
      if (idMatches(r)) {
        let newR = { ...r }
        for (const f of this.entity.fields) {
          if (!isDbReadonly(f, names)) {
            if (keys.includes(f.key)) {
              newR[names.$dbNameOf(f)] = f.valueConverter.toJson(data[f.key])
            }
          }
        }
        this.verifyThatRowHasAllNotNullColumns(newR, names)
        this.rows[i] = newR
        return Promise.resolve(this.translateFromJson(this.rows[i], names))
      }
    }
    throw new Error("couldn't find id to update: " + id)
  }
  async delete(id: any): Promise<void> {
    const names = await this.init()
    let idMatches = this.idMatches(id, names)
    for (let i = 0; i < this.rows.length; i++) {
      if (idMatches(this.rows[i])) {
        this.rows.splice(i, 1)
        return Promise.resolve()
      }
    }
    throw new Error("couldn't find id to delete: " + id)
  }
  async insert(data: any): Promise<any> {
    const names = await this.init()
    let j = this.translateToJson(data, names)
    let idf = this.entity.idMetadata.field
    if (!(idf instanceof CompoundIdField)) {
      if (idf.options.valueConverter?.fieldTypeInDb === 'autoincrement') {
        j[idf.key] = 1
        for (const row of this.rows) {
          if (row[idf.key] >= j[idf.key]) j[idf.key] = row[idf.key] + 1
        }
      }
      if (j[idf.key])
        this.rows.forEach((i) => {
          if (j[idf.key] == i[idf.key]) throw Error('id already exists')
        })
    }
    this.verifyThatRowHasAllNotNullColumns(j, names)
    this.rows.push(j)
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
}

export type CustomArrayFilter = (item: any) => boolean
export interface CustomArrayFilterObject {
  arrayFilter: CustomArrayFilter
}
