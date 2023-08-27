import {
  FieldMetadata,
  FieldOptions,
  ValueConverter,
  ValueListItem,
} from '../column-interfaces'
import { EntityOptions } from '../entity'
import { CompoundIdField, LookupColumn, makeTitle } from '../column'
import {
  EntityMetadata,
  FieldRef,
  FieldsRef,
  EntityFilter,
  FindOptions,
  Repository,
  EntityRef,
  QueryOptions,
  QueryResult,
  EntityOrderBy,
  FieldsMetadata,
  IdMetadata,
  FindFirstOptionsBase,
  FindFirstOptions,
  OmitEB,
  Subscribable,
  ControllerRef,
  LiveQuery,
  LiveQueryChangeInfo,
} from './remult3'
import { ClassType } from '../../classType'
import {
  allEntities,
  Remult,
  isBackend,
  queryConfig as queryConfig,
  setControllerSettings,
  EventSource,
  Allowed,
  AllowedForInstance,
} from '../context'
import {
  AndFilter,
  customFilterInfo,
  entityFilterToJson,
  Filter,
  FilterConsumer,
  OrFilter,
} from '../filter/filter-interfaces'
import { Sort } from '../sort'
import { v4 as uuid } from 'uuid'
import { createId } from '@paralleldrive/cuid2'

import { entityEventListener } from '../__EntityValueProvider'
import {
  DataProvider,
  EntityDataProvider,
  EntityDataProviderFindOptions,
  ErrorInfo,
} from '../data-interfaces'
import { ValueConverters } from '../valueConverters'
import { filterHelper } from '../filter/filter-interfaces'
import { assign } from '../../assign'
import { Paginator, RefSubscriber, RefSubscriberBase } from '.'

import { RemultProxy, remult as defaultRemult } from '../remult-proxy'
import {
  SubscriptionListener,
  Unsubscribe,
} from '../live-query/SubscriptionChannel'
import { findOptionsToJson } from '../data-providers/rest-data-provider'
//import { remult } from "../remult-proxy";

let classValidatorValidate:
  | ((
      item: any,
      ref: {
        fields: FieldsRef<any>
      },
    ) => Promise<void>)
  | undefined = undefined
// import("class-validator".toString())
//     .then((v) => {
//         classValidatorValidate = (item, ref) => {
//             return v.validate(item).then(errors => {
//                 for (const err of errors) {
//                     for (const key in err.constraints) {
//                         if (Object.prototype.hasOwnProperty.call(err.constraints, key)) {
//                             const element = err.constraints[key];
//                             ref.fields.find(err.property).error = element;
//                         }
//                     }
//                 }
//             });
//         }
//     })
//     .catch(() => {
//     });

