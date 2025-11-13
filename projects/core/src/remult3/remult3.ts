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

export interface UpsertOptions<entityType> {
  where: Partial<MembersOnly<entityType>>
  set?: Partial<MembersOnly<entityType>>
}

export interface EntityRefBase<entityType> extends Subscribable {
  hasErrors(): boolean
  undoChanges(): void
  save(options?: InsertOrUpdateOptions): Promise<entityType>
  reload(): Promise<entityType>
  delete(): Promise<void>
  isNew(): boolean //
  wasChanged(): boolean
  wasDeleted(): boolean
  error: string | undefined
  getId(): idType<entityType>
  getOriginalId(): idType<entityType>
  repository: Repository<unknown> //unknown for hagai ts 4.6
  metadata: EntityMetadata<unknown> //unknown for hagai ts 4.6
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

export interface ValidateFieldEvent<entityType = unknown, valueType = unknown> {
  error?: string
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
  error: string | undefined
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
  [Properties in keyof MembersOnly<entityType>]-?: FieldMetadata<
    entityType[Properties],
    entityType
  >
} & {
  find(
    fieldMetadataOrKey: FieldMetadata | string,
  ): FieldMetadata<unknown, entityType>
  [Symbol.iterator]: () => IterableIterator<FieldMetadata<any, entityType>>
  toArray(): FieldMetadata<any, entityType>[]
}

export type FieldsRef<entityType> = FieldsRefBase<entityType> & {
  [Properties in keyof MembersOnly<entityType>]-?: NonNullable<
    entityType[Properties]
  > extends {
    id?: number | string
  }
    ? IdFieldRef<entityType, entityType[Properties]>
    : FieldRef<entityType, entityType[Properties]>
}

export type FieldsRefForEntityBase<entityType> = FieldsRefBase<entityType> & {
  [Properties in keyof Omit<entityType, keyof EntityBase>]-?: NonNullable<
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
  ): void
  getId(): valueType extends { id?: number }
    ? number
    : valueType extends { id?: string }
      ? string
      : string | number
}

export interface FieldRef<entityType = unknown, valueType = unknown>
  extends Subscribable {
  error: string | undefined
  displayValue: string
  value: valueType
  originalValue: valueType
  inputValue: string
  valueChanged(): boolean
  entityRef: EntityRef<entityType>
  container: entityType
  metadata: FieldMetadata<valueType>
  /**
   * Loads the related value - returns null if the related value is not found
   */
  load(): Promise<valueType>
  valueIsNull(): boolean
  originalValueIsNull(): boolean
  validate(): Promise<boolean>
}

export interface IdMetadata<entityType = unknown> {
  /** Extracts the id value of an entity item. Useful in cases where the id column is not called id
   * @example
   * repo.metadata.idMetadata.getId(task)
   */
  getId(item: Partial<MembersOnly<entityType>>): any
  field: FieldMetadata<any>
  fields: FieldMetadata<unknown>[]
  getIdFilter(...ids: any[]): EntityFilter<entityType>
  isIdField(col: FieldMetadata): boolean
  createIdInFilter(
    items: Partial<MembersOnly<entityType>>[],
  ): EntityFilter<entityType>
}

/** Metadata for an `Entity`, this metadata can be used in the user interface to provide a richer UI experience  */
export interface EntityMetadata<entityType = unknown> {
  /** The Entity's key also used as it's url  */
  readonly key: string
  /** Metadata for the Entity's fields */
  readonly fields: FieldsMetadata<entityType> //expose fields to repository
  /** A human readable caption for the entity. Can be used to achieve a consistent caption for a field throughout the app
   * @example
   * <h1>Create a new item in {taskRepo.metadata.caption}</h1>
   * @see {@link EntityOptions.caption}
   */
  readonly caption: string
  /** A human readable label for the entity. Can be used to achieve a consistent label for a field throughout the app
   * @example
   * <h1>Create a new item in {taskRepo.metadata.label}</h1>
   * @see {@link EntityOptions.label}
   */
  readonly label: string
  /** The name of the table in the database that holds the data for this entity.
   * If no name is set in the entity options, the `key` will be used instead.
   * @see {@link EntityOptions.dbName}
   */
  readonly dbName: string
  /** The options send to the `Entity`'s decorator
   * @see {@link EntityOptions}
   */
  readonly options: EntityOptions
  /** The class type of the entity */
  readonly entityType: ClassType<entityType>
  /** true if the current user is allowed to update an entity instance
   * @see {@link EntityOptions.allowApiUpdate}
   * @example
   * ```ts
   * if (repo(Task).metadata.apiUpdateAllowed(task)){
   *   // Allow user to edit the entity
   * }
   * ```
   */
  apiUpdateAllowed(item?: entityType): boolean
  /** true if the current user is allowed to read from entity
   * @see {@link EntityOptions.allowApiRead}
   * @example
   * if (repo(Task).metadata.apiReadAllowed){
   *   await taskRepo.find()
   * }
   */
  readonly apiReadAllowed: boolean
  /** true if the current user is allowed to delete an entity instance
   * @see {@link EntityOptions.allowApiDelete}
   * @example
   * if (repo(Task).metadata.apiDeleteAllowed(task)){
   *   // display delete button
   * }
   */
  apiDeleteAllowed(item?: entityType): boolean
  /** true if the current user is allowed to create an entity instance
   * @see {@link EntityOptions.allowApiInsert}
   * @example
   * if (repo(Task).metadata.apiInsertAllowed(task)){
   *   // display insert button
   * }
   */
  apiInsertAllowed(item?: entityType): boolean

