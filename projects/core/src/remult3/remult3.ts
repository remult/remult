import type { ErrorInfo, FieldOptions } from '../..'
import type { ClassType } from '../../classType'
import type { entityEventListener } from '../__EntityValueProvider'
import type { FieldMetadata } from '../column-interfaces'
import type { EntityOptions } from '../entity'
import type {
  LiveQueryChange,
  SubscriptionListener,
  Unsubscribe,
} from '../live-query/SubscriptionChannel'
import type { SortSegment } from '../sort'
import type { EntityBase } from './RepositoryImplementation'

export interface EntityRef<entityType> extends Subscribable {
  hasErrors(): boolean
  undoChanges()
  save(): Promise<entityType>
  reload(): Promise<entityType>
  delete(): Promise<void>
  isNew(): boolean //
  wasChanged(): boolean
  wasDeleted(): boolean
  fields: FieldsRef<entityType>
  error: string
  getId(): idType<entityType>
  getOriginalId(): idType<entityType>
  repository: Repository<entityType>
  metadata: EntityMetadata<entityType>
  toApiJson(): any
  validate(): Promise<ErrorInfo<entityType> | undefined>
  relations: RepositoryRelations<entityType>
  readonly apiUpdateAllowed: boolean
  readonly apiDeleteAllowed: boolean
  readonly apiInsertAllowed: boolean
  readonly isLoading: boolean
}
/**
 * Represents a lifecycle event associated with an entity instance. These events
 * are triggered during various stages of the entity's lifecycle, such as validation,
 * saving, saved, deleting, and deleted.
 *
 * @template entityType The type of the entity associated with the event.
 * @see [Entity Lifecycle Hooks](http://remult.dev/docs/lifecycle-hooks)
 */
export interface LifecycleEvent<entityType> {
  /**
   * Indicates whether the entity is new or existing.
   */
  isNew: boolean

  /**
   * A reference to the fields of the entity, providing access to its properties.
   */
  fields: FieldsRef<entityType>

  /**
   * The ID of the entity.
   */
  id: idType<entityType>

  /**
   * The original ID of the entity, useful for tracking changes.
   */
  originalId: idType<entityType>

  /**
   * The repository associated with the entity, providing access to repository methods.
   */
  repository: Repository<entityType>

  /**
   * Metadata describing the entity's structure and configuration.
   */
  metadata: EntityMetadata<entityType>

  /**
   * A function that can be used to prevent the default behavior associated with
   * the lifecycle event.
   */
  preventDefault: VoidFunction

  /**
   * A reference to the repository relations associated with the entity, providing
   * access to related entities and their data.
   */
  relations: RepositoryRelations<entityType>
}
export interface ControllerRef<entityType> extends Subscribable {
  hasErrors(): boolean
  fields: FieldsRef<entityType>
  error: string
  validate(): Promise<ErrorInfo<entityType> | undefined>
  readonly isLoading: boolean
}
export interface RefSubscriberBase {
  reportChanged: () => void
  reportObserved: () => void
}
export declare type RefSubscriber = (() => void) | RefSubscriberBase
export interface Subscribable {
  // new to talk with Yoni;
  subscribe(listener: RefSubscriber): Unsubscribe
}

export type FieldsRef<entityType> = {
  [Properties in keyof OmitFunctions<OmitEB<entityType>>]: NonNullable<
    entityType[Properties]
  > extends {
    id?: number | string
  }
    ? IdFieldRef<entityType, entityType[Properties]>
    : FieldRef<entityType, entityType[Properties]>
} & {
  find(fieldMetadataOrKey: FieldMetadata | string): FieldRef<entityType, any>
  [Symbol.iterator]: () => IterableIterator<FieldRef<entityType, any>>
  toArray(): FieldRef<entityType, any>[]
}
export type FieldsMetadata<entityType> = {
  [Properties in keyof OmitFunctions<OmitEB<entityType>>]: FieldMetadata<
    entityType[Properties],
    entityType
  >
} & {
  find(
    fieldMetadataOrKey: FieldMetadata | string,
  ): FieldMetadata<any, entityType>
  [Symbol.iterator]: () => IterableIterator<FieldMetadata<any, entityType>>
  toArray(): FieldMetadata<any, entityType>[]
}

