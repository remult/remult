import type { FieldMetadata } from '../column-interfaces.js'
import type { Remult } from '../context.js'
import type {
  EntityFilter,
  EntityMetadata,
  FieldsMetadata,
  RelationOptions,
} from '../remult3/remult3.js'

import { getEntityRef, getEntitySettings } from '../remult3/getEntityRef.js'
import { getRelationFieldInfo } from '../remult3/relationInfoMember.js'
import type { ErrorInfo } from '../data-interfaces.js'

/**
 * The `Filter` class is a helper class that focuses on filter-related concerns. It provides methods
 * for creating and applying filters in queries.
 */
export class Filter {
  //@internal
  static throwErrorIfFilterIsEmpty(
    where: EntityFilter<any>,
    methodName: string,
  ) {
    if (Filter.isFilterEmpty(where)) {
      throw {
        message: `${methodName}: requires a filter to protect against accidental delete/update of all rows`,
        httpStatusCode: 400,
      } satisfies ErrorInfo
    }
  }
  //@internal
  static isFilterEmpty(where: EntityFilter<unknown>) {
    if (where.$and) {
      for (const a of where.$and) {
        if (!Filter.isFilterEmpty(a)) {
          return false
        }
      }
    }
    if (where.$or) {
      for (const a of where.$or) {
        if (Filter.isFilterEmpty(a)) {
          return true
        }
      }
      return false
    }
    if (
      Object.keys(where).filter((x) => !['$or', '$and'].includes(x)).length == 0
    ) {
      return true
    }

    return false
  }

  /**
   * Retrieves information about a filter, including precise values for each property.
   * @template entityType The type of the entity being filtered.
   * @param metadata The metadata of the entity being filtered.
   * @param filter The filter to analyze.
   * @returns A promise that resolves to a FilterInfo object containing the filter information.
   * @example
   * const info = await Filter.getInfo(meta, {
   *   status: { $ne: 'active' },
   *   $or: [
   *     { customerId: ["1", "2"] },
   *     { customerId: "3" }
   *   ]
   * });
   * console.log(info.preciseValues);
   * // Output:
   * // {
   * //   "customerId": ["1", "2", "3"], // Precise values inferred from the filter
   * //   "status": undefined,           // Cannot infer precise values for 'status'
   * // }
  
   */
  static async getInfo<entityType>(
    metadata: EntityMetadata<entityType>,
    filter: EntityFilter<entityType>,
  ): Promise<FilterInfo<entityType>> {
    const result = new preciseValuesCollector()
    await Filter.fromEntityFilter(metadata, filter).__applyToConsumer(result)
    return result
  }
  /**
   * Creates a custom filter. Custom filters are evaluated on the backend, ensuring security and efficiency.
   * When the filter is used in the frontend, only its name is sent to the backend via the API,
   * where the filter gets translated and applied in a safe manner.
   *
   * @template entityType The entity type for the filter.
   * @param {function(): EntityFilter<entityType>} rawFilterTranslator A function that returns an `EntityFilter`.
   * @param {string} [key] An optional unique identifier for the custom filter.
   * @returns {function(): EntityFilter<entityType>} A function that returns an `EntityFilter` of type `entityType`.
   *
   * @example
   * // In an entity class, add a static method for the custom filter
   * static titleLengthFilter = Filter.createCustom<Task>(() => {
   *   return SqlDatabase.rawFilter((whereFragment) => {
   *     whereFragment.sql = 'length(title) > 10';
   *   });
   * });
   *
   * // Usage
   * console.table(
   *   await remult.repo(Task).find({
   *     where: Task.titleLengthFilter()
   *   })
   * );
   * @see
   * [Sql filter and Custom filter](/docs/custom-filter.html)
   * [Filtering and Relations](/docs/filtering-and-relations.html)
   */