  /**
   * @deprecated Returns the dbName - based on it's `dbName` option and it's `sqlExpression` option */
  getDbName(): Promise<string>
  /** Metadata for the Entity's id
   * @see {@link EntityOptions.id} for configuration
   *
   */
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
export declare type idType<entityType> = entityType extends {
  id?: infer U
}
  ? U extends string
    ? string
    : U extends number
      ? number
      : string | number
  : string | number

export type NumericKeys<T> = {
  [K in keyof T]: T[K] extends number | undefined | null ? K : never
}[keyof T]

/**
 * Options for performing aggregation on an entity in the repository.
 *
 * @template entityType The entity type.
 * @template groupByFields The fields to group by, provided as an array of keys from the entity type.
 * @template sumFields The fields to sum, provided as an array of numeric keys from the entity type.
 * @template averageFields The fields to average, provided as an array of numeric keys from the entity type.
 * @template minFields The fields to find the minimum value, provided as an array of numeric keys from the entity type.
 * @template maxFields The fields to find the maximum value, provided as an array of numeric keys from the entity type.
 * @template distinctCountFields The fields to count distinct values, provided as an array of keys from the entity type.
 *
 * @example
 * // Grouping by country and city, summing the salary field, and ordering by country and sum of salary:
 * const results = await repo.groupBy({
 *   group: ['country', 'city'],
 *   sum: ['salary'],
 *   where: {
 *     salary: { $ne: 1000 },
 *   },
 *   orderBy: {
 *     country: 'asc',
 *     salary: {
 *       sum: 'desc',
 *     },
 *   },
 * });
 *
 * // Accessing the results:
 * console.log(results[0].country); // 'uk'
 * console.log(results[0].city); // 'London'
 * console.log(results[0].$count); // count for London, UK
 * console.log(results[0].salary.sum); // Sum of salaries for London, UK
 *
 * @example
 * // Aggregating without grouping (summing the salary field across all entities):
 * const totalSalary = await repo.aggregate({
 *   sum: ['salary'],
 * });
 * console.log(totalSalary.salary.sum); // Outputs the total sum of salaries
 */
export type GroupByOptions<
  entityType,
  groupByFields extends (keyof MembersOnly<entityType>)[],
  sumFields extends NumericKeys<entityType>[],
  averageFields extends NumericKeys<entityType>[],
  minFields extends (keyof MembersOnly<entityType>)[],
  maxFields extends (keyof MembersOnly<entityType>)[],
  distinctCountFields extends (keyof MembersOnly<entityType>)[],
> = {
  /**
   * Fields to group by. The result will include one entry per unique combination of these fields.
   */
  group?: groupByFields

  /**
   * Fields to sum. The result will include the sum of these fields for each group.
   */
  sum?: sumFields

  /**
   * Fields to average. The result will include the average of these fields for each group.
   */
  avg?: averageFields

  /**
   * Fields to find the minimum value. The result will include the minimum value of these fields for each group.
   */
  min?: minFields

  /**
   * Fields to find the maximum value. The result will include the maximum value of these fields for each group.
   */
  max?: maxFields

  /**
   * Fields to count distinct values. The result will include the distinct count of these fields for each group.
   */
  distinctCount?: distinctCountFields

  /**
   * Filters to apply to the query before aggregation.
   * @see EntityFilter
   */
  where?: EntityFilter<entityType>

  /**
   * Fields and aggregates to order the results by.
   * The result can be ordered by groupBy fields, sum fields, average fields, min fields, max fields, and distinctCount fields.
   */
  orderBy?: {
    [K in groupByFields[number]]?: 'asc' | 'desc'
  } & {
    [K in sumFields[number]]?: { sum?: 'asc' | 'desc' }
  } & {
    [K in averageFields[number]]?: { avg?: 'asc' | 'desc' }
  } & {
    [K in minFields[number]]?: { min?: 'asc' | 'desc' }
  } & {
    [K in maxFields[number]]?: { max?: 'asc' | 'desc' }
  } & {
    [K in distinctCountFields[number]]?: { distinctCount?: 'asc' | 'desc' }
  } & {
    $count?: 'asc' | 'desc'
  }
} & Pick<FindOptions<entityType>, 'limit' | 'page'>

export const GroupByCountMember = '$count' as const
export const GroupByForApiKey = Symbol.for('GroupByForApiKey')
export const GroupByOperators = [
  'sum',
  'avg',
  'min',
  'max',
  'distinctCount',
] as const
export type GroupByResult<
  entityType,
  groupByFields extends (keyof entityType)[],
  sumFields extends NumericKeys<entityType>[],
  averageFields extends NumericKeys<entityType>[],
  minFields extends NumericKeys<entityType>[],
  maxFields extends NumericKeys<entityType>[],
  distinctCountFields extends (keyof entityType)[],
> = {
  [K in
    | groupByFields[number]
    | sumFields[number]]: K extends groupByFields[number]
    ? entityType[K]
    : K extends sumFields[number]
      ? { sum: number }
      : never
} & { [K in averageFields[number]]: { avg: number } } & {
  [K in minFields[number]]: { min: number }
} & { [K in maxFields[number]]: { max: number } } & {
  [K in distinctCountFields[number]]: { distinctCount: number }
} & {
  $count: number
}

/** used to perform CRUD operations on an `entityType` */
export interface Repository<entityType> {
  /** returns an array based on the provided options */
  find(options?: FindOptions<entityType>): Promise<entityType[]>
  /** Using the same options as the {@link find} method, but subscribing to entity changes.
   *
   * _Note that today it subscribes to entity changes, but not included entities [Feature Request](https://github.com/remult/remult/issues/712)!_
   *
   * @see {@link LiveQuery}
   */
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
  ): Promise<entityType | undefined>
  /** returns the first item that matchers the `where` condition
   * @example
   * await taskRepo.findOne({ where:{ completed:false }})
   * @example
   * await taskRepo.findFirst({ where:{ completed:false }, createIfNotFound: true })
   *      */
  findOne(
    options?: FindFirstOptions<entityType>,
  ): Promise<entityType | undefined>
  /** returns the items that matches the id. If id is undefined | null, returns null */
  findId(
    id: idType<entityType>,
    options?: FindFirstOptionsBase<entityType>,
  ): Promise<entityType | undefined | null>

