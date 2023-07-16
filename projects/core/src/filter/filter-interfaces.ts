import { FieldMetadata } from '../column-interfaces'
import { Remult } from '../context'
import {
  EntityMetadata,
  EntityFilter,
  getEntityRef,
  getEntitySettings,
  ValueFilter,
} from '../remult3'

export class Filter {
  constructor(private apply?: (add: FilterConsumer) => void) {
    if (!this.apply) {
      this.apply = () => {}
    }
  }
  __applyToConsumer(add: FilterConsumer) {
    this.apply(add)
  }
  static async resolve<entityType>(
    filter:
      | EntityFilter<entityType>
      | (() => EntityFilter<entityType> | Promise<EntityFilter<entityType>>),
  ): Promise<EntityFilter<entityType>> {
    if (typeof filter === 'function') return await filter()
    return filter
  }

  //@ts-ignore
  static createCustom<entityType>(
    rawFilterTranslator: (
      unused: never,
      r: Remult,
    ) => EntityFilter<entityType> | Promise<EntityFilter<entityType>>,
    key?: string,
  ): (() => EntityFilter<entityType>) & customFilterInfo<entityType>
  static createCustom<entityType, argsType>(
    rawFilterTranslator: (
      args: argsType,
      r: Remult,
    ) => EntityFilter<entityType> | Promise<EntityFilter<entityType>>,
    key?: string,
  ): ((y: argsType) => EntityFilter<entityType>) & customFilterInfo<entityType>
  static createCustom<entityType, argsType>(
    rawFilterTranslator: (
      args: argsType,
      r: Remult,
    ) => EntityFilter<entityType> | Promise<EntityFilter<entityType>>,
    key = '',
  ): ((y: argsType) => EntityFilter<entityType>) &
    customFilterInfo<entityType> {
    let rawFilterInfo = { key: key, rawFilterTranslator }
    return Object.assign(
      (x: any) => {
        let z = {}
        if (x == undefined) x = {}
        if (!rawFilterInfo.key)
          throw 'Usage of custom filter before a key was assigned to it'
        return {
          [customUrlToken + rawFilterInfo.key]: x,
        }
      },
      { rawFilterInfo },
    ) as ((y: argsType) => EntityFilter<entityType>) &
      customFilterInfo<entityType>
  }
  static fromEntityFilter<T>(
    entity: EntityMetadata<T>,
    whereItem: EntityFilter<T>,
  ): Filter {
    let result: Filter[] = []
    for (const key in whereItem) {
      if (Object.prototype.hasOwnProperty.call(whereItem, key)) {
        let fieldToFilter: any = whereItem[key]
        {
          if (key == '$or') {
            result.push(
              new OrFilter(
                ...fieldToFilter.map((x) => Filter.fromEntityFilter(entity, x)),
              ),
            )
          } else if (key == '$and') {
            result.push(
              new AndFilter(
                ...fieldToFilter.map((x) => Filter.fromEntityFilter(entity, x)),
              ),
            )
          } else if (key.startsWith(customUrlToken)) {
            result.push(
              new Filter((x) => {
                x.custom(key.substring(customUrlToken.length), fieldToFilter)
              }),
            )
          } else if (key == customDatabaseFilterToken) {
            result.push(new Filter((x) => x.databaseCustom(fieldToFilter)))
          } else {
            let fh = new filterHelper(entity.fields[key])
            let found = false
            if (fieldToFilter !== undefined && fieldToFilter != null) {
              if (fieldToFilter.$id) fieldToFilter = fieldToFilter.$id
              for (const key in fieldToFilter) {
                if (Object.prototype.hasOwnProperty.call(fieldToFilter, key)) {
                  const element = fieldToFilter[key]
                  switch (key) {
                    case '$gte':
                    case '>=':
                      result.push(fh.isGreaterOrEqualTo(element))
                      found = true
                      break
                    case '$gt':
                    case '>':
                      result.push(fh.isGreaterThan(element))
                      found = true
                      break
                    case '$lte':
                    case '<=':
                      result.push(fh.isLessOrEqualTo(element))
                      found = true
                      break
                    case '$lt':
                    case '<':
                      result.push(fh.isLessThan(element))
                      found = true
                      break
                    case '$ne':
                    case '!=':
                    case '$nin':
                      found = true
                      if (Array.isArray(element)) {
                        result.push(fh.isNotIn(element))
                      } else result.push(fh.isDifferentFrom(element))
                      break
                    case '$in':
                      found = true
                      result.push(fh.isIn(element))
                      break
                    case '$contains':
                      found = true
                      result.push(fh.contains(element))
                      break
                  }
                }
              }

              if (Array.isArray(fieldToFilter)) {
                found = true
                result.push(fh.isIn(fieldToFilter))
              }
            }
            if (!found && fieldToFilter !== undefined) {
              result.push(fh.isEqualTo(fieldToFilter))
            }
          }
        }
      }
    }
    return new AndFilter(...result)
  }

