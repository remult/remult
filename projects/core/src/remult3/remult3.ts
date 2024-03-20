import type { ErrorInfo, FieldOptions } from '../../index.js'
import type { ClassType } from '../../classType.js'
import type { entityEventListener } from '../__EntityValueProvider.js'
import type { FieldMetadata } from '../column-interfaces.js'
import type { EntityOptions } from '../entity.js'
import type {
  LiveQueryChange,
  SubscriptionListener,
  Unsubscribe,
} from '../live-query/SubscriptionChannel.js'
import type { SortSegment } from '../sort.js'
import type { EntityBase } from './RepositoryImplementation.js'

export interface EntityRefBase<entityType> extends Subscribable {
  hasErrors(): boolean
  undoChanges()
  save(): Promise<entityType>
  reload(): Promise<entityType>
  delete(): Promise<void>
  isNew(): boolean //
  wasChanged(): boolean
  wasDeleted(): boolean
  error: string
  getId(): idType<entityType>
  getOriginalId(): idType<entityType>
  repository: Repository<entityType>
  metadata: EntityMetadata<entityType>
  toApiJson(): any
  validate(): Promise<ErrorInfo<entityType> | undefined>
  readonly apiUpdateAllowed: boolean
  readonly apiDeleteAllowed: boolean
  readonly apiInsertAllowed: boolean
  readonly isLoading: boolean
  clone(): entityType
}

export interface EntityRef<entityType> extends EntityRefBase<entityType> {
  fields: FieldsRef<entityType>
  relations: RepositoryRelations<entityType>
}

export interface EntityRefForEntityBase<entityType>
  extends EntityRefBase<entityType> {
  fields: FieldsRefForEntityBase<entityType>
  relations: RepositoryRelationsForEntityBase<entityType>
}