  /**
   * Performs an aggregation on the repository's entity type based on the specified options.
   *
   * @template entityType The type of the entity being aggregated.
   * @template groupByFields The fields to group by, provided as an array of keys from the entity type.
   * @template sumFields The fields to sum, provided as an array of numeric keys from the entity type.
   * @template averageFields The fields to average, provided as an array of numeric keys from the entity type.
   *
   * @param {GroupByOptions<entityType, groupByFields, sumFields, averageFields>} options - The options for the aggregation.
   * @returns {Promise<GroupByResult<entityType, groupByFields, sumFields, averageFields>[]> } The result of the aggregation.
   *
   * @example
   * // Grouping by country and city, summing the salary field, and ordering by country and sum of salary:
   * const results = await repo.groupBy({
   *   group: ['country', 'city'],
   *   sum: ['salary'],
   *   where: {
   *     salary: { $ne: 1000 },
   *   },
   *   orderBy: {
   *     country: 'asc',
   *     salary: {
   *       sum: 'desc',
   *     },
   *   },
   * });
   *
   * // Accessing the results:
   * console.log(results[0].country); // 'uk'
   * console.log(results[0].city); // 'London'
   * console.log(results[0].$count); // count for London, UK
   * console.log(results[0].salary.sum); // Sum of salaries for London, UK
   *

   */
  groupBy<
    groupByFields extends
      | (keyof MembersOnly<entityType>)[]
      | undefined = undefined,
    sumFields extends NumericKeys<entityType>[] | undefined = undefined,
    averageFields extends NumericKeys<entityType>[] | undefined = undefined,
    minFields extends (keyof MembersOnly<entityType>)[] | undefined = undefined,
    maxFields extends (keyof MembersOnly<entityType>)[] | undefined = undefined,
    distinctCountFields extends
      | (keyof MembersOnly<entityType>)[]
      | undefined = undefined,
  >(
    options: GroupByOptions<
      entityType,
      groupByFields extends undefined ? never : groupByFields,
      sumFields extends undefined ? never : sumFields,
      averageFields extends undefined ? never : averageFields,
      minFields extends undefined ? never : minFields,
      maxFields extends undefined ? never : maxFields,
      distinctCountFields extends undefined ? never : distinctCountFields
    >,
  ): Promise<
    GroupByResult<
      entityType,
      groupByFields extends undefined ? never : groupByFields,
      sumFields extends undefined ? never : sumFields,
      averageFields extends undefined ? never : averageFields,
      minFields extends undefined ? never : minFields,
      maxFields extends undefined ? never : maxFields,
      distinctCountFields extends undefined ? never : distinctCountFields
    >[]
  >
  /**
   * Performs an aggregation on the repository's entity type based on the specified options.
   * @template entityType The type of the entity being aggregated.
   * @template sumFields The fields to sum, provided as an array of numeric keys from the entity type.
   * @template averageFields The fields to average, provided as an array of numeric keys from the entity type.
   *
   * @param {GroupByOptions<entityType, groupByFields, sumFields, averageFields>} options - The options for the aggregation.
   * @returns {Promise<GroupByResult<entityType, groupByFields, sumFields, averageFields>[]> } The result of the aggregation.
   *
   * @example
   * // Aggregating  (summing the salary field across all items):
   * const totalSalary = await repo.aggregate({
   *   sum: ['salary'],
   * });
   * console.log(totalSalary.salary.sum); // Outputs the total sum of salaries

   */
  aggregate<
    sumFields extends NumericKeys<entityType>[] | undefined = undefined,
    averageFields extends NumericKeys<entityType>[] | undefined = undefined,
    minFields extends (keyof MembersOnly<entityType>)[] | undefined = undefined,
    maxFields extends (keyof MembersOnly<entityType>)[] | undefined = undefined,
    distinctCountFields extends
      | (keyof MembersOnly<entityType>)[]
      | undefined = undefined,
  >(
    options: Omit<
      GroupByOptions<
        entityType,
        never,
        sumFields extends undefined ? never : sumFields,
        averageFields extends undefined ? never : averageFields,
        minFields extends undefined ? never : minFields,
        maxFields extends undefined ? never : maxFields,
        distinctCountFields extends undefined ? never : distinctCountFields
      >,
      'orderBy' | 'limit' | 'page' | 'group'
    >,
  ): Promise<
    GroupByResult<
      entityType,
      never,
      sumFields extends undefined ? never : sumFields,
      averageFields extends undefined ? never : averageFields,
      minFields extends undefined ? never : minFields,
      maxFields extends undefined ? never : maxFields,
      distinctCountFields extends undefined ? never : distinctCountFields
    >
  >