  //@ts-ignore
  static createCustom<entityType>(
    rawFilterTranslator: (
      unused: never,
      r: Remult,
    ) => EntityFilter<entityType> | Promise<EntityFilter<entityType>>,
    key?: string,
  ): (() => EntityFilter<entityType>) & customFilterInfo<entityType>
  /**
   * Creates a custom filter. Custom filters are evaluated on the backend, ensuring security and efficiency.
   * When the filter is used in the frontend, only its name and value arguments are sent to the backend via the API,
   * where the filter gets translated and applied in a safe manner.
   *
   * @template entityType The entity type for the filter.
   * @template argsType The type of the argument for the filter.
   * @param {function(argsType, Remult): EntityFilter<entityType>} rawFilterTranslator A function that takes an argument of type `argsType` and an instance of `Remult`, and returns an `EntityFilter`.
   * @param {string} [key] An optional unique identifier for the custom filter.
   * @returns {function(argsType): EntityFilter<entityType>} A function that takes an argument of type `argsType` and returns an `EntityFilter` of type `entityType`.
   *
   * @example
   * // In an entity class, add a static method for the custom filter with parameters
   * static filterCity = Filter.createCustom<Order, { city: string }>(
   *   async ({ city }) => {
   *     const orders = await dbNamesOf(Order);
   *     const customers = await dbNamesOf(Customer);
   *     return SqlDatabase.rawFilter(async (whereFragment) => {
   *       whereFragment.sql = `${orders.customer} in
   *              (select ${customers.id}
   *                 from ${customers}
   *                where ${await whereFragment.filterToRaw(Customer, { city })})`;
   *     });
   *   }
   * );
   *
   * // Usage
   * const cityFilter = Order.filterCity({ city: 'New York' });
   * const ordersInNewYork = await remult.repo(Order).find({ where: cityFilter });
   *
   * // The filter is sent to the backend as:
   * // http://127.0.0.1:3002/api/orders?%24custom%24filterCity=%7B%22city%22%3A%22New%20York%22%7D
   * @see
   * [Sql filter and Custom filter](/docs/custom-filter.html)
   * [Filtering and Relations](/docs/filtering-and-relations.html)
   */
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

  /**
   * Translates an `EntityFilter` to a plain JSON object that can be stored or transported.
   *
   * @template T The entity type for the filter.
   * @param {EntityMetadata<T>} entityDefs The metadata of the entity associated with the filter.
   * @param {EntityFilter<T>} where The `EntityFilter` to be translated.
   * @returns {any} A plain JSON object representing the `EntityFilter`.
   *
   * @example
   * // Assuming `Task` is an entity class
   * const jsonFilter = Filter.entityFilterToJson(Task, { completed: true });
   * // `jsonFilter` can now be stored or transported as JSON
   */
  static entityFilterToJson<T>(
    entityDefs: EntityMetadata<T>,
    where: EntityFilter<T>,
  ): any {
    return Filter.fromEntityFilter(entityDefs, where).toJson()
  }