  toJson() {
    let r = new FilterSerializer()
    this.__applyToConsumer(r)
    return r.result
  }
  static entityFilterToJson<T>(
    entityDefs: EntityMetadata<T>,
    where: EntityFilter<T>,
  ) {
    return Filter.fromEntityFilter(entityDefs, where).toJson()
  }
  static entityFilterFromJson<T>(
    entityDefs: EntityMetadata<T>,
    packed: any,
  ): EntityFilter<T> {
    return buildFilterFromRequestParameters(entityDefs, {
      get: (key: string) => packed[key],
    })
  }

  static async translateCustomWhere<T>(
    r: Filter,
    entity: EntityMetadata<T>,
    remult: Remult,
  ) {
    let f = new customTranslator(async (filterKey, custom) => {
      let r: Filter[] = []
      for (const key in entity.entityType) {
        const element = entity.entityType[key] as customFilterInfo<any>
        if (
          element &&
          element.rawFilterInfo &&
          element.rawFilterInfo.rawFilterTranslator
        ) {
          if (element.rawFilterInfo.key == filterKey) {
            r.push(
              await Filter.fromEntityFilter(
                entity,
                await element.rawFilterInfo.rawFilterTranslator(custom, remult),
              ),
            )
          }
        }
      }
      return r
    })
    r.__applyToConsumer(f)
    await f.resolve()
    r = new Filter((x) => f.applyTo(x))
    return r
  }
}
export class filterHelper {
  constructor(public metadata: FieldMetadata) {}

  processVal(val: any) {
    let ei = getEntitySettings(this.metadata.valueType, false)
    if (ei) {
      if (!val) return null
      if (typeof val === 'string' || typeof val === 'number') return val
      return getEntityRef(val).getId()
    }
    return val
  }

  contains(val: string): Filter {
    return new Filter((add) => add.containsCaseInsensitive(this.metadata, val))
  }
  isLessThan(val: any): Filter {
    val = this.processVal(val)
    return new Filter((add) => add.isLessThan(this.metadata, val))
  }
  isGreaterOrEqualTo(val: any): Filter {
    val = this.processVal(val)
    return new Filter((add) => add.isGreaterOrEqualTo(this.metadata, val))
  }
  isNotIn(values: any[]): Filter {
    return new Filter((add) => {
      for (const v of values) {
        add.isDifferentFrom(this.metadata, this.processVal(v))
      }
    })
  }
  isDifferentFrom(val: any) {
    val = this.processVal(val)
    if ((val === null || val === undefined) && this.metadata.allowNull)
      return new Filter((add) => add.isNotNull(this.metadata))
    return new Filter((add) => add.isDifferentFrom(this.metadata, val))
  }
  isLessOrEqualTo(val: any): Filter {
    val = this.processVal(val)
    return new Filter((add) => add.isLessOrEqualTo(this.metadata, val))
  }
  isGreaterThan(val: any): Filter {
    val = this.processVal(val)
    return new Filter((add) => add.isGreaterThan(this.metadata, val))
  }
  isEqualTo(val: any): Filter {
    val = this.processVal(val)
    if ((val === null || val === undefined) && this.metadata.allowNull)
      return new Filter((add) => add.isNull(this.metadata))
    return new Filter((add) => add.isEqualTo(this.metadata, val))
  }
  isIn(val: any[]): Filter {
    val = val.map((x) => this.processVal(x))
    return new Filter((add) => add.isIn(this.metadata, val))
  }
}
export interface FilterConsumer {
  or(orElements: Filter[])
  isEqualTo(col: FieldMetadata, val: any): void
  isDifferentFrom(col: FieldMetadata, val: any): void
  isNull(col: FieldMetadata): void
  isNotNull(col: FieldMetadata): void
  isGreaterOrEqualTo(col: FieldMetadata, val: any): void
  isGreaterThan(col: FieldMetadata, val: any): void
  isLessOrEqualTo(col: FieldMetadata, val: any): void
  isLessThan(col: FieldMetadata, val: any): void
  containsCaseInsensitive(col: FieldMetadata, val: any): void
  isIn(col: FieldMetadata, val: any[]): void
  custom(key: string, customItem: any): void
  databaseCustom(databaseCustom: any): void
}

export class AndFilter extends Filter {
  readonly filters: Filter[]
  constructor(...filters: Filter[]) {
    super((add) => {
      for (const iterator of this.filters) {
        if (iterator) iterator.__applyToConsumer(add)
      }
    })
    this.filters = filters
  }
  add(filter: Filter) {
    this.filters.push(filter)
  }
}
export class OrFilter extends Filter {
  readonly filters: Filter[]