  /**
   * Fetches data from the repository in a way that is optimized for handling large sets of entity objects.
   *
   * Unlike the `find` method, which returns an array, the `query` method returns an iterable `QueryResult` object.
   * This allows for more efficient data handling, particularly in scenarios that involve paging through large amounts of data.
   *
   * The method supports pagination and aggregation in a single request. When aggregation options are provided,
   * the result will include both the items from the current page and the results of the requested aggregation.
   *
   * The `query` method is designed for asynchronous iteration using the `for await` statement.
   *
   * @example
   * // Basic usage with asynchronous iteration:
   * for await (const task of taskRepo.query()) {
   *   // Perform some operation on each task
   * }
   *
   * @example
   * // Querying with pagination:
   * const query = taskRepo.query({
   *   where: { completed: false },
   *   pageSize: 100,
   * });
   *
   * let paginator = await query.paginator();
   * console.log('Number of items on the current page:', paginator.items.length);
   * console.log('Total pages:', Math.ceil(paginator.aggregate.$count / 100));
   *
   * if (paginator.hasNextPage) {
   *   paginator = await paginator.nextPage();
   *   console.log('Items on the next page:', paginator.items.length);
   * }
   *
   * @example
   * // Querying with aggregation:
   * const query = await repo.query({
   *   where: { completed: false },
   *   pageSize: 50,
   *   aggregates: {
   *     sum: ['salary'],
   *     average: ['age'],
   *   }
   * });
   *
   * let paginator = await query.paginator();
   * // Accessing paginated items
   * console.table(paginator.items);
   *
   * // Accessing aggregation results
   * console.log('Total salary:', paginator.aggregates.salary.sum); // Sum of all salaries
   * console.log('Average age:', paginator.aggregates.age.average);  // Average age
   */

  query<
    Options extends QueryOptions<entityType> & {
      aggregate?: Omit<
        GroupByOptions<
          entityType,
          never,
          NumericKeys<entityType>[],
          NumericKeys<entityType>[],
          (keyof MembersOnly<entityType>)[],
          (keyof MembersOnly<entityType>)[],
          (keyof MembersOnly<entityType>)[]
        >,
        'group' | 'orderBy' | 'where' | 'limit' | 'page'
      >
    },
  >(
    options?: Options,
  ): Options extends {
    aggregate: Omit<
      GroupByOptions<
        entityType,
        never,
        NumericKeys<entityType>[],
        NumericKeys<entityType>[],
        (keyof MembersOnly<entityType>)[],
        (keyof MembersOnly<entityType>)[],
        (keyof MembersOnly<entityType>)[]
      >,
      'group' | 'orderBy' | 'where' | 'limit' | 'page'
    >
  }
    ? QueryResult<
        entityType,
        GroupByResult<
          entityType,
          never,
          NonNullable<Options['aggregate']['sum']>,
          NonNullable<Options['aggregate']['avg']>,
          NonNullable<Options['aggregate']['min']>,
          NonNullable<Options['aggregate']['max']>,
          NonNullable<Options['aggregate']['distinctCount']>
        >
      >
    : QueryResult<entityType>

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
  insert(
    item: Partial<MembersOnly<entityType>>[],
    options?: InsertOrUpdateOptions,
  ): Promise<entityType[]>
  insert(
    item: Partial<MembersOnly<entityType>>,
    options?: InsertOrUpdateOptions,
  ): Promise<entityType>

  /** Updates an item, based on its `id`
   * @example
   * taskRepo.update(task.id,{...task,completed:true})
   */
  update(
    id: idType<entityType>,
    item: Partial<MembersOnly<entityType>>,
    options?: InsertOrUpdateOptions,
  ): Promise<entityType>
  update(
    id: Partial<MembersOnly<entityType>>,
    item: Partial<MembersOnly<entityType>>,
    options?: InsertOrUpdateOptions,
  ): Promise<entityType>
  /**
   * Updates all items that match the `where` condition.
   */
  updateMany(options: {
    where: EntityFilter<entityType> | 'all'
    set: Partial<MembersOnly<entityType>>
  }): Promise<number>

  /**
   * Inserts a new entity or updates an existing entity based on the specified criteria.
   * If an entity matching the `where` condition is found, it will be updated with the provided `set` values.
   * If no matching entity is found, a new entity will be created with the given data.
   *
   * The `upsert` method ensures that a row exists based on the `where` condition: if no entity is found, a new one is created.
   * It can handle both single and multiple upserts.
   *
   * @template entityType The type of the entity being inserted or updated.
   *
   * @param {UpsertOptions<entityType> | UpsertOptions<entityType>[]} options - The options that define the `where` condition and the `set` values. Can be a single object or an array of objects.
   * @returns {Promise<entityType | entityType[]>} A promise that resolves with the inserted or updated entity, or an array of entities if multiple options were provided.
   *
   * @example
   * // Upserting a single entity: updates 'task a' if it exists, otherwise creates it.
   * taskRepo.upsert({ where: { title: 'task a' }, set: { completed: true } });
   *
   * @example
   * // Upserting a single entity without additional `set` values: ensures that a row with the title 'task a' exists.
   * taskRepo.upsert({ where: { title: 'task a' } });
   *
   * @example
   * // Upserting multiple entities: ensures both 'task a' and 'task b' exist, updating their `completed` status if found.
   * taskRepo.upsert([
   *   { where: { title: 'task a' }, set: { completed: true } },
   *   { where: { title: 'task b' }, set: { completed: true } }
   * ]);
   */
  upsert(options: UpsertOptions<entityType>[]): Promise<entityType[]>
  upsert(options: UpsertOptions<entityType>): Promise<entityType>