export type SortSegments<entityType> = {
  [Properties in keyof entityType]: SortSegment & { descending(): SortSegment }
}
export interface IdFieldRef<entityType, valueType>
  extends FieldRef<entityType, valueType> {
  setId(
    id: valueType extends { id?: number }
      ? number
      : valueType extends { id?: string }
      ? string
      : string | number,
  )
  getId(): valueType extends { id?: number }
    ? number
    : valueType extends { id?: string }
    ? string
    : string | number
}

export interface FieldRef<entityType = any, valueType = any>
  extends Subscribable {
  error: string
  displayValue: string
  value: valueType
  originalValue: valueType
  inputValue: string
  valueChanged(): boolean
  entityRef: EntityRef<entityType>
  container: entityType
  metadata: FieldMetadata<valueType>
  load(): Promise<valueType>
  valueIsNull(): boolean
  originalValueIsNull(): boolean
  validate(): Promise<boolean>
}
export interface IdMetadata<entityType = any> {
  /** Extracts the id value of an entity item. Useful in cases where the id column is not called id
   * @example
   * repo.metadata.idMetadata.getId(task)
   */
  getId(item: Partial<OmitFunctions<OmitEB<entityType>>>): any
  field: FieldMetadata<any>
  getIdFilter(...ids: any[]): EntityFilter<entityType>
  isIdField(col: FieldMetadata): boolean
  createIdInFilter(
    items: Partial<OmitFunctions<OmitEB<entityType>>>[],
  ): EntityFilter<entityType>
}

/** Metadata for an `Entity`, this metadata can be used in the user interface to provide a richer UI experience  */
export interface EntityMetadata<entityType = any> {
  /** The Entity's key also used as it's url  */
  readonly key: string
  /** Metadata for the Entity's fields */
  readonly fields: FieldsMetadata<entityType> //expose fields to repository
  /** A human readable caption for the entity. Can be used to achieve a consistent caption for a field throughout the app
   * @example
   * <h1>Create a new item in {taskRepo.metadata.caption}</h1>
   */
  readonly caption: string
  /** The options send to the `Entity`'s decorator */
  readonly options: EntityOptions
  /** The class type of the entity */
  readonly entityType: ClassType<entityType>
  /** true if the current user is allowed to update an entity instance
   * @example
   * const taskRepo = remult.repo(Task);
   * if (taskRepo.metadata.apiUpdateAllowed(task)){
   *   // Allow user to edit the entity
   * }
   */
  apiUpdateAllowed(item?: entityType): boolean
  /** true if the current user is allowed to read from entity
   * @example
   * const taskRepo = remult.repo(Task);
   * if (taskRepo.metadata.apiReadAllowed){
   *   await taskRepo.find()
   * }
   */
  readonly apiReadAllowed: boolean
  /** true if the current user is allowed to delete an entity instance
   * @example
   * const taskRepo = remult.repo(Task);
   * if (taskRepo.metadata.apiDeleteAllowed(task)){
   *   // display delete button
   * }
   */
  apiDeleteAllowed(item?: entityType): boolean
  /** true if the current user is allowed to create an entity instance
   * @example
   * const taskRepo = remult.repo(Task);
   * if (taskRepo.metadata.apiInsertAllowed(task)){
   *   // display insert button
   * }
   */
  apiInsertAllowed(item?: entityType): boolean

  /** Returns the dbName - based on it's `dbName` option and it's `sqlExpression` option */
  getDbName(): Promise<string>
  /** Metadata for the Entity's id */
  readonly idMetadata: IdMetadata<entityType>
}

export declare type OmitEB<T> = Omit<T, keyof EntityBase>
export declare type OmitFunctions<T> = { [K in keyof T as T[K] extends Function ? never : K]: T[K] }
//Pick<
//   T,
//   { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]
// >
export declare type idType<entityType> = entityType extends { id?: number }
  ? number
  : entityType extends { id?: string }
  ? string
  : string | number
