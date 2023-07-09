import {
  EntityDataProvider,
  EntityDataProviderFindOptions,
} from '../data-interfaces'
import {
  customDatabaseFilterToken,
  Filter,
  FilterConsumer,
} from '../filter/filter-interfaces'
import { FieldMetadata } from '../column-interfaces'
import { EntityMetadata, EntityFilter } from '../remult3'
import { CompoundIdField } from '../column'
import { Sort } from '../sort'

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
    private rows?: any[],
  ) {
    if (!rows) rows = []
    else {
      for (const r of rows) {
        this.verifyThatRowHasAllNotNullColumns(r)
      }
    }
  }
  private verifyThatRowHasAllNotNullColumns(r: any) {
    for (const f of this.entity.fields) {
      if (!f.isServerExpression)
        if (!f.allowNull) {
          if (r[f.key] === undefined || r[f.key] === null) {
            let val = undefined
            if (f.valueType === Boolean) val = false
            else if (f.valueType === Number) val = 0
            else if (f.valueType === String) val = ''
            r[f.key] = val
          }
        } else if (r[f.key] === undefined) r[f.key] = null
    }
  }
  async count(where?: Filter): Promise<number> {
    let rows = this.rows
    let j = 0
    for (let i = 0; i < rows.length; i++) {
      if (!where) {
        j++
      } else {
        let x = new FilterConsumerBridgeToObject(rows[i])
        where.__applyToConsumer(x)
        if (x.ok) j++
      }
    }
    return j
  }
  async find(options?: EntityDataProviderFindOptions): Promise<any[]> {
    let rows = this.rows
    if (options) {
      if (options.where) {
        rows = rows.filter((i) => {
          let x = new FilterConsumerBridgeToObject(i)
          options.where.__applyToConsumer(x)
          return x.ok
        })
      }
      if (options.orderBy) {
        rows = rows.sort((a: any, b: any) => {
          return options.orderBy.compare(a, b)
        })
      }
      rows = pageArray(rows, options)
    }
    if (rows)
      return rows.map((i) => {
        return this.translateFromJson(i)
      })
  }
  translateFromJson(row: any) {
    let result = {}
    for (const col of this.entity.fields) {
      result[col.key] = col.valueConverter.fromJson(row[col.key])
    }
    return result
  }
  translateToJson(row: any) {
    let result = {}
    for (const col of this.entity.fields) {
      result[col.key] = col.valueConverter.toJson(row[col.key])
    }
    return result
  }

  private idMatches(id: any): (item: any) => boolean {
    return (item) => {
      let x = new FilterConsumerBridgeToObject(item)
      Filter.fromEntityFilter(
        this.entity,
        this.entity.idMetadata.getIdFilter(id),
      ).__applyToConsumer(x)
      return x.ok
    }
  }
  public update(id: any, data: any): Promise<any> {
    let idMatches = this.idMatches(id)
    let keys = Object.keys(data)
    for (let i = 0; i < this.rows.length; i++) {
      let r = this.rows[i]
      if (idMatches(r)) {
        let newR = { ...r }
        for (const f of this.entity.fields) {
          if (!f.dbReadOnly && !f.isServerExpression) {
            if (keys.includes(f.key)) {
              newR[f.key] = f.valueConverter.toJson(data[f.key])
            }
          }
        }
        this.verifyThatRowHasAllNotNullColumns(newR)
        this.rows[i] = newR
        return Promise.resolve(this.translateFromJson(this.rows[i]))
      }
    }
    throw new Error("couldn't find id to update: " + id)
  }
  public delete(id: any): Promise<void> {
    let idMatches = this.idMatches(id)
    for (let i = 0; i < this.rows.length; i++) {
      if (idMatches(this.rows[i])) {
        this.rows.splice(i, 1)
        return Promise.resolve()
      }
    }
    throw new Error("couldn't find id to delete: " + id)
  }
  async insert(data: any): Promise<any> {
    let idf = this.entity.idMetadata.field
    if (!(idf instanceof CompoundIdField)) {
      if (idf.options.valueConverter?.fieldTypeInDb === 'autoincrement') {
        data[idf.key] = 1
        for (const row of this.rows) {
          if (row[idf.key] >= data[idf.key]) data[idf.key] = row[idf.key] + 1
        }
      }
      if (data[idf.key])
        this.rows.forEach((i) => {
          if (data[idf.key] == i[idf.key]) throw Error('id already exists')
        })
    }
    let j = this.translateToJson(data)
    this.verifyThatRowHasAllNotNullColumns(j)
    this.rows.push(j)
    return Promise.resolve(this.translateFromJson(j))
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
    let max = page * options.limit
    let min = max - options.limit
    return x > min && x <= max
  })
}
class FilterConsumerBridgeToObject implements FilterConsumer {
  ok = true
  constructor(private row: any) {}
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
      let filter = new FilterConsumerBridgeToObject(this.row)
      element.__applyToConsumer(filter)
      if (filter.ok) {
        return
      }
    }
    this.ok = false
  }
  isNull(col: FieldMetadata): void {
    if (this.row[col.key] != null) this.ok = false
  }
  isNotNull(col: FieldMetadata): void {
    if (this.row[col.key] == null) this.ok = false
  }
  isIn(col: FieldMetadata, val: any[]): void {
    for (const v of val) {
      if (this.row[col.key] == col.valueConverter.toJson(v)) {
        return
      }
    }
    this.ok = false
  }
  public isEqualTo(col: FieldMetadata, val: any): void {
    if (this.row[col.key] != col.valueConverter.toJson(val)) this.ok = false
  }

  public isDifferentFrom(col: FieldMetadata, val: any): void {
    if (this.row[col.key] == col.valueConverter.toJson(val)) this.ok = false
  }

  public isGreaterOrEqualTo(col: FieldMetadata, val: any): void {
    if (this.row[col.key] < col.valueConverter.toJson(val)) this.ok = false
  }

  public isGreaterThan(col: FieldMetadata, val: any): void {
    if (this.row[col.key] <= col.valueConverter.toJson(val)) this.ok = false
  }

  public isLessOrEqualTo(col: FieldMetadata, val: any): void {
    if (this.row[col.key] > col.valueConverter.toJson(val)) this.ok = false
  }

  public isLessThan(col: FieldMetadata, val: any): void {
    if (this.row[col.key] >= col.valueConverter.toJson(val)) this.ok = false
  }
  public containsCaseInsensitive(col: FieldMetadata, val: any): void {
    let v = this.row[col.key]
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