  /** Deletes an Item*/
  delete(id: idType<entityType>): Promise<void>
  delete(item: Partial<MembersOnly<entityType>>): Promise<void>
  /**
   * Deletes all items that match the `where` condition.
   */
  deleteMany(options: {
    where: EntityFilter<entityType> | 'all'
  }): Promise<number>

  /** Creates an instance of an item. It'll not be saved to the data source unless `save` or `insert` will be called.
   *
   * It's useful to start or reset a form taking your entity default values into account.
   *
   */
  create(item?: Partial<MembersOnly<entityType>>): entityType

  /**
   * Translates an entity to a json object.
   * - Ready to be sent to the client _(Date & co are managed)_
   * - Strip out fields that are not allowed to be sent to the client! Check: [Field.includeInApi](http://remult.dev/docs/ref_field#includeinapi)
   *
   * @example
   * ```ts
   * const tasks = repo(Task).toJson(repo(Task).find())
   * ```
   *
   * @param item Can be an array or a single entity, awaitable or not
   */
  toJson(item: Promise<entityType[]>): Promise<any[]>
  toJson(item: entityType[]): any[]
  toJson(item: Promise<entityType>): Promise<any>
  toJson(item: entityType): any

  /**
   * Translates a json object to an item instance.
   *
   * @example
   * ```ts
   * const data = // from the server
   * const tasks = repo(Task).fromJson(data)
   * ```
   *
   * @param data Can be an array or a single element
   * @param isNew To help the creation of the instance
   */
  fromJson(data: any[], isNew?: boolean): entityType[]
  fromJson(data: any, isNew?: boolean): entityType
  /** returns an `entityRef` for an item returned by `create`, `find` etc... */
  getEntityRef(item: entityType): EntityRef<entityType>
  /** Provides information about the fields of the Repository's entity
   * @example
   * console.log(repo.fields.title.label) // displays the label of a specific field
   * console.log(repo.fields.title.options)// writes the options that were defined for this field
   */
  fields: FieldsMetadata<entityType>
  /**The metadata for the `entity`
   * @see [EntityMetadata](https://remult.dev/docs/ref_entitymetadata.html)
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
   * const unsubscribe = repo(Task)
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
  /** Number of rows returned. _(Defaults to 100 in the browser)_
   * @example
   * await repo(Products).find({ limit: 10 })
   */
  limit?: number
  /** Determines the page number to retrieve. Works in tandem with the `limit` option.
   * @example
   * await repo(Products).find({ page: 2 })
   */
  page?: number
}
/** Determines the order of items returned .
 * @example
 * await repo(Products).find({ orderBy: { name: "asc" }})
 * @example
 * await repo(Products).find({ orderBy: { price: "desc", name: "asc" }})
 */
export declare type EntityOrderBy<entityType> = {
  [Properties in keyof Partial<MembersOnly<entityType>>]?: 'asc' | 'desc'
}

/**Used to filter the desired result set
 * @see [EntityFilter](http://remult.dev/docs/entityFilter.html)
 */
export declare type EntityFilter<entityType> = {
  [Properties in keyof Partial<MembersOnly<entityType>>]?:
    | (Partial<entityType>[Properties] extends number | Date | undefined | null
        ? ComparisonValueFilter<Partial<entityType>[Properties]>
        : Partial<entityType>[Properties] extends string | undefined
          ?
              | Partial<entityType>[Properties]
              | (ContainsStringValueFilter &
                  ComparisonValueFilter<Partial<entityType>[Properties]>)
          : Partial<entityType>[Properties] extends boolean | undefined | null
            ? ValueFilter<boolean>
            : Partial<entityType>[Properties] extends
                  | { id?: string | number }
                  | undefined
              ? IdFilter<Partial<entityType>[Properties]>
              : ValueFilter<Partial<entityType>[Properties]>)
    | ContainsStringValueFilter
} & {
  /**
   * Represents an 'OR' filter condition where any of the specified filters can be true.
   *
   * @example
   * // Matches entities where the status is 1 or the archive is false
   * const filter = {
   *   $or: [
   *     { status: 1 },
   *     { archive: false }
   *   ]
   * };
   */
  $or?: EntityFilter<entityType>[]

  /**
   * Represents an 'AND' filter condition where all of the specified filters must be true.
   *
   * @example
   * // Matches entities where the status is 1 and the archive is false
   * const filter = {
   *   $and: [
   *     { status: 1 },
   *     { archive: false }
   *   ]
   * };
   */
  $and?: EntityFilter<entityType>[]

  /**
   * Represents a 'NOT' filter condition where the specified filter must be false.
   *
   * @example
   * // Matches entities where the status is not 1
   * const filter = {
   *   $not: { status: 1 }
   * };
   */
  $not?: EntityFilter<entityType>
}
interface testWhere {
  n: number
  nu: number | undefined
  nn: number | null
  nnu: number | null | undefined
}
const wn: EntityFilter<testWhere>[] = [{ n: 1 }, { n: { $gt: 1 } }]
const wnu: EntityFilter<testWhere>[] = [{ nu: 1 }, { nu: { $gt: 1 } }]
const wnn: EntityFilter<testWhere>[] = [
  { nn: 1 },
  { nn: { $gt: 1 } },
  { nn: null! },
]