/**used to perform CRUD operations on an `entityType` */
export interface Repository<entityType> {
  /** returns a result array based on the provided options */
  find(options?: FindOptions<entityType>): Promise<entityType[]>
  /** returns a result array based on the provided options */
  liveQuery(options?: FindOptions<entityType>): LiveQuery<entityType>
  /** returns the first item that matchers the `where` condition
   * @example
   * await taskRepo.findFirst({ completed:false })
   * @example
   * await taskRepo.findFirst({ completed:false },{ createIfNotFound: true })
   *      */
  findFirst(
    where?: EntityFilter<entityType>,
    options?: FindFirstOptions<entityType>,
  ): Promise<entityType>
  /** returns the items that matches the idm the result is cached unless specified differently in the `options` parameter */
  findId(
    id: idType<entityType>,
    options?: FindFirstOptionsBase<entityType>,
  ): Promise<entityType>
  /**  An alternative form of fetching data from the API server, which is intended for operating on large numbers of entity objects.
   *
   * It also has it's own paging mechanism that can be used n paging scenarios.
   *
   * The `query` method doesn't return an array (as the `find` method) and instead returns an `iterable` `QueryResult` object
   * which supports iterations using the JavaScript `for await` statement.
   * @example
   * for await (const task of taskRepo.query()) {
   *   // do something.
   * }
   * */
  query(options?: QueryOptions<entityType>): QueryResult<entityType>
  /** Returns a count of the items matching the criteria.
   * @see [EntityFilter](http://remult.dev/docs/entityFilter.html)
   * @example
   * await taskRepo.count({ completed:false })
   */
  count(where?: EntityFilter<entityType>): Promise<number>

  /**Validates an item
   * @example
   * const error = repo.validate(task);
   * if (error){
   *   alert(error.message);
   *   alert(error.modelState.title);//shows the specific error for the title field
   * }
   * // Can also be used to validate specific fields
   * const error = repo.validate(task,"title")
   */
  validate(
    item: Partial<entityType>,
    ...fields: Extract<keyof OmitFunctions<OmitEB<entityType>>, string>[]
  ): Promise<ErrorInfo<entityType> | undefined>
  /** saves an item or item[] to the data source. It assumes that if an `id` value exists, it's an existing row - otherwise it's a new row
   * @example
   * await taskRepo.save({...task, completed:true })
   */

  save(
    item: Partial<OmitFunctions<OmitEB<entityType>>>[],
  ): Promise<entityType[]>
  save(item: Partial<OmitFunctions<OmitEB<entityType>>>): Promise<entityType>

  /**Insert an item or item[] to the data source
   * @example
   * await taskRepo.insert({title:"task a"})
   * @example
   * await taskRepo.insert([{title:"task a"}, {title:"task b", completed:true }])
   */
  insert(
    item: Partial<OmitFunctions<OmitEB<entityType>>>[],
  ): Promise<entityType[]>
  insert(item: Partial<OmitFunctions<OmitEB<entityType>>>): Promise<entityType>

  /** Updates an item, based on its `id`
   * @example
   * taskRepo.update(task.id,{...task,completed:true})
   */
  update(
    id: entityType extends { id?: number }
      ? number
      : entityType extends { id?: string }
      ? string
      : string | number,
    item: Partial<OmitFunctions<OmitEB<entityType>>>,
  ): Promise<entityType>
  update(
    id: Partial<OmitFunctions<OmitEB<entityType>>>,
    item: Partial<OmitFunctions<OmitEB<entityType>>>,
  ): Promise<entityType>

  /** Deletes an Item*/
  delete(
    id: entityType extends { id?: number }
      ? number
      : entityType extends { id?: string }
      ? string
      : string | number,
  ): Promise<void>
  delete(item: Partial<OmitFunctions<OmitEB<entityType>>>): Promise<void>

  /** Creates an instance of an item. It'll not be saved to the data source unless `save` or `insert` will be called for that item */
  create(item?: Partial<OmitFunctions<OmitEB<entityType>>>): entityType

  toJson(item: Promise<entityType[]>): Promise<any[]>
  toJson(item: entityType[]): any[]
  toJson(item: Promise<entityType>): Promise<any>
  toJson(item: entityType): any