  /**
   * Translates a plain JSON object back into an `EntityFilter`.
   *
   * @template T The entity type for the filter.
   * @param {EntityMetadata<T>} entityDefs The metadata of the entity associated with the filter.
   * @param {any} packed The plain JSON object representing the `EntityFilter`.
   * @returns {EntityFilter<T>} The reconstructed `EntityFilter`.
   *
   * @example
   * // Assuming `Task` is an entity class and `jsonFilter` is a JSON object representing an EntityFilter
   * const taskFilter = Filter.entityFilterFromJson(Task, jsonFilter);
   * // Using the reconstructed `EntityFilter` in a query
   * const tasks = await remult.repo(Task).find({ where: taskFilter });
   * for (const task of tasks) {
   *   // Do something for each task based on the filter
   * }
   */
  static entityFilterFromJson<T>(
    entityDefs: EntityMetadata<T>,
    packed: any,
  ): EntityFilter<T> {
    return buildFilterFromRequestParameters(entityDefs, {
      get: (key: string) => packed[key],
    })
  }
  /**
   * Converts an `EntityFilter` to a `Filter` that can be used by the `DataProvider`. This method is
   * mainly used internally.
   *
   * @template T The entity type for the filter.
   * @param {EntityMetadata<T>} entity The metadata of the entity associated with the filter.
   * @param {EntityFilter<T>} whereItem The `EntityFilter` to be converted.
   * @returns {Filter} A `Filter` instance that can be used by the `DataProvider`.
   *
   * @example
   * // Assuming `Task` is an entity class and `taskFilter` is an EntityFilter
   * const filter = Filter.fromEntityFilter(Task, taskFilter);
   * // `filter` can now be used with the DataProvider
   */
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
            const field = entity.fields[key]
            const rel = getRelationFieldInfo(field)
            const op = field.options as RelationOptions<any, any, any>
            let fh =
              rel?.type === 'toOne'
                ? op.fields
                  ? new manyToOneFilterHelper(field, entity.fields, op)
                  : new toOneFilterHelper(entity.fields[op.field!])
                : new filterHelper(field)
            let found = false
            if (fieldToFilter !== undefined && fieldToFilter != null) {
              if (fieldToFilter.$id !== undefined)
                fieldToFilter = fieldToFilter.$id
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
                    case '$notContains':
                      found = true
                      result.push(fh.notContains(element))
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
  constructor(private apply: (add: FilterConsumer) => void) {}
  __applyToConsumer(add: FilterConsumer) {
    this.apply(add)
  }
  /**
   * Resolves an entity filter.
   *
   * This method takes a filter which can be either an instance of `EntityFilter`
   * or a function that returns an instance of `EntityFilter` or a promise that
   * resolves to an instance of `EntityFilter`. It then resolves the filter if it
   * is a function and returns the resulting `EntityFilter`.
   *
   * @template entityType The type of the entity that the filter applies to.
   * @param {EntityFilter<entityType> | (() => EntityFilter<entityType> | Promise<EntityFilter<entityType>>)} filter The filter to resolve.
   * @returns {Promise<EntityFilter<entityType>>} The resolved entity filter.
   */
  static async resolve<entityType>(
    filter:
      | EntityFilter<entityType>
      | (() => EntityFilter<entityType> | Promise<EntityFilter<entityType>>),
  ): Promise<EntityFilter<entityType>> {
    if (typeof filter === 'function') return await filter()
    return filter
  }
  //@internal
  toJson() {
    let r = new FilterSerializer()
    this.__applyToConsumer(r)
    return r.result
  }
  //@internal
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

class filterHelper {
  constructor(public metadata: FieldMetadata) {}

  processVal(val: any) {
    let ei = getEntitySettings(this.metadata.valueType, false)
    if (ei) {
      if (!val) {
        if (val === null && !this.metadata.allowNull) {
          const rel = getRelationFieldInfo(this.metadata)
          if (rel?.type === 'reference')
            if (
              rel.toRepo.metadata.idMetadata.field.options.valueType === Number
            )
              return 0
            else return ''
        }
        return null
      }
      if (typeof val === 'string' || typeof val === 'number') return val
      return getEntityRef(val).getId()
    }
    return val
  }

  contains(val: string): Filter {
    return new Filter((add) => add.containsCaseInsensitive(this.metadata, val))
  }
  notContains(val: string): Filter {
    return new Filter((add) =>
      add.notContainsCaseInsensitive(this.metadata, val),
    )
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
    if (val?.length == 1 && val[0] != undefined && val[0] !== null)
      return new Filter((add) => add.isEqualTo(this.metadata, val[0]))
    return new Filter((add) => add.isIn(this.metadata, val))
  }
}
class toOneFilterHelper extends filterHelper {
  processVal(val: any) {
    if (!val) return null
    if (typeof val === 'string' || typeof val === 'number') return val
    return getEntityRef(val).getId()
  }
}
class manyToOneFilterHelper implements filterHelper {
  constructor(
    public metadata: FieldMetadata,
    public fields: FieldsMetadata<any>,
    public relationOptions: RelationOptions<any, any, any>,
  ) {}
  processVal(val: any) {
    throw new Error('Invalid for Many To One Relation Field')
  }
  contains(val: string): Filter {
    throw new Error('Invalid for Many To One Relation Field')
  }
  notContains(val: string): Filter {
    throw new Error('Invalid for Many To One Relation Field')
  }
  isLessThan(val: any): Filter {
    throw new Error('Invalid for Many To One Relation Field')
  }
  isGreaterOrEqualTo(val: any): Filter {
    throw new Error('Invalid for Many To One Relation Field')
  }
  isNotIn(values: any[]): Filter {
    return new Filter((add) => {
      values.forEach((v) => this.isDifferentFrom(v).__applyToConsumer(add))
    })
  }
  isDifferentFrom(val: any): Filter {
    return new Filter((add) => {
      const or: Filter[] = []

      for (const key in this.relationOptions.fields) {
        if (
          Object.prototype.hasOwnProperty.call(this.relationOptions.fields, key)
        ) {
          const keyInMyEntity = this.relationOptions.fields[key] as string
          or.push(
            new Filter((add) =>
              new filterHelper(this.fields.find(keyInMyEntity))
                .isDifferentFrom(val[key])
                .__applyToConsumer(add),
            ),
          )
        }
      }
      add.or(or)
    })
  }
  isLessOrEqualTo(val: any): Filter {
    throw new Error('Invalid for Many To One Relation Field')
  }
  isGreaterThan(val: any): Filter {
    throw new Error('Invalid for Many To One Relation Field')
  }
  isEqualTo(val: any): Filter {
    return new Filter((add) => {
      for (const key in this.relationOptions.fields) {
        if (
          Object.prototype.hasOwnProperty.call(this.relationOptions.fields, key)
        ) {
          const keyInMyEntity = this.relationOptions.fields[key] as string

          new filterHelper(this.fields.find(keyInMyEntity))
            .isEqualTo(val[key])
            .__applyToConsumer(add)
        }
      }
    })
  }

  isIn(val: any[]): Filter {
    return new Filter((add) => {
      add.or(val.map((v) => this.isEqualTo(v)))
    })
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
  notContainsCaseInsensitive(col: FieldMetadata, val: any): void
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
  public notContainsCaseInsensitive(col: FieldMetadata, val: any): void {
    this.add(col.key + '.notContains', val)
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
  let where: EntityFilter<any> = {}

  function addAnd(what: EntityFilter<any>) {
    if (!where.$and) {
      where.$and = []
    }
    where.$and.push(what)
  }
  function addToFilterObject(key: string, val: any) {
    if (where[key] === undefined) where[key] = val
    else {
      addAnd({ [key]: val })
    }
  }

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
            addToFilterObject(col.key, f)
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
          addToFilterObject(col.key, null)
          break
        default:
          addToFilterObject(col.key, { $ne: null })
          break
      }
    }

    addFilter('.contains', (val) => ({ $contains: val }), false, true)
    addFilter('.notContains', (val) => ({ $notContains: val }), false, true)
  })
  let val = filterInfo.get('OR')
  if (val) {
    const array = separateArrayFromInnerArray(val)
    const or = array.map((v) => ({
      $or: v.map((x) =>
        buildFilterFromRequestParameters(entity, {
          get: (key: string) => x[key],
        }),
      ),
    }))
    if (or.length == 1) {
      if (!where.$or) {
        where.$or = or[0].$or
      } else {
        where.$or.push(or[0].$or)
      }
    } else {
      addAnd({
        $and: or,
      })
    }
  }