export type ValueFilter<valueType> =
  | valueType
  | valueType[]
  | {
      /**
       * Represents a 'NOT EQUAL' filter condition where the value must not match the specified value or values.
       *
       * @example
       * // Matches entities where the status is not 1
       * const filter = {
       *   status: { $ne: 1 }
       * };
       *
       * @example
       * // Matches entities where the status is not 1, 2, or 3
       * const filter = {
       *   status: { $ne: [1, 2, 3] }
       * };
       */
      $not?: valueType | valueType[]
      /**
       * Represents a 'NOT EQUAL' filter condition where the value must not match the specified value or values.
       *
       * @example
       * // Matches entities where the status is not 1
       * const filter = {
       *   status: { $not: 1 }
       * };
       *
       * @example
       * // Matches entities where the status is not 1, 2, or 3
       * const filter = {
       *   status: { $not: [1, 2, 3] }
       * };
       */
      $ne?: valueType | valueType[]

      /**
       * Represents a 'NOT EQUAL' filter condition using the '!=' operator where the value must not match the specified value or values.
       *
       * @example
       * // Matches entities where the status is not 1
       * const filter = {
       *   status: { '!=': 1 }
       * };
       *
       * @example
       * // Matches entities where the status is not 1, 2, or 3
       * const filter = {
       *   status: { '!=': [1, 2, 3] }
       * };
       */
      '!='?: valueType | valueType[]

      /**
       * Represents an 'IN' filter condition where the value must match one of the specified values.
       *
       * @example
       * // Matches entities where the status is 1, 3, or 5
       * const filter = {
       *   status: { $in: [1, 3, 5] }
       * };
       */
      $in?: valueType[]

      /**
       * Represents a 'NOT IN' filter condition where the value must not match any of the specified values.
       *
       * @example
       * // Matches entities where the status is not 1, 2, or 3
       * const filter = {
       *   status: { $nin: [1, 2, 3] }
       * };
       */
      $nin?: valueType[]
    }
export type ComparisonValueFilter<valueType> = ValueFilter<valueType> & {
  /**
   * Represents a 'GREATER THAN' filter condition where the value must be greater than the specified value.
   *
   * @example
   * // Matches entities where the status is greater than 1
   * const filter = {
   *   status: { $gt: 1 }
   * };
   */
  $gt?: valueType

  /**
   * Represents a 'GREATER THAN' filter condition using the '>' operator where the value must be greater than the specified value.
   *
   * @example
   * // Matches entities where the status is greater than 1
   * const filter = {
   *   status: { '>': 1 }
   * };
   */
  '>'?: valueType

  /**
   * Represents a 'GREATER THAN OR EQUAL TO' filter condition where the value must be greater than or equal to the specified value.
   *
   * @example
   * // Matches entities where the status is greater than or equal to 1
   * const filter = {
   *   status: { $gte: 1 }
   * };
   */
  $gte?: valueType

  /**
   * Represents a 'GREATER THAN OR EQUAL TO' filter condition using the '>=' operator where the value must be greater than or equal to the specified value.
   *
   * @example
   * // Matches entities where the status is greater than or equal to 1
   * const filter = {
   *   status: { '>=': 1 }
   * };
   */
  '>='?: valueType

  /**
   * Represents a 'LESS THAN' filter condition where the value must be less than the specified value.
   *
   * @example
   * // Matches entities where the status is less than 1
   * const filter = {
   *   status: { $lt: 1 }
   * };
   */
  $lt?: valueType

  /**
   * Represents a 'LESS THAN' filter condition using the '<' operator where the value must be less than the specified value.
   *
   * @example
   * // Matches entities where the status is less than 1
   * const filter = {
   *   status: { '<': 1 }
   * };
   */
  '<'?: valueType

  /**
   * Represents a 'LESS THAN OR EQUAL TO' filter condition where the value must be less than or equal to the specified value.
   *
   * @example
   * // Matches entities where the status is less than or equal to 1
   * const filter = {
   *   status: { $lte: 1 }
   * };
   */
  $lte?: valueType

  /**
   * Represents a 'LESS THAN OR EQUAL TO' filter condition using the '<=' operator where the value must be less than or equal to the specified value.
   *
   * @example
   * // Matches entities where the status is less than or equal to 1
   * const filter = {
   *   status: { '<=': 1 }
   * };
   */
  '<='?: valueType
}
export interface ContainsStringValueFilter {
  /**
   * Represents a 'CONTAINS' filter condition where the value must contain the specified substring.
   *
   * @example
   * // Matches entities where the name contains 'joe'
   * const filter = {
   *   name: { $contains: 'joe' }
   * };
   */
  $contains?: string

  /**
   * Represents a 'NOT CONTAINS' filter condition where the value must not contain the specified substring.
   *
   * @example
   * // Matches entities where the name does not contain 'joe'
   * const filter = {
   *   name: { $notContains: 'joe' }
   * };
   */
  $notContains?: string

  /**
   * Represents a 'STARTS WITH' filter condition where the value must start with the specified substring.
   *
   * @example
   * // Matches entities where the name starts with 'joe'
   * const filter = {
   *   name: { $startsWith: 'joe' }
   * };
   */
  $startsWith?: string