  /** Translates a json object to an item instance */
  fromJson(x: any[], isNew?: boolean): entityType[]
  fromJson(x: any, isNew?: boolean): entityType
  /** returns an `entityRef` for an item returned by `create`, `find` etc... */
  getEntityRef(item: entityType): EntityRef<entityType>
  /** Provides information about the fields of the Repository's entity
   * @example
   * console.log(repo.fields.title.caption) // displays the caption of a specific field
   * console.log(repo.fields.title.options)// writes the options that were defined for this field
   */
  fields: FieldsMetadata<entityType>
  /**The metadata for the `entity`
   * @See [EntityMetadata](https://remult.dev/docs/ref_entitymetadata.html)
   */
  metadata: EntityMetadata<entityType>
  addEventListener(listener: entityEventListener<entityType>): Unsubscribe
  relations: (item: entityType) => RepositoryRelations<entityType>
}
export interface LiveQuery<entityType> {
  subscribe(next: (info: LiveQueryChangeInfo<entityType>) => void): Unsubscribe
  subscribe(
    listener: Partial<SubscriptionListener<LiveQueryChangeInfo<entityType>>>,
  ): Unsubscribe
}
export interface LiveQueryChangeInfo<entityType> {
  items: entityType[]
  changes: LiveQueryChange[]
  applyChanges(prevState: entityType[] | undefined): entityType[]
}
export interface FindOptions<entityType> extends FindOptionsBase<entityType> {
  /** Determines the number of rows returned by the request, on the browser the default is 100 rows
   * @example
   * await this.remult.repo(Products).find({
   *  limit:10,
   *  page:2
   * })
   */
  limit?: number
  /** Determines the page number that will be used to extract the data
   * @example
   * await this.remult.repo(Products).find({
   *  limit:10,
   *  page:2
   * })
   */
  page?: number
}
/** Determines the order of items returned .
 * @example
 * await this.remult.repo(Products).find({ orderBy: { name: "asc" }})
 * @example
 * await this.remult.repo(Products).find({ orderBy: { price: "desc", name: "asc" }})
 */
export declare type EntityOrderBy<entityType> = {
  [Properties in keyof Partial<OmitEB<OmitFunctions<entityType>>>]?:
    | 'asc'
    | 'desc'
}

/**Used to filter the desired result set
 * @see [EntityFilter](http://remult.dev/docs/entityFilter.html)
 */
export declare type EntityFilter<entityType> = {
  [Properties in keyof Partial<OmitEB<OmitFunctions<entityType>>>]?:
    | (Partial<OmitEB<entityType>>[Properties] extends number | Date | undefined
        ? ComparisonValueFilter<Partial<OmitEB<entityType>>[Properties]>
        : Partial<OmitEB<entityType>>[Properties] extends string | undefined
        ? ContainsStringValueFilter & ComparisonValueFilter<string>
        : Partial<OmitEB<entityType>>[Properties] extends boolean | undefined
        ? ValueFilter<boolean>
        : Partial<OmitEB<entityType>>[Properties] extends
            | { id?: string | number }
            | undefined
        ? IdFilter<Partial<OmitEB<entityType>>[Properties]>
        : ValueFilter<Partial<OmitEB<entityType>>[Properties]>)
    | ContainsStringValueFilter
} & {
  $or?: EntityFilter<entityType>[]
  $and?: EntityFilter<entityType>[]
}

export type ValueFilter<valueType> =
  | valueType
  | valueType[]
  | {
      $ne?: valueType | valueType[]
      '!='?: valueType | valueType[]
      $in?: valueType[]
      $nin?: valueType[]
    }
export type ComparisonValueFilter<valueType> = ValueFilter<valueType> & {
  $gt?: valueType
  '>'?: valueType
  $gte?: valueType
  '>='?: valueType
  $lt?: valueType
  '<'?: valueType
  $lte?: valueType
  '<='?: valueType
}
export interface ContainsStringValueFilter {
  $contains?: string
}
export type IdFilter<valueType> =
  | ValueFilter<valueType>
  | {
      $id: ValueFilter<valueType extends { id?: number } ? number : string>
    }