  constructor(...filters: Filter[]) {
    super((add) => {
      let f = this.filters.filter((x) => x !== undefined)
      if (f.length > 1) {
        add.or(f)
      } else if (f.length == 1) f[0].__applyToConsumer(add)
    })
    this.filters = filters
  }
}

export const customUrlToken = '$custom$'
export const customDatabaseFilterToken = '$db$'
const customArrayToken = '$an array'
export class FilterSerializer implements FilterConsumer {
  result: any = {}
  constructor() {}
  databaseCustom(databaseCustom: any): void {
    throw new Error('database custom is not allowed with api calls.')
  }
  custom(key, customItem: any): void {
    if (Array.isArray(customItem))
      customItem = { [customArrayToken]: customItem }
    this.add(customUrlToken + key, customItem)
  }
  hasUndefined = false
  add(key: string, val: any) {
    if (val === undefined) this.hasUndefined = true
    let r = this.result
    if (!r[key]) {
      r[key] = val
      return
    }
    let v = r[key]
    if (v instanceof Array) {
      v.push(val)
    } else v = [v, val]
    r[key] = v
  }

  or(orElements: Filter[]) {
    this.add(
      'OR',
      orElements.map((x) => {
        let f = new FilterSerializer()
        x.__applyToConsumer(f)
        return f.result
      }),
    )
  }
  isNull(col: FieldMetadata): void {
    this.add(col.key + '.null', true)
  }
  isNotNull(col: FieldMetadata): void {
    this.add(col.key + '.null', false)
  }
  isIn(col: FieldMetadata, val: any[]): void {
    this.add(
      col.key + '.in',
      val.map((x) => col.valueConverter.toJson(x)),
    )
  }

  public isEqualTo(col: FieldMetadata, val: any): void {
    this.add(col.key, col.valueConverter.toJson(val))
  }

  public isDifferentFrom(col: FieldMetadata, val: any): void {
    this.add(col.key + '.ne', col.valueConverter.toJson(val))
  }

  public isGreaterOrEqualTo(col: FieldMetadata, val: any): void {
    this.add(col.key + '.gte', col.valueConverter.toJson(val))
  }

  public isGreaterThan(col: FieldMetadata, val: any): void {
    this.add(col.key + '.gt', col.valueConverter.toJson(val))
  }

  public isLessOrEqualTo(col: FieldMetadata, val: any): void {
    this.add(col.key + '.lte', col.valueConverter.toJson(val))
  }

  public isLessThan(col: FieldMetadata, val: any): void {
    this.add(col.key + '.lt', col.valueConverter.toJson(val))
  }
  public containsCaseInsensitive(col: FieldMetadata, val: any): void {
    this.add(col.key + '.contains', val)
  }
}

export function entityFilterToJson<T>(
  entityDefs: EntityMetadata<T>,
  where: EntityFilter<T>,
) {
  if (!where) return {}
  return Filter.fromEntityFilter(entityDefs, where).toJson()
}

export function buildFilterFromRequestParameters(
  entity: EntityMetadata,
  filterInfo: {
    get: (key: string) => any
  },
): EntityFilter<any> {
  let where: EntityFilter<any>[] = []

  ;[...entity.fields].forEach((col) => {
    function addFilter(
      operation: string,
      theFilter: (val: any) => any,
      jsonArray = false,
      asString = false,
    ) {
      let val = filterInfo.get(col.key + operation)
      if (val !== undefined) {
        let addFilter = (val: any) => {
          let theVal = val
          if (jsonArray) {
            let arr: []
            if (typeof val === 'string') arr = JSON.parse(val)
            else arr = val
            theVal = arr.map((x) =>
              asString ? x : col.valueConverter.fromJson(x),
            )
          } else {
            theVal = asString ? theVal : col.valueConverter.fromJson(theVal)
          }
          let f = theFilter(theVal)
          if (f !== undefined) {
            where.push({ [col.key]: f })
          }
        }
        if (!jsonArray && val instanceof Array) {
          val.forEach((v) => {
            addFilter(v)
          })
        } else {
          if (jsonArray) {
            if (typeof val === 'string') val = JSON.parse(val)
          }
          const array = separateArrayFromInnerArray(val)
          for (const x of array) {
            addFilter(x)
          }
        }
      }
    }
    let c = new filterHelper(col)
    addFilter('', (val) => val)
    addFilter('.gt', (val) => ({ $gt: val }))
    addFilter('.gte', (val) => ({ $gte: val }))
    addFilter('.lt', (val) => ({ $lt: val }))
    addFilter('.lte', (val) => ({ $lte: val }))
    addFilter('.ne', (val) => ({ $ne: val }))
    addFilter('.in', (val) => val, true)
    var nullFilter = filterInfo.get(col.key + '.null')
    if (nullFilter) {
      nullFilter = nullFilter.toString().trim().toLowerCase()
      switch (nullFilter) {
        case 'y':
        case 'true':
        case 'yes':
          where.push({ [col.key]: null })
          break
        default:
          where.push({ [col.key]: { $ne: null } })
          break
      }
    }

    addFilter('.contains', (val) => ({ $contains: val }), false, true)
  })
  let val = filterInfo.get('OR')
  if (val) {
    const array = separateArrayFromInnerArray(val)
    where.push({
      $and: array.map((v) => ({
        $or: v.map((x) =>
          buildFilterFromRequestParameters(entity, {
            get: (key: string) => x[key],
          }),
        ),
      })),
    })
  }

  for (const key in entity.entityType) {
    const element = entity.entityType[key] as customFilterInfo<any>
    if (
      element &&
      element.rawFilterInfo &&
      element.rawFilterInfo.rawFilterTranslator
    ) {
      let custom = filterInfo.get(customUrlToken + key)
      if (custom !== undefined) {
        const addItem = (item: any) => {
          if (item[customArrayToken] != undefined) item = item[customArrayToken]
          where.push({ [customUrlToken + key]: item })
        }
        if (Array.isArray(custom)) {
          custom.forEach((item) => addItem(item))
        } else addItem(custom)
      }
    }
  }

  return { $and: where }

  function separateArrayFromInnerArray(val: any) {
    if (!Array.isArray(val)) return [val]
    const nonArray = [],
      array = []
    for (const v of val) {
      if (Array.isArray(v)) {
        array.push(v)
      } else nonArray.push(v)
    }
    array.push(nonArray)
    return array
  }
}

