# Public API

## ./index.js

````ts
export declare class Allow {
  static everyone: () => boolean
  static authenticated: (...args: any[]) => any
}
export declare type Allowed =
  | boolean
  | string
  | string[]
  | ((c?: Remult) => boolean)
export declare type AllowedForInstance<T> =
  | boolean
  | string
  | string[]
  | ((entity?: T, c?: Remult) => boolean)
export interface ApiClient {
  /**
   * The HTTP client to use when making API calls. It can be set to a function with the `fetch` signature
   * or an object that has `post`, `put`, `delete`, and `get` methods. This can also be used to inject
   * logic before each HTTP call, such as adding authorization headers.
   *
   * @example
   * // Using Axios
   * remult.apiClient.httpClient = axios;
   *
   * @example
   * // Using Angular HttpClient
   * remult.apiClient.httpClient = httpClient;
   * @see
   * If you want to add headers using angular httpClient, see: https://medium.com/angular-shots/shot-3-how-to-add-http-headers-to-every-request-in-angular-fab3d10edc26
   *
   * @example
   * // Using fetch (default)
   * remult.apiClient.httpClient = fetch;
   *
   * @example
   * // Adding bearer token authorization
   * remult.apiClient.httpClient = (
   *   input: RequestInfo | URL,
   *   init?: RequestInit
   * ) => {
   *   return fetch(input, {
   *     ...init,
   *     headers: authToken
   *       ? {
   *           ...init?.headers,
   *           authorization: 'Bearer ' + authToken,
   *         }
   *       : init?.headers,
   *
   *     cache: 'no-store',
   *   })
   * }
   */
  httpClient?: ExternalHttpProvider | typeof fetch
  /**
   * The base URL for making API calls. By default, it is set to '/api'. It can be modified to be relative
   * or to use a different domain for the server.
   *
   * @example
   * // Relative URL
   * remult.apiClient.url = './api';
   *
   * @example
   * // Different domain
   * remult.apiClient.url = 'https://example.com/api';
   */
  url?: string
  /**
   * The subscription client used for real-time data updates. By default, it is set to use Server-Sent Events (SSE).
   * It can be set to any subscription provider as illustrated in the Remult tutorial for deploying to a serverless environment.
   *
   * @see https://remult.dev/tutorials/react-next/deployment.html#deploying-to-a-serverless-environment
   */
  subscriptionClient?: SubscriptionClient
  /**
   * A function that wraps message handling for subscriptions. This is useful for executing some code before
   * or after any message arrives from the subscription.
   * For example, in Angular, to refresh a specific part of the UI,
   * you can call the `NgZone` run method at this time.
   *
   * @example
   * // Angular example
   * import { Component, NgZone } from '@angular/core';
   * import { remult } from "remult";
   *
   * export class AppComponent {
   *   constructor(zone: NgZone) {
   *     remult.apiClient.wrapMessageHandling = handler => zone.run(() => handler());
   *   }
   * }
   */
  wrapMessageHandling?: (x: VoidFunction) => void
}
export declare class ArrayEntityDataProvider implements EntityDataProvider {
  private entity
  private rows
  static rawFilter(filter: CustomArrayFilter): EntityFilter<any>
  constructor(entity: EntityMetadata, rows: () => any[])
  groupBy(options?: EntityDataProviderGroupByOptions): Promise<any[]>
  count(where?: Filter): Promise<number>
  find(options?: EntityDataProviderFindOptions): Promise<any[]>
  update(id: any, data: any): Promise<any>
  delete(id: any): Promise<void>
  insert(data: any): Promise<any>
}
//[ ] CustomArrayFilter from TBD is not exported
export declare function BackendMethod<type = unknown>(
  options: BackendMethodOptions<type>,
): (
  target: any,
  context: ClassMethodDecoratorContextStub<type> | string,
  descriptor?: any,
) => any
//[ ] ClassMethodDecoratorContextStub from TBD is not exported
export interface BackendMethodOptions<type> {
  /**Determines when this `BackendMethod` can execute, see: [Allowed](https://remult.dev/docs/allowed.html)  */
  allowed: AllowedForInstance<type>
  /** Used to determine the route for the BackendMethod.
   * @example
   * {allowed:true, apiPrefix:'someFolder/'}
   */
  apiPrefix?: string
  /**
   * Controls whether this `BackendMethod` runs within a database transaction. If set to `true`, the method will either complete entirely or fail without making any partial changes. If set to `false`, the method will not be transactional and may result in partial changes if it fails.
   * @default true
   * @example
   * {allowed: true, transactional: false}
   */
  transactional?: boolean
  /** EXPERIMENTAL: Determines if this method should be queued for later execution */
  queue?: boolean
  /** EXPERIMENTAL: Determines if the user should be blocked while this `BackendMethod` is running*/
  blockUser?: boolean
  paramTypes?: any[] | (() => any[])
}
export const CaptionTransformer: {
  /**
   * Transforms the caption of a column based on custom rules or criteria.
   *
   * This method can be assigned an arrow function that dynamically alters the
   * caption of a column. It is particularly useful for internationalization,
   * applying specific labeling conventions, or any other custom caption transformation
   * logic that your application requires.
   *
   * @param {Remult} remult - The Remult context, providing access to various framework features.
   * @param {string} key - The key (name) of the field whose caption is being transformed.
   * @param {string} caption - The original caption of the field.
   * @param {EntityMetadata<any>} entityMetaData - Metadata of the entity that the field belongs to.
   * @returns {string} The transformed caption for the field. If no transformation is applied,
   *                   the original caption is returned.
   *
   * @example
   * // Example of translating a field caption to French
   * CaptionTransformer.transformCaption = (
   *   remult, key, caption, entityMetaData
   * ) => {
   *   if (key === 'firstName') {
   *     return 'Prénom'; // French translation for 'firstName'
   *   }
   *   return caption;
   * };
   *
   * // Usage
   * const firstNameCaption = repo(Person).fields.firstName.caption; // Returns 'Prénom'
   */
  transformCaption: (
    remult: Remult,
    key: string,
    caption: string,
    entityMetaData: EntityMetadata<any>,
  ) => string
}
export type ClassFieldDecorator<entityType, valueType> = (
  target: any,
  context:
    | string
    | ClassFieldDecoratorContextStub<entityType, valueType | undefined>,
  c?: any,
) => void
export interface ClassFieldDecoratorContextStub<entityType, valueType> {
  readonly access: {
    set(object: entityType, value: valueType | null): void
  }
  readonly name: string
}
export type ClassType<T> = {
  new (...args: any[]): T
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
  ">"?: valueType
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
  ">="?: valueType
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
  "<"?: valueType
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
  "<="?: valueType
}
export declare class CompoundIdField implements FieldMetadata<string> {
  fields: FieldMetadata[]
  constructor(...columns: FieldMetadata[])
  apiUpdateAllowed(item: any): boolean
  displayValue(item: any): string
  includedInApi(item: any): boolean
  toInput(value: string, inputType?: string): string
  fromInput(inputValue: string, inputType?: string): string
  getDbName(): Promise<string>
  getId(instance: any): string
  options: FieldOptions
  get valueConverter(): Required<ValueConverter<string>>
  target: ClassType<any>
  readonly: boolean
  allowNull: boolean
  dbReadOnly: boolean
  isServerExpression: boolean
  key: string
  caption: string
  inputType: string
  dbName: string
  valueType: any
  isEqualTo(value: FieldMetadata<string> | string): EntityFilter<any>
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
export declare function Controller(
  key: string,
): (target: any, context?: any) => any
export declare class ControllerBase {
  protected remult: Remult
  constructor(remult?: Remult)
  assign(values: Partial<Omit<this, keyof EntityBase>>): this
  get $(): FieldsRefForEntityBase<this>
  get _(): ControllerRefForControllerBase<this>
}
export interface ControllerRef<entityType>
  extends ControllerRefBase<entityType> {
  fields: FieldsRef<entityType>
}
export interface ControllerRefBase<entityType> extends Subscribable {
  hasErrors(): boolean
  error: string | undefined
  validate(): Promise<ErrorInfo<entityType> | undefined>
  readonly isLoading: boolean
}
export interface ControllerRefForControllerBase<entityType>
  extends ControllerRefBase<entityType> {
  fields: FieldsRefForEntityBase<entityType>
}
export declare function createValidator<valueType>(
  validate: (
    entity: any,
    e: ValidateFieldEvent<any, valueType>,
  ) => Promise<boolean | string> | boolean | string,
  defaultMessage?: ValidationMessage<valueType, undefined>,
): Validator<valueType>
export declare function createValidatorWithArgs<valueType, argsType>(
  validate: (
    entity: any,
    e: ValidateFieldEvent<any, valueType>,
    args: argsType,
  ) => Promise<boolean | string> | boolean | string,
  defaultMessage: ValidationMessage<valueType, argsType>,
): ValidatorWithArgs<valueType, argsType> & {
  defaultMessage: ValidationMessage<valueType, argsType>
}
export declare function createValueValidator<valueType>(
  validate: (value: valueType) => boolean | string | Promise<boolean | string>,
  defaultMessage?: ValidationMessage<valueType, undefined>,
): Validator<valueType>
export declare function createValueValidatorWithArgs<valueType, argsType>(
  validate: (
    value: valueType,
    args: argsType,
  ) => boolean | string | Promise<boolean | string>,
  defaultMessage?: ValueValidationMessage<argsType>,
): ValidatorWithArgs<valueType, argsType> & {
  defaultMessage: ValueValidationMessage<argsType>
}
export declare class CustomSqlFilterBuilder
  implements SqlCommandWithParameters, HasWrapIdentifier
{
  private r
  wrapIdentifier: (name: string) => string
  constructor(
    r: SqlCommandWithParameters,
    wrapIdentifier: (name: string) => string,
  )
  sql: string
  /** @deprecated  use `param` instead*/
  addParameterAndReturnSqlToken(val: any): string
  /**
   * Adds a parameter value.
   * @param {valueType} val - The value to add as a parameter.
   * @param {FieldMetadata<valueType>} [field] - The field metadata.
   * @returns {string} - The SQL token.
   */
  param: <valueType>(val: valueType, field?: FieldMetadata<valueType>) => string
  /**
   * Converts an entity filter into a raw SQL condition - and appends to it any `backendPrefilter` and `backendPreprocessFilter`
   * @param {RepositoryOverloads<entityType>} repo - The repository.
   * @param {EntityFilter<entityType>} condition - The entity filter.
   * @returns {Promise<string>} - The raw SQL.
   */
  filterToRaw: <entityType>(
    repo: RepositoryOverloads<entityType>,
    condition: EntityFilter<entityType>,
  ) => Promise<string>
}
//[ ] RepositoryOverloads from TBD is not exported
export type CustomSqlFilterBuilderFunction = (
  builder: CustomSqlFilterBuilder,
) => void | string | Promise<string | void>
export interface DataProvider {
  getEntityDataProvider(entity: EntityMetadata): EntityDataProvider
  transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void>
  ensureSchema?(entities: EntityMetadata[]): Promise<void>
  isProxy?: boolean
}
export declare function dbNamesOf<entityType>(
  repo: EntityMetadataOverloads<entityType>,
  wrapIdentifierOrOptions?: ((name: string) => string) | dbNamesOfOptions,
): Promise<EntityDbNames<entityType>>
//[ ] EntityMetadataOverloads from TBD is not exported
export interface dbNamesOfOptions {
  wrapIdentifier?: (name: string) => string
  tableName?: boolean | string
}
export declare function describeBackendMethods<T>(
  classType: T,
  backendMethods: {
    [K in keyof T]?: BackendMethodOptions<unknown>
  },
): void
export declare function describeClass<classType>(
  classType: classType,
  classDescriber: ((x: any, context?: any) => any) | undefined,
  members?: FieldsDescriptor<classType> | undefined,
  staticMembers?: StaticMemberDescriptors<classType>,
): void
//[ ] FieldsDescriptor from TBD is not exported
//[ ] StaticMemberDescriptors from TBD is not exported
export declare function describeEntity<entityType extends ClassType<any>>(
  classType: entityType,
  key: string,
  fields: FieldsDescriptor<entityType>,
  options?: EntityOptions<InstanceType<entityType>>,
): void
export declare function Entity<entityType>(
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
): (
  target: any,
  info?: ClassDecoratorContextStub<
    entityType extends new (...args: any) => any ? entityType : never
  >,
) => any
//[ ] ClassDecoratorContextStub from TBD is not exported
export declare class EntityBase {
  get _(): EntityRefForEntityBase<this>
  save(): Promise<this>
  assign(values: Partial<Omit<this, keyof EntityBase>>): this
  delete(): Promise<void>
  isNew(): boolean
  get $(): FieldsRefForEntityBase<this>
}
export interface EntityDataProvider {
  count(where: Filter): Promise<number>
  find(options?: EntityDataProviderFindOptions): Promise<Array<any>>
  groupBy(options?: EntityDataProviderGroupByOptions): Promise<any[]>
  update(id: any, data: any): Promise<any>
  delete(id: any): Promise<void>
  insert(data: any): Promise<any>
}
export interface EntityDataProviderFindOptions {
  where?: Filter
  limit?: number
  page?: number
  orderBy?: Sort
}
export interface EntityDataProviderGroupByOptions
  extends Pick<EntityDataProviderFindOptions, "where" | "limit" | "page"> {
  group?: FieldMetadata[]
  sum?: FieldMetadata[]
  avg?: FieldMetadata[]
  min?: FieldMetadata[]
  max?: FieldMetadata[]
  distinctCount?: FieldMetadata[]
  orderBy?: {
    field?: FieldMetadata
    isDescending?: boolean
    operation?: (typeof GroupByOperators)[number] | "count"
  }[]
}
//[ ] IndexedAccessType from TBD is not exported
export declare type EntityDbNames<entityType> = {
  [Properties in keyof Required<MembersOnly<entityType>>]: string
} & EntityDbNamesBase
//[ ] EntityDbNamesBase from TBD is not exported
export declare class EntityError<entityType = unknown>
  extends Error
  implements ErrorInfo<entityType>
{
  constructor(errorInfo: ErrorInfo<entityType>)
  modelState?: {
    [Properties in keyof Partial<MembersOnly<entityType>>]?: string
  }
  stack?: string
  exception?: any
  httpStatusCode?: number
}
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
            | {
                id?: string | number
              }
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
export declare type EntityIdFields<entityType> = {
  [Properties in keyof Partial<MembersOnly<entityType>>]?: true
}
export interface EntityMetadata<entityType = unknown> {
  /** The Entity's key also used as it's url  */
  readonly key: string
  /** Metadata for the Entity's fields */
  readonly fields: FieldsMetadata<entityType>
  /** A human readable caption for the entity. Can be used to achieve a consistent caption for a field throughout the app
   * @example
   * <h1>Create a new item in {taskRepo.metadata.caption}</h1>
   * @see {@link EntityOptions.caption}
   */
  readonly caption: string
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
   * @see {@link EntityOptions.allowApiUpdate
   * @example
   * if (repo(Task).metadata.apiUpdateAllowed(task)){
   *   // Allow user to edit the entity
   * }
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
   * * @see {@link EntityOptions.allowApiDelete}
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
export interface EntityOptions<entityType = unknown> {
  /**A human readable name for the entity */
  caption?: string
  /**
   * Determines if this Entity is available for get requests using Rest Api
   * @description
   * Determines if one has any access to the data of an entity.
   * @see [allowed](http://remult.dev/docs/allowed.html)
   * @see to restrict data based on a criteria, use [apiPrefilter](https://remult.dev/docs/ref_entity.html#apiprefilter)
   * */
  allowApiRead?: Allowed
  /**
   * Determines if this entity can be updated through the api.
   * @see [allowed](http://remult.dev/docs/allowed.html)
   * @see [Access Control](https://remult.dev/docs/access-control)
   * */
  allowApiUpdate?: AllowedForInstance<entityType>
  /** Determines if entries for this entity can be deleted through the api.
   * @see [allowed](http://remult.dev/docs/allowed.html)
   * @see [Access Control](https://remult.dev/docs/access-control)
   * */
  allowApiDelete?: AllowedForInstance<entityType>
  /** Determines if new entries for this entity can be posted through the api.
   * @see [allowed](http://remult.dev/docs/allowed.html)
   * @see [Access Control](https://remult.dev/docs/access-control)
   * */
  allowApiInsert?: AllowedForInstance<entityType>
  /** sets  the `allowApiUpdate`, `allowApiDelete` and `allowApiInsert` properties in a single set */
  allowApiCrud?: Allowed
  /**
   * An optional filter that determines which rows can be queried using the API.
   * This filter is applied to all CRUD operations to ensure that only authorized data is accessible.
   *
   * Use `apiPrefilter` to restrict data based on user profile or other conditions.
   *
   * @example
   * // Only include non-archived items in API responses
   * apiPrefilter: { archive: false }
   *
   * @example
   * // Allow admins to access all rows, but restrict non-admins to non-archived items
   * apiPrefilter: () => remult.isAllowed("admin") ? {} : { archive: false }
   *
   * @see [EntityFilter](https://remult.dev/docs/access-control.html#filtering-accessible-rows)
   */
  apiPrefilter?:
    | EntityFilter<entityType>
    | (() => EntityFilter<entityType> | Promise<EntityFilter<entityType>>)
  /**
   * An optional function that allows for preprocessing or modifying the EntityFilter for a specific entity type
   * before it is used in API CRUD operations. This function can be used to enforce additional access control
   * rules or adjust the filter based on the current context or specific request.
   *
   * @template entityType The type of the entity being filtered.
   * @param filter The initial EntityFilter for the entity type.
   * @param event Additional information and utilities for preprocessing the filter.
   * @returns The modified EntityFilter or a Promise that resolves to the modified EntityFilter.
   *
   * @example
   * ```typescript
   * @Entity<Task>("tasks", {
   *   apiPreprocessFilter: async (filter, { getPreciseValues }) => {
   *     // Ensure that users can only query tasks for specific customers
   *     const preciseValues = await getPreciseValues();
   *     if (!preciseValues.customerId) {
   *       throw new ForbiddenError("You must specify a valid customerId filter");
   *     }
   *     return filter;
   *   }
   * })
   * ```
   */
  apiPreprocessFilter?: (
    filter: EntityFilter<entityType>,
    event: PreprocessFilterEvent<entityType>,
  ) => EntityFilter<entityType> | Promise<EntityFilter<entityType>>
  /**
   * Similar to apiPreprocessFilter, but for backend operations.
   *
   * @template entityType The type of the entity being filtered.
   * @param filter The initial EntityFilter for the entity type.
   * @param event Additional information and utilities for preprocessing the filter.
   * @returns The modified EntityFilter or a Promise that resolves to the modified EntityFilter.
   */
  backendPreprocessFilter?: (
    filter: EntityFilter<entityType>,
    event: PreprocessFilterEvent<entityType>,
  ) => EntityFilter<entityType> | Promise<EntityFilter<entityType>>
  /** A filter that will be used for all queries from this entity both from the API and from within the backend.
   * @example
   * backendPrefilter: { archive:false }
   * @see [EntityFilter](http://remult.dev/docs/entityFilter.html)
   */
  backendPrefilter?:
    | EntityFilter<entityType>
    | (() => EntityFilter<entityType> | Promise<EntityFilter<entityType>>)
  /** An order by to be used, in case no order by was specified
   * @example
   * defaultOrderBy: { name: "asc" }
   *
   * @example
   * defaultOrderBy: { price: "desc", name: "asc" }
   */
  defaultOrderBy?: EntityOrderBy<entityType>
  /** An event that will be fired before the Entity will be saved to the database.
   * If the `error` property of the entity's ref or any of its fields will be set, the save will be aborted and an exception will be thrown.
   * this is the place to run logic that we want to run in any case before an entity is saved.
   * @example
   * @Entity<Task>("tasks", {
   *   saving: async (task, e) => {
   *     if (e.isNew) {
   *       task.createdAt = new Date(); // Set the creation date for new tasks.
   *     }
   *     task.lastUpdated = new Date(); // Update the last updated date.
   *   },
   * })
   * @param entity - The instance of the entity being saved.
   * @param event - an @link LifeCycleEvent object
   * @see [Entity Lifecycle Hooks](http://remult.dev/docs/lifecycle-hooks)
   */
  saving?: (
    entity: entityType,
    event: LifecycleEvent<entityType>,
  ) => Promise<any> | any
  /**
   * A hook that runs after an entity has been successfully saved.
   *
   * @param entity The instance of the entity that was saved.
   * @param event - an @link LifeCycleEvent object
   * @see [Entity Lifecycle Hooks](http://remult.dev/docs/lifecycle-hooks)
   */
  saved?: (
    entity: entityType,
    e: LifecycleEvent<entityType>,
  ) => Promise<any> | any
  /**
   * A hook that runs before an entity is deleted.
   *
   * @param entity The instance of the entity being deleted.
   * @param event - an @link LifeCycleEvent object
   * @see [Entity Lifecycle Hooks](http://remult.dev/docs/lifecycle-hooks)
   */
  deleting?: (
    entity: entityType,
    e: LifecycleEvent<entityType>,
  ) => Promise<any> | any
  /**
   * A hook that runs after an entity has been successfully deleted.
   *
   * @param entity The instance of the entity that was deleted.
   * @param event - an @link LifeCycleEvent object
   * @see [Entity Lifecycle Hooks](http://remult.dev/docs/lifecycle-hooks)
   */
  deleted?: (
    entity: entityType,
    e: LifecycleEvent<entityType>,
  ) => Promise<any> | any
  /**
   * A hook that runs to perform validation checks on an entity before saving.
   * This hook is also executed on the frontend.
   *
   * @param entity The instance of the entity being validated.
   * @param event - an @link LifeCycleEvent object
   * @see [Entity Lifecycle Hooks](http://remult.dev/docs/lifecycle-hooks)
   */
  validation?: (
    entity: entityType,
    ref: LifecycleEvent<entityType>,
  ) => Promise<any> | any
  /** The name of the table in the database that holds the data for this entity.
   * If no name is set, the `key` will be used instead.
   * @example
   * dbName:'myProducts'
   *
   * You can also add your schema name to the table name
   * @example
   * dbName:'public."myProducts"'
   */
  dbName?: string
  /** For entities that are based on SQL expressions instead of a physical table or view
   * @example
   * @Entity('people', {
   *   sqlExpression:`select id,name from employees
   *                  union all select id,name from contractors`,
   * })
   * export class Person {
   *   @Fields.string()
   *   id=''
   *   @Fields.string()
   *   name=''
   * }
   */
  sqlExpression?:
    | string
    | ((entity: EntityMetadata<entityType>) => string | Promise<string>)
  /** An arrow function that identifies the `id` column to use for this entity
   * @example
   * //Single column id
   * @Entity<Products>("products", { id: 'productCode' })
   * @example
   * //Multiple columns id
   * @Entity<OrderDetails>("orderDetails", { id:['orderId:', 'productCode'] })
   */
  id?:
    | keyof MembersOnly<entityType>
    | (keyof MembersOnly<entityType>)[]
    | EntityIdFields<entityType>
    | ((entity: FieldsMetadata<entityType>) => FieldMetadata | FieldMetadata[])
  entityRefInit?: (ref: EntityRef<entityType>, row: entityType) => void
  apiRequireId?: Allowed
  /**
   * A function that allows customizing the data provider for the entity.
   * @param defaultDataProvider The default data provider defined in the `remult` object.
   * @example
   * dataProvider: (dp) => {
   *   if (!dp.isProxy) // usually indicates that we're on the backend
   *     return getASpacificDataProvider();
   *   return null
   * }
   * @returns A custom data provider for the entity.
   */
  dataProvider?: (
    defaultDataProvider: DataProvider,
  ) => DataProvider | Promise<DataProvider> | undefined | null
}
export declare type EntityOrderBy<entityType> = {
  [Properties in keyof Partial<MembersOnly<entityType>>]?: "asc" | "desc"
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
export interface ErrorInfo<entityType = unknown> {
  message?: string
  modelState?: {
    [Properties in keyof Partial<MembersOnly<entityType>>]?: string
  }
  stack?: string
  exception?: any
  httpStatusCode?: number
}
export interface EventDispatcher {
  observe(what: () => any | Promise<any>): Promise<Unsubscribe>
}
export declare class EventSource {
  listeners: (() => {})[]
  fire(): Promise<void>
  dispatcher: EventDispatcher
}
export interface ExternalHttpProvider {
  post(
    url: string,
    data: any,
  ):
    | Promise<any>
    | {
        toPromise(): Promise<any>
      }
  delete(url: string):
    | Promise<void>
    | {
        toPromise(): Promise<void>
      }
  put(
    url: string,
    data: any,
  ):
    | Promise<any>
    | {
        toPromise(): Promise<any>
      }
  get(url: string):
    | Promise<any>
    | {
        toPromise(): Promise<any>
      }
}
export declare function Field<entityType = unknown, valueType = unknown>(
  valueType:
    | (() => valueType extends number
        ? Number
        : valueType extends string
        ? String
        : valueType extends boolean
        ? Boolean
        : ClassType<valueType>)
    | undefined,
  ...options: (
    | FieldOptions<entityType, valueType>
    | ((options: FieldOptions<entityType, valueType>, remult: Remult) => void)
  )[]
): (
  target: any,
  context:
    | ClassFieldDecoratorContextStub<entityType, valueType | undefined>
    | string,
  c?: any,
) => void
export interface FieldMetadata<valueType = unknown, entityType = unknown> {
  /** The field's member name in an object.
   * @example
   * console.log(repo(Task).metadata.fields.title.key);
   * // result: title
   */
  readonly key: entityType extends object ? keyof entityType & string : string
  /** A human readable caption for the field. Can be used to achieve a consistent caption for a field throughout the app
   * @example
   * <input placeholder={taskRepo.metadata.fields.title.caption}/>
   * @see {@link FieldOptions#caption} for configuration details
   */
  readonly caption: string
  /** The name of the column in the database that holds the data for this field. If no name is set, the key will be used instead.
   * @example
   *
   * @Fields.string({ dbName: 'userName'})
   * userName=''
   * @see {@link FieldOptions#dbName} for configuration details
   */
  dbName: string
  /** The field's value type (number,string etc...) */
  readonly valueType: any
  /** The options sent to this field's decorator */
  readonly options: FieldOptions
  /** The `inputType` relevant for this field, determined by the options sent to it's decorator and the valueConverter in these options */
  readonly inputType: string
  /** if null is allowed for this field
   * @see {@link FieldOptions#allowNull} for configuration details
   *
   */
  readonly allowNull: boolean
  /** The class that contains this field
   * @example
   * Task == repo(Task).metadata.fields.title.target //will return true
   */
  readonly target: ClassType<valueType>
  /**
   * @deprecated Returns the dbName - based on it's `dbName` option and it's `sqlExpression` option */
  getDbName(): Promise<string>
  /** Indicates if this field is based on a server express */
  readonly isServerExpression: boolean
  /** indicates that this field should only be included in select statement, and excluded from update or insert. useful for db generated ids etc...
   * @see {@link FieldOptions#dbReadOnly} for configuration details
   */
  readonly dbReadOnly: boolean
  /** the Value converter for this field */
  readonly valueConverter: Required<ValueConverter<valueType>>
  /** Get the display value for a specific item
   * @see {@link FieldOptions#displayValue} for configuration details
   * @example
   * repo.fields.createDate.displayValue(task) //will display the date as defined in the `displayValue` option defined for it.
   */
  displayValue(item: Partial<entityType>): string
  /**
   * Determines if the current user is allowed to update a specific entity instance.
   
   * @example
   * // Check if the current user is allowed to update a specific task
   * if (repo(Task).metadata.apiUpdateAllowed(task)){
   *   // Allow user to edit the entity
   * }
   * @see {@link FieldOptions#allowApiUpdate} for configuration details
   * @param {Partial<entityType>} item - Partial entity instance to check permissions against.
   * @returns {boolean} True if the update is allowed.
   */
  apiUpdateAllowed(item?: Partial<entityType>): boolean
  /**
   * Determines if a specific entity field should be included in the API based on the current user's permissions.
   * This method checks visibility permissions for a field within a partial entity instance.
   * @example
   * const employeeRepo = remult.repo(Employee);
   * // Determine if the 'salary' field of an employee should be visible in the API for the current user
   * if (employeeRepo.fields.salary.includedInApi({ id: 123, name: 'John Doe' })) {
   *   // The salary field is included in the API
   * }
   * @see {@link FieldOptions#includeInApi} for configuration details
   * @param {Partial<entityType>} item - The partial entity instance used to evaluate field visibility.
   * @returns {boolean} True if the field is included in the API.
   */
  includedInApi(item?: Partial<entityType>): boolean
  /** Adapts the value for usage with html input
   * @example
   * @Fields.dateOnly()
   * birthDate = new Date(1976,5,16)
   * //...
   * input.value = repo.fields.birthDate.toInput(person) // will return '1976-06-16'
   * @see {@link ValueConverter#toInput} for configuration details
   */
  toInput(value: valueType, inputType?: string): string
  /** Adapts the value for usage with html input
   * @example
   * @Fields.dateOnly()
   * birthDate = new Date(1976,5,16)
   * //...
   * person.birthDate = repo.fields.birthDate.fromInput(personFormState) // will return Date
   * @see {@link ValueConverter#fromInput} for configuration details
   */
  fromInput(inputValue: string, inputType?: string): valueType
}
export interface FieldOptions<entityType = unknown, valueType = unknown> {
  /** A human readable name for the field. Can be used to achieve a consistent caption for a field throughout the app
   * @example
   * <input placeholder={taskRepo.metadata.fields.title.caption}/>
   */
  caption?: string
  /** If it can store null in the database */
  allowNull?: boolean
  /** If a value is required. Short-cut to say `validate: Validators.required`.
        @see option [validate](https://remult.dev/docs/ref_field#validate) below
        @see validator [required](https://remult.dev/docs/ref_validators#required)
     */
  required?: boolean
  /**
   * Specifies whether this field should be included in the API. This can be configured
   * based on access control levels.
   * @example
   * // Do not include in the API
   * @Fields.string({ includeInApi: false })
   * password = '';
   * // Include in the API for 'admin' only
   * @Fields.number({ includeInApi: 'admin' })
   * salary = 0;
   * @see [allowed](https://remult.dev/docs/allowed.html)
   * @see [Access Control](https://remult.dev/docs/access-control)
   * @type {AllowedForInstance<entityType>}
   */
  includeInApi?: AllowedForInstance<entityType>
  /**
   * Determines whether this field can be updated via the API. This setting can also
   * be controlled based on user roles or other access control checks.
   *
   * _It happens after entity level authorization AND if it's allowed._
   * @example
   * // Prevent API from updating this field
   * @Fields.string({ allowApiUpdate: false })
   * createdBy = remult.user?.id;
   * @example
   * // Allow API update only on new items
   * @Fields.string<Category>({ allowApiUpdate: (c) => getEntityRef(c).isNew() })
   * Description = ""
   * @see [allowed](https://remult.dev/docs/allowed.html)
   * @see [Access Control](https://remult.dev/docs/access-control)
   * @type {AllowedForInstance<entityType>}
   */
  allowApiUpdate?: AllowedForInstance<entityType>
  /** An arrow function that'll be used to perform validations on it
   * @example
   * @Fields.string({
   *   validate: Validators.required
   * })
   * * @example
   * @Fields.string<Task>({
   *    validate: task=>task.title.length>3 ||  "Too Short"
   * })
   * @example
   * @Fields.string<Task>({
   *    validate: task=>{
   *      if (task.title.length<3)
   *          throw "Too Short";
   *   }
   * })
   * @example
   * @Fields.string({
   *    validate: (_, fieldValidationEvent)=>{
   *      if (fieldValidationEvent.value.length < 3)
   *          fieldValidationEvent.error = "Too Short";
   *   }
   * })
   */
  validate?:
    | FieldValidator<entityType, valueType>
    | FieldValidator<entityType, valueType>[]
  /** Will be fired before this field is saved to the server/database */
  saving?: (
    entity: entityType,
    fieldRef: FieldRef<entityType, valueType>,
    e: LifecycleEvent<entityType>,
  ) => any | Promise<any>
  /**  An expression that will determine this fields value on the backend and be provided to the front end*/
  serverExpression?: (entity: entityType) => valueType | Promise<valueType>
  /** The name of the column in the database that holds the data for this field. If no name is set, the key will be used instead.
   * @example
   *
   * @Fields.string({ dbName: 'userName'})
   * userName=''
   */
  dbName?: string
  /** Used or fields that are based on an sql expressions, instead of a physical table column
   * @example
   *
   * @Fields.integer({
   *   sqlExpression:e=> 'length(title)'
   * })
   * titleLength = 0;
   * @Fields.string()
   * title='';
   */
  sqlExpression?:
    | string
    | ((entity: EntityMetadata<entityType>) => string | Promise<string>)
  /** For fields that shouldn't be part of an update or insert statement */
  dbReadOnly?: boolean
  /** The value converter to be used when loading and saving this field */
  valueConverter?: ValueConverter<valueType>
  /** an arrow function that translates the value to a display value */
  displayValue?: (entity: entityType, value: valueType) => string
  /** an arrow function that determines the default value of the field, when the entity is created using the `repo.create` method */
  defaultValue?: (entity: entityType) => valueType
  /** The html input type for this field */
  inputType?: string
  /**
   * @deprecated The 'lazy' option is deprecated and will be removed in future versions.
   * Use 'Relations.toOne' instead.
   *
   * Example usage:
   * ```
   * // Deprecated usage with 'lazy' option
   * @Field(() => Customer, { lazy: true })
   * customer?: Customer;
   *
   * // Preferred usage with 'Relations.toOne'
   * @Relations.toOne(() => Customer)
   * customer?: Customer;
   * ```
   */
  lazy?: boolean
  /** The value type for this field */
  valueType?: any
  /** The entity type to which this field belongs */
  target?: ClassType<entityType>
  /** The key to be used for this field */
  key?: string
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
export declare class Fields {
  /**
   * Stored as a JSON.stringify - to store as json use Fields.json
   */
  static object<entityType = unknown, valueType = unknown>(
    ...options: (
      | FieldOptions<entityType, valueType>
      | ((options: FieldOptions<entityType, valueType>, remult: Remult) => void)
    )[]
  ): ClassFieldDecorator<entityType, valueType | undefined>
  static json<entityType = unknown, valueType = unknown>(
    ...options: (
      | FieldOptions<entityType, valueType>
      | ((options: FieldOptions<entityType, valueType>, remult: Remult) => void)
    )[]
  ): ClassFieldDecorator<entityType, valueType | undefined>
  static dateOnly<entityType = unknown>(
    ...options: (
      | FieldOptions<entityType, Date>
      | ((options: FieldOptions<entityType, Date>, remult: Remult) => void)
    )[]
  ): ClassFieldDecorator<entityType, Date | undefined>
  static date<entityType = unknown>(
    ...options: (
      | FieldOptions<entityType, Date>
      | ((options: FieldOptions<entityType, Date>, remult: Remult) => void)
    )[]
  ): ClassFieldDecorator<entityType, Date | undefined>
  static integer<entityType = unknown>(
    ...options: (
      | FieldOptions<entityType, number>
      | ((options: FieldOptions<entityType, number>, remult: Remult) => void)
    )[]
  ): ClassFieldDecorator<entityType, number | undefined>
  static autoIncrement<entityType = unknown>(
    ...options: (
      | FieldOptions<entityType, number>
      | ((options: FieldOptions<entityType, number>, remult: Remult) => void)
    )[]
  ): ClassFieldDecorator<entityType, number | undefined>
  static number<entityType = unknown>(
    ...options: (
      | FieldOptions<entityType, number>
      | ((options: FieldOptions<entityType, number>, remult: Remult) => void)
    )[]
  ): ClassFieldDecorator<entityType, number | undefined>
  static createdAt<entityType = unknown>(
    ...options: (
      | FieldOptions<entityType, Date>
      | ((options: FieldOptions<entityType, Date>, remult: Remult) => void)
    )[]
  ): ClassFieldDecorator<entityType, Date | undefined>
  static updatedAt<entityType = unknown>(
    ...options: (
      | FieldOptions<entityType, Date>
      | ((options: FieldOptions<entityType, Date>, remult: Remult) => void)
    )[]
  ): ClassFieldDecorator<entityType, Date | undefined>
  static uuid<entityType = unknown>(
    ...options: (
      | FieldOptions<entityType, string>
      | ((options: FieldOptions<entityType, string>, remult: Remult) => void)
    )[]
  ): ClassFieldDecorator<entityType, string | undefined>
  /**
   * A CUID (Collision Resistant Unique Identifier) field.
   * This id value is determined on the backend on insert, and can't be updated through the API.
   * The CUID is generated using the `@paralleldrive/cuid2` npm package.
   */
  static cuid<entityType = unknown>(
    ...options: (
      | FieldOptions<entityType, string>
      | ((options: FieldOptions<entityType, string>, remult: Remult) => void)
    )[]
  ): ClassFieldDecorator<entityType, string | undefined>
  /**
   * Defines a field that can hold a value from a specified set of string literals.
   * @param {() => readonly valueType[]} optionalValues - A function that returns an array of allowed string literals.
   * @returns {ClassFieldDecorator<entityType, valueType | undefined>} - A class field decorator.
   *
   * @example
   
   * class MyEntity {
   *   .@Fields.literal(() => ['open', 'closed', 'frozen', 'in progress'] as const)
   *   status: 'open' | 'closed' | 'frozen' | 'in progress' = 'open';
   * }
   
   *
   * // This defines a field `status` in `MyEntity` that can only hold the values 'open', 'closed', 'frozen', or 'in progress'.
   *
   * @example
   * // For better reusability and maintainability:
   
   * const statuses = ['open', 'closed', 'frozen', 'in progress'] as const;
   * type StatusType = typeof statuses[number];
   *
   * class MyEntity {
   *   .@Fields.literal(() => statuses)
   *   status: StatusType = 'open';
   * }
   
   *
   * // This approach allows easy management and updates of the allowed values for the `status` field.
   */
  static literal<entityType = unknown, valueType extends string = string>(
    optionalValues: () => readonly valueType[],
    ...options: (
      | StringFieldOptions<entityType, valueType>
      | ((
          options: StringFieldOptions<entityType, valueType>,
          remult: Remult,
        ) => void)
    )[]
  ): ClassFieldDecorator<entityType, valueType | undefined>
  static enum<entityType = unknown, theEnum = unknown>(
    enumType: () => theEnum,
    ...options: (
      | FieldOptions<entityType, theEnum[keyof theEnum]>
      | ((
          options: FieldOptions<entityType, theEnum[keyof theEnum]>,
          remult: Remult,
        ) => void)
    )[]
  ): ClassFieldDecorator<entityType, theEnum[keyof theEnum] | undefined>
  static string<entityType = unknown, valueType = string>(
    ...options: (
      | StringFieldOptions<entityType, valueType>
      | ((
          options: StringFieldOptions<entityType, valueType>,
          remult: Remult,
        ) => void)
    )[]
  ): ClassFieldDecorator<entityType, valueType | undefined>
  static boolean<entityType = unknown>(
    ...options: (
      | FieldOptions<entityType, boolean>
      | ((options: FieldOptions<entityType, boolean>, remult: Remult) => void)
    )[]
  ): ClassFieldDecorator<entityType, boolean | undefined>
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
export type FieldsRefBase<entityType> = {
  find(fieldMetadataOrKey: FieldMetadata | string): FieldRef<entityType, any>
  [Symbol.iterator]: () => IterableIterator<FieldRef<entityType, any>>
  toArray(): FieldRef<entityType, any>[]
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
export declare function FieldType<valueType = unknown>(
  ...options: (
    | FieldOptions<any, valueType>
    | ((options: FieldOptions<any, valueType>, remult: Remult) => void)
  )[]
): (target: any, context?: any) => any
export declare type FieldValidator<
  entityType = unknown,
  valueType = unknown,
> = (
  entity: entityType,
  event: ValidateFieldEvent<entityType, valueType>,
) =>
  | boolean
  | string
  | void
  | undefined
  | Promise<boolean | string | void | undefined>
export declare class Filter {
  private apply
  /**
     * Retrieves precise values for each property in a filter for an entity.
     * @template entityType The type of the entity being filtered.
     * @param metadata The metadata of the entity being filtered.
     * @param filter The filter to analyze.
     * @returns A promise that resolves to a FilterPreciseValues object containing the precise values for each property.
     * @example
     * const preciseValues = await Filter.getPreciseValues(meta, {
     *   status: { $ne: 'active' },
     *   $or: [
     *     { customerId: ["1", "2"] },
     *     { customerId: "3" }
     *   ]
     * });
     * console.log(preciseValues);
     * // Output:
     * // {
     * //   "customerId": ["1", "2", "3"], // Precise values inferred from the filter
     * //   "status": undefined,           // Cannot infer precise values for 'status'
     * // }
    
     */
  static getPreciseValues<entityType>(
    metadata: EntityMetadata<entityType>,
    filter: EntityFilter<entityType>,
  ): Promise<FilterPreciseValues<entityType>>
  /**
     * Retrieves precise values for each property in a filter for an entity.
     * @template entityType The type of the entity being filtered.
     * @param metadata The metadata of the entity being filtered.
     * @param filter The filter to analyze.
     * @returns A promise that resolves to a FilterPreciseValues object containing the precise values for each property.
     * @example
     * const preciseValues = await where.getPreciseValues();
     * console.log(preciseValues);
     * // Output:
     * // {
     * //   "customerId": ["1", "2", "3"], // Precise values inferred from the filter
     * //   "status": undefined,           // Cannot infer precise values for 'status'
     * // }
    
     */
  getPreciseValues<entityType>(): Promise<FilterPreciseValues<entityType>>
  /**
     * Creates a custom filter. Custom filters are evaluated on the backend, ensuring security and efficiency.
     * When the filter is used in the frontend, only its name is sent to the backend via the API,
     * where the filter gets translated and applied in a safe manner.
     *
     * @template entityType The entity type for the filter.
     * @param {function(): EntityFilter<entityType>} translator A function that returns an `EntityFilter`.
     * @param {string} [key] An optional unique identifier for the custom filter.
     * @returns {function(): EntityFilter<entityType>} A function that returns an `EntityFilter` of type `entityType`.
     *
     * @example
     *  class Order {
     *  //...
     *  static activeOrdersFor = Filter.createCustom<Order, { year: number }>(
     *    async ({ year }) => {
     *      return {
     *        status: ['created', 'confirmed', 'pending', 'blocked', 'delayed'],
     *        createdAt: {
     *          $gte: new Date(year, 0, 1),
     *          $lt: new Date(year + 1, 0, 1),
     *        },
     *      }
     *    },
     *  )
     *}
     * // Usage
     * await repo(Order).find({
     *  where: Order.activeOrders({ year }),
     *})
  
  
     * @see
     * [Sql filter and Custom filter](/docs/custom-filter.html)
     * [Filtering and Relations](/docs/filtering-and-relations.html)
     */
  static createCustom<entityType>(
    translator: (
      unused: never,
      r: Remult,
    ) => EntityFilter<entityType> | Promise<EntityFilter<entityType>>,
    key?: string,
  ): (() => EntityFilter<entityType>) & customFilterInfo<entityType>
  /**
     * Creates a custom filter. Custom filters are evaluated on the backend, ensuring security and efficiency.
     * When the filter is used in the frontend, only its name is sent to the backend via the API,
     * where the filter gets translated and applied in a safe manner.
     *
     * @template entityType The entity type for the filter.
     * @param {function(): EntityFilter<entityType>} translator A function that returns an `EntityFilter`.
     * @param {string} [key] An optional unique identifier for the custom filter.
     * @returns {function(): EntityFilter<entityType>} A function that returns an `EntityFilter` of type `entityType`.
     *
     * @example
     *  class Order {
     *  //...
     *  static activeOrdersFor = Filter.createCustom<Order, { year: number }>(
     *    async ({ year }) => {
     *      return {
     *        status: ['created', 'confirmed', 'pending', 'blocked', 'delayed'],
     *        createdAt: {
     *          $gte: new Date(year, 0, 1),
     *          $lt: new Date(year + 1, 0, 1),
     *        },
     *      }
     *    },
     *  )
     *}
     * // Usage
     * await repo(Order).find({
     *  where: Order.activeOrders({ year }),
     *})
  
     
     * @see
     * [Sql filter and Custom filter](/docs/custom-filter.html)
     * [Filtering and Relations](/docs/filtering-and-relations.html)
     */
  static createCustom<entityType, argsType>(
    translator: (
      args: argsType,
      r: Remult,
    ) => EntityFilter<entityType> | Promise<EntityFilter<entityType>>,
    key?: string,
  ): ((y: argsType) => EntityFilter<entityType>) & customFilterInfo<entityType>
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
  ): any
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
  ): EntityFilter<T>
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
  ): Filter
  constructor(apply: (add: FilterConsumer) => void)
  __applyToConsumer(add: FilterConsumer): void
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
  static resolve<entityType>(
    filter:
      | EntityFilter<entityType>
      | (() => EntityFilter<entityType> | Promise<EntityFilter<entityType>>),
  ): Promise<EntityFilter<entityType>>
  toJson(): any
  static translateCustomWhere<T>(
    r: Filter,
    entity: EntityMetadata<T>,
    remult: Remult,
  ): Promise<Filter>
}
//[ ] customFilterInfo from TBD is not exported
export interface FilterConsumer {
  or(orElements: Filter[]): void
  not(filter: Filter): void
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
  startsWithCaseInsensitive(col: FieldMetadata, val: any): void
  endsWithCaseInsensitive(col: FieldMetadata, val: any): void
  isIn(col: FieldMetadata, val: any[]): void
  custom(key: string, customItem: any): void
  databaseCustom(databaseCustom: any): void
}
export type FilterPreciseValues<entityType> = {
  [Properties in keyof MembersOnly<entityType>]?: Partial<
    entityType[Properties]
  >[]
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
export interface FindOptions<entityType> extends FindOptionsBase<entityType> {
  /** Determines the number of rows returned by the request, on the browser the default is 100 rows
   * @example
   * await repo(Products).find({
   *   limit: 10,
   *   page: 2
   * })
   */
  limit?: number
  /** Determines the page number that will be used to extract the data
   * @example
   * await repo(Products).find({
   *   limit: 10,
   *  page: 2
   * })
   */
  page?: number
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
   * await repo(Products).find({ orderBy: { name: "asc" }})
   * @example
   * await repo(Products).find({ orderBy: { price: "desc", name: "asc" }})
   */
  orderBy?: EntityOrderBy<entityType>
}
export declare class ForbiddenError extends Error {
  constructor(message?: string)
  isForbiddenError: true
}
export declare function getEntityRef<entityType>(
  entity: entityType,
  throwException?: boolean,
): EntityRef<entityType>
export declare function getFields<fieldsContainerType>(
  container: fieldsContainerType,
  remult?: Remult,
): FieldsRef<fieldsContainerType>
export declare function getValueList<T>(type: ClassType<T>): T[]
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
    [K in groupByFields[number]]?: "asc" | "desc"
  } & {
    [K in sumFields[number]]?: {
      sum?: "asc" | "desc"
    }
  } & {
    [K in averageFields[number]]?: {
      avg?: "asc" | "desc"
    }
  } & {
    [K in minFields[number]]?: {
      min?: "asc" | "desc"
    }
  } & {
    [K in maxFields[number]]?: {
      max?: "asc" | "desc"
    }
  } & {
    [K in distinctCountFields[number]]?: {
      distinctCount?: "asc" | "desc"
    }
  } & {
    $count?: "asc" | "desc"
  }
} & Pick<FindOptions<entityType>, "limit" | "page">
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
    ? {
        sum: number
      }
    : never
} & {
  [K in averageFields[number]]: {
    avg: number
  }
} & {
  [K in minFields[number]]: {
    min: number
  }
} & {
  [K in maxFields[number]]: {
    max: number
  }
} & {
  [K in distinctCountFields[number]]: {
    distinctCount: number
  }
} & {
  $count: number
}
export declare class IdEntity extends EntityBase {
  id: string
}
export interface IdFieldRef<entityType, valueType>
  extends FieldRef<entityType, valueType> {
  setId(
    id: valueType extends {
      id?: number
    }
      ? number
      : valueType extends {
          id?: string
        }
      ? string
      : string | number,
  ): void
  getId(): valueType extends {
    id?: number
  }
    ? number
    : valueType extends {
        id?: string
      }
    ? string
    : string | number
}
export type IdFilter<valueType> =
  | ValueFilter<valueType>
  | {
      $id: ValueFilter<
        valueType extends {
          id?: number
        }
          ? number
          : string
      >
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
export declare class InMemoryDataProvider
  implements DataProvider, __RowsOfDataForTesting
{
  transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void>
  rows: any
  getEntityDataProvider(entity: EntityMetadata): EntityDataProvider
  toString(): string
}
export declare class InMemoryLiveQueryStorage implements LiveQueryStorage {
  debugFileSaver: (x: any) => void
  debug(): void
  keepAliveAndReturnUnknownQueryIds(ids: string[]): Promise<string[]>
  queries: (StoredQuery & {
    lastUsed: string
  })[]
  constructor()
  add(query: StoredQuery): Promise<void>
  removeCountForTesting: number
  remove(id: any): Promise<void>
  forEach(
    entityKey: string,
    handle: (args: {
      query: StoredQuery
      setData(data: any): Promise<void>
    }) => Promise<void>,
  ): Promise<void>
}
export declare function isBackend(): boolean
export declare class JsonDataProvider implements DataProvider {
  private storage
  private formatted
  constructor(storage: JsonEntityStorage, formatted?: boolean)
  getEntityDataProvider(entity: EntityMetadata): EntityDataProvider
  transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void>
}
export declare class JsonEntityIndexedDbStorage implements JsonEntityStorage {
  private dbName
  private storeName
  constructor(dbName?: string, storeName?: string)
  supportsRawJson: boolean
  getItem(entityDbName: string): Promise<string>
  setItem(entityDbName: string, json: string): Promise<void>
  removeItem(entityDbName: string): Promise<void>
}
export declare class JsonEntityOpfsStorage implements JsonEntityStorage {
  getItem(entityDbName: string): Promise<string>
  setItem(entityDbName: string, json: string): Promise<void>
}
export interface JsonEntityStorage {
  getItem(entityDbName: string): any | null | Promise<any | null>
  setItem(entityDbName: string, json: any): void | Promise<void>
  supportsRawJson?: boolean
}
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
//[ ] idType from TBD is not exported
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
export declare type LiveQueryChange =
  | {
      type: "all"
      data: any[]
    }
  | {
      type: "add"
      data: any
    }
  | {
      type: "replace"
      data: {
        oldId: any
        item: any
      }
    }
  | {
      type: "remove"
      data: {
        id: any
      }
    }
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
export interface LiveQueryStorage {
  add(query: StoredQuery): Promise<void>
  remove(queryId: string): Promise<void>
  forEach(
    entityKey: string,
    callback: (args: {
      query: StoredQuery
      setData(data: any): Promise<void>
    }) => Promise<void>,
  ): Promise<void>
  keepAliveAndReturnUnknownQueryIds(queryIds: string[]): Promise<string[]>
}
export declare type MembersOnly<T> = {
  [K in keyof Omit<T, keyof EntityBase> as T[K] extends Function
    ? never
    : K]: T[K]
}
export type MembersToInclude<T> = {
  [K in keyof ObjectMembersOnly<T>]?:
    | boolean
    | (NonNullable<T[K]> extends Array<any>
        ? FindOptions<NonNullable<T[K]>[number]>
        : FindFirstOptions<NonNullable<T[K]>>)
}
export type NumericKeys<T> = {
  [K in keyof T]: T[K] extends number | undefined | null ? K : never
}[keyof T]
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
  : {
      aggregates: AggregateResult
    })
//[ ] EmptyAggregateResult from TBD is not exported
export interface PreprocessFilterEvent<entityType> {
  /**
   * Metadata of the entity being filtered.
   */
  metadata: EntityMetadata<entityType>
  /**
     * Retrieves precise values for each property in a filter for an entity.
     * @param filter Optional filter to analyze. If not provided, the current filter being preprocessed is used.
     * @returns A promise that resolves to a FilterPreciseValues object containing the precise values for each property.
     
    * @see {@Link FilterPreciseValues }
     */
  getFilterPreciseValues(
    filter?: EntityFilter<entityType>,
  ): Promise<FilterPreciseValues<entityType>>
}
export declare class ProgressListener {
  private res
  constructor(res: DataApiResponse)
  progress(progress: number): void
}
//[ ] DataApiResponse from TBD is not exported
export interface QueryOptions<entityType> extends FindOptionsBase<entityType> {
  /** The number of items to return in each step */
  pageSize?: number
  /** A callback method to indicate the progress of the iteration */
  progress?: {
    progress: (progress: number) => void
  }
}
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
export declare type RefSubscriber = (() => void) | RefSubscriberBase
export interface RefSubscriberBase {
  reportChanged: () => void
  reportObserved: () => void
}
export interface RelationOptions<
  fromEntity,
  toEntity,
  matchIdEntity,
  optionsType extends FindOptionsBase<toEntity> = FindOptionsBase<toEntity>,
> extends Pick<FieldOptions, "caption"> {
  /**
   * An object specifying custom field names for the relation.
   * Each key represents a field in the related entity, and its value is the corresponding field in the source entity.
   * For example, `{ customerId: 'id' }` maps the 'customerId' field in the related entity to the 'id' field in the source entity.
   * This is useful when you want to define custom field mappings for the relation.
   */
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
export declare class Relations {
  /**
   * Define a to-one relation between entities, indicating a one-to-one relationship.
   * If no field or fields are provided, it will automatically create a field in the database
   * to represent the relation.
   *
   * @param toEntityType A function that returns the target entity type.
   * @param options (Optional): An object containing options for configuring the to-one relation.
   * @returns A decorator function to apply the to-one relation to an entity field.
   *
   * Example usage:
   * ```
   * @Relations.toOne(() => Customer)
   * customer?: Customer;
   * ```
   * ```
   * Fields.string()
   * customerId?: string;
   *
   * @Relations.toOne(() => Customer, "customerId")
   * customer?: Customer;
   * ```
   * ```
   * Fields.string()
   * customerId?: string;
   *
   * @Relations.toOne(() => Customer, {
   *   field: "customerId",
   *   defaultIncluded: true
   * })
   * customer?: Customer;
   * ```
   * ```
   * Fields.string()
   * customerId?: string;
   *
   * @Relations.toOne(() => Customer, {
   *   fields: {
   *     customerId: "id",
   *   },
   * })
   * customer?: Customer;
   * ```
   */
  static toOne<entityType, toEntityType>(
    toEntityType: () => ClassType<toEntityType>,
    options?:
      | (FieldOptions<entityType, toEntityType> &
          Pick<
            RelationOptions<entityType, toEntityType, any, any>,
            "defaultIncluded"
          >)
      | RelationOptions<entityType, toEntityType, entityType>
      | keyof entityType,
  ): (
    target: any,
    context:
      | ClassFieldDecoratorContextStub<entityType, toEntityType | undefined>
      | string,
    c?: any,
  ) => void
  /**
   * Define a toMany relation between entities, indicating a one-to-many relationship.
   * This method allows you to establish a relationship where one entity can have multiple related entities.
   *
   * @param toEntityType A function that returns the target entity type.
   * @param fieldInToEntity (Optional) The field in the target entity that represents the relation.
   *                       Use this if you want to specify a custom field name for the relation.
   * @returns A decorator function to apply the toMany relation to an entity field.
   *
   * Example usage:
   * ```
   * @Relations.toMany(() => Order)
   * orders?: Order[];
   *
   * // or with a custom field name:
   * @Relations.toMany(() => Order, "customerId")
   * orders?: Order[];
   * ```
   */
  static toMany<entityType, toEntityType>(
    toEntityType: () => ClassType<toEntityType>,
    fieldInToEntity?: keyof toEntityType,
  ): ClassFieldDecorator<entityType, toEntityType[] | undefined>
  /**
   * Define a toMany relation between entities, indicating a one-to-many relationship.
   * This method allows you to establish a relationship where one entity can have multiple related entities.
   * You can also specify various options to customize the relation and control related data retrieval.
   *
   * @param toEntityType A function that returns the target entity type.
   * @param options An object containing options for configuring the toMany relation.
   *                - field (Optional): The field in the target entity that represents the relation.
   *                  Use this if you want to specify a custom field name for the relation.
   *                - findOptions (Optional): Customize the options for finding related entities.
   *                  You can set limits, order, where conditions, and more.
   * @returns A decorator function to apply the toMany relation to an entity field.
   *
   * Example usage:
   * ```
   * @Relations.toMany(() => Order, {
   *   field: "customerOrders",
   *   findOptions: {
   *     limit: 10,
   *     orderBy: { amount: "desc" },
   *     where: { completed: true },
   *   },
   * })
   * orders?: Order[];
   * ```
   */
  static toMany<entityType, toEntityType>(
    toEntityType: () => ClassType<toEntityType>,
    options: RelationOptions<
      entityType,
      toEntityType,
      toEntityType,
      FindOptions<toEntityType>
    >,
  ): ClassFieldDecorator<entityType, toEntityType[] | undefined>
}
export const remult: Remult
export declare class Remult {
  /**Return's a `Repository` of the specific entity type
   * @example
   * const taskRepo = remult.repo(Task);
   * @see [Repository](https://remult.dev/docs/ref_repository.html)
   * @param entity - the entity to use
   * @param dataProvider - an optional alternative data provider to use. Useful for writing to offline storage or an alternative data provider
   */
  repo: <T>(entity: ClassType<T>, dataProvider?: DataProvider) => Repository<T>
  private _subscribers?
  subscribeAuth(listener: RefSubscriber): Unsubscribe
  private __user?
  /** Returns the current user's info */
  get user(): UserInfo | undefined
  set user(user: UserInfo | undefined)
  /**
   * Fetches user information from the backend and updates the `remult.user` object.
   * Typically used during application initialization and user authentication.
   *
   * @returns {Promise<UserInfo | undefined>} A promise that resolves to the user's information or `undefined` if unavailable.
   */
  initUser(): Promise<UserInfo | undefined>
  /** Checks if a user was authenticated */
  authenticated(): boolean
  /** checks if the user has any of the roles specified in the parameters
   * @example
   * remult.isAllowed("admin")
   * @see
   * [Allowed](https://remult.dev/docs/allowed.html)
   */
  isAllowed(roles?: Allowed): boolean
  /** checks if the user matches the allowedForInstance callback
   * @see
   * [Allowed](https://remult.dev/docs/allowed.html)
   */
  isAllowedForInstance(
    instance: any,
    allowed?: AllowedForInstance<any>,
  ): boolean
  useFetch(fetch: ApiClient["httpClient"]): void
  /** The current data provider */
  dataProvider: DataProvider
  /** Creates a new instance of the `remult` object.
   *
   * Can receive either an HttpProvider or a DataProvider as a parameter - which will be used to fetch data from.
   *
   * If no provider is specified, `fetch` will be used as an http provider
   */
  constructor(http: ExternalHttpProvider | typeof fetch | ApiClient)
  constructor(p: DataProvider)
  constructor()
  liveQueryStorage?: LiveQueryStorage
  subscriptionServer?: SubscriptionServer
  /** Used to call a `backendMethod` using a specific `remult` object
   * @example
   * await remult.call(TasksController.setAll, undefined, true);
   * @param backendMethod - the backend method to call
   * @param classInstance - the class instance of the backend method, for static backend methods use undefined
   * @param args - the arguments to send to the backend method
   */
  call<T extends (...args: any[]) => Promise<any>>(
    backendMethod: T,
    classInstance?: any,
    ...args: GetArguments<T>
  ): ReturnType<T>
  /** A helper callback that can be used to debug and trace all find operations. Useful in debugging scenarios */
  static onFind: (metadata: EntityMetadata, options: FindOptions<any>) => void
  clearAllCache(): any
  /** A helper callback that is called whenever an entity is created. */
  static entityRefInit?: (ref: EntityRef<any>, row: any) => void
  /** context information that can be used to store custom information that will be disposed as part of the `remult` object */
  readonly context: RemultContext
  /** The api client that will be used by `remult` to perform calls to the `api` */
  apiClient: ApiClient
}
export interface RemultContext {}
export declare function repo<entityType>(
  entity: ClassType<entityType>,
  dataProvider?: DataProvider,
): import("./src/remult3/remult3.js").Repository<entityType>
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
      "orderBy" | "limit" | "page" | "group"
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
        "group" | "orderBy" | "where" | "limit" | "page"
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
      "group" | "orderBy" | "where" | "limit" | "page"
    >
  }
    ? QueryResult<
        entityType,
        GroupByResult<
          entityType,
          never,
          NonNullable<Options["aggregate"]["sum"]>,
          NonNullable<Options["aggregate"]["avg"]>,
          NonNullable<Options["aggregate"]["min"]>,
          NonNullable<Options["aggregate"]["max"]>,
          NonNullable<Options["aggregate"]["distinctCount"]>
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
  insert(item: Partial<MembersOnly<entityType>>[]): Promise<entityType[]>
  insert(item: Partial<MembersOnly<entityType>>): Promise<entityType>
  /** Updates an item, based on its `id`
   * @example
   * taskRepo.update(task.id,{...task,completed:true})
   */
  update(
    id: idType<entityType>,
    item: Partial<MembersOnly<entityType>>,
  ): Promise<entityType>
  update(
    id: Partial<MembersOnly<entityType>>,
    item: Partial<MembersOnly<entityType>>,
  ): Promise<entityType>
  /**
   * Updates all items that match the `where` condition.
   */
  updateMany(options: {
    where: EntityFilter<entityType>
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
  deleteMany(options: { where: EntityFilter<entityType> }): Promise<number>
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
//[ ] entityEventListener from TBD is not exported
export type RepositoryRelations<entityType> = {
  [K in keyof ObjectMembersOnly<entityType>]-?: NonNullable<
    entityType[K]
  > extends Array<infer R>
    ? Repository<R>
    : entityType[K] extends infer R
    ? {
        findOne: (options?: FindOptionsBase<R>) => Promise<R>
      }
    : never
}
//[ ] R from TBD is not exported
export type RepositoryRelationsForEntityBase<entityType> = {
  [K in keyof Omit<entityType, keyof EntityBase>]-?: NonNullable<
    entityType[K]
  > extends Array<infer R>
    ? Repository<R>
    : entityType[K] extends infer R
    ? {
        findOne: (options?: FindOptionsBase<R>) => Promise<R>
      }
    : never
}
export declare class RestDataProvider implements DataProvider {
  private apiProvider
  private entityRequested?
  constructor(
    apiProvider: () => ApiClient,
    entityRequested?: ((entity: EntityMetadata) => void) | undefined,
  )
  getEntityDataProvider(entity: EntityMetadata): RestEntityDataProvider
  transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void>
  isProxy: boolean
}
//[ ] RestEntityDataProvider from TBD is not exported
export interface RestDataProviderHttpProvider {
  post(url: string, data: any): Promise<any>
  delete(url: string): Promise<void>
  put(url: string, data: any): Promise<any>
  get(url: string): Promise<any>
}
export declare class Sort {
  /**
   * Translates the current `Sort` instance into an `EntityOrderBy` object.
   *
   * @returns {EntityOrderBy<any>} An `EntityOrderBy` object representing the sort criteria.
   */
  toEntityOrderBy(): EntityOrderBy<any>
  /**
   * Constructs a `Sort` instance with the provided sort segments.
   *
   * @param {...SortSegment[]} segments The sort segments to be included in the sort criteria.
   */
  constructor(...segments: SortSegment[])
  /**
   * The segments of the sort criteria.
   *
   * @type {SortSegment[]}
   */
  Segments: SortSegment[]
  /**
   * Reverses the sort order of the current sort criteria.
   *
   * @returns {Sort} A new `Sort` instance with the reversed sort order.
   */
  reverse(): Sort
  /**
   * Compares two objects based on the current sort criteria.
   *
   * @param {any} a The first object to compare.
   * @param {any} b The second object to compare.
   * @param {function(FieldMetadata): string} [getFieldKey] An optional function to get the field key for comparison.
   * @returns {number} A negative value if `a` should come before `b`, a positive value if `a` should come after `b`, or zero if they are equal.
   */
  compare(
    a: any,
    b: any,
    getFieldKey?: (field: FieldMetadata) => string,
  ): number
  /**
   * Translates an `EntityOrderBy` to a `Sort` instance.
   *
   * @template T The entity type for the order by.
   * @param {EntityMetadata<T>} entityDefs The metadata of the entity associated with the order by.
   * @param {EntityOrderBy<T>} [orderBy] The `EntityOrderBy` to be translated.
   * @returns {Sort} A `Sort` instance representing the translated order by.
   */
  static translateOrderByToSort<T>(
    entityDefs: EntityMetadata<T>,
    orderBy: EntityOrderBy<T>,
  ): Sort
  /**
   * Creates a unique `Sort` instance based on the provided `Sort` and the entity metadata.
   * This ensures that the sort criteria result in a unique ordering of entities.
   *
   * @template T The entity type for the sort.
   * @param {EntityMetadata<T>} entityMetadata The metadata of the entity associated with the sort.
   * @param {Sort} [orderBy] The `Sort` instance to be made unique.
   * @returns {Sort} A `Sort` instance representing the unique sort criteria.
   */
  static createUniqueSort<T>(
    entityMetadata: EntityMetadata<T>,
    orderBy?: Sort,
  ): Sort
  /**
   * Creates a unique `EntityOrderBy` based on the provided `EntityOrderBy` and the entity metadata.
   * This ensures that the order by criteria result in a unique ordering of entities.
   *
   * @template T The entity type for the order by.
   * @param {EntityMetadata<T>} entityMetadata The metadata of the entity associated with the order by.
   * @param {EntityOrderBy<T>} [orderBy] The `EntityOrderBy` to be made unique.
   * @returns {EntityOrderBy<T>} An `EntityOrderBy` representing the unique order by criteria.
   */
  static createUniqueEntityOrderBy<T>(
    entityMetadata: EntityMetadata<T>,
    orderBy?: EntityOrderBy<T>,
  ): EntityOrderBy<T>
}
export interface SortSegment {
  field: FieldMetadata
  isDescending?: boolean
}
export type SortSegments<entityType> = {
  [Properties in keyof entityType]: SortSegment & {
    descending(): SortSegment
  }
}
export interface SqlCommand extends SqlCommandWithParameters {
  execute(sql: string): Promise<SqlResult>
}
export interface SqlCommandWithParameters {
  /** @deprecated use `param` instead*/
  addParameterAndReturnSqlToken(val: any): string
  param(val: any): string
}
export declare class SqlDatabase
  implements
    DataProvider,
    HasWrapIdentifier,
    CanBuildMigrations,
    SqlCommandFactory
{
  private sql
  /**
   * Gets the SQL database from the data provider.
   * @param dataProvider - The data provider.
   * @returns The SQL database.
   * @see [Direct Database Access](https://remult.dev/docs/running-sql-on-the-server)
   */
  static getDb(dataProvider?: DataProvider): SqlDatabase
  /**
   * Creates a new SQL command.
   * @returns The SQL command.
   * @see [Direct Database Access](https://remult.dev/docs/running-sql-on-the-server)
   */
  createCommand(): SqlCommand
  /**
   * Executes a SQL command.
   * @param sql - The SQL command.
   * @returns The SQL result.
   * @see [Direct Database Access](https://remult.dev/docs/running-sql-on-the-server)
   */
  execute(sql: string): Promise<SqlResult>
  /**
   * Wraps an identifier with the database's identifier syntax.
   */
  wrapIdentifier: (name: string) => string
  ensureSchema(entities: EntityMetadata[]): Promise<void>
  /**
   * Gets the entity data provider.
   * @param entity  - The entity metadata.
   * @returns The entity data provider.
   */
  getEntityDataProvider(entity: EntityMetadata): EntityDataProvider
  /**
   * Runs a transaction. Used internally by remult when transactions are required
   * @param action - The action to run in the transaction.
   * @returns The promise of the transaction.
   */
  transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void>
  /**
     * Creates a raw filter for entity filtering.
     * @param {CustomSqlFilterBuilderFunction} build - The custom SQL filter builder function.
     * @returns {EntityFilter<any>} - The entity filter with a custom SQL filter.
     * @example
     * SqlDatabase.rawFilter(({param}) =>
          `"customerId" in (select id from customers where city = ${param(customerCity)})`
        )
     * @see [Leveraging Database Capabilities with Raw SQL in Custom Filters](https://remult.dev/docs/custom-filter.html#leveraging-database-capabilities-with-raw-sql-in-custom-filters)
     */
  static rawFilter(build: CustomSqlFilterBuilderFunction): EntityFilter<any>
  /**
     *  Converts a filter to a raw SQL string.
     *  @see [Leveraging Database Capabilities with Raw SQL in Custom Filters](https://remult.dev/docs/running-sql-on-the-server#leveraging-entityfilter-for-sql-databases)
     
     */
  static filterToRaw<entityType>(
    repo: RepositoryOverloads<entityType>,
    condition: EntityFilter<entityType>,
    sqlCommand?: SqlCommandWithParameters,
    dbNames?: EntityDbNamesBase,
    wrapIdentifier?: (name: string) => string,
  ): Promise<string>
  /**
   * `false` _(default)_ - No logging
   *
   * `true` - to log all queries to the console
   *
   * `oneLiner` - to log all queries to the console as one line
   *
   * a `function` - to log all queries to the console as a custom format
   * @example
   * SqlDatabase.LogToConsole = (duration, query, args) => { console.log("be crazy ;)") }
   */
  static LogToConsole:
    | boolean
    | "oneLiner"
    | ((duration: number, query: string, args: Record<string, any>) => void)
  /**
   * Threshold in milliseconds for logging queries to the console.
   */
  static durationThreshold: number
  /**
   * Creates a new SQL database.
   * @param sql - The SQL implementation.
   * @example
   * const db = new SqlDatabase(new PostgresDataProvider(pgPool))
   */
  constructor(sql: SqlImplementation)
  provideMigrationBuilder: (builder: MigrationCode) => MigrationBuilder
  private createdEntities
  end: () => Promise<void>
}
//[ ] MigrationCode from TBD is not exported
//[ ] MigrationBuilder from TBD is not exported
export interface SqlImplementation extends HasWrapIdentifier {
  getLimitSqlSyntax(limit: number, offset: number): string
  createCommand(): SqlCommand
  transaction(action: (sql: SqlImplementation) => Promise<void>): Promise<void>
  entityIsUsedForTheFirstTime(entity: EntityMetadata): Promise<void>
  ensureSchema?(entities: EntityMetadata[]): Promise<void>
  supportsJsonColumnType?: boolean
  /** true by default */
  doesNotSupportReturningSyntax?: boolean
  doesNotSupportReturningSyntaxOnlyForUpdate?: boolean
  orderByNullsFirst?: boolean
  end(): Promise<void>
  afterMutation?: VoidFunction
}
export interface SqlResult {
  rows: any[]
  getColumnKeyInResultForIndexInSelect(index: number): string
}
export interface StoredQuery {
  entityKey: string
  id: string
  data: any
}
export interface StringFieldOptions<entityType = unknown, valueType = string>
  extends FieldOptions<entityType, valueType> {
  maxLength?: number
  minLength?: number
}
export interface Subscribable {
  subscribe(listener: RefSubscriber): Unsubscribe
}
export declare class SubscriptionChannel<messageType> {
  channelKey: string
  /**
   * Constructs a new `SubscriptionChannel` instance.
   *
   * @param {string} channelKey The key that identifies the channel.
   */
  constructor(channelKey: string)
  /**
   * Publishes a message to the channel. This method should only be used on the backend.
   *
   * @param {messageType} message The message to be published.
   * @param {Remult} [remult] An optional instance of Remult to use for publishing the message.
   */
  publish(message: messageType, remult?: Remult): void
  /**
   * Subscribes to messages from the channel. This method should only be used on the frontend.
   *
   * @param {(message: messageType) => void} next A function that will be called with each message received.
   * @param {Remult} [remult] An optional instance of Remult to use for the subscription.
   * @returns {Promise<Unsubscribe>} A promise that resolves to a function that can be used to unsubscribe from the channel.
   */
  subscribe(
    next: (message: messageType) => void,
    remult?: Remult,
  ): Promise<Unsubscribe>
  /**
   * Subscribes to messages from the channel using a `SubscriptionListener` object.
   *
   * @param {Partial<SubscriptionListener<messageType>>} listener An object that implements the `SubscriptionListener` interface.
   * @returns {Promise<Unsubscribe>} A promise that resolves to a function that can be used to unsubscribe from the channel.
   */
  subscribe(
    listener: Partial<SubscriptionListener<messageType>>,
  ): Promise<Unsubscribe>
}
export interface SubscriptionClient {
  openConnection(
    onReconnect: VoidFunction,
  ): Promise<SubscriptionClientConnection>
}
export interface SubscriptionClientConnection {
  subscribe(
    channel: string,
    onMessage: (message: any) => void,
    onError: (err: any) => void,
  ): Promise<Unsubscribe>
  close(): void
}
export interface SubscriptionListener<type> {
  next(message: type): void
  error(err: any): void
  complete(): void
}
export interface SubscriptionServer {
  publishMessage<T>(channel: string, message: T): Promise<void>
}
export type Unsubscribe = VoidFunction
export interface UpsertOptions<entityType> {
  where: Partial<MembersOnly<entityType>>
  set?: Partial<MembersOnly<entityType>>
}
export declare class UrlBuilder {
  url: string
  constructor(url: string)
  add(key: string, value: any): void
  addObject(object: any, suffix?: string): void
}
export interface UserInfo {
  id: string
  name?: string
  roles?: string[]
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
export type ValidationMessage<valueType, argsType> =
  | string
  | ((
      entity: any,
      event: ValidateFieldEvent<any, valueType>,
      args: argsType,
    ) => string)
export type Validator<valueType> = FieldValidator<unknown, valueType> &
  ((
    message?: ValidationMessage<valueType, undefined>,
  ) => FieldValidator<unknown, valueType>) & {
    defaultMessage: ValidationMessage<valueType, undefined>
    /**
     * @deprecated use (message:string) instead - for example: Validators.required("Is needed")
     */
    withMessage(
      message: ValidationMessage<valueType, undefined>,
    ): FieldValidator<unknown, valueType>
  }
export declare class Validators {
  /**
   * Validator to check if a value is required (not null or empty).
   */
  static required: Validator<unknown>
  /**
   * Validator to ensure a value is unique in the database.
   */
  static unique: Validator<unknown>
  /**
   * @deprecated use `unique` instead - it also runs only on the backend
   * Validator to ensure a value is unique on the backend.
   */
  static uniqueOnBackend: Validator<unknown>
  /**
   * Validator to check if a value matches a given regular expression.
   */
  static regex: ValidatorWithArgs<string, RegExp> & {
    defaultMessage: ValueValidationMessage<RegExp>
  }
  /**
   * Validator to check if a value is a valid email address.
   */
  static email: Validator<string>
  /**
   * Validator to check if a value is a valid URL.
   */
  static url: Validator<string>
  /**
   * Validator to check if a value is one of the specified values.
   */
  static in: <T>(
    value: readonly T[],
    withMessage?: ValueValidationMessage<T[]>,
  ) => FieldValidator<unknown, T> & {
    withMessage: ValueValidationMessage<T[]>
  }
  /**
   * Validator to check if a value is not null.
   */
  static notNull: Validator<unknown>
  /**
   * Validator to check if a value exists in a given enum.
   */
  static enum: ValidatorWithArgs<unknown, unknown> & {
    defaultMessage: ValueValidationMessage<unknown>
  }
  /**
   * Validator to check if a related value exists in the database. By side-effect it loads relation data so it is directly available in [lifecycle hooks](https://remult.dev/docs/lifecycle-hooks)
   */
  static relationExists: Validator<unknown>
  /**
   * Validator to check if a value is greater than or equal to a minimum value.
   */
  static min: ValidatorWithArgs<number, number> & {
    defaultMessage: ValueValidationMessage<number>
  }
  /**
   * Validator to check if a value is less than or equal to a maximum value.
   */
  static max: ValidatorWithArgs<number, number> & {
    defaultMessage: ValueValidationMessage<number>
  }
  /**
   * Validator to check if a string's length is less than or equal to a maximum length.
   */
  static maxLength: ValidatorWithArgs<string, number> & {
    defaultMessage: ValueValidationMessage<number>
  }
  /**
   * Validator to check if a string's length is greater than or equal to a minimum length.
   */
  static minLength: ValidatorWithArgs<string, number> & {
    defaultMessage: ValueValidationMessage<number>
  }
  /**
   * Validator to check if a value is within a specified range.
   */
  static range: ValidatorWithArgs<number, [number, number]> & {
    defaultMessage: ValueValidationMessage<[number, number]>
  }
  static defaultMessage: string
}
//[ ] RegExp from TBD is not exported
export type ValidatorWithArgs<valueType, argsType> = (
  args: argsType,
  message?: ValidationMessage<valueType, argsType>,
) => FieldValidator<unknown, valueType>
export interface ValueConverter<valueType> {
  /**
   * Converts a value from a JSON DTO to the valueType. This method is typically used when receiving data
   * from a REST API call or deserializing a JSON payload.
   *
   * @param val The value to convert.
   * @returns The converted value.
   *
   * @example
   * fromJson: val => new Date(val)
   */
  fromJson?(val: any): valueType
  /**
   * Converts a value of valueType to a JSON DTO. This method is typically used when sending data
   * to a REST API or serializing an object to a JSON payload.
   *
   * @param val The value to convert.
   * @returns The converted value.
   *
   * @example
   * toJson: val => val?.toISOString()
   */
  toJson?(val: valueType): any
  /**
   * Converts a value from the database format to the valueType.
   *
   * @param val The value to convert.
   * @returns The converted value.
   *
   * @example
   * fromDb: val => new Date(val)
   */
  fromDb?(val: any): valueType
  /**
   * Converts a value of valueType to the database format.
   *
   * @param val The value to convert.
   * @returns The converted value.
   *
   * @example
   * toDb: val => val?.toISOString()
   */
  toDb?(val: valueType): any
  /**
   * Converts a value of valueType to a string suitable for an HTML input element.
   *
   * @param val The value to convert.
   * @param inputType The type of the input element (optional).
   * @returns The converted value as a string.
   *
   * @example
   * toInput: (val, inputType) => val?.toISOString().substring(0, 10)
   */
  toInput?(val: valueType, inputType?: string): string
  /**
   * Converts a string from an HTML input element to the valueType.
   *
   * @param val The value to convert.
   * @param inputType The type of the input element (optional).
   * @returns The converted value.
   *
   * @example
   * fromInput: (val, inputType) => new Date(val)
   */
  fromInput?(val: string, inputType?: string): valueType
  /**
   * Returns a displayable string representation of a value of valueType.
   *
   * @param val The value to convert.
   * @returns The displayable string.
   *
   * @example
   * displayValue: val => val?.toLocaleDateString()
   */
  displayValue?(val: valueType): string
  /**
   * Specifies the storage type used in the database for this field. This can be used to explicitly define the data type and precision of the field in the database.
   *
   * @example
   * // Define a field with a specific decimal precision in the database
   * @Fields.number({
   *   valueConverter: {
   *     fieldTypeInDb: 'decimal(18,8)'
   *   }
   * })
   * price=0;
   */
  readonly fieldTypeInDb?: string
  /**
   * Specifies the type of HTML input element suitable for values of valueType.
   *
   * @example
   * inputType = 'date';
   */
  readonly inputType?: string
}
export declare class ValueConverters {
  static readonly Date: ValueConverter<Date>
  static readonly DateOnly: ValueConverter<Date>
  static readonly DateOnlyString: ValueConverter<Date>
  static readonly Boolean: ValueConverter<Boolean>
  static readonly Number: ValueConverter<number>
  static readonly String: ValueConverter<String>
  static readonly Integer: ValueConverter<number>
  static readonly Default: Required<ValueConverter<any>>
  static readonly JsonString: ValueConverter<any>
  static readonly JsonValue: ValueConverter<any>
}
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
      "!="?: valueType | valueType[]
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
export interface ValueListFieldOptions<entityType, valueType>
  extends FieldOptions<entityType, valueType> {
  getValues?: () => valueType[]
}
export declare function ValueListFieldType<
  valueType extends ValueListItem = ValueListItem,
>(
  ...options: (
    | ValueListFieldOptions<any, valueType>
    | ((options: FieldOptions<any, valueType>, remult: Remult) => void)
  )[]
): (type: ClassType<valueType>, context?: any) => void
export declare class ValueListInfo<T extends ValueListItem>
  implements ValueConverter<T>
{
  private valueListType
  static get<T extends ValueListItem>(type: ClassType<T>): ValueListInfo<T>
  private byIdMap
  private values
  isNumeric: boolean
  private constructor()
  getValues(): T[]
  byId(key: any): T | undefined
  fromJson(val: any): T
  toJson(val: T): any
  fromDb(val: any): T
  toDb(val: T): any
  toInput(val: T, inputType: string): string
  fromInput(val: string, inputType: string): T
  displayValue?(val: T): string
  fieldTypeInDb?: string
  inputType?: string
}
export interface ValueListItem {
  id?: any
  caption?: any
}
export declare type ValueOrExpression<valueType> = valueType | (() => valueType)
export type ValueValidationMessage<argsType> =
  | string
  | ((args: argsType) => string)
export declare function valueValidator<valueType>(
  validate: (value: valueType) => boolean | string | Promise<boolean | string>,
  defaultMessage?: string,
): (
  entity: any,
  e: ValidateFieldEvent<any, valueType>,
) => string | boolean | Promise<string | boolean>
export declare function withRemult<T>(
  callback: (remult: Remult) => Promise<T>,
  options?: {
    dataProvider?:
      | DataProvider
      | Promise<DataProvider>
      | (() => Promise<DataProvider | undefined>)
  },
): Promise<T>
````

## ./remult-express.js

```ts
export declare function remultApi(
  options?: RemultServerOptions<express.Request> & {
    bodyParser?: boolean
    bodySizeLimit?: string
  },
): remultApiServer
//[ ] RemultServerOptions from ./server/remult-api-server.js is not exported
export type remultApiServer = express.RequestHandler &
  RemultServerCore<express.Request> & {
    withRemult: (
      req: express.Request,
      res: express.Response,
      next: VoidFunction,
    ) => void
  } & Pick<RemultServer<express.Request>, "withRemultAsync">
//[ ] RemultServerCore from ./server/remult-api-server.js is not exported
//[ ] RemultServer from ./server/remult-api-server.js is not exported
export const remultExpress: typeof remultApi
```

## ./remult-next.js

```ts
export declare function remultApi(
  options?: RemultServerOptions<Request>,
): RemultNextAppServer
//[ ] RemultServerOptions from ./server/index.js is not exported
export declare function remultNext(
  options: RemultServerOptions<NextApiRequest>,
): RemultNextServer
export const remultNextApp: typeof remultApi
export type RemultNextAppServer = RemultServerCore<Request> & {
  GET: (req: Request) => Promise<Response | undefined>
  PUT: (req: Request) => Promise<Response | undefined>
  POST: (req: Request) => Promise<Response | undefined>
  DELETE: (req: Request) => Promise<Response | undefined>
  withRemult<T>(what: () => Promise<T>): Promise<T>
}
//[ ] RemultServerCore from ./server/index.js is not exported
export type RemultNextServer = RemultServerCore<NextApiRequest> &
  NextApiHandler & {
    getServerSideProps<
      P extends {
        [key: string]: any
      } = {
        [key: string]: any
      },
      Q extends ParsedUrlQuery = ParsedUrlQuery,
      D extends PreviewData = PreviewData,
    >(
      getServerPropsFunction: GetServerSideProps<P, Q, D>,
    ): GetServerSideProps<P, Q, D>
    withRemult<T>(
      req: NextApiRequest | undefined,
      what: () => Promise<T>,
    ): Promise<T>
    /** Creates a `next.js` handler with remult defined in the correct context
     * @see
     * https://remult.dev/tutorials/react-next/appendix-1-get-server-side-props.html#using-remult-in-a-next-js-api-handler
     */
    handle<T>(handler: NextApiHandler<T>): NextApiHandler<T>
  }
```

## ./async-hooks.js

```ts
export declare function initAsyncHooks(): void
```

## ./server/index.js

```ts
export declare function createRemultServer<RequestType>(
  options: RemultServerOptions<RequestType>,
  serverCoreOptions?: ServerCoreOptions<RequestType>,
): RemultServer<RequestType>
//[ ] ServerCoreOptions from ./remult-api-server.js is not exported
export declare class DataProviderLiveQueryStorage
  implements LiveQueryStorage, Storage
{
  repo: Promise<Repository<LiveQueryStorageEntity>>
  dataProvider: Promise<DataProvider>
  constructor(
    dataProvider:
      | DataProvider
      | Promise<DataProvider>
      | (() => Promise<DataProvider | undefined>),
  )
  ensureSchema(): Promise<void>
  add({ id, entityKey, data }: StoredQuery): Promise<void>
  remove(queryId: string): Promise<void>
  forEach(
    entityKey: string,
    callback: (args: {
      query: StoredQuery
      setData(data: any): Promise<void>
    }) => Promise<void>,
  ): Promise<void>
  keepAliveAndReturnUnknownQueryIds(queryIds: string[]): Promise<string[]>
}
//[ ] Repository from TBD is not exported
//[ ] LiveQueryStorageEntity from TBD is not exported
//[ ] DataProvider from TBD is not exported
//[ ] StoredQuery from TBD is not exported
export type GenericRequestHandler<RequestType> = (
  req: RequestType,
  res: GenericResponse,
  next: VoidFunction,
) => void
export interface GenericRequestInfo {
  url?: string
  method?: any
  query?: any
  params?: any
}
export interface GenericResponse {
  json(data: any): void
  send(html: string): void
  status(statusCode: number): GenericResponse
  end(): void
}
export type GenericRouter<RequestType> = {
  route(path: string): SpecificRoute<RequestType>
}
export interface InitRequestOptions {
  liveQueryStorage: LiveQueryStorage
  readonly remult: Remult
}
//[ ] LiveQueryStorage from TBD is not exported
//[ ] Remult from TBD is not exported
export declare class JsonEntityFileStorage implements JsonEntityStorage {
  private folderPath
  getItem(entityDbName: string): string | null
  setItem(entityDbName: string, json: string): void
  constructor(folderPath: string)
}
export declare class JsonFileDataProvider extends JsonDataProvider {
  constructor(folderPath: string)
}
export interface queuedJobInfo {
  info: queuedJobInfoResponse
  userId: string
  setErrorResult(error: any): void
  setResult(result: any): void
  setProgress(progress: number): void
}
//[ ] queuedJobInfoResponse from TBD is not exported
export interface QueueStorage {
  createJob(url: string, userId?: string): Promise<string>
  getJobInfo(queuedJobId: string): Promise<queuedJobInfo>
}
export interface RemultServer<RequestType>
  extends RemultServerCore<RequestType> {
  withRemult(req: RequestType, res: GenericResponse, next: VoidFunction): void
  registerRouter(r: GenericRouter<RequestType>): void
  handle(
    req: RequestType,
    gRes?: GenericResponse,
  ): Promise<ServerHandleResponse | undefined>
  withRemultAsync<T>(
    request: RequestType | undefined,
    what: () => Promise<T>,
  ): Promise<T>
}
//[ ] ServerHandleResponse from TBD is not exported
export interface RemultServerCore<RequestType> {
  getRemult(req?: RequestType): Promise<Remult>
  openApiDoc(options: { title: string; version?: string }): any
}
export interface RemultServerOptions<RequestType> {
  /**Entities to use for the api */
  entities?: ClassType<any>[]
  /**Controller to use for the api */
  controllers?: ClassType<any>[]
  /** Will be called to get the current user based on the current request */
  getUser?: (request: RequestType) => Promise<UserInfo | undefined>
  /** Will be called for each request and can be used for configuration */
  initRequest?: (
    request: RequestType,
    options: InitRequestOptions,
  ) => Promise<void>
  /** Will be called once the server is loaded and the data provider is ready */
  initApi?: (remult: Remult) => void | Promise<void>
  /** Data Provider to use for the api.
   *
   * @see [Connecting to a Database](https://remult.dev/docs/databases.html).
   */
  dataProvider?:
    | DataProvider
    | Promise<DataProvider>
    | (() => Promise<DataProvider | undefined>)
  /** Will create tables and columns in supporting databases. default: true
   *
   * @description
   * when set to true, it'll create entities that do not exist, and add columns that are missing.
   */
  ensureSchema?: boolean
  /** The path to use for the api, default:/api
   *
   * @description
   * If you want to use a different api path adjust this field
   */
  rootPath?: string
  /** The default limit to use for find requests that did not specify a limit */
  defaultGetLimit?: number
  /** When set to true (default) it'll console log each api endpoint that is created */
  logApiEndPoints?: boolean
  /** A subscription server to use for live query and message channels */
  subscriptionServer?: SubscriptionServer
  /** A storage to use to store live queries, relevant mostly for serverless scenarios or larger scales */
  liveQueryStorage?: LiveQueryStorage
  /** Used to store the context relevant info for re running a live query */
  contextSerializer?: {
    serialize(remult: Remult): Promise<any>
    deserialize(json: any, options: InitRequestOptions): Promise<void>
  }
  /** When set to true, will display an admin ui in the `/api/admin` url.
   * Can also be set to an arrow function for fine grained control
   * @example
   * admin: true
   * @example
   * admin: () => remult.isAllowed('admin')
   * @see [allowed](http://remult.dev/docs/allowed.html)
   */
  admin?:
    | Allowed
    | {
        allow: Allowed
        customHtmlHead?: (remult: Remult) => string
        requireAuthToken?: boolean
        disableLiveQuery?: boolean
      }
  /** Storage to use for backend methods that use queue */
  queueStorage?: QueueStorage
  /**
   * This method is called whenever there is an error in the API lifecycle.
   *
   * @param info - Information about the error.
   * @param info.req - The request object.
   * @param info.entity - (Optional) The entity metadata associated with the error, if applicable.
   * @param info.exception - (Optional) The exception object or error that occurred.
   * @param info.httpStatusCode - The HTTP status code.
   * @param info.responseBody - The body of the response.
   * @param info.sendError - A method to send a custom error response. Call this method with the desired HTTP status code and response body.
   *
   * @returns A promise that resolves when the error handling is complete.
   * @example
   * export const api = remultApi({
   *   error: async (e) => {
   *     if (e.httpStatusCode == 400) {
   *       e.sendError(500, { message: "An error occurred" })
   *     }
   *   }
   * })
   */
  error?: (info: {
    req?: RequestType
    entity?: EntityMetadata
    exception?: any
    httpStatusCode: number
    responseBody: any
    sendError: (httpStatusCode: number, body: any) => void
  }) => Promise<void> | undefined
}
//[ ] ClassType from TBD is not exported
//[ ] UserInfo from TBD is not exported
//[ ] SubscriptionServer from TBD is not exported
//[ ] Allowed from TBD is not exported
//[ ] EntityMetadata from TBD is not exported
export type SpecificRoute<RequestType> = {
  get(handler: GenericRequestHandler<RequestType>): SpecificRoute<RequestType>
  put(handler: GenericRequestHandler<RequestType>): SpecificRoute<RequestType>
  post(handler: GenericRequestHandler<RequestType>): SpecificRoute<RequestType>
  delete(
    handler: GenericRequestHandler<RequestType>,
  ): SpecificRoute<RequestType>
}
export declare class SseSubscriptionServer implements SubscriptionServer {
  private canUserConnectToChannel?
  constructor(
    canUserConnectToChannel?:
      | ((channel: string, remult: Remult) => boolean)
      | undefined,
  )
  publishMessage<T>(channel: string, message: any): Promise<void>
}
export declare function TestApiDataProvider(
  options?: Pick<RemultServerOptions<unknown>, "ensureSchema" | "dataProvider">,
): RestDataProvider
//[ ] RestDataProvider from TBD is not exported
```

## ./server/core.js

```ts
export declare function createRemultServerCore<RequestType>(
  options: RemultServerOptions<RequestType>,
  serverCoreOptions: ServerCoreOptions<RequestType>,
): RemultServer<RequestType>
//[ ] ServerCoreOptions from TBD is not exported
export declare class DataProviderLiveQueryStorage
  implements LiveQueryStorage, Storage
{
  repo: Promise<Repository<LiveQueryStorageEntity>>
  dataProvider: Promise<DataProvider>
  constructor(
    dataProvider:
      | DataProvider
      | Promise<DataProvider>
      | (() => Promise<DataProvider | undefined>),
  )
  ensureSchema(): Promise<void>
  add({ id, entityKey, data }: StoredQuery): Promise<void>
  remove(queryId: string): Promise<void>
  forEach(
    entityKey: string,
    callback: (args: {
      query: StoredQuery
      setData(data: any): Promise<void>
    }) => Promise<void>,
  ): Promise<void>
  keepAliveAndReturnUnknownQueryIds(queryIds: string[]): Promise<string[]>
}
//[ ] Repository from TBD is not exported
//[ ] LiveQueryStorageEntity from TBD is not exported
//[ ] DataProvider from TBD is not exported
//[ ] StoredQuery from TBD is not exported
export type GenericRequestHandler<RequestType> = (
  req: RequestType,
  res: GenericResponse,
  next: VoidFunction,
) => void
export interface GenericRequestInfo {
  url?: string
  method?: any
  query?: any
  params?: any
}
export interface GenericResponse {
  json(data: any): void
  send(html: string): void
  status(statusCode: number): GenericResponse
  end(): void
}
export type GenericRouter<RequestType> = {
  route(path: string): SpecificRoute<RequestType>
}
export declare class JsonEntityFileStorage implements JsonEntityStorage {
  private folderPath
  getItem(entityDbName: string): string | null
  setItem(entityDbName: string, json: string): void
  constructor(folderPath: string)
}
export declare class JsonFileDataProvider extends JsonDataProvider {
  constructor(folderPath: string)
}
export interface queuedJobInfo {
  info: queuedJobInfoResponse
  userId: string
  setErrorResult(error: any): void
  setResult(result: any): void
  setProgress(progress: number): void
}
//[ ] queuedJobInfoResponse from TBD is not exported
export interface QueueStorage {
  createJob(url: string, userId?: string): Promise<string>
  getJobInfo(queuedJobId: string): Promise<queuedJobInfo>
}
export interface RemultServer<RequestType>
  extends RemultServerCore<RequestType> {
  withRemult(req: RequestType, res: GenericResponse, next: VoidFunction): void
  registerRouter(r: GenericRouter<RequestType>): void
  handle(
    req: RequestType,
    gRes?: GenericResponse,
  ): Promise<ServerHandleResponse | undefined>
  withRemultAsync<T>(
    request: RequestType | undefined,
    what: () => Promise<T>,
  ): Promise<T>
}
//[ ] ServerHandleResponse from TBD is not exported
export interface RemultServerOptions<RequestType> {
  /**Entities to use for the api */
  entities?: ClassType<any>[]
  /**Controller to use for the api */
  controllers?: ClassType<any>[]
  /** Will be called to get the current user based on the current request */
  getUser?: (request: RequestType) => Promise<UserInfo | undefined>
  /** Will be called for each request and can be used for configuration */
  initRequest?: (
    request: RequestType,
    options: InitRequestOptions,
  ) => Promise<void>
  /** Will be called once the server is loaded and the data provider is ready */
  initApi?: (remult: Remult) => void | Promise<void>
  /** Data Provider to use for the api.
   *
   * @see [Connecting to a Database](https://remult.dev/docs/databases.html).
   */
  dataProvider?:
    | DataProvider
    | Promise<DataProvider>
    | (() => Promise<DataProvider | undefined>)
  /** Will create tables and columns in supporting databases. default: true
   *
   * @description
   * when set to true, it'll create entities that do not exist, and add columns that are missing.
   */
  ensureSchema?: boolean
  /** The path to use for the api, default:/api
   *
   * @description
   * If you want to use a different api path adjust this field
   */
  rootPath?: string
  /** The default limit to use for find requests that did not specify a limit */
  defaultGetLimit?: number
  /** When set to true (default) it'll console log each api endpoint that is created */
  logApiEndPoints?: boolean
  /** A subscription server to use for live query and message channels */
  subscriptionServer?: SubscriptionServer
  /** A storage to use to store live queries, relevant mostly for serverless scenarios or larger scales */
  liveQueryStorage?: LiveQueryStorage
  /** Used to store the context relevant info for re running a live query */
  contextSerializer?: {
    serialize(remult: Remult): Promise<any>
    deserialize(json: any, options: InitRequestOptions): Promise<void>
  }
  /** When set to true, will display an admin ui in the `/api/admin` url.
   * Can also be set to an arrow function for fine grained control
   * @example
   * admin: true
   * @example
   * admin: () => remult.isAllowed('admin')
   * @see [allowed](http://remult.dev/docs/allowed.html)
   */
  admin?:
    | Allowed
    | {
        allow: Allowed
        customHtmlHead?: (remult: Remult) => string
        requireAuthToken?: boolean
        disableLiveQuery?: boolean
      }
  /** Storage to use for backend methods that use queue */
  queueStorage?: QueueStorage
  /**
   * This method is called whenever there is an error in the API lifecycle.
   *
   * @param info - Information about the error.
   * @param info.req - The request object.
   * @param info.entity - (Optional) The entity metadata associated with the error, if applicable.
   * @param info.exception - (Optional) The exception object or error that occurred.
   * @param info.httpStatusCode - The HTTP status code.
   * @param info.responseBody - The body of the response.
   * @param info.sendError - A method to send a custom error response. Call this method with the desired HTTP status code and response body.
   *
   * @returns A promise that resolves when the error handling is complete.
   * @example
   * export const api = remultApi({
   *   error: async (e) => {
   *     if (e.httpStatusCode == 400) {
   *       e.sendError(500, { message: "An error occurred" })
   *     }
   *   }
   * })
   */
  error?: (info: {
    req?: RequestType
    entity?: EntityMetadata
    exception?: any
    httpStatusCode: number
    responseBody: any
    sendError: (httpStatusCode: number, body: any) => void
  }) => Promise<void> | undefined
}
//[ ] ClassType from TBD is not exported
//[ ] UserInfo from TBD is not exported
//[ ] InitRequestOptions from TBD is not exported
//[ ] Remult from TBD is not exported
//[ ] SubscriptionServer from TBD is not exported
//[ ] LiveQueryStorage from TBD is not exported
//[ ] Allowed from TBD is not exported
//[ ] EntityMetadata from TBD is not exported
export type SpecificRoute<RequestType> = {
  get(handler: GenericRequestHandler<RequestType>): SpecificRoute<RequestType>
  put(handler: GenericRequestHandler<RequestType>): SpecificRoute<RequestType>
  post(handler: GenericRequestHandler<RequestType>): SpecificRoute<RequestType>
  delete(
    handler: GenericRequestHandler<RequestType>,
  ): SpecificRoute<RequestType>
}
export declare class SseSubscriptionServer implements SubscriptionServer {
  private canUserConnectToChannel?
  constructor(
    canUserConnectToChannel?:
      | ((channel: string, remult: Remult) => boolean)
      | undefined,
  )
  publishMessage<T>(channel: string, message: any): Promise<void>
}
```

## ./remult-fastify.js

```ts
export declare function remultApi(
  options: RemultServerOptions<FastifyRequest>,
): RemultFastifyServer
//[ ] RemultServerOptions from ./server/remult-api-server.js is not exported
export const remultFastify: typeof remultApi
export type RemultFastifyServer = FastifyPluginCallback &
  RemultServerCore<FastifyRequest> & {
    withRemult: RemultServer<FastifyRequest>["withRemultAsync"]
  }
//[ ] RemultServerCore from ./server/remult-api-server.js is not exported
//[ ] RemultServer from ./server/remult-api-server.js is not exported
```

## ./remult-hapi.js

```ts
export declare function remultApi(
  options: RemultServerOptions<Request>,
): RemultHapiServer
//[ ] RemultServerOptions from ./server/index.js is not exported
export const remultHapi: typeof remultApi
export type RemultHapiServer = Plugin<any, any> &
  RemultServerCore<Request> & {
    withRemult: RemultServer<Request>["withRemultAsync"]
  }
//[ ] RemultServerCore from ./server/index.js is not exported
//[ ] RemultServer from ./server/index.js is not exported
```

## ./remult-hono.js

```ts
export declare function remultApi(
  options: RemultServerOptions<Context<Env, "", BlankInput>>,
): RemultHonoServer
//[ ] RemultServerOptions from ./server/index.js is not exported
export const remultHono: typeof remultApi
export type RemultHonoServer = Hono &
  RemultServerCore<Context<Env, "", BlankInput>> & {
    withRemult: <T>(
      c: Context<Env, "", BlankInput>,
      what: () => Promise<T>,
    ) => Promise<T>
  }
//[ ] RemultServerCore from ./server/index.js is not exported
```

## ./remult-fresh.js

```ts
export interface FreshContext {
  next: () => Promise<any>
}
export interface FreshRequest {
  url: string
  method: string
  json: () => Promise<any>
}
export interface FreshResponse {
  new (body?: any | undefined, init?: ResponseInit): any
  json(data: unknown, init?: ResponseInit): any
}
//[ ] ResponseInit from TBD is not exported
export declare function remultApi(
  options: RemultServerOptions<FreshRequest>,
  response: FreshResponse,
): RemultFresh
//[ ] RemultServerOptions from ./server/remult-api-server.js is not exported
export const remultFresh: typeof remultApi
export interface RemultFresh extends RemultServerCore<FreshRequest> {
  handle(req: FreshRequest, ctx: FreshContext): Promise<any>
}
```

## ./remult-sveltekit.js

```ts
export declare function remultApi(
  options: RemultServerOptions<RequestEvent>,
): RemultSveltekitServer
//[ ] RemultServerOptions from ./server/index.js is not exported
export const remultSveltekit: typeof remultApi
export type RemultSveltekitServer = RemultServerCore<RequestEvent> &
  Handle & {
    withRemult: RemultServer<RequestEvent>["withRemultAsync"]
    GET: RequestHandler
    PUT: RequestHandler
    POST: RequestHandler
    DELETE: RequestHandler
  }
//[ ] RemultServerCore from ./server/index.js is not exported
//[ ] RemultServer from ./server/index.js is not exported
```

## ./postgres/index.js

```ts
export declare function createPostgresConnection(
  options?: Parameters<typeof createPostgresDataProvider>[0],
): Promise<SqlDatabase>
//[ ] IndexedAccessType from TBD is not exported
//[ ] SqlDatabase from TBD is not exported
export declare function createPostgresDataProvider(options?: {
  connectionString?: string
  sslInDev?: boolean
  configuration?: "heroku" | PoolConfig
  wrapIdentifier?: (name: string) => string
  caseInsensitiveIdentifiers?: boolean
  schema?: string
  orderByNullsFirst?: boolean
}): Promise<SqlDatabase>
//[ ] PoolConfig from TBD is not exported
export interface PostgresClient extends PostgresCommandSource {
  release(): void
}
export declare function postgresColumnSyntax(
  x: FieldMetadata,
  dbName: string,
): string
//[ ] FieldMetadata from TBD is not exported
export interface PostgresCommandSource {
  query(queryText: string, values?: any[]): Promise<QueryResult>
}
//[ ] QueryResult from TBD is not exported
export declare class PostgresDataProvider
  implements SqlImplementation, CanBuildMigrations
{
  private pool
  private options?
  supportsJsonColumnType: boolean
  static getDb(dataProvider?: DataProvider): ClientBase
  entityIsUsedForTheFirstTime(entity: EntityMetadata): Promise<void>
  getLimitSqlSyntax(limit: number, offset: number): string
  createCommand(): SqlCommand
  constructor(
    pool: PostgresPool,
    options?:
      | {
          wrapIdentifier?: (name: string) => string
          caseInsensitiveIdentifiers?: boolean
          schema?: string
          orderByNullsFirst?: boolean
        }
      | undefined,
  )
  end(): Promise<void>
  provideMigrationBuilder(builder: MigrationCode): MigrationBuilder
  wrapIdentifier: (name: string) => string
  ensureSchema(entities: EntityMetadata<any>[]): Promise<void>
  orderByNullsFirst?: boolean
  transaction(
    action: (dataProvider: SqlImplementation) => Promise<void>,
  ): Promise<void>
}
//[ ] DataProvider from TBD is not exported
//[ ] ClientBase from TBD is not exported
//[ ] EntityMetadata from TBD is not exported
//[ ] SqlCommand from TBD is not exported
//[ ] MigrationCode from TBD is not exported
//[ ] MigrationBuilder from TBD is not exported
//[ ] SqlImplementation from TBD is not exported
export interface PostgresPool extends PostgresCommandSource {
  connect(): Promise<PostgresClient>
  end(): Promise<void>
}
export declare class PostgresSchemaBuilder {
  private pool
  private removeQuotes
  private whereTableAndSchema
  private schemaAndName
  private schemaOnly
  ensureSchema(entities: EntityMetadata[]): Promise<void>
  createIfNotExist(entity: EntityMetadata): Promise<void>
  verifyAllColumns<T extends EntityMetadata>(entity: T): Promise<void>
  specifiedSchema: string
  constructor(pool: SqlDatabase, schema?: string)
}
export declare function preparePostgresQueueStorage(
  sql: SqlDatabase,
): Promise<import("../server/remult-api-server.js").EntityQueueStorage>
```

## ./postgres/schema-builder.js

```ts
export declare function postgresColumnSyntax(
  x: FieldMetadata,
  dbName: string,
): string
//[ ] FieldMetadata from ../src/column-interfaces.js is not exported
export declare class PostgresSchemaBuilder {
  private pool
  private removeQuotes
  private whereTableAndSchema
  private schemaAndName
  private schemaOnly
  ensureSchema(entities: EntityMetadata[]): Promise<void>
  createIfNotExist(entity: EntityMetadata): Promise<void>
  verifyAllColumns<T extends EntityMetadata>(entity: T): Promise<void>
  specifiedSchema: string
  constructor(pool: SqlDatabase, schema?: string)
}
//[ ] EntityMetadata from ../src/remult3/remult3.js is not exported
//[ ] SqlDatabase from ../src/data-providers/sql-database.js is not exported
```

## ./remult-knex/index.js

```ts
export declare function buildColumn(
  x: FieldMetadata,
  dbName: string,
  b: Knex.CreateTableBuilder,
  supportsJson?: boolean,
): void
//[ ] FieldMetadata from ../src/column-interfaces.js is not exported
//[ ] Knex.CreateTableBuilder from TBD is not exported
export declare function createKnexDataProvider(
  config: Knex.Config,
): Promise<KnexDataProvider>
//[ ] Knex.Config from TBD is not exported
export type CustomKnexFilterBuilderFunction = () => Promise<
  (builder: Knex.QueryBuilder) => void
>
//[ ] Knex.QueryBuilder from TBD is not exported
export declare class KnexDataProvider
  implements
    DataProvider,
    HasWrapIdentifier,
    SqlCommandFactory,
    CanBuildMigrations
{
  knex: Knex
  constructor(knex: Knex)
  end(): Promise<void>
  provideMigrationBuilder(builder: MigrationCode): MigrationBuilder
  createCommand(): SqlCommand
  execute(sql: string): Promise<SqlResult>
  static getDb(dataProvider?: DataProvider): Knex<any, any[]>
  wrapIdentifier: (name: string) => string
  getEntityDataProvider(entity: EntityMetadata<any>): EntityDataProvider
  transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void>
  static rawFilter(build: CustomKnexFilterBuilderFunction): EntityFilter<any>
  static filterToRaw<entityType>(
    entity: RepositoryOverloads<entityType>,
    condition: EntityFilter<entityType>,
    wrapIdentifier?: (name: string) => string,
  ): Promise<(knex: Knex.QueryBuilder) => void>
  isProxy?: boolean
  ensureSchema(entities: EntityMetadata<any>[]): Promise<void>
}
//[ ] MigrationCode from ../migrations/migration-types.js is not exported
//[ ] MigrationBuilder from ../migrations/migration-types.js is not exported
//[ ] SqlCommand from ../src/sql-command.js is not exported
//[ ] SqlResult from ../src/sql-command.js is not exported
//[ ] DataProvider from ../src/data-interfaces.js is not exported
//[ ] EntityMetadata from ../src/remult3/remult3.js is not exported
//[ ] EntityDataProvider from ../src/data-interfaces.js is not exported
//[ ] EntityFilter from ../src/remult3/remult3.js is not exported
//[ ] RepositoryOverloads from ../src/remult3/RepositoryImplementation.js is not exported
export declare class KnexSchemaBuilder {
  private knex
  ensureSchema(entities: EntityMetadata<any>[]): Promise<void>
  createIfNotExist(entity: EntityMetadata): Promise<void>
  createTableKnexCommand(
    entity: EntityMetadata,
    e: EntityDbNamesBase,
  ): Knex.SchemaBuilder
  addColumnIfNotExist(
    entity: EntityMetadata,
    c: (e: EntityMetadata) => FieldMetadata,
  ): Promise<void>
  createColumnKnexCommand(
    e: EntityDbNamesBase,
    col: FieldMetadata<any, any>,
    colName: string,
  ): Knex.SchemaBuilder
  verifyAllColumns<T extends EntityMetadata>(entity: T): Promise<void>
  additionalWhere: string
  constructor(knex: Knex)
}
//[ ] EntityDbNamesBase from ../src/filter/filter-consumer-bridge-to-sql-request.js is not exported
//[ ] Knex.SchemaBuilder from TBD is not exported
```

## ./remult-mongo.js

```ts
export declare class MongoDataProvider implements DataProvider {
  private db
  private client
  constructor(
    db: Db,
    client: MongoClient | undefined,
    options?: {
      session?: ClientSession
      disableTransactions?: boolean
    },
  )
  session?: ClientSession
  disableTransactions: boolean
  static getDb(dataProvider?: DataProvider): {
    db: Db
    session: ClientSession | undefined
  }
  ensureSchema(entities: EntityMetadata[]): Promise<void>
  getEntityDataProvider(entity: EntityMetadata): EntityDataProvider
  transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void>
  static filterToRaw<entityType>(
    entity: RepositoryOverloads<entityType>,
    condition: EntityFilter<entityType>,
  ): Promise<
    | {
        $and: any[]
      }
    | {
        $and?: undefined
      }
  >
}
//[ ] DataProvider from ./index.js is not exported
//[ ] EntityMetadata from ./index.js is not exported
//[ ] EntityDataProvider from ./index.js is not exported
//[ ] RepositoryOverloads from ./src/remult3/RepositoryImplementation.js is not exported
//[ ] EntityFilter from ./index.js is not exported
```

## ./remult-sql-js.js

```ts
export declare class SqlJsDataProvider extends SqliteCoreDataProvider {
  constructor(db: Promise<Database>)
}
```

## ./remult-sqlite-core.js

```ts
export declare class SqliteCoreDataProvider
  implements SqlImplementation, CanBuildMigrations
{
  createCommand: () => SqlCommand
  end: () => Promise<void>
  doesNotSupportReturningSyntax: boolean
  doesNotSupportReturningSyntaxOnlyForUpdate: boolean
  constructor(
    createCommand: () => SqlCommand,
    end: () => Promise<void>,
    doesNotSupportReturningSyntax?: boolean,
    doesNotSupportReturningSyntaxOnlyForUpdate?: boolean,
  )
  orderByNullsFirst?: boolean
  getLimitSqlSyntax(limit: number, offset: number): string
  afterMutation?: VoidFunction
  provideMigrationBuilder(builder: MigrationCode): MigrationBuilder
  transaction(action: (sql: SqlImplementation) => Promise<void>): Promise<void>
  entityIsUsedForTheFirstTime(entity: EntityMetadata): Promise<void>
  ensureSchema(entities: EntityMetadata<any>[]): Promise<void>
  verifyAllColumns<T extends EntityMetadata>(entity: T): Promise<void>
  dropTable(entity: EntityMetadata): Promise<void>
  addColumnSqlSyntax(
    x: FieldMetadata,
    dbName: string,
    isAlterTable: boolean,
  ): string
  createTableIfNotExist(entity: EntityMetadata<any>): Promise<void>
  supportsJsonColumnType?: boolean
  getCreateTableSql(entity: EntityMetadata<any>): Promise<string[]>
  wrapIdentifier(name: string): string
}
//[ ] SqlCommand from ./src/sql-command.js is not exported
//[ ] MigrationCode from ./migrations/migration-types.js is not exported
//[ ] MigrationBuilder from ./migrations/migration-types.js is not exported
//[ ] SqlImplementation from ./src/sql-command.js is not exported
//[ ] EntityMetadata from ./src/remult3/remult3.js is not exported
//[ ] FieldMetadata from ./src/column-interfaces.js is not exported
```

## ./remult-better-sqlite3.js

```ts
export declare class BetterSqlite3DataProvider extends SqliteCoreDataProvider {
  constructor(db: Database)
}
export declare class BetterSqlite3SqlResult implements SqlResult {
  private result
  constructor(result: any[])
  rows: any[]
  getColumnKeyInResultForIndexInSelect(index: number): string
}
```

## ./remult-sqlite3.js

```ts
export declare function createSqlite3DataProvider(
  fileName?: string,
): Promise<SqlDatabase>
//[ ] SqlDatabase from ./index.js is not exported
export declare class Sqlite3DataProvider extends SqliteCoreDataProvider {
  constructor(db: Database)
}
```

## ./remult-turso.js

```ts
export declare class TursoDataProvider extends SqliteCoreDataProvider {
  private client
  constructor(client: Pick<Client, "execute">)
  transaction(action: (sql: SqlImplementation) => Promise<void>): Promise<void>
}
//[ ] SqlImplementation from ./index.js is not exported
```

## ./remult-duckdb.js

```ts
export declare class DuckDBDataProvider extends SqliteCoreDataProvider {
  private connection
  constructor(connection: DuckDBConnection)
  wrapIdentifier(name: string): string
  getCreateTableSql(entity: EntityMetadata<any>): Promise<string[]>
  addColumnSqlSyntax(
    x: FieldMetadata,
    dbName: string,
    isAlterColumn: boolean,
  ): string
}
//[ ] EntityMetadata from ./index.js is not exported
//[ ] FieldMetadata from ./index.js is not exported
```

## ./remult-bun-sqlite.js

```ts
export declare class BunSqliteDataProvider extends SqliteCoreDataProvider {
  constructor(db: Database)
}
type Database = {
  close(): void
  query(sql: string): {
    all(args?: any): any[]
  }
}
```

## ./migrations/index.js

```ts
export declare function generateMigrations(options: {
  entities: any[]
  dataProvider:
    | DataProvider
    | Promise<DataProvider>
    | (() => Promise<DataProvider | undefined>)
  migrationsFolder?: string
  snapshotFile?: string
  migrationsTSFile?: string
  endConnection?: boolean
}): Promise<boolean>
//[ ] DataProvider from TBD is not exported
export declare function migrate(options: {
  migrations: Migrations
  dataProvider:
    | DataProvider
    | Promise<DataProvider>
    | (() => Promise<DataProvider | undefined>)
  migrationsTable?: string
  endConnection?: boolean
  beforeMigration?: (info: { index: number }) => void | Promise<void>
  afterMigration?: (info: {
    index: number
    duration: number
  }) => void | Promise<void>
}): Promise<void>
export type Migrations = Record<
  number,
  (utils: MigrationUtils) => Promise<unknown>
>
export type MigrationUtils = {
  sql(sql: string): Promise<unknown>
}
```

## ./ably.js

```ts
export declare class AblySubscriptionClient implements SubscriptionClient {
  private ably
  constructor(ably: Ably.Types.RealtimePromise)
  openConnection(
    onReconnect: VoidFunction,
  ): Promise<SubscriptionClientConnection>
}
//[ ] Ably.Types.RealtimePromise from TBD is not exported
//[ ] SubscriptionClientConnection from ./src/live-query/SubscriptionChannel.js is not exported
export declare class AblySubscriptionServer implements SubscriptionServer {
  private ably
  constructor(ably: Ably.Types.RestPromise)
  publishMessage<T>(channel: string, message: T): Promise<void>
}
//[ ] Ably.Types.RestPromise from TBD is not exported
```

## ./graphql.js

```ts
export declare function remultGraphql(options: {
  removeComments?: boolean
  entities: ClassType<any>[]
  getRemultFromRequest?: (req: any) => Promise<Remult>
}): {
  resolvers: {
    Query: Record<string, unknown>
    Mutation: Record<string, unknown>
  }
  rootValue: Record<string, any>
  typeDefs: string
}
//[ ] ClassType from ./classType.js is not exported
//[ ] Remult from ./index.js is not exported
```

## ./internals.js

```ts
export declare function __updateEntityBasedOnWhere<T>(
  entityDefs: EntityMetadata<T>,
  where: EntityFilter<T>,
  r: T,
): void
//[ ] EntityMetadata from TBD is not exported
//[ ] EntityFilter from TBD is not exported
export const actionInfo: {
  allActions: any[]
  runningOnServer: boolean
  runActionWithoutBlockingUI: <T>(what: () => Promise<T>) => Promise<T>
  startBusyWithProgress: () => {
    progress: (percent: number) => void
    close: () => void
  }
}
export type ClassType<T> = {
  new (...args: any[]): T
}
export declare class controllerRefImpl<T = unknown>
  extends rowHelperBase<T>
  implements ControllerRef<T>
{
  constructor(columnsInfo: FieldMetadata[], instance: any, remult: Remult)
  __performColumnAndEntityValidations(): Promise<void>
  fields: FieldsRef<T>
}
//[ ] FieldMetadata from TBD is not exported
//[ ] Remult from TBD is not exported
//[ ] FieldsRef from TBD is not exported
export declare function decorateColumnSettings<valueType>(
  settings: FieldOptions<unknown, valueType>,
  remult: Remult,
): FieldOptions<unknown, valueType>
//[ ] FieldOptions from TBD is not exported
export const fieldOptionsEnricher: {
  enrichFieldOptions: (options: FieldOptions) => void
}
export const flags: {
  error500RetryCount: number
}
export declare function getControllerRef<fieldsContainerType>(
  container: fieldsContainerType,
  remultArg?: Remult,
): ControllerRef<fieldsContainerType>
//[ ] ControllerRef from TBD is not exported
export declare function getEntitySettings<T>(
  entity: ClassType<T>,
  throwError?: boolean,
): EntityOptionsFactory | undefined
//[ ] EntityOptionsFactory from TBD is not exported
export declare function getRelationFieldInfo(
  field: FieldMetadata,
): RelationFieldInfo | undefined
export declare function getRelationInfo(options: FieldOptions): RelationInfo
export declare function isOfType<T>(obj: any, checkMethod: keyof T): obj is T
//[ ] FirstTypeNode from TBD is not exported
export interface RelationFieldInfo {
  type: "reference" | "toOne" | "toMany"
  options: RelationOptions<unknown, unknown, unknown>
  toEntity: any
  toRepo: Repository<unknown>
  getFields(): RelationFields
}
//[ ] RelationOptions from TBD is not exported
//[ ] Repository from TBD is not exported
export interface RelationFields {
  fields: Record<string, string>
  compoundIdField: string | undefined
}
export interface RelationInfo {
  toType: () => any
  type: RelationFieldInfo["type"]
}
export declare class SqlRelationFilter<
  myEntity,
  relationKey extends keyof myEntity,
  toEntity = ArrayItemType<myEntity[relationKey]>,
> {
  private _tools
  constructor(myEntity: ClassType<myEntity>, relationField: relationKey)
  some(where?: EntityFilter<toEntity>): EntityFilter<toEntity>
}
//[ ] ArrayItemType from TBD is not exported
export declare function sqlRelations<entityType>(
  forEntity: ClassType<entityType>,
): SqlRelations<entityType>
export type SqlRelations<entityType> = {
  [p in keyof ObjectMembersOnly<entityType>]-?: SqlRelation<
    ArrayItemType<NonNullable<entityType[p]>>
  >
}
//[ ] ObjectMembersOnly from TBD is not exported
//[ ] SqlRelation from TBD is not exported
export declare function sqlRelationsFilter<entityType>(
  forEntity: ClassType<entityType>,
): {
  [p in keyof entityType]-?: SqlRelationFilter<
    entityType,
    p,
    ArrayItemType<NonNullable<entityType[p]>>
  >
}
```

## ./remult-nuxt.js

```ts
export declare function remultApi(
  options: RemultServerOptions<H3Event>,
): RemultNuxtServer
//[ ] RemultServerOptions from ./server/index.js is not exported
export const remultNuxt: typeof remultApi
export type RemultNuxtServer = RemultServerCore<H3Event> &
  ((event: H3Event) => Promise<any>) & {
    withRemult: RemultServer<H3Event>["withRemultAsync"]
  }
//[ ] RemultServerCore from ./server/index.js is not exported
//[ ] RemultServer from ./server/index.js is not exported
```

## ./remult-solid-start.js

```ts
export declare function remultApi(
  options: RemultServerOptions<RequestEvent>,
): RemultSolidStartServer
//[ ] RemultServerOptions from ./server/index.js is not exported
export const remultSolidStart: typeof remultApi
export type RemultSolidStartServer = RemultServerCore<RequestEvent> & {
  withRemult<T>(what: () => Promise<T>): Promise<T>
  GET: RequestHandler
  PUT: RequestHandler
  POST: RequestHandler
  DELETE: RequestHandler
}
//[ ] RemultServerCore from ./server/index.js is not exported
type RequestHandler = (event: RequestEvent) => Promise<Response>
```