  for (const key in entity.entityType) {
    const element = entity.entityType[key] as customFilterInfo<any>
    if (
      element &&
      element.rawFilterInfo &&
      element.rawFilterInfo.rawFilterTranslator!
    ) {
      let custom = filterInfo.get(customUrlToken + key)
      if (custom !== undefined) {
        const addItem = (item: any) => {
          if (item[customArrayToken] != undefined) item = item[customArrayToken]
          addToFilterObject(customUrlToken + key, item)
        }
        if (Array.isArray(custom)) {
          custom.forEach((item) => addItem(item))
        } else addItem(custom)
      }
    }
  }
  return where

  function separateArrayFromInnerArray(val: any) {
    if (!Array.isArray(val)) return [val]
    const nonArray: any[] = [],
      array: any[] = []
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
  notContainsCaseInsensitive(col: FieldMetadata<any>, val: any): void {
    this.commands.push((x) => x.notContainsCaseInsensitive(col, val))
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

export function __updateEntityBasedOnWhere<T>(
  entityDefs: EntityMetadata<T>,
  where: EntityFilter<T>,
  r: T,
) {
  let w = Filter.fromEntityFilter(entityDefs, where)
  const emptyFunction = () => {}
  if (w) {
    w.__applyToConsumer({
      custom: emptyFunction,
      databaseCustom: emptyFunction,
      containsCaseInsensitive: emptyFunction,
      notContainsCaseInsensitive: emptyFunction,
      isDifferentFrom: emptyFunction,
      isEqualTo: (col, val) => {
        r[col.key] = val
      },
      isGreaterOrEqualTo: emptyFunction,
      isGreaterThan: emptyFunction,
      isIn: emptyFunction,
      isLessOrEqualTo: emptyFunction,
      isLessThan: emptyFunction,
      isNotNull: emptyFunction,
      isNull: emptyFunction,

      or: emptyFunction,
    })
  }
}

/**
 * Represents information about a filter, including precise values for each property.
 * @template entityType The type of the entity being filtered.
 */
export interface FilterInfo<entityType> {
  /**
   * A mapping of property names to arrays of precise values for those properties.
   * @example
   * const info = await Filter.getInfo(meta, {
   *   status: { $ne: 'active' },
   *   $or: [
   *     { customerId: ["1", "2"] },
   *     { customerId: "3" }
   *   ]
   * });
   * console.log(info.preciseValues);
   * // Output:
   * // {
   * //   "customerId": ["1", "2", "3"], // Precise values inferred from the filter
   * //   "status": undefined,           // Cannot infer precise values for 'status'
   * // }
   */
  preciseValues: { [Properties in keyof entityType]?: entityType[Properties][] }
}

class preciseValuesCollector<entityType>
  implements FilterConsumer, FilterInfo<entityType>
{
  bad = new Set<string>()

  preciseValues: {
    [Properties in keyof entityType]?: entityType[Properties][]
  } = {}

  ok(col: string, ...val: any[]) {
    if (this.bad.has(col)) return
    let x = this.preciseValues[col]
    if (!x) {
      this.preciseValues[col] = [...val]
    } else {
      x.push(...val.filter((y) => !x.includes(y)))
    }
  }
  notOk(col: string) {
    if (this.bad.has(col)) return
    this.bad.add(col)
    this.preciseValues[col] = undefined
  }
  or(orElements: Filter[]) {
    const result = orElements.map((or) => {
      let x = new preciseValuesCollector<entityType>()
      or.__applyToConsumer(x)
      return x
    })
    for (const or of result) {
      for (const key in or.preciseValues) {
        if (Object.prototype.hasOwnProperty.call(or.preciseValues, key)) {
          const element = or.preciseValues[key]
          if (element) this.ok(key, ...element)
        }
      }
      for (const key of or.bad) {
        this.notOk(key)
      }
    }
    for (const key in this.preciseValues) {
      if (Object.prototype.hasOwnProperty.call(this.preciseValues, key)) {
        for (const r of result) {
          const element = r.preciseValues[key]
          if (!element) this.notOk(key)
        }
      }
    }
  }
  isEqualTo(col: FieldMetadata<any, any>, val: any): void {
    this.ok(col.key, val)
  }
  isDifferentFrom(col: FieldMetadata<any, any>, val: any): void {
    this.notOk(col.key)
  }
  isNull(col: FieldMetadata<any, any>): void {
    this.ok(col.key, null)
  }
  isNotNull(col: FieldMetadata<any, any>): void {
    this.notOk(col.key)
  }
  isGreaterOrEqualTo(col: FieldMetadata<any, any>, val: any): void {
    this.notOk(col.key)
  }
  isGreaterThan(col: FieldMetadata<any, any>, val: any): void {
    this.notOk(col.key)
  }
  isLessOrEqualTo(col: FieldMetadata<any, any>, val: any): void {
    this.notOk(col.key)
  }
  isLessThan(col: FieldMetadata<any, any>, val: any): void {
    this.notOk(col.key)
  }
  containsCaseInsensitive(col: FieldMetadata<any, any>, val: any): void {
    this.notOk(col.key)
  }
  notContainsCaseInsensitive(col: FieldMetadata<any, any>, val: any): void {
    this.notOk(col.key)
  }
  isIn(col: FieldMetadata<any, any>, val: any[]): void {
    this.ok(col.key, ...val)
  }
  custom(key: string, customItem: any): void {}
  databaseCustom(databaseCustom: any): void {}
}