  /**
   * Represents an 'ENDS WITH' filter condition where the value must end with the specified substring.
   *
   * @example
   * // Matches entities where the name ends with 'joe'
   * const filter = {
   *   name: { $endsWith: 'joe' }
   * };
   */
  $endsWith?: string
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
   * await repo(Order).find({
   *   load: (o) => [o.customer],
   * });
   *
   *
   * // Preferred usage with 'Relations.toOne' and 'include' option
   * await repo(Order).find({
   *   include: { customer: true },
   * });
   * ```
   */
  load?: (entity: FieldsMetadata<entityType>) => FieldMetadata[]
  /**
   * An option used to specify which related entities should be included when querying the source entity.
   * It allows you to eagerly load related data to avoid N+1 query problems.
   *
   * @param include An object specifying the related entities to include, their options, and filtering criteria.
   *
   * Example usage:
   * ```ts
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
  /**
   * An option used to specify which fields should be included in the result.
   * @example
   * ```ts
   * await repo(Task).find({ select: { id: true, title: true } })
   * ```
   */
  select?: EntitySelectFields<entityType>

  /** filters the data
   * @example
   * await taskRepo.find({ where: { completed:false } })
   * @see For more usage examples see [EntityFilter](https://remult.dev/docs/entityFilter.html)
   */
  where?: EntityFilter<entityType>
  /** Determines the order of items returned .
   * @example
   * await repo(Products).find({ orderBy: { name: "asc" }})
   * @example
   * await repo(Products).find({ orderBy: { price: "desc", name: "asc" }})
   */
  orderBy?: EntityOrderBy<entityType>
  args?: any
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
export type EmptyAggregateResult = 'EmptyAggregateResult'
/** The result of a call to the `query` method in the `Repository` object.
 */
export interface QueryResult<
  entityType,
  AggregateResult = EmptyAggregateResult,
> {
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

  /** gets the items in a specific page */
  getPage(pageNumber?: number): Promise<entityType[]>
  /** Performs an operation on all the items matching the query criteria */
  forEach(what: (item: entityType) => Promise<any>): Promise<number>

  /** Returns a `Paginator` object that is used for efficient paging */
  paginator(): Promise<Paginator<entityType, AggregateResult>>
}
/** An interface used to paginating using the `query` method in the `Repository` object
 *  @example
 * @example
 * const query = taskRepo.query({
 *   where: { completed: false },
 *   pageSize: 100,
 * })
 * const count = await query.count()
 * console.log('Paged: ' + count / 100)
 * let paginator = await query.paginator()
 * console.log(paginator.items.length)
 * if (paginator.hasNextPage) {
 *   paginator = await paginator.nextPage()
 *   console.log(paginator.items.length)
 * }
 */
export type Paginator<entityType, AggregateResult = EmptyAggregateResult> = {
  /** the items in the current page */
  items: entityType[]
  /** True if next page exists */
  hasNextPage: boolean

  /** the count of the total items in the `query`'s result */
  count(): Promise<number>

  /** Gets the next page in the `query`'s result set */
  nextPage(): Promise<Paginator<entityType, AggregateResult>>
} & (AggregateResult extends EmptyAggregateResult
  ? {}
  : { aggregates: AggregateResult })

/**
 * Options for configuring a relation between entities.
 *
 * @template fromEntity The type of the source entity (the entity defining the relation).
 * @template toEntity The type of the target entity (the related entity).
 * @template matchIdEntity The type used for matching IDs in the relation.
 * @template optionsType The type of find options to apply to the relation (default is FindOptionsBase<toEntity>).
 */

export interface RelationOptions<
  fromEntity,
  toEntity,
  matchIdEntity,
  optionsType extends FindOptionsBase<toEntity> = FindOptionsBase<toEntity>,
> extends Pick<FieldOptions, 'caption' | 'label'> {
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
}

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
export declare type EntitySelectFields<entityType> = {
  [Properties in keyof Partial<MembersOnly<entityType>>]?: boolean
}
export declare type InsertOrUpdateOptions = { select: 'none' }

export interface ClassFieldDecoratorContextStub<entityType, valueType> {
  readonly access: {
    set(object: entityType, value: valueType | null): void
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

export const flags = {
  error500RetryCount: 4,
}

/*p1 - issues in https://stackblitz.com/edit/demo-allow-delete-based-on-other-entity:
  - don't like the ensure schema
  - seems like this didn't work well in their version of sqlite:
    ```
    @Entity<TaskUser>('TaskUsers', {
      id: ['taskId', 'userId'],
    })
    ```
  - This could be better
    ```
    sqlExpression: async () => {
        if (!remult.authenticated()) return 'false';
        return (
          '1=' +
          (await sqlRelations(Task).taskUsers.$count({
            userId: [remult.user?.id],
            canDelete: true,
          }))
        );
      },
    ```
  
  - 
*/
/*p1 - https://github.com/remult/remult/discussions/438
  - should we use the arg for update and insert? for the returning query?
  - Does dbNamesOf still makes sense? I think that abstraction, regarding sql expression has lost it's merit
  - remember caching of sql expression  calculations that took a recursive amount of time for JYC
  - maybe introduce a ready dbNamesOf of argument that will be aware of prefixes
  - I've changed the order by to support order by 1

*/
//p1 - deleteAll({title:undefined}) should throw an error - not return 0 (with direct call to db)
//p1 - remult-create, move db question ahead of auth - everyone needs a database, not everyone need auth

//p1 - allow experimental route registration on remult server, with at least get route, and support redirect, read header and set header - (and the existing get html etc...)

//p2 - add parameter all to deleteMany, and updateMany
//p2  filter.apply ApiPreFilter
//p2 - signIn: (arg) =>withRemult(async () => { - consider if there's a generic way of doing signIn:withRemult(arg=>{})

/*p2 - add id and use uuid by default, but allow changes with Fields.id.defaultIdProvider NO but defaultProvider yes???
  //p2 - replace uuid with crypto.randomUUID and allow custom fallback NO
  //p2 - Add example for luid
  //p2 - add example for nanoid
  //p2 - explain the benefits of changing the default provider for testing in docs.
*/

//p2 - add some kind of options handler that will help with translation etc... like in hagai - something that runs at the stage where options are being built
//p2 - enforce api rules in some backend scenarios - https://discord.com/channels/975754286384418847/1292424895338119239

/*y1 - https://github.com/remult/remult/discussions/438
     - https://github.com/remult/remult/blob/query-argumets/projects/tests/dbs/test-sql-database.spec.ts#L100-L128
     //y1 - consider sql expression gets a dbnames of it's own (that already has the "tableName" defined correctly) maybe also the filter translator
     //p2 - allow preprocess to replace filter values - for example replace $contains on a specific field, with specific other sql - useful for full text search and other scenarios
     //y2 - soft-delete-discussion https://discord.com/channels/975754286384418847/1230386433093533698/1230386433093533698
*/
//p2 - fix query docs to also explain how it can be used for infinite scroll and pagination.
//p2 - when like doesn't have a string - don't send it to the db

//p2 - vite 5.3 supports ts5 decorators - check and adapt.
//p2 - tutorial about controller - and mutable controller
//p2 - docs abount subscription channel

//p2 - add LifecycleEvent to documentation
//p2 - fix chaining of saving and saved in multiple entity options args
//y1 - live query with count #436

//y1 TODO - In the esm version of our tutorial - the imports are automatically .ts and not .js in react and not in vue

//y1 TODO - fix remult admin not to load the html into memory until used

//y2 - talk about insert / update / delete with relations
/*
repo(Order).insert({},{
  relations:{
    orderItems:[{},{},{}]
  }
})
*/
//y2 - repo batch - for multiple operations:
//y2 - request by jy find and count / aggregate with a single call
/*
const result = await repo.batch(x=>({
  data:x.find(),
  count:x.count()
}))
*/

//y1 - wait a second to close stream -see pr

//p1 - prepare the createEntity discussion

//p2 - article on displayValue including it's definition for entities that is used in relations

//p2 - create foreign key constraints in user code - https://codesandbox.io/p/devbox/fk-validator-tdshcs, https://gist.github.com/jycouet/8b264e18c4d8605736f4353062a7d81e

//y2 - should we validate relations

//y1 - dependency of live query tables  live query refresh of view on table update

//y2 - consider replacing all errors with error classes that extend the base Error class
//y2 - should enforce integer - currently we probably round / truncate it
//y1 - talk about filter on objects that are not loaded -  {
//category: repo(CompoundId).create({ company: 7, index: 3, name: '' }),
//    }
/*y1 - talk about modules in init express with entities/controllers,initRequest,initApi
 - support get with backend method, with url search params as the first parameter, & url as second parameter
   - support returning redirect, and plain html (For sign in scenarios)

 */

//p1 - in this video I'll use remult to turn a frontend app to a fullstack app

/*y2 - Talk JYC - JYC - add some integrity checks on delete
  - soft delete
  - delete restrict (implicit, or user selected - and if so, how) (delete & update of id)

*/

//y1 - talk about the parameter issue with backend methods

//y2 - livequery for findfirst (@JY)

/*y2 -
//y2 - allow api update only for new rows
  @Fields.string<Category>({
    allowApiUpdate: (c) => getEntityRef(c).isNew(),
  })
  Description = ""*/
//p1 - get backend methods to work when specifying types for date, and entities as poco's - https://discord.com/channels/975754286384418847/976006081748807690/1289806378864476271
//y2 - constraints (@JY)

//p1 - when a tasks table exists in a different schema - we get many errors
//p1 - live query with include

//y2 - Fix problem with promise all in sql expression recurssion - when using PromiseAll in row relation loading, some sql expressions appear is recursion call even if they are not
//p2 - when subscribe is forbidden - the query still runs after the renew process
//p2 - 'update tasks set  where id = $1

//p2 - when value changes for field with error, clear error - so the user will feel comfortable
//p2 - allowApiUpdate should be false for include in api false

//docs

//------
//y2 - wrap identifier for custom filter & sql expression
//y2 - Should we create a separate implementation of command - one that the user uses, and another that the database implements (with only the bear necesities) - for example, to provide a second paramter called field for toDb conversions
//y2 - should we simply inherit from SqlDataProvider - and send the required parameter in the call to the base class - I think that new SqlDatabase(new PostgresDataProvider()) is a bilt combersome
//y2 - from the crm-demo(https://crm-demo.up.railway.app/deals), after editing a deal: - _updateEntityBasedOnApi

//y1 - how to run a transaction as a user

//y2 - message for relation that is missing
//y2 - consider multi tenancies

//p2 - and validators to reference
//y2 - discuss a default date formatter
//y2 - add some api testing framework for user unit tests (will help with codesandbox based discussions)

//[ ] V2 - what to do about for relations count?
//[ ] V2 - condition? not to fetch if null etc....