export interface ValidateFieldEvent<entityType = any, valueType = any> {
  error: string
  value: valueType
  originalValue: valueType
  valueChanged(): boolean
  entityRef: EntityRef<entityType>
  metadata: FieldMetadata<valueType>
  load(): Promise<valueType>
  valueIsNull(): boolean
  originalValueIsNull(): boolean
  isBackend(): boolean
  isNew: boolean
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
export interface ControllerRefBase<entityType> extends Subscribable {
  hasErrors(): boolean
  error: string
  validate(): Promise<ErrorInfo<entityType> | undefined>
  readonly isLoading: boolean
}

export interface ControllerRef<entityType>
  extends ControllerRefBase<entityType> {
  fields: FieldsRef<entityType>
}

export interface ControllerRefForControllerBase<entityType>
  extends ControllerRefBase<entityType> {
  fields: FieldsRefForEntityBase<entityType>
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

export type FieldsRefBase<entityType> = {
  find(fieldMetadataOrKey: FieldMetadata | string): FieldRef<entityType, any>
  [Symbol.iterator]: () => IterableIterator<FieldRef<entityType, any>>
  toArray(): FieldRef<entityType, any>[]
}
export type FieldsMetadata<entityType> = {
  [Properties in keyof MembersOnly<entityType>]: FieldMetadata<
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

export type FieldsRef<entityType> = FieldsRefBase<entityType> & {
  [Properties in keyof MembersOnly<entityType>]: NonNullable<
    entityType[Properties]
  > extends {
    id?: number | string
  }
    ? IdFieldRef<entityType, entityType[Properties]>
    : FieldRef<entityType, entityType[Properties]>
}

export type FieldsRefForEntityBase<entityType> = FieldsRefBase<entityType> & {
  [Properties in keyof Omit<entityType, keyof EntityBase>]: NonNullable<
    entityType[Properties]
  > extends {
    id?: number | string
  }
    ? IdFieldRef<entityType, entityType[Properties]>
    : FieldRef<entityType, entityType[Properties]>
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
  getId(item: Partial<MembersOnly<entityType>>): any
  field: FieldMetadata<any>
  getIdFilter(...ids: any[]): EntityFilter<entityType>
  isIdField(col: FieldMetadata): boolean
  createIdInFilter(
    items: Partial<MembersOnly<entityType>>[],
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
  /** The name of the table in the database that holds the data for this entity.
   * If no name is set in the entity options, the `key` will be used instead.
   */
  readonly dbName: string
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

  /**
   * @deprecated Returns the dbName - based on it's `dbName` option and it's `sqlExpression` option */
  getDbName(): Promise<string>
  /** Metadata for the Entity's id */
  readonly idMetadata: IdMetadata<entityType>
}

export declare type MembersOnly<T> = {
  [K in keyof Omit<T, keyof EntityBase> as T[K] extends Function
    ? never
    : K]: T[K]
}
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
  /** returns the first item that matchers the `where` condition
   * @example
   * await taskRepo.findOne({ where:{ completed:false }})
   * @example
   * await taskRepo.findFirst({ where:{ completed:false }, createIfNotFound: true })
   *      */
  findOne(options?: FindFirstOptions<entityType>): Promise<entityType>
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
    ...fields: Extract<keyof MembersOnly<entityType>, string>[]
  ): Promise<ErrorInfo<entityType> | undefined>
  /** saves an item or item[] to the data source. It assumes that if an `id` value exists, it's an existing row - otherwise it's a new row
   * @example
   * await taskRepo.save({...task, completed:true })
   */

  save(item: Partial<MembersOnly<entityType>>[]): Promise<entityType[]>
  save(item: Partial<MembersOnly<entityType>>): Promise<entityType>

  /**Insert an item or item[] to the data source
   * @example
   * await taskRepo.insert({title:"task a"})
   * @example
   * await taskRepo.insert([{title:"task a"}, {title:"task b", completed:true }])
   */
  insert(item: Partial<MembersOnly<entityType>>[]): Promise<entityType[]>
  insert(item: Partial<MembersOnly<entityType>>): Promise<entityType>

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
    item: Partial<MembersOnly<entityType>>,
  ): Promise<entityType>
  update(
    id: Partial<MembersOnly<entityType>>,
    item: Partial<MembersOnly<entityType>>,
  ): Promise<entityType>
  /**
   * Updates all items that match the `where` condition.
   */
  updateMany(
    where: EntityFilter<entityType>,
    item: Partial<MembersOnly<entityType>>,
  ): Promise<number>

  /** Deletes an Item*/
  delete(
    id: entityType extends { id?: number }
      ? number
      : entityType extends { id?: string }
      ? string
      : string | number,
  ): Promise<void>
  delete(item: Partial<MembersOnly<entityType>>): Promise<void>
  /**
   * Deletes all items that match the `where` condition.
   */
  deleteMany(where: EntityFilter<entityType>): Promise<number>

  /** Creates an instance of an item. It'll not be saved to the data source unless `save` or `insert` will be called for that item */
  create(item?: Partial<MembersOnly<entityType>>): entityType

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
  relations(item: entityType): RepositoryRelations<entityType>
}
/**
 * The `LiveQuery` interface represents a live query that allows subscribing to changes in the query results.
 *
 * @template entityType The entity type for the live query.
 */
export interface LiveQuery<entityType> {
  /**
   * Subscribes to changes in the live query results.
   *
   * @param {(info: LiveQueryChangeInfo<entityType>) => void} next A function that will be called with information about changes in the query results.
   * @returns {Unsubscribe} A function that can be used to unsubscribe from the live query.
   *
   * @example
   * // Subscribing to changes in a live query
   * const unsubscribe = taskRepo
   *   .liveQuery({
   *     limit: 20,
   *     orderBy: { createdAt: 'asc' }
   *     //where: { completed: true },
   *   })
   *   .subscribe(info => setTasks(info.applyChanges));
   *
   * // Later, to unsubscribe
   * unsubscribe();
   */
  subscribe(next: (info: LiveQueryChangeInfo<entityType>) => void): Unsubscribe