export interface LoadOptions<entityType> {
  /**
   * @deprecated The 'load' option is deprecated and will be removed in future versions.
   * Use 'Relations.toOne' along with the 'include' option instead.
   *
   * Example usage:
   * ```
   * // Deprecated usage with 'load' option
   * await remult.repo(Order).find({
   *   load: (o) => [o.customer],
   * });
   *
   *
   * // Preferred usage with 'Relations.toOne' and 'include' option
   * await remult.repo(Order).find({
   *   include: { customer: true },
   * });
   * ```
   */
  load?: (entity: FieldsMetadata<entityType>) => FieldMetadata[]
  /**
   * An option used in the `find` and `findFirst` methods to specify which related entities should be included
   * when querying the source entity. It allows you to eagerly load related data to avoid N+1 query problems.
   *
   * @param include An object specifying the related entities to include, their options, and filtering criteria.
   *
   * Example usage:
   * ```
   * const orders = await customerRepo.find({
   *   include: {
   *     // Include the 'tags' relation for each customer.
   *     tags: true,
   *   },
   * });
   * ```
   * In this example, the `tags` relation for each customer will be loaded and included in the query result.
   *
   * @see {@link Relations.toMany}
   * @see {@link Relations.toOne}
   * @see {@link RelationOptions}
   */
  include?: MembersToInclude<entityType>
}
export interface FindOptionsBase<entityType> extends LoadOptions<entityType> {
  /** filters the data
   * @example
   * await taskRepo.find({where: { completed:false }})
   * @see For more usage examples see [EntityFilter](https://remult.dev/docs/entityFilter.html)
   */
  where?: EntityFilter<entityType>
  /** Determines the order of items returned .
   * @example
   * await this.remult.repo(Products).find({ orderBy: { name: "asc" }})
   * @example
   * await this.remult.repo(Products).find({ orderBy: { price: "desc", name: "asc" }})
   */
  orderBy?: EntityOrderBy<entityType>
}
export interface FindFirstOptions<entityType>
  extends FindOptionsBase<entityType>,
    FindFirstOptionsBase<entityType> {}
export interface FindFirstOptionsBase<entityType>
  extends LoadOptions<entityType> {
  /** determines if to cache the result, and return the results from cache.
   */
  useCache?: boolean
  /** If set to true and an item is not found, it's created and returned*/
  createIfNotFound?: boolean
}
export interface QueryOptions<entityType> extends FindOptionsBase<entityType> {
  /** The number of items to return in each step */
  pageSize?: number
  /** A callback method to indicate the progress of the iteration */
  progress?: { progress: (progress: number) => void }
}
/** The result of a call to the `query` method in the `Repository` object.
 */
export interface QueryResult<entityType> {
  /** returns an iterator that iterates the rows in the result using a paging mechanism
   * @example
   * for await (const task of taskRepo.query()) {
   *   await taskRepo.save({ ...task, completed });
   * }
   */
  [Symbol.asyncIterator](): {
    next: () => Promise<IteratorResult<entityType, entityType>>
  }
  /** returns the number of rows that match the query criteria */
  count(): Promise<number>
  /** Returns a `Paginator` object that is used for efficient paging */
  paginator(): Promise<Paginator<entityType>>
  /** gets the items in a specific page */
  getPage(pageNumber?: number): Promise<entityType[]>
  /** Performs an operation on all the items matching the query criteria */
  forEach(what: (item: entityType) => Promise<any>): Promise<number>
}
/** An interface used to paginating using the `query` method in the `Repository` object */
export interface Paginator<entityType> {
  /** the items in the current page */
  items: entityType[]
  /** True if next page exists */
  hasNextPage: boolean
  /** Gets the next page in the `query`'s result set */
  nextPage(): Promise<Paginator<entityType>>
  /** the count of the total items in the `query`'s result */
  count(): Promise<number>
}

export interface RelationInfo {
  toType: () => any
  type: 'reference' | 'toOne' | 'toMany' //remove to from name
}
//[ ] V2 - what to do about count?
//[ ] V2 - condition? not to fetch if null etc....
//[ ] V3 - all these fields will also appear in the where etc... in the typescript api - but we will not enforce them

/**
 * Options for configuring a relation between entities.
 *
 * @template fromEntity The type of the source entity (the entity defining the relation).
 * @template toEntity The type of the target entity (the related entity).
 * @template matchIdEntity The type used for matching IDs in the relation.
 * @template optionsType The type of find options to apply to the relation (default is FindOptionsBase<toEntity>).
 */

export type RelationOptions<
  fromEntity,
  toEntity,
  matchIdEntity,
  optionsType extends FindOptionsBase<toEntity> = FindOptionsBase<toEntity>,
> = {
  /**
   * An object specifying custom field names for the relation.
   * Each key represents a field in the related entity, and its value is the corresponding field in the source entity.
   * For example, `{ customerId: 'id' }` maps the 'customerId' field in the related entity to the 'id' field in the source entity.
   * This is useful when you want to define custom field mappings for the relation.
   */
  //[ ] V2- consider enforcing types
  fields?: {
    [K in keyof toEntity]?: keyof fromEntity
  }
  /**
   * The name of the field for this relation.
   */
  field?: keyof matchIdEntity
  /**
   * Find options to apply to the relation when fetching related entities.
   * You can specify a predefined set of find options or provide a function that takes the source entity
   * and returns find options dynamically.
   * These options allow you to customize how related entities are retrieved.
   */
  findOptions?: optionsType | ((entity: fromEntity) => optionsType)
  /**
   * Determines whether the relation should be included by default when querying the source entity.
   * When set to true, related entities will be automatically included when querying the source entity.
   * If false or not specified, related entities will need to be explicitly included using the `include` option.
   */
  defaultIncluded?: boolean
} & Pick<FieldOptions, 'caption'>