class customTranslator implements FilterConsumer {
  applyTo(x: FilterConsumer): void {
    this.commands.forEach((y) => y(x))
  }
  constructor(
    private translateCustom: (
      key: string,
      custom: any,
    ) => Promise<Filter | Filter[]>,
  ) {}

  commands: ((x: FilterConsumer) => void)[] = []
  promises: Promise<void>[] = []
  or(orElements: Filter[]) {
    let newOrElements: Filter[]
    this.promises.push(
      Promise.all(
        orElements.map(async (element) => {
          let c = new customTranslator(this.translateCustom)
          element.__applyToConsumer(c)
          await c.resolve()
          return new Filter((x) => c.applyTo(x))
        }),
      ).then((x) => {
        newOrElements = x
      }),
    )
    this.commands.push((x) => x.or(newOrElements))
  }
  isEqualTo(col: FieldMetadata<any>, val: any): void {
    this.commands.push((x) => x.isEqualTo(col, val))
  }
  isDifferentFrom(col: FieldMetadata<any>, val: any): void {
    this.commands.push((x) => x.isDifferentFrom(col, val))
  }
  isNull(col: FieldMetadata<any>): void {
    this.commands.push((x) => x.isNull(col))
  }
  isNotNull(col: FieldMetadata<any>): void {
    this.commands.push((x) => x.isNotNull(col))
  }
  isGreaterOrEqualTo(col: FieldMetadata<any>, val: any): void {
    this.commands.push((x) => x.isGreaterOrEqualTo(col, val))
  }
  isGreaterThan(col: FieldMetadata<any>, val: any): void {
    this.commands.push((x) => x.isGreaterThan(col, val))
  }
  isLessOrEqualTo(col: FieldMetadata<any>, val: any): void {
    this.commands.push((x) => x.isLessOrEqualTo(col, val))
  }
  isLessThan(col: FieldMetadata<any>, val: any): void {
    this.commands.push((x) => x.isLessThan(col, val))
  }
  containsCaseInsensitive(col: FieldMetadata<any>, val: any): void {
    this.commands.push((x) => x.containsCaseInsensitive(col, val))
  }

  isIn(col: FieldMetadata<any>, val: any[]): void {
    this.commands.push((x) => x.isIn(col, val))
  }
  custom(key: string, customItem: any): void {
    this.promises.push(
      (async () => {
        let r = await this.translateCustom(key, customItem)
        if (r)
          if (Array.isArray(r)) r.forEach((x) => x.__applyToConsumer(this))
          else r.__applyToConsumer(this)
      })(),
    )
  }
  databaseCustom(custom: any) {
    this.commands.push((x) => x.databaseCustom(custom))
  }
  async resolve() {
    while (this.promises.length > 0) {
      let p = this.promises
      this.promises = []
      await Promise.all(p)
    }
  }
}

export interface customFilterInfo<entityType> {
  rawFilterInfo: {
    key: string
    rawFilterTranslator: (
      args: any,
      r: Remult,
    ) => EntityFilter<entityType> | Promise<EntityFilter<entityType>>
  }
}