  /**
   * Subscribes to changes in the live query results using a `SubscriptionListener` object.
   *
   * @param {Partial<SubscriptionListener<LiveQueryChangeInfo<entityType>>>} listener An object that implements the `SubscriptionListener` interface.
   * @returns {Unsubscribe} A function that can be used to unsubscribe from the live query.
   */
  subscribe(
    listener: Partial<SubscriptionListener<LiveQueryChangeInfo<entityType>>>,
  ): Unsubscribe
}
/**
 * The `LiveQueryChangeInfo` interface represents information about changes in the results of a live query.
 *
 * @template entityType The entity type for the live query.
 */
export interface LiveQueryChangeInfo<entityType> {
  /**
   * The updated array of result items.
   *
   * @type {entityType[]}
   */
  items: entityType[]

  /**
   * The changes received in the specific message. The change types can be "all" (replace all), "add", "replace", or "remove".
   *
   * @type {LiveQueryChange[]}
   */
  changes: LiveQueryChange[]

  /**
   * Applies the changes received in the message to an existing array. This method is particularly useful with React
   * to update the component's state based on the live query changes.
   *
   * @param {entityType[] | undefined} prevState The previous state of the array of result items.
   * @returns {entityType[]} The updated array of result items after applying the changes.
   *
   * @example
   * // Using applyChanges in a React component with useEffect hook
   * useEffect(() => {
   *   return taskRepo
   *     .liveQuery({
   *       limit: 20,
   *       orderBy: { createdAt: 'asc' }
   *       //where: { completed: true },
   *     })
   *     .subscribe(info => setTasks(info.applyChanges));
   * }, []);
   */
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
  [Properties in keyof Partial<MembersOnly<entityType>>]?: 'asc' | 'desc'
}

/**Used to filter the desired result set
 * @see [EntityFilter](http://remult.dev/docs/entityFilter.html)
 */
export declare type EntityFilter<entityType> = {
  [Properties in keyof Partial<MembersOnly<entityType>>]?:
    | (Partial<entityType>[Properties] extends number | Date | undefined
        ? ComparisonValueFilter<Partial<entityType>[Properties]>
        : Partial<entityType>[Properties] extends string | undefined
        ?
            | Partial<entityType>[Properties]
            | (ContainsStringValueFilter &
                ComparisonValueFilter<Partial<entityType>[Properties]>)
        : Partial<entityType>[Properties] extends boolean | undefined
        ? ValueFilter<boolean>
        : Partial<entityType>[Properties] extends
            | { id?: string | number }
            | undefined
        ? IdFilter<Partial<entityType>[Properties]>
        : ValueFilter<Partial<entityType>[Properties]>)
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
  $notContains?: string
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
    [K in keyof toEntity]?: keyof fromEntity & string
  }
  /**
   * The name of the field for this relation.
   */
  field?: keyof matchIdEntity & string
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

export type ObjectMembersOnly<T> = MembersOnly<{
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

export type RepositoryRelationsForEntityBase<entityType> = {
  [K in keyof Omit<entityType, keyof EntityBase>]-?: NonNullable<
    entityType[K]
  > extends Array<infer R>
    ? Repository<R>
    : entityType[K] extends infer R
    ? { findOne: (options?: FindOptionsBase<R>) => Promise<R> }
    : never
}

export declare type EntityIdFields<entityType> = {
  [Properties in keyof Partial<MembersOnly<entityType>>]?: true
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

/*y1 - workshop

* Experiment with doing this with version control - so the students can follow changes
* Prepare stackblitz


# influencer:
  * review react summit
# 

//y1 - getFields didn't work for kobi in the home component

//p1 - processError in remult express
//p1 - add section to Fields doc, explaining field type in db
//p1 - add section about union type
//p1 - add section about value list field type

/*y1 - Talk JYC - JYC - add some integrity checks on delete
  - soft delete
  - delete restrict (implicit, or user selected - and if so, how) (delete & update of id)

*/
//y1 תגיד - updateMany צריך להחזיר את השורות שעודכנו (כמו update או insert) או כמה שורות עודכנו (כמו deleteMany)

/*y1 currency.ts:10 Uncaught TypeError: Currency_1 is not a constructor
// - ValueListFieldType - the decorator gives an error in react vite project - see langulage yedidya

@ValueListFieldType()
export class Currency {
  constructor(
    public id: number,
    public caption: string,
    public symbol: string
  ) {}
  static shekel = new Currency(1, 'Shekel', '₪');
  static dollar = new Currency(2, 'Dollar', '$');
  static euro = new Currency(3, 'Euro', '€');
  static pound = new Currency(4, 'Pound', '£');
  static yen = new Currency(5, 'Yen', '¥');
}

*/
//y1 - allow api read to also support instance and filter. - problem with promise

//y1 - admin url!
//y1 - consider sql expression gets a dbnames of it's own (that already has the "tableName" defined correctly) maybe also the filter translator
//y1 - talk about modules in init express with entities/controllers,initRequest,initApi
//y1 - tried to upgrade vitest, nuxt tests are failing with loading uuid - sounds familiar?
//y1 - I think that the tests you've setup don't cover next app router - I added to the setup, but not sure where else
//y1 - support get with backend method, with url search params as the first parameter, & url as second parameter
//y1 - talk about the parameter issue with backend methods
//y1 - select data provider per entity https://discord.com/channels/975754286384418847/976006081748807690/1201415305885397003
//y1 - migrations
//y1 - live query refresh of view on table update
//y1 - main vs master
//y2 - livequery for findfirst (@JY)

/*y2 - 
//y2 - allow api update only for new rows
  @Fields.string<Category>({
    allowApiUpdate: (c) => getEntityRef(c).isNew(),
  })
  Description = ""*/
//y2 - get backend methods to work when specifying types for date, and entities as poco's
//y2 - conside law-q db based on schema issue - I think that while running the dataProvider function, we should have a valid remult - maybe even have a valid remult, that will be valid until api is run
//y2 - #239 - (@JY) add a way to get from fieldMetadata back to entity repo (like we have in fieldRef)
//y2 - constraints (@JY)

/*p2 remult admin

 - Small thing, I get SvelteKitError: Not found: /vite.svg
 - understand the to many relation for the admin, based on the to one
 - relation from order details to order gave a compound id info - and it is not true - same for the relation to product
 - new row when there are relations, looks funny (see product)
 - the + row in the bottom should extend to the full width
 - need a way to extract the fields from the relation - for generating relation based sql
 - allow conditional admin - like allowed
 - remult-admin doesn't handle primary key that has compound column
 - remult-admin didn't show a update for a table with a uniqua that is numeric
*/
//remult
//p1 - better support union types (status, etc... so it'll work also in filter etc...)

//p1 - when a tasks table exists in a different schema - we get many errors
//p1 - live query with include
//p1 - adjust angular tutorial starter kit for latest angular (as is in tutorial)
//p2 - I think there should be a way to throw a forbidden exception

//p2 - allow find options preprocessor for api calls, to use for authorization
//p2 - when subscribe is forbidden - the query still runs after the renew process
//p2 - 'update tasks set  where id = $1

//p2 - type metadata.key - to keyof entity - based on cwis input
//y2 - remove __dirname from tutorials
//p2 - when value changes for field with error, clear error - so the user will feel comfortable
//p2 - allowApiUpdate should be false for include in api false

//docs
//p2 - make sure that internal members do not appear in the documentation - try running it on the d.ts instead of the code itself.

//------

//y2 - from the crm-demo(https://crm-demo.up.railway.app/deals), after editing a deal: - _updateEntityBasedOnApi

//y2 - Backend methods are transactions, it's not intuitive and maybe should be optional / opt in
//y2 - how to run a transaction as a user
//p2 - enum column

//y2 - message for invalid value
//y2 - message for relation that is missing
//y2 - consider multi tenancies

//p2 - more column types

//p2 - document validators
//p2 - and validators to reference
//y2 - discuss a default date formatter
//y2 - add some api testing framework for user unit tests (will help with codesandbox based discussions)

//[ ] V2 - what to do about for relations count?
//[ ] V2 - condition? not to fetch if null etc....
//[ ] V3 - all these fields will also appear in the where etc... in the typescript api - but we will not enforce them

//y2 - consider if field types should include validation in them by default (string,number that it's not NaN etc...) and if so, what message?
//y2 - should enforce integer - currently we probably round / truncate it
//p1 - adjust react tutorial to esm