export class RepositoryImplementation<entityType>
  implements Repository<entityType>
{
  async createAfterFilter(
    orderBy: EntityOrderBy<entityType>,
    lastRow: entityType,
  ): Promise<EntityFilter<entityType>> {
    let values = new Map<string, any>()

    for (const s of Sort.translateOrderByToSort(this.metadata, orderBy)
      .Segments) {
      let existingVal = lastRow[s.field.key]
      // if (typeof existingVal !== "string" && typeof existingVal !== "number") {
      // }
      // else {
      //     let ei = getEntitySettings(s.field.valueType, false);
      //     if (ei) {
      //         existingVal = await this.remult.repo(s.field.valueType).findId(existingVal);
      //     }
      // }
      values.set(s.field.key, existingVal)
    }

    let r: EntityFilter<any> = { $or: [] }
    let equalToColumn: FieldMetadata[] = []
    for (const s of Sort.translateOrderByToSort(this.metadata, orderBy)
      .Segments) {
      let ff = new filterHelper(s.field)
      let f: EntityFilter<any> = {}
      for (const c of equalToColumn) {
        f[c.key] = values.get(c.key)
      }
      equalToColumn.push(s.field)
      if (s.isDescending) {
        f[s.field.key] = { $lt: values.get(s.field.key) }
      } else f[s.field.key] = { $gt: values.get(s.field.key) }
      r.$or.push(f)
    }
    return r
  }

  private _info: EntityFullInfo<entityType>
  private __edp: EntityDataProvider
  private get edp() {
    return this.__edp
      ? this.__edp
      : (this.__edp = this.dataProvider.getEntityDataProvider(this.metadata))
  }
  constructor(
    private entity: ClassType<entityType>,
    public remult: Remult,
    private dataProvider: DataProvider,
  ) {
    this._info = createOldEntity(entity, remult)
  }
  idCache = new Map<any, any>()
  getCachedById(id: any): entityType {
    id = id + ''
    this.getCachedByIdAsync(id)
    let r = this.idCache.get(id)
    if (r instanceof Promise) return undefined
    return r
  }
  async getCachedByIdAsync(id: any): Promise<entityType> {
    id = id + ''
    let r = this.idCache.get(id)
    if (r instanceof Promise) return await r
    if (this.idCache.has(id)) {
      return r
    }
    this.idCache.set(id, undefined)
    let row = this.findId(id).then((row) => {
      if (row === undefined) {
        r = null
      } else r = row
      this.idCache.set(id, r)
      return r
    })
    this.idCache.set(id, row)
    return await row
  }
  //TODO2 - Used to prevent unnecessary many to one relations
  addToCache(item: entityType) {
    if (item) this.idCache.set(this.getEntityRef(item).getId() + '', item)
  }

  get metadata(): EntityMetadata<entityType> {
    return this._info
  }

  listeners: entityEventListener<entityType>[]
  addEventListener(listener: entityEventListener<entityType>) {
    if (!this.listeners) this.listeners = []
    this.listeners.push(listener)
    return () => {
      this.listeners.splice(this.listeners.indexOf(listener), 1)
    }
  }

  query(options?: QueryOptions<entityType>): QueryResult<entityType> {
    return new QueryResultImpl(options, this)
  }

  getEntityRef(entity: entityType): EntityRef<entityType> {
    let x = entity[entityMember]
    if (!x) {
      this.fixTypes(entity)
      x = new rowHelperImplementation(
        this._info,
        entity,
        this,
        this.edp,
        this.remult,
        true,
      )
      Object.defineProperty(entity, entityMember, {
        //I've used define property to hide this member from console.lo g
        get: () => x,
      })
      x.saveOriginalData()
    }
    return x
  }
  async delete(
    id: entityType extends { id?: number }
      ? number
      : entityType extends { id?: string }
      ? string
      : string | number,
  ): Promise<void>
  async delete(item: entityType): Promise<void>
  async delete(
    item:
      | entityType
      | (entityType extends { id?: number }
          ? number
          : entityType extends { id?: string }
          ? string
          : string | number),
  ): Promise<void> {
    if (typeof item === 'string' || typeof item === 'number')
      return this.edp.delete(item)
    else {
      return this.getRefForExistingRow(item as entityType, undefined).delete()
    }
  }
  insert(item: Partial<OmitEB<entityType>>[]): Promise<entityType[]>
  insert(item: Partial<OmitEB<entityType>>): Promise<entityType>
  async insert(
    entity: Partial<OmitEB<entityType>> | Partial<OmitEB<entityType>>[],
  ): Promise<entityType | entityType[]> {
    if (Array.isArray(entity)) {
      let r = []
      for (const item of entity) {
        r.push(await this.insert(item))
      }
      return r
    } else {
      let ref = getEntityRef(entity, false) as EntityRef<entityType>
      if (ref) {
        if (!ref.isNew()) throw 'Item is not new'
        return await ref.save()
      } else {
        return await this.getEntityRef(this.create(entity)).save()
      }
    }
  }
  get fields() {
    return this.metadata.fields
  }
  async validate(
    entity: Partial<OmitEB<entityType>>,
    ...fields: Extract<keyof OmitEB<entityType>, string>[]
  ): Promise<ErrorInfo<entityType> | undefined> {
    {
      let ref: rowHelperImplementation<any> = getEntityRef(entity, false) as any
      if (!ref) ref = this.getEntityRef({ ...entity } as any) as any

      if (!fields || fields.length === 0) {
        return await ref.validate()
      } else {
        ref.__clearErrorsAndReportChanged()
        let hasError = false
        for (const f of fields) {
          if (!(await ref.fields.find(f).validate())) hasError = true
        }
        if (!hasError) return undefined
        return ref.buildErrorInfoObject()
      }
    }
  }
  update(
    id: entityType extends { id?: number }
      ? number
      : entityType extends { id?: string }
      ? string
      : string | number,
    item: Partial<OmitEB<entityType>>,
  ): Promise<entityType>
  update(
    originalItem: Partial<OmitEB<entityType>>,
    item: Partial<OmitEB<entityType>>,
  ): Promise<entityType>
  async update(
    id: any,
    entity: Partial<OmitEB<entityType>>,
  ): Promise<entityType> {
    {
      let ref = getEntityRef(entity, false)
      if (ref) return (await ref.save()) as unknown as entityType
    }
    let ref = this.getRefForExistingRow(
      entity,
      id,
    ) as rowHelperImplementation<entityType>
    if (this.dataProvider.isProxy) {
      return await ref.save(Object.keys(entity))
    } else {
      const r = await this.findId(ref.id, { useCache: false })
      if (!r) throw new Error('Not Found')
      for (const key in entity) {
        if (Object.prototype.hasOwnProperty.call(entity, key)) {
          let f = ref.fields[key]
          if (f) r[key] = f.value
        }
      }
      return await getEntityRef(r).save()
    }
  }

  private getRefForExistingRow(
    entity: Partial<OmitEB<entityType>>,
    id: string | number,
  ) {
    let ref = getEntityRef(entity, false)
    if (!ref) {
      const instance = new this.entity(this.remult)

      for (const field of this.fieldsOf(entity)) {
        instance[field.key] = entity[field.key]
      }
      this.fixTypes(instance)
      let row = new rowHelperImplementation(
        this._info,
        instance,
        this,
        this.edp,
        this.remult,
        false,
      )
      if (typeof id === 'object') id = this.metadata.idMetadata.getId(id)
      if (id) {
        row.id = id
        row.originalId = id
      } else row.id = row.getId()
      ref = row as any
      Object.defineProperty(instance, entityMember, {
        get: () => row,
      })
    }
    return ref
  }

  save(item: Partial<OmitEB<entityType>>[]): Promise<entityType[]>
  save(item: Partial<OmitEB<entityType>>): Promise<entityType>
  async save(
    entity: Partial<OmitEB<entityType>> | Partial<OmitEB<entityType>>[],
  ): Promise<entityType | entityType[]> {
    if (Array.isArray(entity)) {
      return Promise.all(entity.map((x) => this.save(x)))
    } else {
      let ref = getEntityRef(entity, false) as EntityRef<entityType>
      if (ref) return await ref.save()
      else if (entity instanceof EntityBase) {
        return await this.getEntityRef(entity as unknown as entityType).save()
      } else {
        let id = this.metadata.idMetadata.getId(entity)
        if (id === undefined) return this.insert(entity)
        return this.update(id, entity)
      }
    }
  }
  liveQuery(options?: FindOptions<entityType>) {
    if (!options) options = {}
    return {
      subscribe: (l) => {
        let listener = l as SubscriptionListener<
          LiveQueryChangeInfo<entityType>
        >
        if (typeof l === 'function') {
          listener = {
            next: l,
            complete: () => {},
            error: () => {},
          }
        }
        listener.error ??= () => {}
        listener.complete ??= () => {}
        return this.remult.liveQuerySubscriber.subscribe(
          this,
          options,
          listener,
        )
      },
    } as LiveQuery<entityType>
  }

  async find(
    options: FindOptions<entityType>,
    skipOrderByAndLimit = false,
  ): Promise<entityType[]> {
    Remult.onFind(this._info, options)
    if (!options) options = {}
    let opt = await this.buildEntityDataProviderFindOptions(options)
    if (skipOrderByAndLimit) {
      delete opt.orderBy
      delete opt.limit
    }

    let rawRows = await this.edp.find(opt)
    let result = await this.loadManyToOneForManyRows(rawRows, options.load)
    return result
  }

  async buildEntityDataProviderFindOptions(options: FindOptions<entityType>) {
    let opt: EntityDataProviderFindOptions = {}

    opt = {}
    if (!options.orderBy || Object.keys(options.orderBy).length === 0) {
      options.orderBy = this._info.entityInfo.defaultOrderBy
    }
    opt.where = await this.translateWhereToFilter(options.where)
    opt.orderBy = Sort.translateOrderByToSort(this.metadata, options.orderBy)

    opt.limit = options.limit
    opt.page = options.page
    return opt
  }
  async fromJsonArray(
    jsonItems: any[],
    load?: (entity: FieldsMetadata<entityType>) => FieldMetadata[],
  ) {
    return this.loadManyToOneForManyRows(
      jsonItems.map((row) => {
        let result = {}
        for (const col of this.metadata.fields.toArray()) {
          result[col.key] = col.valueConverter.fromJson(row[col.key])
        }
        return result
      }),
      load,
    )
  }
  private async loadManyToOneForManyRows(
    rawRows: any[],
    load?: (entity: FieldsMetadata<entityType>) => FieldMetadata[],
  ) {
    let loadFields: FieldMetadata[] = undefined
    if (load) loadFields = load(this.metadata.fields)

    for (const col of this.metadata.fields) {
      let ei = getEntitySettings(col.valueType, false)

      if (ei) {
        let load = !col.options.lazy
        if (loadFields !== undefined) load = loadFields.includes(col)
        if (load) {
          let repo = this.remult.repo(
            col.valueType,
          ) as RepositoryImplementation<any>
          let toLoad = []
          for (const r of rawRows) {
            let val = r[col.key]
            if (
              val !== undefined &&
              val !== null &&
              !toLoad.includes(val) &&
              !repo.idCache.has(val)
            ) {
              toLoad.push(val)
            }
          }
          if (toLoad.length > 0) {
            await loadManyToOne(repo, toLoad)
          }
        }
      }
    }
    async function loadManyToOne(
      repo: RepositoryImplementation<any>,
      toLoad: any[],
    ) {
      let rows = await repo.find(
        { where: repo.metadata.idMetadata.getIdFilter(...toLoad) },
        true,
      )
      for (const r of rows) {
        repo.addToCache(r)
      }
    }

    let result = await Promise.all(
      rawRows.map(async (r) => await this.mapRawDataToResult(r, loadFields)),
    )
    return result
  }

  private async mapRawDataToResult(r: any, loadFields: FieldMetadata[]) {
    if (!r) return undefined
    let x = new this.entity(this.remult)
    let helper = new rowHelperImplementation(
      this._info,
      x,
      this,
      this.edp,
      this.remult,
      false,
    )
    Object.defineProperty(x, entityMember, {
      //I've used define property to hide this member from console.lo g
      get: () => helper,
    })
    await helper.loadDataFrom(r, loadFields)
    helper.saveOriginalData()

    return x
  }

  toJson(
    item:
      | entityType
      | entityType[]
      | Promise<entityType>
      | Promise<entityType[]>,
  ) {
    if (item === undefined || item === null) return item
    if (Array.isArray(item)) return item.map((x) => this.toJson(x))
    if (typeof (item as Promise<any>).then === 'function')
      return (item as Promise<any>).then((x) => this.toJson(x))
    return (
      this.getEntityRef(
        item as entityType,
      ) as rowHelperImplementation<entityType>
    ).toApiJson(true)
  }

  fromJson(json: any, newRow?: boolean) {
    if (json === null || json === undefined) return json
    if (Array.isArray(json))
      return json.map((item) => this.fromJson(item, newRow))
    let result = new this.entity(this.remult)
    for (const col of this.fieldsOf(json)) {
      let ei = getEntitySettings(col.valueType, false)
      if (ei) {
        result[col.key] = this.remult
          .repo(col.valueType)
          .fromJson(json[col.key])
      } else {
        if (json[col.key] !== undefined) {
          result[col.key] = col.valueConverter.fromJson(json[col.key])
        }
      }
    }
    this.fixTypes(result)
    if (newRow) {
      return this.create(result)
    } else {
      let row = new rowHelperImplementation(
        this._info,
        result,
        this,
        this.edp,
        this.remult,
        false,
      )

      Object.defineProperty(result, entityMember, {
        //I've used define property to hide this member from console.lo g
        get: () => row,
      })
      row.saveOriginalData()
      return result as entityType
    }
  }

  async count(where?: EntityFilter<entityType>): Promise<number> {
    return this.edp.count(await this.translateWhereToFilter(where))
  }
  private cache = new Map<string, cacheEntityInfo<entityType>>()
  async findFirst(
    where?: EntityFilter<entityType>,
    options?: FindFirstOptions<entityType>,
    skipOrderByAndLimit = false,
  ): Promise<entityType> {
    if (!options) options = {}
    if (where) {
      if (options.where) {
        let w = options.where
        options.where = {
          $and: [w, where],
        } as EntityFilter<entityType>
      } else options.where = where
    }

    let r: Promise<entityType>
    let cacheInfo: cacheEntityInfo<entityType>
    if (options.useCache) {
      let f = findOptionsToJson(options, this.metadata)
      let key = JSON.stringify(f)
      cacheInfo = this.cache.get(key)
      if (cacheInfo !== undefined) {
        if (
          cacheInfo.value &&
          this.getEntityRef(cacheInfo.value).wasDeleted()
        ) {
          cacheInfo = undefined
          this.cache.delete(key)
        } else return this.cache.get(key).promise
      } else {
        cacheInfo = {
          value: undefined,
          promise: undefined,
        }
        this.cache.set(key, cacheInfo)
      }
    }

    r = this.find({ ...options, limit: 1 }, skipOrderByAndLimit).then(
      async (items) => {
        let r: entityType = undefined
        if (items.length > 0) r = items[0]
        if (!r && options.createIfNotFound) {
          r = this.create()
          if (options.where) {
            await __updateEntityBasedOnWhere(this.metadata, options.where, r)
          }
        }
        return r
      },
    )
    if (cacheInfo) {
      cacheInfo.promise = r = r.then((r) => {
        cacheInfo.value = r
        return r
      })
    }
    return r
  }

  private fieldsOf(item: any) {
    let keys = Object.keys(item)
    return this.metadata.fields.toArray().filter((x) => keys.includes(x.key))
  }

  create(item?: Partial<OmitEB<entityType>>): entityType {
    let r = new this.entity(this.remult)
    if (item) {
      for (const field of this.fieldsOf(item)) {
        r[field.key] = item[field.key]
      }
      this.fixTypes(r)
    }
    let z = this.getEntityRef(r)

    return r
  }
  async fixTypes(item: any) {
    for (const field of this.fieldsOf(item)) {
      const val = item[field.key]
      if (val !== null && val !== undefined) {
        if (field.valueType === Date && !(val instanceof Date))
          item[field.key] = field.valueConverter.fromJson(
            field.valueConverter.toJson(val),
          )
        else
          for (const [type, typeName] of [
            [String, 'string'],
            [Number, 'number'],
            [Boolean, 'boolean'],
          ]) {
            if (field.valueType === type && typeof val !== typeName)
              item[field.key] = field.valueConverter.fromJson(
                field.valueConverter.toJson(val),
              )
          }
      }
    }
    return item
  }

  findId(
    id: any,
    options?: FindFirstOptionsBase<entityType>,
  ): Promise<entityType> {
    if (id === null || id === undefined) return null
    if (typeof id !== 'string' && typeof id !== 'number')
      throw new Error(
        'id can be either number or string, but got: ' + typeof id,
      )
    return this.findFirst(
      {},
      {
        useCache: true,
        ...options,
        where: this.metadata.idMetadata.getIdFilter(id),
      },
      true,
    )
  }

  /* @internal*/
  async translateWhereToFilter(
    where: EntityFilter<entityType>,
  ): Promise<Filter> {
    if (this.metadata.options.backendPrefilter && !this.dataProvider.isProxy) {
      let z = where
      where = {
        $and: [z, await Filter.resolve(this.metadata.options.backendPrefilter)],
      } as EntityFilter<entityType>
    }
    let r = await Filter.fromEntityFilter(this.metadata, where)
    if (r && !this.dataProvider.isProxy) {
      r = await Filter.translateCustomWhere(r, this.metadata, this.remult)
    }
    return r
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

export type EntityOptionsFactory = (remult: Remult) => EntityOptions

export const entityInfo = Symbol('entityInfo')
export const entityInfo_key = Symbol('entityInfo_key')
const entityMember = Symbol('entityMember')
export function getEntitySettings<T>(
  entity: ClassType<T>,
  throwError = true,
): EntityOptionsFactory {
  if (entity === undefined)
    if (throwError) {
      throw new Error('Undefined is not an entity :)')
    } else return undefined
  let info: EntityOptionsFactory = Reflect.getMetadata(entityInfo, entity)
  if (!info && throwError)
    throw new Error(
      entity.prototype.constructor.name +
        " is not a known entity, did you forget to set @Entity() or did you forget to add the '@' before the call to Entity?",
    )

  return info
}
export function getEntityKey(entity: ClassType<any>): string {
  return Reflect.getMetadata(entityInfo_key, entity)
}
export const columnsOfType = new Map<any, columnInfo[]>()
export function createOldEntity<T>(entity: ClassType<T>, remult: Remult) {
  let r: columnInfo[] = columnsOfType.get(entity)
  if (!r) columnsOfType.set(entity, (r = []))

  let info = getEntitySettings(entity)(remult)
  let key = getEntityKey(entity)

  let base = Object.getPrototypeOf(entity)
  while (base != null) {
    let baseCols = columnsOfType.get(base)
    if (baseCols) {
      r.unshift(...baseCols.filter((x) => !r.find((y) => y.key == x.key)))
    }

    let baseSettingsFactory = getEntitySettings(base, false)
    if (baseSettingsFactory) {
      let baseSettings = baseSettingsFactory(remult)
      info = { ...baseSettings, ...info }
      let functions: (keyof EntityOptions)[] = [
        'saving',
        'saved',
        'deleting',
        'deleted',
        'validation',
      ]
      for (const key of functions as string[]) {
        if (baseSettings[key] && baseSettings[key] !== info[key]) {
          let x = info[key]
          info[key] = async (a, b) => {
            await x(a, b)
            await baseSettings[key](a, b)
          }
        }
      }
    }
    base = Object.getPrototypeOf(base)
  }

  return new EntityFullInfo<T>(
    prepareColumnInfo(r, remult),
    info,
    remult,
    entity,
    key,
  )
}

abstract class rowHelperBase<T> {
  _error: string
  get error() {
    this._subscribers?.reportObserved()
    return this._error
  }
  set error(val: string) {
    this._error = val
    this._subscribers?.reportChanged()
  }
  constructor(
    protected columnsInfo: FieldOptions[],
    protected instance: T,
    protected remult: Remult,
  ) {
    {
      let fac = remult as RemultProxy
      if (fac != null && fac.remultFactory) {
        remult = fac.remultFactory()
      }
    }
    for (const col of columnsInfo) {
      let ei = getEntitySettings(col.valueType, false)

      if (ei && remult) {
        let lookup = new LookupColumn(
          remult.repo(col.valueType) as RepositoryImplementation<T>,
          undefined,
        )
        this.lookups.set(col.key, lookup)
        let val = instance[col.key]
        let refImpl: FieldRefImplementation<any, any>
        Object.defineProperty(instance, col.key, {
          get: () => {
            if (this._subscribers) {
              this._subscribers.reportObserved()
              if (!refImpl) {
                refImpl = this.fields.find(col.key) as FieldRefImplementation<
                  any,
                  any
                >
                if (!refImpl._subscribers) {
                  refImpl._subscribers = new SubscribableImp()
                }
              }
              refImpl._subscribers.reportObserved()
            }
            return lookup.item
          },
          set: (val) => {
            lookup.set(val)
            this._subscribers?.reportChanged()
            if (!refImpl) {
              refImpl = this.fields.find(col.key) as FieldRefImplementation<
                any,
                any
              >
              if (!refImpl._subscribers) {
                refImpl._subscribers = new SubscribableImp()
              }
            }
            refImpl._subscribers.reportChanged()
          },
          enumerable: true,
        })
        lookup.set(val)
      } else {
      }
    }
  }

  _subscribers: SubscribableImp
  subscribe(listener: RefSubscriber): Unsubscribe {
    this.initSubscribers()
    return this._subscribers.subscribe(listener)
  }
  _isLoading = false
  initSubscribers() {
    if (!this._subscribers) {
      this._subscribers = new SubscribableImp()
      for (const col of this.columnsInfo) {
        let ei = getEntitySettings(col.valueType, false)
        let refImpl = this.fields.find(col.key) as FieldRefImplementation<
          any,
          any
        >
        refImpl._subscribers = new SubscribableImp()
        if (ei && this.remult) {
        } else {
          let val = this.instance[col.key]

          Object.defineProperty(this.instance, col.key, {
            get: () => {
              this._subscribers.reportObserved()
              refImpl._subscribers.reportObserved()
              return val
            },
            set: (value) => {
              val = value
              this._subscribers.reportChanged()
              refImpl._subscribers.reportChanged()
            },
            enumerable: true,
          })
        }
      }
    }
  }

  get isLoading() {
    this._subscribers?.reportObserved()
    return this._isLoading
  }
  set isLoading(val: boolean) {
    this._isLoading = val
    this._subscribers?.reportChanged()
  }

  lookups = new Map<string, LookupColumn<any>>()
  async waitLoad() {
    await Promise.all([...this.lookups.values()].map((x) => x.waitLoad()))
  }
  errors: { [key: string]: string }
  protected __assertValidity() {
    if (!this.hasErrors()) throw this.buildErrorInfoObject()
  }
  buildErrorInfoObject() {
    let error: ErrorInfo = {
      modelState: Object.assign({}, this.errors),
      message: this.error,
    }
    if (!error.message) {
      for (const col of this.columnsInfo) {
        if (this.errors[col.key]) {
          error.message =
            this.fields[col.key].metadata.caption + ': ' + this.errors[col.key]
          this.error = error.message
          break
        }
      }
    }
    return error
  }

  abstract get fields(): FieldsRef<T>
  catchSaveErrors(err: any): any {
    let e = err

    if (e instanceof Promise) {
      return e.then((x) => this.catchSaveErrors(x))
    }
    if (e.error) {
      e = e.error
    }

    if (e.message) this.error = e.message
    else if (e.Message) this.error = e.Message
    else this.error = e
    let s = e.modelState
    if (!s) s = e.ModelState
    if (s) {
      this.errors = s
    }
    throw err
  }
  __clearErrorsAndReportChanged() {
    this.errors = undefined
    this.error = undefined
    this._reportChangedToEntityAndFields()
  }
  _reportChangedToEntityAndFields() {
    if (this._subscribers) {
      this._subscribers.reportChanged()
      for (const field of this.fields) {
        let ref = field as FieldRefImplementation<any, any>
        ref._subscribers.reportChanged()
      }
    }
  }
  hasErrors(): boolean {
    this._subscribers?.reportObserved()
    return !!!this.error && this.errors == undefined
  }
  copyDataToObject() {
    let d: any = {}
    for (const col of this.columnsInfo) {
      let lu = this.lookups.get(col.key)
      let val: any = undefined
      if (lu) val = lu.id
      else val = this.instance[col.key]
      if (val !== undefined) {
        val = col.valueConverter.toJson(val)
        if (val !== undefined && val !== null)
          val = col.valueConverter.fromJson(JSON.parse(JSON.stringify(val)))
      }
      d[col.key] = val
    }
    return d
  }
  originalValues: any = {}
  saveOriginalData() {
    this.originalValues = this.copyDataToObject()
    this.saveMoreOriginalData()
  }
  saveMoreOriginalData() {}
  async validate() {
    this.__clearErrorsAndReportChanged()
    if (classValidatorValidate)
      await classValidatorValidate(this.instance, this)
    await this.__performColumnAndEntityValidations()
    let r = this.hasErrors()
    if (!this.hasErrors()) return this.buildErrorInfoObject()
    else return undefined
  }
  async __validateEntity() {
    this.__clearErrorsAndReportChanged()
    if (classValidatorValidate)
      await classValidatorValidate(this.instance, this)
    await this.__performColumnAndEntityValidations()
    this.__assertValidity()
  }
  async __performColumnAndEntityValidations() {}
  toApiJson(includeRelatedEntities = false) {
    let result: any = {}
    for (const col of this.columnsInfo) {
      if (
        !this.remult ||
        col.includeInApi === undefined ||
        this.remult.isAllowed(col.includeInApi)
      ) {
        let val
        let lu = this.lookups.get(col.key)
        if (lu)
          if (includeRelatedEntities) val = lu.toJson()
          else val = lu.id
        else {
          val = this.instance[col.key]
          if (!this.remult) {
            if (val) {
              let eo = getEntitySettings(val.constructor, false)
              if (eo) {
                val = getEntityRef(val).getId()
              }
            }
          }
        }
        result[col.key] = col.valueConverter.toJson(val)
      }
    }
    return result
  }

  async _updateEntityBasedOnApi(body: any) {
    let keys = Object.keys(body)
    for (const col of this.columnsInfo) {
      if (keys.includes(col.key))
        if (
          col.includeInApi === undefined ||
          this.remult.isAllowed(col.includeInApi)
        ) {
          if (
            !this.remult ||
            col.allowApiUpdate === undefined ||
            this.remult.isAllowedForInstance(this.instance, col.allowApiUpdate)
          ) {
            let lu = this.lookups.get(col.key)
            if (lu) lu.id = body[col.key]
            else
              this.instance[col.key] = col.valueConverter.fromJson(
                body[col.key],
              )
          }
        }
    }
    await Promise.all([...this.fields].map((x) => x.load()))
  }
}

export class rowHelperImplementation<T>
  extends rowHelperBase<T>
  implements EntityRef<T>
{
  constructor(
    private info: EntityFullInfo<T>,
    instance: T,
    public repository: RepositoryImplementation<T>,
    private edp: EntityDataProvider,
    remult: Remult,
    private _isNew: boolean,
  ) {
    super(info.columnsInfo, instance, remult)
    this.metadata = info
    if (_isNew) {
      for (const col of info.columnsInfo) {
        if (col.defaultValue && instance[col.key] === undefined) {
          if (typeof col.defaultValue === 'function') {
            instance[col.key] = col.defaultValue(instance)
          } else if (!instance[col.key]) instance[col.key] = col.defaultValue
        }
      }
    }
    if (this.info.options.entityRefInit)
      this.info.options.entityRefInit(this, instance)
    if (Remult.entityRefInit) Remult.entityRefInit(this, instance)
  }
  get apiUpdateAllowed() {
    return this.remult.isAllowedForInstance(
      this.instance,
      this.metadata.options.allowApiUpdate,
    )
  }
  get apiDeleteAllowed() {
    return this.remult.isAllowedForInstance(
      this.instance,
      this.metadata.options.allowApiDelete,
    )
  }
  get apiInsertAllowed() {
    return this.remult.isAllowedForInstance(
      this.instance,
      this.metadata.options.allowApiInsert,
    )
  }
  metadata: EntityMetadata<T>
  getId() {
    return this.info.idMetadata.getId(this.instance)
  }
  saveMoreOriginalData() {
    this.originalId = this.getId()
  }

  private _wasDeleted = false

  wasDeleted(): boolean {
    this._subscribers?.reportObserved()
    return this._wasDeleted
  }

  undoChanges() {
    this.loadDataFrom(this.originalValues)
    this.__clearErrorsAndReportChanged()
  }
  async reload(): Promise<T> {
    await this.edp.find({ where: this.getIdFilter() }).then(async (newData) => {
      await this.loadDataFrom(newData[0])
      this.saveOriginalData()
    })
    this._reportChangedToEntityAndFields()
    return this.instance
  }

  private _columns: FieldsRef<T>

  get fields(): FieldsRef<T> {
    if (!this._columns) {
      let _items = []
      let r = {
        find: (c: FieldMetadata<T> | string) =>
          r[typeof c === 'string' ? c : c.key],
        [Symbol.iterator]: () => _items[Symbol.iterator](),
        toArray: () => _items,
      }
      for (const c of this.info.columnsInfo) {
        _items.push(
          (r[c.key] = new FieldRefImplementation(
            c,
            this.info.fields[c.key],
            this.instance,
            this,
            this,
          )),
        )
      }

      this._columns = r as unknown as FieldsRef<T>
    }
    return this._columns
  }
  private _saving = false
  async save(onlyTheseFieldsSentOnlyInTheCaseOfProxySaveWithPartialObject?: string[]): Promise<T> {
    try {
      if (this._saving)
        throw new Error('cannot save while entity is already saving')
      this._saving = true
      if (this.wasDeleted()) throw new Error('cannot save a deleted row')
      this.isLoading = true
      if (onlyTheseFieldsSentOnlyInTheCaseOfProxySaveWithPartialObject===undefined) // no need
      await this.__validateEntity()
      let doNotSave = false
      for (const col of this.fields) {
        if (col.metadata.options.saving)
          await col.metadata.options.saving(this.instance, col)
      }
      if (this.info.entityInfo.saving) {
        await this.info.entityInfo.saving(
          this.instance,
          () => (doNotSave = true),
        )
      }

      this.__assertValidity()

      let d = this.copyDataToObject()
      let ignoreKeys = []
      for (const field of this.metadata.fields) {
        if (
          field.dbReadOnly ||
          (onlyTheseFieldsSentOnlyInTheCaseOfProxySaveWithPartialObject !== undefined &&
            !onlyTheseFieldsSentOnlyInTheCaseOfProxySaveWithPartialObject.includes(field.key))
        ) {
          d[field.key] = undefined
          ignoreKeys.push(field.key)
          let f = this.fields.find(field)
          f.value = f.originalValue
        }
      }

      if (this.info.idMetadata.field instanceof CompoundIdField) delete d.id
      let updatedRow: any
      let isNew = this.isNew()
      try {
        this._subscribers?.reportChanged()
        if (this.isNew()) {
          updatedRow = await this.edp.insert(d)
        } else {
          let changesOnly = {}
          let wasChanged = false
          for (const key in d) {
            if (Object.prototype.hasOwnProperty.call(d, key)) {
              const element = d[key]
              if (
                this.fields.find(key).valueChanged() &&
                !ignoreKeys.includes(key)
              ) {
                changesOnly[key] = element
                wasChanged = true
              }
            }
          }
          if (!wasChanged) return this.instance
          if (doNotSave) {
            updatedRow = (await this.edp.find({ where: this.getIdFilter() }))[0]
          } else {
            updatedRow = await this.edp.update(this.id, changesOnly)
          }
        }
        await this.loadDataFrom(updatedRow)

        if (this.info.entityInfo.saved)
          await this.info.entityInfo.saved(this.instance)
        if (this.repository.listeners)
          for (const listener of this.repository.listeners.filter(
            (x) => x.saved,
          )) {
            await listener.saved(this.instance, isNew)
          }

        await this.repository.remult.liveQueryPublisher.itemChanged(
          this.repository.metadata.key,
          [{ id: this.getId(), oldId: this.getOriginalId(), deleted: false }],
        )
        this.saveOriginalData()
        this._isNew = false
        return this.instance
      } catch (err) {
        await this.catchSaveErrors(err)
      }
    } finally {
      this.isLoading = false
      this._reportChangedToEntityAndFields()
      this._saving = false
    }
  }

  private getIdFilter(): Filter {
    return Filter.fromEntityFilter(
      this.metadata,
      this.repository.metadata.idMetadata.getIdFilter(this.id),
    )
  }

  async delete() {
    this.__clearErrorsAndReportChanged()
    if (this.info.entityInfo.deleting)
      await this.info.entityInfo.deleting(this.instance)
    this.__assertValidity()

    try {
      await this.edp.delete(this.id)
      if (this.info.entityInfo.deleted)
        await this.info.entityInfo.deleted(this.instance)

      if (this.repository.listeners)
        for (const listener of this.repository.listeners.filter(
          (x) => x.deleted,
        )) {
          await listener.deleted(this.instance)
        }
      await this.repository.remult.liveQueryPublisher.itemChanged(
        this.repository.metadata.key,
        [{ id: this.getId(), oldId: this.getOriginalId(), deleted: true }],
      )

      this._wasDeleted = true
    } catch (err) {
      await this.catchSaveErrors(err)
    }
  }

  async loadDataFrom(data: any, loadItems?: FieldMetadata[]) {
    for (const col of this.info.fields) {
      let lu = this.lookups.get(col.key)
      if (lu) {
        lu.id = data[col.key]
        if (loadItems === undefined) {
          if (!col.options.lazy) await lu.waitLoad()
        } else {
          if (loadItems.includes(col)) await lu.waitLoad()
        }
      } else this.instance[col.key] = data[col.key]
    }
    await this.calcServerExpression()
    this.id = this.getId()
  }
  id
  originalId
  public getOriginalId() {
    return this.originalId
  }

  private async calcServerExpression() {
    if (isBackend())
      for (const col of this.info.columnsInfo) {
        if (col.serverExpression) {
          this.instance[col.key] = await col.serverExpression(this.instance)
        }
      }
  }

  isNew(): boolean {
    this._subscribers?.reportObserved()
    return this._isNew
  }
  wasChanged(): boolean {
    this._subscribers?.reportObserved()
    for (const col of this.fields) {
      if (col.valueChanged()) return true
    }
    return false
  }

  async __performColumnAndEntityValidations() {
    for (const c of this.columnsInfo) {
      if (c.validate) {
        let col = new FieldRefImplementation(
          c,
          this.info.fields[c.key],
          this.instance,
          this,
          this,
        )
        await col.__performValidation()
      }
    }

    if (this.info.entityInfo.validation)
      await this.info.entityInfo.validation(this.instance, this)
    if (this.repository.listeners)
      for (const listener of this.repository.listeners.filter(
        (x) => x.validating,
      )) {
        await listener.validating(this.instance)
      }
  }
}
const controllerColumns = Symbol('controllerColumns')
function prepareColumnInfo(r: columnInfo[], remult: Remult): FieldOptions[] {
  return r.map((x) => decorateColumnSettings(x.settings(remult), remult))
}

export function getFields<fieldsContainerType>(
  container: fieldsContainerType,
  remult?: Remult,
): FieldsRef<fieldsContainerType> {
  return getControllerRef(container, remult).fields
}
export function getControllerRef<fieldsContainerType>(
  container: fieldsContainerType,
  remultArg?: Remult,
): ControllerRef<fieldsContainerType> {
  const remultVar = remultArg || defaultRemult
  let result = container[
    controllerColumns
  ] as controllerRefImpl<fieldsContainerType>
  if (!result) result = container[entityMember]
  if (!result) {
    let columnSettings: columnInfo[] = columnsOfType.get(container.constructor)
    if (!columnSettings)
      columnsOfType.set(container.constructor, (columnSettings = []))
    let base = Object.getPrototypeOf(container.constructor)
    while (base != null) {
      let baseCols = columnsOfType.get(base)
      if (baseCols) {
        columnSettings.unshift(
          ...baseCols.filter(
            (x) => !columnSettings.find((y) => y.key == x.key),
          ),
        )
      }
      base = Object.getPrototypeOf(base)
    }

    container[controllerColumns] = result = new controllerRefImpl(
      prepareColumnInfo(columnSettings, remultVar),
      container,
      remultVar,
    )
  }
  return result
}

export class controllerRefImpl<T = any>
  extends rowHelperBase<T>
  implements ControllerRef<T>
{
  constructor(columnsInfo: FieldOptions[], instance: any, remult: Remult) {
    super(columnsInfo, instance, remult)

    let _items = []
    let r = {
      find: (c: FieldMetadata<T> | string) =>
        r[typeof c === 'string' ? c : c.key],
      [Symbol.iterator]: () => _items[Symbol.iterator](),
      toArray: () => _items,
    }

    for (const col of columnsInfo) {
      _items.push(
        (r[col.key] = new FieldRefImplementation<any, any>(
          col,
          new columnDefsImpl(col, undefined, remult),
          instance,
          undefined,
          this,
        )),
      )
    }

    this.fields = r as unknown as FieldsRef<T>
  }
  async __performColumnAndEntityValidations() {
    for (const col of this.fields) {
      if (col instanceof FieldRefImplementation) {
        await col.__performValidation()
      }
    }
  }
  fields: FieldsRef<T>
}
export class FieldRefImplementation<entityType, valueType>
  implements FieldRef<entityType, valueType>
{
  constructor(
    private settings: FieldOptions,
    public metadata: FieldMetadata,
    public container: any,
    private helper: EntityRef<entityType>,
    private rowBase: rowHelperBase<entityType>,
  ) {
    this.target = this.settings.target
    this.entityRef = this.helper
  }
  _subscribers: SubscribableImp
  subscribe(listener: RefSubscriber): Unsubscribe {
    if (!this._subscribers) {
      this.rowBase.initSubscribers()
    }
    return this._subscribers.subscribe(listener)
  }
  valueIsNull(): boolean {
    this.reportObserved()
    let lu = this.rowBase.lookups.get(this.metadata.key)
    if (lu) {
      return lu.id === undefined || lu.id === null
    }
    return this.value === null
  }
  originalValueIsNull(): boolean {
    this.reportObserved()
    let lu = this.rowBase.lookups.get(this.metadata.key)
    return this.rawOriginalValue() === null
  }
  async load(): Promise<valueType> {
    let lu = this.rowBase.lookups.get(this.metadata.key)
    if (lu) {
      if (this.valueChanged()) {
        await lu.waitLoadOf(this.rawOriginalValue())
      }
      return await lu.waitLoad()
    }
    return this.value
  }
  target: ClassType<any>

  reportObserved() {
    this._subscribers?.reportObserved()
    this.rowBase._subscribers?.reportObserved()
  }
  reportChanged() {
    this._subscribers?.reportChanged()
    this.rowBase._subscribers?.reportChanged()
  }

  get error(): string {
    this.reportObserved()
    if (!this.rowBase.errors) return undefined
    return this.rowBase.errors[this.metadata.key]
  }
  set error(error: string) {
    if (!this.rowBase.errors) this.rowBase.errors = {}
    this.rowBase.errors[this.metadata.key] = error
    this.reportChanged()
  }
  get displayValue(): string {
    this.reportObserved()
    if (this.value != undefined) {
      if (this.settings.displayValue)
        return this.settings.displayValue(this.container, this.value)
      else if (this.metadata.valueConverter.displayValue)
        return this.metadata.valueConverter.displayValue(this.value)
      else return this.value.toString()
    }
    return ''
  }
  get value() {
    return this.container[this.metadata.key]
  }
  set value(value: any) {
    this.container[this.metadata.key] = value
  }
  get originalValue(): any {
    this.reportObserved()
    let lu = this.rowBase.lookups.get(this.metadata.key)
    if (lu) return lu.get(this.rawOriginalValue())
    return this.rowBase.originalValues[this.metadata.key]
  }
  private rawOriginalValue(): any {
    return this.rowBase.originalValues[this.metadata.key]
  }
  setId(id: string | number) {
    this.value = id
  }
  getId() {
    let lu = this.rowBase.lookups.get(this.metadata.key)
    if (lu) return lu.id != undefined ? lu.id : null
    return this.value
  }

  get inputValue(): string {
    this.reportObserved()
    let lu = this.rowBase.lookups.get(this.metadata.key)
    if (lu) return lu.id != undefined ? lu.id.toString() : null
    return this.metadata.valueConverter.toInput(
      this.value,
      this.settings.inputType,
    )
  }
  set inputValue(val: string) {
    let lu = this.rowBase.lookups.get(this.metadata.key)
    if (lu) {
      lu.setId(val)
    } else
      this.value = this.metadata.valueConverter.fromInput(
        val,
        this.settings.inputType,
      )
  }
  valueChanged(): boolean {
    this.reportObserved()
    let val = this.value
    let lu = this.rowBase.lookups.get(this.metadata.key)
    if (lu) {
      val = lu.id
    }
    return (
      JSON.stringify(
        this.metadata.valueConverter.toJson(
          this.rowBase.originalValues[this.metadata.key],
        ),
      ) != JSON.stringify(this.metadata.valueConverter.toJson(val))
    )
  }
  entityRef: EntityRef<any>

  async __performValidation() {
    try {
      let x = typeof this.settings.validate
      if (Array.isArray(this.settings.validate)) {
        for (const v of this.settings.validate) {
          await v(this.container, this)
        }
      } else if (typeof this.settings.validate === 'function')
        await this.settings.validate(this.container, this)
    } catch (error) {
      if (typeof error === 'string') this.error = error
      else this.error = error.message
    }
  }
  async validate() {
    await this.__performValidation()
    return !!!this.error
  }
}

export function getEntityRef<entityType>(
  entity: entityType,
  throwException = true,
): EntityRef<entityType> {
  let x = entity[entityMember]
  if (!x && throwException)
    throw new Error(
      'item ' +
        entity.constructor.name +
        ' was not initialized using a context',
    )
  return x
}
export const CaptionTransformer = {
  transformCaption: (remult: Remult, key: string, caption: string) => caption,
}
export function buildCaption(
  caption: string | ((remult: Remult) => string),
  key: string,
  remult: Remult,
): string {
  let result: string
  if (typeof caption === 'function') {
    if (remult) result = caption(remult)
  } else if (caption) result = caption
  result = CaptionTransformer.transformCaption(remult, key, result)
  if (result) return result
  if (key) return makeTitle(key)
  return ''
}

export class columnDefsImpl implements FieldMetadata {
  constructor(
    private settings: FieldOptions,
    private entityDefs: EntityFullInfo<any>,
    private remult: Remult,
  ) {
    this.options = this.settings
    this.target = this.settings.target
    this.valueConverter = this.settings.valueConverter as Required<
      ValueConverter<any>
    >
    this.allowNull = !!this.settings.allowNull
    this.valueType = this.settings.valueType
    this.key = this.settings.key
    this.inputType = this.settings.inputType
    if (settings.serverExpression) this.isServerExpression = true
    if (typeof this.settings.allowApiUpdate === 'boolean')
      this.readonly = this.settings.allowApiUpdate
    if (!this.inputType) this.inputType = this.valueConverter.inputType
    this.caption = buildCaption(settings.caption, settings.key, remult)
  }
  apiUpdateAllowed(item?: any): boolean {
    if (this.options.allowApiUpdate === undefined) return true
    return this.remult.isAllowedForInstance(item, this.options.allowApiUpdate)
  }

  displayValue(item: any): string {
    return this.entityDefs
      .getEntityMetadataWithoutBreakingTheEntity(item)
      .fields.find(this.key).displayValue
  }
  get includedInApi() {
    if (this.options.includeInApi === undefined) return true
    return this.remult.isAllowed(this.options.includeInApi) //TODO 2- consolidate other code paths to go through here
  }
  toInput(value: any, inputType?: string): string {
    return this.valueConverter.toInput(value, inputType)
  }
  fromInput(inputValue: string, inputType?: string): any {
    return this.valueConverter.fromInput(inputValue, inputType)
  }

  async getDbName() {
    try {
      if (this.settings.sqlExpression) {
        let result: string
        if (typeof this.settings.sqlExpression === 'function') {
          result = await this.settings.sqlExpression(this.entityDefs)
        } else result = this.settings.sqlExpression
        if (!result) return this.settings.dbName
        return result
      }
      return this.settings.dbName
    } finally {
    }
  }
  options: FieldOptions<any, any>
  target: ClassType<any>
  readonly: boolean

  valueConverter: Required<ValueConverter<any>>
  allowNull: boolean

  caption: string
  get dbName() {
    let result
    if (this.settings.sqlExpression) {
      if (typeof this.settings.sqlExpression === 'function') {
        result = this.settings.sqlExpression(this.entityDefs)
      } else result = this.settings.sqlExpression
    }
    if (result) return result
    return this.settings.dbName
  }
  inputType: string
  key: string
  get dbReadOnly() {
    return this.settings.dbReadOnly
  }
  isServerExpression: boolean
  valueType: any
}
class EntityFullInfo<T> implements EntityMetadata<T> {
  options: EntityOptions<T>

  constructor(
    public columnsInfo: FieldOptions[],
    public entityInfo: EntityOptions,
    private remult: Remult,
    public readonly entityType: ClassType<T>,
    public readonly key: string,
  ) {
    this.options = entityInfo
    if (this.options.allowApiCrud !== undefined) {
      let crud: AllowedForInstance<T>
      if (typeof this.options.allowApiCrud === 'function')
        crud = (_, remult) => (this.options.allowApiCrud as Function)(remult)
      else crud = this.options.allowApiCrud as AllowedForInstance<T>
      if (this.options.allowApiDelete === undefined)
        this.options.allowApiDelete = crud
      if (this.options.allowApiInsert === undefined)
        this.options.allowApiInsert = crud
      if (this.options.allowApiUpdate === undefined)
        this.options.allowApiUpdate = crud
      if (this.options.allowApiRead === undefined)
        this.options.allowApiRead = this.options.allowApiCrud
    }
    if (this.options.allowApiRead === undefined)
      this.options.allowApiRead = true
    if (!this.key) this.key = entityType.name
    if (!entityInfo.dbName) entityInfo.dbName = this.key

    let _items = []
    let r = {
      find: (c: FieldMetadata<any> | string) =>
        r[typeof c === 'string' ? c : c.key],
      [Symbol.iterator]: () => _items[Symbol.iterator](),
      toArray: () => _items,
    }

    for (const x of columnsInfo) {
      _items.push((r[x.key] = new columnDefsImpl(x, this, remult)))
    }

    this.fields = r as unknown as FieldsMetadata<T>

    this.caption = buildCaption(entityInfo.caption, this.key, remult)

    if (entityInfo.id) {
      let r = entityInfo.id(this.fields)
      if (Array.isArray(r)) {
        if (r.length > 1) this.idMetadata.field = new CompoundIdField(...r)
        else if (r.length == 1) this.idMetadata.field = r[0]
      } else this.idMetadata.field = r
    } else {
      if (this.fields['id']) this.idMetadata.field = this.fields['id']
      else this.idMetadata.field = [...this.fields][0]
    }
  }
  apiUpdateAllowed(item: T) {
    if (this.options.allowApiUpdate === undefined) return false
    return !item
      ? this.remult.isAllowedForInstance(undefined, this.options.allowApiUpdate)
      : this.getEntityMetadataWithoutBreakingTheEntity(item).apiUpdateAllowed
  }
  get apiReadAllowed() {
    if (this.options.allowApiRead === undefined) return true //TODO2 - consider that this default may be confusing, since it's different from all others.
    return this.remult.isAllowed(this.options.allowApiRead)
  }
  apiDeleteAllowed(item: T) {
    if (this.options.allowApiDelete === undefined) return false
    return !item
      ? this.remult.isAllowedForInstance(undefined, this.options.allowApiDelete)
      : this.getEntityMetadataWithoutBreakingTheEntity(item).apiDeleteAllowed
  }

  apiInsertAllowed(item: T) {
    if (this.options.allowApiUpdate === undefined) return false
    return !item
      ? this.remult.isAllowedForInstance(undefined, this.options.allowApiInsert)
      : this.getEntityMetadataWithoutBreakingTheEntity(item).apiInsertAllowed
  }

  getEntityMetadataWithoutBreakingTheEntity(item: T) {
    let result = getEntityRef(item, false)
    if (result) return result
    return this.remult.repo(this.entityType).getEntityRef({ ...item })
  }
  dbNamePromise: Promise<string>
  getDbName(): Promise<string> {
    if (this.dbNamePromise) return this.dbNamePromise
    if (!this.options.sqlExpression) {
      this.dbNamePromise = Promise.resolve(this.options.dbName)
    }
    if (typeof this.options.sqlExpression === 'string')
      this.dbNamePromise = Promise.resolve(this.options.sqlExpression)
    else if (typeof this.options.sqlExpression === 'function') {
      let r = this.options.sqlExpression(this)
      if (r instanceof Promise) this.dbNamePromise = r
      else if (r) this.dbNamePromise = Promise.resolve(r)
    }
    this.dbNamePromise = this.dbNamePromise.then((x) => {
      if (!x) return this.options.dbName
      return x
    })
    return this.dbNamePromise
  }

  idMetadata: IdMetadata<T> = {
    getId: (item) => {
      if (this.idMetadata.field instanceof CompoundIdField)
        return this.idMetadata.field.getId(item)
      else return item[this.idMetadata.field.key]
    },
    field: undefined,
    createIdInFilter: (items: T[]): EntityFilter<any> => {
      if (items.length > 0)
        return {
          $or: items.map((x) =>
            this.idMetadata.getIdFilter(getEntityRef(x).getId()),
          ),
        }
    },
    isIdField: (col: FieldMetadata<any>): boolean => {
      return col.key == this.idMetadata.field.key
    },
    getIdFilter: (...ids: any[]): EntityFilter<any> => {
      if (this.idMetadata.field instanceof CompoundIdField) {
        let field = this.idMetadata.field
        return {
          $or: ids.map((x) => field.isEqualTo(x)),
        }
      }
      if (ids.length == 1)
        return {
          [this.idMetadata.field.key]: ids[0],
        }
      else
        return {
          [this.idMetadata.field.key]: ids,
        }
    },
  }

  fields: FieldsMetadata<T>

  dbName: string
  caption: string
}

export function FieldType<valueType = any>(
  ...options: (
    | FieldOptions<any, valueType>
    | ((options: FieldOptions<any, valueType>, remult: Remult) => void)
  )[]
) {
  return (target, context?) => {
    if (!options) {
      options = []
    }
    options.splice(0, 0, { valueType: target })

    Reflect.defineMetadata(storableMember, options, target)
    return target
  }
}

export class Fields {
  /**
   * Stored as a JSON.stringify - to store as json use Fields.json
   */
  static object<entityType = any, valueType = any>(
    ...options: (
      | FieldOptions<entityType, valueType>
      | ((options: FieldOptions<entityType, valueType>, remult: Remult) => void)
    )[]
  ): (
    target: any,
    context:
      | string
      | ClassFieldDecoratorContextStub<entityType, valueType | undefined>,
    c?: any,
  ) => void {
    return Field(undefined, ...options)
  }
  static json<entityType = any, valueType = any>(
    ...options: (
      | FieldOptions<entityType, valueType>
      | ((options: FieldOptions<entityType, valueType>, remult: Remult) => void)
    )[]
  ): (
    target: any,
    context:
      | string
      | ClassFieldDecoratorContextStub<entityType, valueType | undefined>,
    c?: any,
  ) => void {
    return Field(
      undefined,
      {
        valueConverter: {
          fieldTypeInDb: 'json',
        },
      },
      ...options,
    )
  }
  static dateOnly<entityType = any>(
    ...options: (
      | FieldOptions<entityType, Date>
      | ((options: FieldOptions<entityType, Date>, remult: Remult) => void)
    )[]
  ): (
    target: any,
    context:
      | string
      | ClassFieldDecoratorContextStub<entityType, Date | undefined>,
    c?: any,
  ) => void {
    return Field(
      () => Date,
      {
        valueConverter: ValueConverters.DateOnly,
      },
      ...options,
    )
  }
  static date<entityType = any>(
    ...options: (
      | FieldOptions<entityType, Date>
      | ((options: FieldOptions<entityType, Date>, remult: Remult) => void)
    )[]
  ): (
    target: any,
    context:
      | string
      | ClassFieldDecoratorContextStub<entityType, Date | undefined>,
    c?: any,
  ) => void {
    return Field(() => Date, ...options)
  }
  static integer<entityType = any>(
    ...options: (
      | FieldOptions<entityType, Number>
      | ((options: FieldOptions<entityType, Number>, remult: Remult) => void)
    )[]
  ): (
    target: any,
    context:
      | string
      | ClassFieldDecoratorContextStub<entityType, number | undefined>,
    c?: any,
  ) => void {
    return Field(
      () => Number,
      {
        valueConverter: ValueConverters.Integer,
      },
      ...options,
    )
  }
  static autoIncrement<entityType = any>(
    ...options: (
      | FieldOptions<entityType, Number>
      | ((options: FieldOptions<entityType, Number>, remult: Remult) => void)
    )[]
  ): (
    target: any,
    context:
      | string
      | ClassFieldDecoratorContextStub<entityType, number | undefined>,
    c?: any,
  ) => void {
    return Field(
      () => Number,
      {
        allowApiUpdate: false,
        dbReadOnly: true,
        valueConverter: {
          ...ValueConverters.Integer,
          fieldTypeInDb: 'autoincrement',
        },
      },
      ...options,
    )
  }

  static number<entityType = any>(
    ...options: (
      | FieldOptions<entityType, Number>
      | ((options: FieldOptions<entityType, Number>, remult: Remult) => void)
    )[]
  ): (
    target: any,
    context:
      | string
      | ClassFieldDecoratorContextStub<entityType, number | undefined>,
    c?: any,
  ) => void {
    return Field(() => Number, ...options)
  }
  static createdAt<entityType = any>(
    ...options: (
      | FieldOptions<entityType, Date>
      | ((options: FieldOptions<entityType, Date>, remult: Remult) => void)
    )[]
  ): (
    target: any,
    context:
      | string
      | ClassFieldDecoratorContextStub<entityType, Date | undefined>,
    c?: any,
  ) => void {
    return Field(
      () => Date,
      {
        allowApiUpdate: false,
        saving: (_, ref) => {
          if (getEntityRef(_).isNew()) ref.value = new Date()
        },
      },
      ...options,
    )
  }
  static updatedAt<entityType = any>(
    ...options: (
      | FieldOptions<entityType, Date>
      | ((options: FieldOptions<entityType, Date>, remult: Remult) => void)
    )[]
  ): (
    target: any,
    context:
      | string
      | ClassFieldDecoratorContextStub<entityType, Date | undefined>,
    c?: any,
  ) => void {
    return Field(
      () => Date,
      {
        allowApiUpdate: false,
        saving: (_, ref) => {
          ref.value = new Date()
        },
      },
      ...options,
    )
  }

  static uuid<entityType = any>(
    ...options: (
      | FieldOptions<entityType, string>
      | ((options: FieldOptions<entityType, string>, remult: Remult) => void)
    )[]
  ): (
    target: any,
    context:
      | string
      | ClassFieldDecoratorContextStub<entityType, string | undefined>,
    c?: any,
  ) => void {
    return Field(
      () => String,
      {
        allowApiUpdate: false,
        defaultValue: () => uuid(),
        saving: (_, r) => {
          if (!r.value) r.value = uuid()
        },
      },
      ...options,
    )
  }
  static cuid<entityType = any>(
    ...options: (
      | FieldOptions<entityType, string>
      | ((options: FieldOptions<entityType, string>, remult: Remult) => void)
    )[]
  ): (
    target: any,
    context:
      | string
      | ClassFieldDecoratorContextStub<entityType, string | undefined>,
    c?: any,
  ) => void {
    return Field(
      () => String,
      {
        allowApiUpdate: false,
        defaultValue: () => createId(),
        saving: (_, r) => {
          if (!r.value) r.value = createId()
        },
      },
      ...options,
    )
  }
  static string<entityType = any>(
    ...options: (
      | StringFieldOptions<entityType>
      | ((options: StringFieldOptions<entityType>, remult: Remult) => void)
    )[]
  ): (
    target: any,
    context:
      | string
      | ClassFieldDecoratorContextStub<entityType, string | undefined>,
    c?: any,
  ) => void {
    return Field(() => String, ...options)
  }
  static boolean<entityType = any>(
    ...options: (
      | FieldOptions<entityType, boolean>
      | ((options: FieldOptions<entityType, boolean>, remult: Remult) => void)
    )[]
  ): (
    target: any,
    context:
      | string
      | ClassFieldDecoratorContextStub<entityType, boolean | undefined>,
    c?: any,
  ) => void {
    return Field(() => Boolean, ...options)
  }
}

export function isAutoIncrement(f: FieldMetadata) {
  return f.options?.valueConverter?.fieldTypeInDb === 'autoincrement'
}
export interface StringFieldOptions<entityType = any>
  extends FieldOptions<entityType, string> {
  maxLength?: number
}
export function ValueListFieldType<valueType extends ValueListItem = any>(
  ...options: (
    | ValueListFieldOptions<any, valueType>
    | ((options: FieldOptions<any, valueType>, remult: Remult) => void)
  )[]
) {
  return (type: ClassType<valueType>, context?) => {
    FieldType<valueType>(
      (o) => {
        ;(o.valueConverter = ValueListInfo.get(type)),
          (o.displayValue = (item, val) => val?.caption)
      },
      ...options,
    )(type, context)
  }
}
export interface ValueListFieldOptions<entityType, valueType>
  extends FieldOptions<entityType, valueType> {
  getValues?: () => valueType[]
}
export class ValueListInfo<T extends ValueListItem>
  implements ValueConverter<T>
{
  static get<T extends ValueListItem>(type: ClassType<T>): ValueListInfo<T> {
    let r = typeCache.get(type)
    if (!r) {
      r = new ValueListInfo(type)
      typeCache.set(type, r)
    }
    return r
  }
  private byIdMap = new Map<any, T>()
  private values: T[] = []
  isNumeric = false
  private constructor(private valueListType: any) {
    for (let member in this.valueListType) {
      let s = this.valueListType[member] as T
      if (s instanceof this.valueListType) {
        if (s.id === undefined) s.id = member
        if (typeof s.id === 'number') this.isNumeric = true
        if (s.caption === undefined)
          s.caption = makeTitle(s.id !== undefined ? s.id.toString() : member)
        this.byIdMap.set(s.id, s)
        this.values.push(s)
      }
    }
    if (this.isNumeric) {
      this.fieldTypeInDb = 'integer'
    }
    var options = Reflect.getMetadata(
      storableMember,
      this.valueListType,
    ) as ValueListFieldOptions<any, any>[]

    if (options) {
      for (const op of options) {
        if (op?.getValues) {
          this.values.splice(0, this.values.length, ...op.getValues())
          this.byIdMap.clear()
          this.values.forEach((s) => {
            if (s.caption === undefined && s.id !== undefined)
              s.caption = makeTitle(s.id)
            this.byIdMap.set(s.id, s)
          })
        }
      }
      if (this.values.find((s) => s.id === undefined))
        throw new Error(
          `ValueType ${this.valueListType} has values without an id`,
        )
    } else
      throw new Error(
        `ValueType not yet initialized, did you forget to call @ValueListFieldType on ` +
          valueListType,
      )
  }

  getValues() {
    return this.values
  }
  byId(key: any) {
    if (this.isNumeric) key = +key
    return this.byIdMap.get(key)
  }
  fromJson(val: any): T {
    return this.byId(val)
  }
  toJson(val: T) {
    if (!val) return undefined
    return val.id
  }
  fromDb(val: any): T {
    return this.fromJson(val)
  }
  toDb(val: T) {
    return this.toJson(val)
  }
  toInput(val: T, inputType: string): string {
    return this.toJson(val)
  }
  fromInput(val: string, inputType: string): T {
    return this.fromJson(val)
  }
  displayValue?(val: T): string {
    if (!val) return ''
    return val.caption
  }
  fieldTypeInDb?: string
  inputType?: string
}
const typeCache = new Map<any, ValueListInfo<any>>()
export function getValueList<T>(field: FieldRef<T>): T[]
export function getValueList<T>(field: FieldMetadata<T>): T[]
export function getValueList<T>(type: ClassType<T>): T[]
export function getValueList<T>(
  type: ClassType<T> | FieldMetadata<T> | FieldRef<T>,
): T[] {
  {
    const fr = (type as FieldRef<T>)?.metadata?.valueType
    if (fr) return ValueListInfo.get<T>(fr).getValues()
  }
  {
    const fr = (type as FieldMetadata<T>)?.valueType
    if (fr) return ValueListInfo.get<T>(fr).getValues()
  }

  return ValueListInfo.get<T>(type as ClassType<T>).getValues()
}

export interface ClassFieldDecoratorContextStub<entityType, valueType> {
  readonly access: {
    set(object: entityType, value: valueType): void
  }
  readonly name: string
}
export interface ClassDecoratorContextStub<
  Class extends new (...args: any) => any = new (...args: any) => any,
> {
  readonly kind: 'class'
  readonly name: string | undefined
  addInitializer(initializer: (this: Class) => void): void
}

/**Decorates fields that should be used as fields.
 * for more info see: [Field Types](https://remult.dev/docs/field-types.html)
 *
 * FieldOptions can be set in two ways:
 * @example
 * // as an object
 * @Fields.string({ includeInApi:false })
 * title='';
 * @example
 * // as an arrow function that receives `remult` as a parameter
 * @Fields.string((options,remult) => options.includeInApi = true)
 * title='';
 */
export function Field<entityType = any, valueType = any>(
  valueType: () => ClassType<valueType>,
  ...options: (
    | FieldOptions<entityType, valueType>
    | ((options: FieldOptions<entityType, valueType>, remult: Remult) => void)
  )[]
) {
  // IMPORTANT!!!! if you call this in another decorator, make sure to set It's return type correctly with the | undefined

  return (
    target,
    context:
      | ClassFieldDecoratorContextStub<entityType, valueType | undefined>
      | string,
    c?,
  ) => {
    const key = typeof context === 'string' ? context : context.name.toString()
    let factory = (remult: Remult) => {
      let r = buildOptions(options, remult)
      if (!r.valueType && valueType) {
        r.valueType = valueType()
      }
      if (!r.key) {
        r.key = key
      }
      if (!r.dbName) r.dbName = r.key
      let type = r.valueType
      if (!type) {
        type = Reflect.getMetadata('design:type', target, key)
        r.valueType = type
      }
      if (!r.target) r.target = target
      return r
    }
    checkTarget(target)
    let names: columnInfo[] = columnsOfType.get(target.constructor)
    if (!names) {
      names = []
      columnsOfType.set(target.constructor, names)
    }

    let set = names.find((x) => x.key == key)
    if (!set)
      names.push({
        key,
        settings: factory,
      })
    else {
      let prev = set.settings
      set.settings = (c) => {
        let prevO = prev(c)
        let curr = factory(c)
        return Object.assign(prevO, curr)
      }
    }
  }
}
export const storableMember = Symbol('storableMember')
function buildOptions<entityType = any, valueType = any>(
  options: (
    | FieldOptions<entityType, valueType>
    | ((options: FieldOptions<entityType, valueType>, remult: Remult) => void)
  )[],
  remult: Remult,
) {
  let r = {} as FieldOptions<entityType, valueType>
  for (const o of options) {
    if (o) {
      if (typeof o === 'function') o(r, remult)
      else Object.assign(r, o)
    }
  }
  return r
}

export function decorateColumnSettings<valueType>(
  settings: FieldOptions<any, valueType>,
  remult: Remult,
) {
  if (settings.valueType) {
    let settingsOnTypeLevel = Reflect.getMetadata(
      storableMember,
      settings.valueType,
    )
    if (settingsOnTypeLevel) {
      settings = {
        ...buildOptions(settingsOnTypeLevel, remult),
        ...settings,
      }
    }
  }

  if (settings.valueType == String) {
    let x = settings as unknown as FieldOptions<any, String>
    if (!settings.valueConverter) x.valueConverter = ValueConverters.String
  }

  if (settings.valueType == Number) {
    let x = settings as unknown as FieldOptions<any, Number>
    if (!settings.valueConverter) x.valueConverter = ValueConverters.Number
  }
  if (settings.valueType == Date) {
    let x = settings as unknown as FieldOptions<any, Date>
    if (!settings.valueConverter) {
      x.valueConverter = ValueConverters.Date
    }
  }

  if (settings.valueType == Boolean) {
    let x = settings as unknown as FieldOptions<any, Boolean>
    if (!x.valueConverter) x.valueConverter = ValueConverters.Boolean
  }
  if (!settings.valueConverter) {
    let ei = getEntitySettings(settings.valueType, false)
    if (ei) {
      let isIdNumeric: Boolean = undefined
      settings.valueConverter = {
        toDb: (x) => x,
        fromDb: (x) => x,
      }
      settings.valueConverter = new Proxy(settings.valueConverter, {
        get(target, property) {
          if (target[property] === undefined) {
            if (isIdNumeric === undefined) {
              isIdNumeric =
                remult.repo(settings.valueType).metadata.idMetadata.field
                  .valueType === Number
              if (isIdNumeric) {
                for (const key of [
                  'fieldTypeInDb',
                ] as (keyof ValueConverter<any>)[]) {
                  //@ts-ignore
                  target[key] = ValueConverters.Integer[key]
                }
              }
            }
          }
          return target[property]
        },
        set(target, property, value, receiver) {
          target[property] = value
          return true
        },
      })
    } else settings.valueConverter = ValueConverters.Default
  }
  if (!settings.valueConverter.toJson) {
    settings.valueConverter.toJson = (x) => x
  }
  if (!settings.valueConverter.fromJson) {
    settings.valueConverter.fromJson = (x) => x
  }
  if (!settings.valueConverter.toDb) {
    settings.valueConverter.toDb = (x) => settings.valueConverter.toJson(x)
  }
  if (!settings.valueConverter.fromDb) {
    settings.valueConverter.fromDb = (x) => settings.valueConverter.fromJson(x)
  }
  if (!settings.valueConverter.toInput) {
    settings.valueConverter.toInput = (x) => settings.valueConverter.toJson(x)
  }
  if (!settings.valueConverter.fromInput) {
    settings.valueConverter.fromInput = (x) =>
      settings.valueConverter.fromJson(x)
  }

  return settings
}

interface columnInfo {
  key: string
  settings: (remult: Remult) => FieldOptions
}
//[ ] YONI - in Typescript 5 I do get the name of the class, what would we like to change because of that?

/**Decorates classes that should be used as entities.
 * Receives a key and an array of EntityOptions.
 * @example
 * import { Entity, Fields } from "remult";
 * @Entity("tasks", {
 *    allowApiCrud: true
 * })
 * export class Task {
 *    @Fields.uuid()
 *    id!: string;
 *    @Fields.string()
 *    title = '';
 *    @Fields.boolean()
 *    completed = false;
 * }
 * @note
 * EntityOptions can be set in two ways:
 * @example
 * // as an object
 * @Entity("tasks",{ allowApiCrud:true })
 * @example
 * // as an arrow function that receives `remult` as a parameter
 * @Entity("tasks", (options,remult) => options.allowApiCrud = true)
 */
export function Entity<entityType>(
  key: string,
  ...options: (
    | EntityOptions<
        entityType extends new (...args: any) => any
          ? InstanceType<entityType>
          : entityType
      >
    | ((
        options: EntityOptions<
          entityType extends new (...args: any) => any
            ? InstanceType<entityType>
            : entityType
        >,
        remult: Remult,
      ) => void)
  )[]
) {
  return (
    target,
    info?: ClassDecoratorContextStub<
      entityType extends new (...args: any) => any ? entityType : never
    >,
  ) => {
    for (const rawFilterMember in target) {
      if (Object.prototype.hasOwnProperty.call(target, rawFilterMember)) {
        const element = target[rawFilterMember] as customFilterInfo<any>
        if (element?.rawFilterInfo?.rawFilterTranslator) {
          if (!element.rawFilterInfo.key)
            element.rawFilterInfo.key = rawFilterMember
        }
      }
    }

    let factory: EntityOptionsFactory = (remult) => {
      let r = {} as EntityOptions<
        entityType extends new (...args: any) => any
          ? InstanceType<entityType>
          : entityType
      >
      for (const o of options) {
        if (o) {
          if (typeof o === 'function') o(r, remult)
          else Object.assign(r, o)
        }
      }

      let base = Object.getPrototypeOf(target)
      if (base) {
        let baseFactory = getEntitySettings(base, false)
        if (baseFactory) {
          let opt = baseFactory(remult)
          if (opt) {
            r = {
              ...opt,
              ...r,
            }
          }
        }
      }
      return r
    }

    allEntities.push(target)
    setControllerSettings(target, { key })
    Reflect.defineMetadata(entityInfo, factory, target)
    Reflect.defineMetadata(entityInfo_key, key, target)
    return target
  }
}

export class EntityBase {
  get _(): EntityRef<this> {
    return getEntityRef(this)
  }
  save() {
    return this._.save()
  }
  assign(values: Partial<Omit<this, keyof EntityBase>>) {
    assign(this, values)
    return this
  }
  delete() {
    return this._.delete()
  }
  isNew() {
    return this._.isNew()
  }
  get $() {
    return this._.fields
  }
}
export class IdEntity extends EntityBase {
  @Fields.uuid()
  id: string
}
export class ControllerBase {
  protected remult: Remult
  constructor(remult?: Remult) {
    this.remult = remult || defaultRemult
  }
  assign(values: Partial<Omit<this, keyof EntityBase>>) {
    assign(this, values)
    return this
  }
  get $() {
    return getFields(this, this.remult)
  }
  get _() {
    return getControllerRef(this, this.remult)
  }
}

class QueryResultImpl<entityType> implements QueryResult<entityType> {
  constructor(
    private options: QueryOptions<entityType>,
    private repo: RepositoryImplementation<entityType>,
  ) {
    if (!this.options) this.options = {}
    if (!this.options.pageSize) {
      this.options.pageSize = queryConfig.defaultPageSize
    }
  }
  private _count: number = undefined
  async getPage(page?: number) {
    if (page < 1) page = 1

    return this.repo.find({
      where: this.options.where,
      orderBy: this.options.orderBy,
      limit: this.options.pageSize,
      page: page,
      load: this.options.load,
    })
  }

  async count() {
    if (this._count === undefined)
      this._count = await this.repo.count(this.options.where)
    return this._count
  }
  async forEach(what: (item: entityType) => Promise<any>) {
    let i = 0
    for await (const x of this) {
      await what(x)
      i++
    }
    return i
  }
  async paginator(
    pNextPageFilter?: EntityFilter<entityType>,
  ): Promise<Paginator<entityType>> {
    this.options.orderBy = Sort.createUniqueEntityOrderBy(
      this.repo.metadata,
      this.options.orderBy,
    )
    let items = await this.repo.find({
      where: {
        $and: [this.options.where, pNextPageFilter],
      } as EntityFilter<entityType>,
      orderBy: this.options.orderBy,
      limit: this.options.pageSize,
      load: this.options.load,
    })

    let nextPage: () => Promise<Paginator<entityType>> = undefined
    let hasNextPage = items.length == this.options.pageSize
    if (hasNextPage) {
      let nextPageFilter = await this.repo.createAfterFilter(
        this.options.orderBy,
        items[items.length - 1],
      )
      nextPage = () => this.paginator(nextPageFilter)
    }
    return {
      count: () => this.count(),
      hasNextPage,
      items,
      nextPage,
    }
  }

  [Symbol.asyncIterator]() {
    if (!this.options.where) {
      this.options.where = {}
    }
    let ob = this.options.orderBy
    this.options.orderBy = Sort.createUniqueEntityOrderBy(
      this.repo.metadata,
      ob,
    )

    let itemIndex = -1
    let currentPage: Paginator<entityType> = undefined

    let itStrategy: () => Promise<IteratorResult<entityType>>

    let j = 0

    itStrategy = async () => {
      if (this.options.progress) {
        this.options.progress.progress(j++ / (await this.count()))
      }
      if (currentPage === undefined || itemIndex == currentPage.items.length) {
        if (currentPage && !currentPage.hasNextPage)
          return { value: <entityType>undefined, done: true }
        let prev = currentPage
        if (currentPage) currentPage = await currentPage.nextPage()
        else currentPage = await this.paginator()

        itemIndex = 0
        if (currentPage.items.length == 0) {
          return { value: <entityType>undefined, done: true }
        } else {
          if (prev?.items.length > 0) {
            if (
              this.repo.getEntityRef(prev.items[0]).getId() ==
              this.repo.getEntityRef(currentPage.items[0]).getId()
            )
              throw new Error('pagination failure, returned same first row')
          }
        }
      }
      if (itemIndex < currentPage.items.length)
        return { value: currentPage.items[itemIndex++], done: false }
    }
    return {
      next: async () => {
        let r = itStrategy()
        return r
      },
    }
  }
}

class cacheEntityInfo<entityType> {
  value: entityType = {} as entityType
  promise: Promise<entityType>
}
class SubscribableImp implements Subscribable {
  reportChanged() {
    if (this._subscribers) this._subscribers.forEach((x) => x.reportChanged())
  }
  reportObserved() {
    if (this._subscribers) this._subscribers.forEach((x) => x.reportObserved())
  }
  private _subscribers: RefSubscriberBase[]
  subscribe(
    listener:
      | (() => void)
      | {
          reportChanged: () => void
          reportObserved: () => void
        },
  ): Unsubscribe {
    let list: {
      reportChanged: () => void
      reportObserved: () => void
    }
    if (typeof listener === 'function')
      list = {
        reportChanged: () => listener(),
        reportObserved: () => {},
      }
    else list = listener

    if (!this._subscribers) {
      this._subscribers = []
    }
    this._subscribers.push(list)
    return () =>
      (this._subscribers = this._subscribers.filter((x) => x != list))
  }
}
export function getEntityMetadata<entityType>(
  entity: EntityMetadataOverloads<entityType>,
): EntityMetadata<entityType> {
  if ((entity as Repository<entityType>).metadata)
    return (entity as Repository<entityType>).metadata
  const settings = getEntitySettings(entity as ClassType<entityType>, false)
  if (settings) {
    return defaultRemult.repo(entity as ClassType<entityType>).metadata
  }
  return entity as EntityMetadata
}
export function getRepository<entityType>(
  entity: RepositoryOverloads<entityType>,
): Repository<entityType> {
  const settings = getEntitySettings(entity as ClassType<entityType>, false)
  if (settings) {
    return defaultRemult.repo(entity as ClassType<entityType>)
  }
  return entity as Repository<entityType>
}
export type EntityMetadataOverloads<entityType> =
  | Repository<entityType>
  | EntityMetadata<entityType>
  | ClassType<entityType>
export type RepositoryOverloads<entityType> =
  | Repository<entityType>
  | ClassType<entityType>

export function checkTarget(target: any) {
  if (!target)
    throw new Error(
      "Set the 'experimentalDecorators:true' option in your 'tsconfig' or 'jsconfig' (target undefined)",
    )
}