export type ObjectMembersOnly<T> = OmitFunctions<{
  [K in keyof Pick<
    T,
    {
      [K in keyof T]: T[K] extends object | undefined | null
        ? T[K] extends Date | undefined | null
          ? never
          : K
        : never
    }[keyof T]
  >]: T[K]
}>

export type MembersToInclude<T> = {
  [K in keyof ObjectMembersOnly<T>]?:
    | boolean
    | (NonNullable<T[K]> extends Array<any>
        ? FindOptions<NonNullable<T[K]>[number]>
        : FindFirstOptions<NonNullable<T[K]>>)
}

export type RepositoryRelations<entityType> = {
  [K in keyof ObjectMembersOnly<entityType>]-?: NonNullable<
    entityType[K]
  > extends Array<infer R>
    ? Repository<R>
    : entityType[K] extends infer R
    ? { findOne: (options?: FindOptionsBase<R>) => Promise<R> }
    : never
}

export declare type EntityIdFields<entityType> = {
  [Properties in keyof Partial<OmitFunctions<OmitEB<entityType>>>]?: true
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

export type ClassFieldDecorator<entityType, valueType> = (
  target: any,
  context:
    | string
    | ClassFieldDecoratorContextStub<entityType, valueType | undefined>,
  c?: any,
) => void

//p2 - write doc about controlling updates of rows...

//p2 - need a way to extract the fields from the relation - for generating relation based sql

//p2 - add docs for apply changes
//y2 - discuss a default date formatter
//[ ] - consider using this in saving etc...
//p2 - when subscribe is forbidden - the query still runs after the renew process
//p2 - JSON FIELD LOST JSON STORAGE WHEN SET INPUT VALUE
//p2 - doc this:
/**
 * //p2 - doc this
remult.apiClient.httpClient = (
  input: RequestInfo | URL,
  init?: RequestInit
) => {
  return fetch(input, {
    ...init,
    headers: {
      authorization: 'Bearer ' + sessionStorage.sessionId,
    },
    cache: 'no-store',
  })
}

&&
remult.apiClient.url='localhost:3007/api


 */
//p2 - with remult promise for remultexpress
//p2 - 'update tasks set  where id = $1
//p2 - live query refresh of view on table update
//p2 - Operator '>' cannot be applied to types 'Number' and 'number'.ts(2365) - change fields to <entityType,number> (now it's Number)
//p2 - Field(()=>String) - doesn't play nice with strict mode - it prevents people from extending basic types
//p2 - with remult for remultexpress
//p2 - Add a with remult promise to Remult!

//y1 - YONI why didn't this._.relations.statusChanges.insert({})work?
//y1 - YONI - trieed to implement this with  OmitFunctions - but it breaks this.$.[something] a good name from fields and relations

//p2 - filterToRaw should get a dbnames of - and we should create a dbnames of that supports an alias

//y2 - livequery for findfirst (@JY)
//y2 - #239 - (@JY) add a way to get from fieldMetadata back to entity repo (like we have in fieldRef)
//p2 - constraints (@JY)
//p2 - Add ability to process query that comes from the api
//p2 - too much data by mistake
//p2 - postgres case sensitive

//p2 - fix sql log to console to make more sense
//p2 - type metadata.key - to keyof entity - based on cwis input
//p2 - processError in remult express
//y1 - should we change relations to be a static const instead of a class (also for fields maybe) what's the point of doing new Relations
//y1 - add Class type to index of remult - it is used in repo and is important
//y2 - Backend methods are transactions, it's not intuitive and maybe should be optional / opt in
//p2 - get backend methods to work when specifying types for date, and entities as poco's
//p2 - allow find options preprocessor for api calls, to use for authorization
//y2 - remove __dirname from tutorials
//y2 - add some api testing framework for user unit tests (will help with codesandbox based discussions)
//y2 - I tihnk there should be a way to throw a forbidden exception
