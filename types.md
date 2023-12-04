# Public API

## ./index.js

```ts
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
  /** The http client to use when making api calls.
   * @example
   * remult.apiClient.httpClient = axios;
   * @example
   * remult.apiClient.httpClient = httpClient;//angular http client
   * @example
   * remult.apiClient.httpClient = fetch; //this is the default
   */
  httpClient?: ExternalHttpProvider | typeof fetch
  /** The base url to for making api calls */
  url?: string
  subscriptionClient?: SubscriptionClient
  wrapMessageHandling?: (x: VoidFunction) => void
}
export declare class ArrayEntityDataProvider implements EntityDataProvider {
  private entity
  private rows?
  static rawFilter(filter: CustomArrayFilter): EntityFilter<any>
  constructor(entity: EntityMetadata, rows?: any[])
  private verifyThatRowHasAllNotNullColumns
  count(where?: Filter): Promise<number>
  find(options?: EntityDataProviderFindOptions): Promise<any[]>
  translateFromJson(row: any): {}
  translateToJson(row: any): {}
  private idMatches
  update(id: any, data: any): Promise<any>
  delete(id: any): Promise<void>
  insert(data: any): Promise<any>
}
//[ ] CustomArrayFilter from this file probably is not exported
export declare function BackendMethod<type = any>(
  options: BackendMethodOptions<type>,
): (
  target: any,
  context: ClassMethodDecoratorContextStub<type> | string,
  descriptor?: any,
) => any
//[ ] ClassMethodDecoratorContextStub from this file probably is not exported
export interface BackendMethodOptions<type> {
  /**Determines when this `BackendMethod` can execute, see: [Allowed](https://remult.dev/docs/allowed.html)  */
  allowed: AllowedForInstance<type>
  /** Used to determine the route for the BackendMethod.
   * @example
   * {allowed:true, apiPrefix:'someFolder/'}
   */
  apiPrefix?: string
  /** EXPERIMENTAL: Determines if this method should be queued for later execution */
  queue?: boolean
  /** EXPERIMENTAL: Determines if the user should be blocked while this `BackendMethod` is running*/
  blockUser?: boolean
  paramTypes?: any[]
}
export const CaptionTransformer: {
  transformCaption: (remult: Remult, key: string, caption: string) => string
}
export type ComparisonValueFilter<valueType> = ValueFilter<valueType> & {
  $gt?: valueType
  ">"?: valueType
  $gte?: valueType
  ">="?: valueType
  $lt?: valueType
  "<"?: valueType
  $lte?: valueType
  "<="?: valueType
}
export declare class CompoundIdField implements FieldMetadata<string> {
  fields: FieldMetadata[]
  constructor(...columns: FieldMetadata[])
  apiUpdateAllowed(item: any): boolean
  displayValue(item: any): string
  includedInApi: boolean
  toInput(value: string, inputType?: string): string
  fromInput(inputValue: string, inputType?: string): string
  getDbName(): Promise<string>
  getId(instance: any): string
  options: FieldOptions<any, any>
  get valueConverter(): Required<ValueConverter<string>>
  target: ClassType<any>
  readonly: true
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
//[ ] ClassType from this file probably is not exported
export interface ContainsStringValueFilter {
  $contains?: string
}
export declare function Controller(
  key: string,
): (target: any, context?: any) => any
export declare class ControllerBase {
  protected remult: Remult
  constructor(remult?: Remult)
  assign(values: Partial<Omit<this, keyof EntityBase>>): this
  get $(): FieldsRef<this>
  get _(): ControllerRef<this>
}
//[ ] ControllerRef from this file probably is not exported
export declare class CustomSqlFilterBuilder {
  private r
  constructor(r: SqlCommandWithParameters)
  sql: string
  addParameterAndReturnSqlToken<valueType>(
    val: valueType,
    field?: FieldMetadata<valueType>,
  ): string
  filterToRaw<entityType>(
    repo: RepositoryOverloads<entityType>,
    condition: EntityFilter<entityType>,
  ): Promise<string>
}
//[ ] SqlCommandWithParameters from this file probably is not exported
//[ ] RepositoryOverloads from this file probably is not exported
export interface CustomSqlFilterObject {
  buildSql: CustomSqlFilterBuilderFunction
}
//[ ] CustomSqlFilterBuilderFunction from this file probably is not exported
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
): Promise<EntityDbNames<entityType>>
//[ ] EntityMetadataOverloads from this file probably is not exported
//[ ] EntityDbNames from this file probably is not exported
export declare function describeClass<classType>(
  classType: classType,
  classDecorator: ((x: any, context?: any) => any) | undefined,
  members?: Decorators<classType> | undefined,
  staticMembers?: StaticDecorators<classType>,
): void
//[ ] Decorators from this file probably is not exported
//[ ] StaticDecorators from this file probably is not exported
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
//[ ] ClassDecoratorContextStub from this file probably is not exported
export declare class EntityBase {
  get _(): EntityRef<this>
  save(): Promise<this>
  assign(values: Partial<Omit<this, keyof EntityBase>>): this
  delete(): Promise<void>
  isNew(): boolean
  get $(): FieldsRef<this>
}
export interface EntityDataProvider {
  count(where: Filter): Promise<number>
  find(options?: EntityDataProviderFindOptions): Promise<Array<any>>
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
export declare type EntityFilter<entityType> = {
  [Properties in keyof Partial<OmitEB<entityType>>]?: (Partial<
    OmitEB<entityType>
  >[Properties] extends number | Date | undefined
    ? ComparisonValueFilter<Partial<OmitEB<entityType>>[Properties]>
    : Partial<OmitEB<entityType>>[Properties] extends string | undefined
    ? ContainsStringValueFilter & ComparisonValueFilter<string>
    : Partial<OmitEB<entityType>>[Properties] extends boolean | undefined
    ? ValueFilter<boolean>
    : Partial<OmitEB<entityType>>[Properties] extends
        | {
            id?: string | number
          }
        | undefined
    ? IdFilter<Partial<OmitEB<entityType>>[Properties]>
    : ValueFilter<Partial<OmitEB<entityType>>[Properties]>) &
    ContainsStringValueFilter
} & {
  $or?: EntityFilter<entityType>[]
  $and?: EntityFilter<entityType>[]
}
export interface EntityMetadata<entityType = any> {
  /** The Entity's key also used as it's url  */
  readonly key: string
  /** Metadata for the Entity's fields */
  readonly fields: FieldsMetadata<entityType>
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
//[ ] IdMetadata from this file probably is not exported
export interface EntityOptions<entityType = any> {
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
   * @see [allowed](http://remult.dev/docs/allowed.html)*/
  allowApiUpdate?: AllowedForInstance<entityType>
  /** Determines if entries for this entity can be deleted through the api.
   * @see [allowed](http://remult.dev/docs/allowed.html)*/
  allowApiDelete?: AllowedForInstance<entityType>
  /** Determines if new entries for this entity can be posted through the api.
   * @see [allowed](http://remult.dev/docs/allowed.html)*/
  allowApiInsert?: AllowedForInstance<entityType>
  /** sets  the `allowApiUpdate`, `allowApiDelete` and `allowApiInsert` properties in a single set */
  allowApiCrud?: Allowed
  /** A filter that determines which rows can be queries using the api.
   * @description
   * Use apiPrefilter in cases where you to restrict data based on user profile
   * @example
   * apiPrefilter: { archive:false }
   *
   * @example
   * apiPrefilter: ()=> remult.isAllowed("admin")?{}:{ archive:false }
   * @see [EntityFilter](http://remult.dev/docs/entityFilter.html)
   *
   */
  apiPrefilter?:
    | EntityFilter<entityType>
    | (() => EntityFilter<entityType> | Promise<EntityFilter<entityType>>)
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
   * saving: async task => {
   *      task.lastUpdated = new Date()
   *  }
   *})
   */
  saving?: (
    row: entityType,
    proceedWithoutSavingToDb: () => void,
  ) => Promise<any> | any
  /** will be called after the Entity was saved to the data source. */
  saved?: (row: entityType) => Promise<any> | any
  /** Will be called before an Entity is deleted. */
  deleting?: (row: entityType) => Promise<any> | any
  /** Will be called after an Entity is deleted */
  deleted?: (row: entityType) => Promise<any> | any
  /** Will be called when the entity is being validated, usually prior to the `saving` event */
  validation?: (
    row: entityType,
    ref: EntityRef<entityType>,
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
  /** For entities that are based on SQL expressions instead of a physical table or view*/
  sqlExpression?:
    | string
    | ((entity: EntityMetadata<entityType>) => string | Promise<string>)
  /** An arrow function that identifies the `id` column to use for this entity
   * @example
   * //Single column id
   * @Entity<Products>("products", { id:p=>p.productCode })
   * @example
   * //Multiple columns id
   * @Entity<OrderDetails>("orderDetails", { id:od=> [od.orderId, od.productCode] })
   */
  id?: (entity: FieldsMetadata<entityType>) => FieldMetadata | FieldMetadata[]
  entityRefInit?: (ref: EntityRef<entityType>, row: entityType) => void
  apiRequireId?: Allowed
}
export declare type EntityOrderBy<entityType> = {
  [Properties in keyof Partial<OmitEB<entityType>>]?: "asc" | "desc"
}
export interface EntityRef<entityType> extends Subscribable {
  hasErrors(): boolean
  undoChanges(): any
  save(): Promise<entityType>
  reload(): Promise<entityType>
  delete(): Promise<void>
  isNew(): boolean
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
  readonly apiUpdateAllowed: boolean
  readonly apiDeleteAllowed: boolean
  readonly apiInsertAllowed: boolean
  readonly isLoading: boolean
}
//[ ] idType from this file probably is not exported
export interface ErrorInfo<entityType = any> {
  message?: string
  modelState?: {
    [Properties in keyof Partial<OmitEB<entityType>>]?: string
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
export declare function Field<entityType = any, valueType = any>(
  valueType: () => ClassType<valueType>,
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
//[ ] ClassFieldDecoratorContextStub from this file probably is not exported
export interface FieldMetadata<valueType = any, entityType = any> {
  /** The field's member name in an object.
   * @example
   * const taskRepo = remult.repo(Task);
   * console.log(taskRepo.metadata.fields.title.key);
   * // result: title
   */
  readonly key: string
  /** A human readable caption for the field. Can be used to achieve a consistent caption for a field throughout the app
   * @example
   * <input placeholder={taskRepo.metadata.fields.title.caption}/>
   */
  readonly caption: string
  /** The field's value type (number,string etc...) */
  readonly valueType: any
  /** The options sent to this field's decorator */
  readonly options: FieldOptions
  /** The `inputType` relevant for this field, determined by the options sent to it's decorator and the valueConverter in these options */
  readonly inputType: string
  /** if null is allowed for this field */
  readonly allowNull: boolean
  /** The class that contains this field
   * @example
   * const taskRepo = remult.repo(Task);
   * Task == taskRepo.metadata.fields.title.target //will return true
   */
  readonly target: ClassType<valueType>
  /** Returns the dbName - based on it's `dbName` option and it's `sqlExpression` option */
  getDbName(): Promise<string>
  /** Indicates if this field is based on a server express */
  readonly isServerExpression: boolean
  /** indicates that this field should only be included in select statement, and excluded from update or insert. useful for db generated ids etc... */
  readonly dbReadOnly: boolean
  /** the Value converter for this field */
  readonly valueConverter: Required<ValueConverter<valueType>>
  /** Get the display value for a specific item
   * @example
   * repo.fields.createDate.displayValue(task) //will display the date as defined in the `displayValue` option defined for it.
   */
  displayValue(item: Partial<OmitEB<entityType>>): string
  apiUpdateAllowed(item?: Partial<OmitEB<entityType>>): boolean
  readonly includedInApi: boolean
  /** Adapts the value for usage with html input
   * @example
   * @Fields.dateOnly()
   * birthDate = new Date(1976,5,16)
   * //...
   * input.value = repo.fields.birthDate.toInput(person) // will return '1976-06-16'
   */
  toInput(value: valueType, inputType?: string): string
  /** Adapts the value for usage with html input
   * @example
   * @Fields.dateOnly()
   * birthDate = new Date(1976,5,16)
   * //...
   * person.birthDate = repo.fields.birthDate.fromInput(personFormState) // will return Date
   */
  fromInput(inputValue: string, inputType?: string): valueType
}
export interface FieldOptions<entityType = any, valueType = any> {
  /** A human readable name for the field. Can be used to achieve a consistent caption for a field throughout the app
   * @example
   * <input placeholder={taskRepo.metadata.fields.title.caption}/>
   */
  caption?: string
  /** If it can store null in the database */
  allowNull?: boolean
  /** If this field data is included in the api.
   * @see [allowed](http://remult.dev/docs/allowed.html)*/
  includeInApi?: Allowed
  /** If this field data can be updated in the api.
   * @see [allowed](http://remult.dev/docs/allowed.html)*/
  allowApiUpdate?: AllowedForInstance<entityType>
  /** An arrow function that'll be used to perform validations on it
   * @example
   * @Fields.string({
   *   validate: Validators.required
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
   *    validate: (_, fieldRef)=>{
   *      if (fieldRef.value.length<3)
   *          fieldRef.error = "Too Short";
   *   }
   * })
   */
  validate?:
    | ((
        entity: entityType,
        fieldRef: FieldRef<entityType, valueType>,
      ) => any | Promise<any>)
    | ((
        entity: entityType,
        fieldRef: FieldRef<entityType, valueType>,
      ) => any | Promise<any>)[]
  /** Will be fired before this field is saved to the server/database */
  saving?: (
    entity: entityType,
    fieldRef: FieldRef<entityType, valueType>,
  ) => any | Promise<any>
  /**  An expression that will determine this fields value on the backend and be provided to the front end*/
  serverExpression?: (entity: entityType) => valueType | Promise<valueType>
  /** The name of the column in the database that holds the data for this field. If no name is set, the key will be used instead.
   * Be aware that if you are using postgres and want to keep your casing, you have to escape your string with double quotes.
   * @example
   *
   * @Fields.string({ dbName: '"userName"'})
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
  defaultValue?: (entity: entityType) => valueType | Promise<valueType>
  /** The html input type for this field */
  inputType?: string
  /** Determines if the referenced entity will be loaded immediately or on demand.
   * @see[Lazy loading of related entities](http://remult.dev/docs/lazy-loading-of-related-entities.html)
   */
  lazy?: boolean
  /** The value type for this field */
  valueType?: any
  /** The entity type to which this field belongs */
  target?: ClassType<entityType>
  /** The key to be used for this field */
  key?: string
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
export declare class Fields {
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
  ) => void
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
  ) => void
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
  ) => void
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
  ) => void
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
  ) => void
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
  ) => void
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
  ) => void
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
  ) => void
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
  ) => void
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
  ) => void
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
  ) => void
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
  ) => void
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
  ) => void
}
export type FieldsMetadata<entityType> = {
  [Properties in keyof OmitEB<entityType>]: FieldMetadata<
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
export type FieldsRef<entityType> = {
  [Properties in keyof OmitEB<entityType>]: entityType[Properties] extends {
    id?: number | string
  }
    ? IdFieldRef<entityType, entityType[Properties]>
    : FieldRef<entityType, entityType[Properties]>
} & {
  find(fieldMetadataOrKey: FieldMetadata | string): FieldRef<entityType, any>
  [Symbol.iterator]: () => IterableIterator<FieldRef<entityType, any>>
  toArray(): FieldRef<entityType, any>[]
}
export declare function FieldType<valueType = any>(
  ...options: (
    | FieldOptions<any, valueType>
    | ((options: FieldOptions<any, valueType>, remult: Remult) => void)
  )[]
): (target: any, context?: any) => any
export declare type FieldValidator<entityType = any, valueType = any> = (
  entity: entityType,
  fieldRef: FieldRef<entityType, valueType>,
) => void | Promise<void>
export declare class Filter {
  private apply?
  constructor(apply?: (add: FilterConsumer) => void)
  __applyToConsumer(add: FilterConsumer): void
  static resolve<entityType>(
    filter:
      | EntityFilter<entityType>
      | (() => EntityFilter<entityType> | Promise<EntityFilter<entityType>>),
  ): Promise<EntityFilter<entityType>>
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
  static fromEntityFilter<T>(
    entity: EntityMetadata<T>,
    whereItem: EntityFilter<T>,
  ): Filter
  toJson(): any
  static entityFilterToJson<T>(
    entityDefs: EntityMetadata<T>,
    where: EntityFilter<T>,
  ): any
  static entityFilterFromJson<T>(
    entityDefs: EntityMetadata<T>,
    packed: any,
  ): EntityFilter<T>
  static translateCustomWhere<T>(
    r: Filter,
    entity: EntityMetadata<T>,
    remult: Remult,
  ): Promise<Filter>
}
//[ ] FilterConsumer from this file probably is not exported
//[ ] customFilterInfo from this file probably is not exported
export interface FindFirstOptions<entityType>
  extends FindOptionsBase<entityType>,
    FindFirstOptionsBase<entityType> {}
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
export declare function getEntityRef<entityType>(
  entity: entityType,
  throwException?: boolean,
): EntityRef<entityType>
export declare function getFields<fieldsContainerType>(
  container: fieldsContainerType,
  remult?: Remult,
): FieldsRef<fieldsContainerType>
export declare function getValueList<T>(type: ClassType<T>): T[]
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
  ): any
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
  constructor(storage: JsonEntityStorage)
  getEntityDataProvider(entity: EntityMetadata): EntityDataProvider
  transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void>
}
export interface JsonEntityStorage {
  getItem(entityDbName: string): string | null
  setItem(entityDbName: string, json: string): any
}
export interface LiveQuery<entityType> {
  subscribe(next: (info: LiveQueryChangeInfo<entityType>) => void): Unsubscribe
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
  items: entityType[]
  changes: LiveQueryChange[]
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
export declare type OmitEB<T> = Omit<T, keyof EntityBase>
export declare class OneToMany<T> {
  private provider
  private settings?
  constructor(
    provider: Repository<T>,
    settings?: {
      create?: (newItem: T) => void
    } & FindOptions<T>,
  )
  private _items
  private _currentPromise
  get lazyItems(): T[]
  load(): Promise<T[]>
  private find
  create(item?: Partial<T>): T
}
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
export declare class ProgressListener {
  private res
  constructor(res: DataApiResponse)
  progress(progress: number): void
}
//[ ] DataApiResponse from this file probably is not exported
export interface QueryOptions<entityType> extends FindOptionsBase<entityType> {
  /** The number of items to return in each step */
  pageSize?: number
  /** A callback method to indicate the progress of the iteration */
  progress?: {
    progress: (progress: number) => void
  }
}
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
export const remult: Remult
export declare class Remult {
  /**Return's a `Repository` of the specific entity type
   * @example
   * const taskRepo = remult.repo(Task);
   * @see [Repository](https://remult.dev/docs/ref_repository.html)
   * @param entity - the entity to use
   * @param dataProvider - an optional alternative data provider to use. Useful for writing to offline storage or an alternative data provider
   */
  repo<T>(entity: ClassType<T>, dataProvider?: DataProvider): Repository<T>
  /** Returns the current user's info */
  user?: UserInfo
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
  static run<T>(
    callback: () => T,
    options: {
      dataProvider: DataProvider
    },
  ): T
}
export interface RemultContext {}
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
    ...fields: Extract<keyof OmitEB<entityType>, string>[]
  ): Promise<ErrorInfo<entityType> | undefined>
  /** saves an item or item[] to the data source. It assumes that if an `id` value exists, it's an existing row - otherwise it's a new row
   * @example
   * await taskRepo.save({...task, completed:true })
   */
  save(item: Partial<OmitEB<entityType>>[]): Promise<entityType[]>
  save(item: Partial<OmitEB<entityType>>): Promise<entityType>
  /**Insert an item or item[] to the data source
   * @example
   * await taskRepo.insert({title:"task a"})
   * @example
   * await taskRepo.insert([{title:"task a"}, {title:"task b", completed:true }])
   */
  insert(item: Partial<OmitEB<entityType>>[]): Promise<entityType[]>
  insert(item: Partial<OmitEB<entityType>>): Promise<entityType>
  /** Updates an item, based on its `id`
   * @example
   * taskRepo.update(task.id,{...task,completed:true})
   */
  update(
    id: entityType extends {
      id?: number
    }
      ? number
      : entityType extends {
          id?: string
        }
      ? string
      : string | number,
    item: Partial<OmitEB<entityType>>,
  ): Promise<entityType>
  update(
    id: Partial<OmitEB<entityType>>,
    item: Partial<OmitEB<entityType>>,
  ): Promise<entityType>
  /** Deletes an Item*/
  delete(
    id: entityType extends {
      id?: number
    }
      ? number
      : entityType extends {
          id?: string
        }
      ? string
      : string | number,
  ): Promise<void>
  delete(item: Partial<OmitEB<entityType>>): Promise<void>
  /** Creates an instance of an item. It'll not be saved to the data source unless `save` or `insert` will be called for that item */
  create(item?: Partial<OmitEB<entityType>>): entityType
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
}
//[ ] FindFirstOptionsBase from this file probably is not exported
//[ ] entityEventListener from this file probably is not exported
export declare class RestDataProvider implements DataProvider {
  private apiProvider
  constructor(apiProvider: () => ApiClient)
  getEntityDataProvider(entity: EntityMetadata): RestEntityDataProvider
  transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void>
  isProxy: boolean
}
//[ ] RestEntityDataProvider from this file probably is not exported
export interface RestDataProviderHttpProvider {
  post(url: string, data: any): Promise<any>
  delete(url: string): Promise<void>
  put(url: string, data: any): Promise<any>
  get(url: string): Promise<any>
}
export declare class Sort {
  toEntityOrderBy(): EntityOrderBy<any>
  constructor(...segments: SortSegment[])
  Segments: SortSegment[]
  reverse(): Sort
  compare(a: any, b: any): number
  static translateOrderByToSort<T>(
    entityDefs: EntityMetadata<T>,
    orderBy: EntityOrderBy<T>,
  ): Sort
  static createUniqueSort<T>(
    entityMetadata: EntityMetadata<T>,
    orderBy: Sort,
  ): Sort
  static createUniqueEntityOrderBy<T>(
    entityMetadata: EntityMetadata<T>,
    orderBy: EntityOrderBy<T>,
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
export declare class SqlDatabase implements DataProvider {
  private sql
  static getDb(remult?: Remult): SqlDatabase
  createCommand(): SqlCommand
  execute(sql: string): Promise<SqlResult>
  ensureSchema(entities: EntityMetadata<any>[]): Promise<void>
  getEntityDataProvider(entity: EntityMetadata): EntityDataProvider
  transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void>
  static rawFilter(build: CustomSqlFilterBuilderFunction): EntityFilter<any>
  static filterToRaw<entityType>(
    repo: RepositoryOverloads<entityType>,
    condition: EntityFilter<entityType>,
    sqlCommand?: SqlCommandWithParameters,
  ): Promise<string>
  /**
   * `false` _(default)_ - No logging
   *
   * `true` - to log all queries to the console
   *
   * `oneLiner` - to log all queries to the console as one line
   *
   * a `function` - to log all queries to the console as a custom format
   */
  static LogToConsole:
    | boolean
    | "oneLiner"
    | ((duration: number, query: string, args: Record<string, any>) => void)
  /**
   * Threshold in milliseconds for logging queries to the console.
   */
  static durationThreshold: number
  constructor(sql: SqlImplementation)
  private createdEntities
}
export interface SqlImplementation {
  getLimitSqlSyntax(limit: number, offset: number): any
  createCommand(): SqlCommand
  transaction(action: (sql: SqlImplementation) => Promise<void>): Promise<void>
  entityIsUsedForTheFirstTime(entity: EntityMetadata): Promise<void>
  ensureSchema?(entities: EntityMetadata[]): Promise<void>
  supportsJsonColumnType?: boolean
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
export interface StringFieldOptions<entityType = any>
  extends FieldOptions<entityType, string> {
  maxLength?: number
}
export declare class SubscriptionChannel<messageType> {
  channelKey: string
  constructor(channelKey: string)
  publish(message: messageType, remult?: Remult): void
  subscribe(
    next: (message: messageType) => void,
    remult?: Remult,
  ): Promise<Unsubscribe>
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
export declare class Validators {
  static required: ((
    entity: any,
    col: FieldRef<any, string>,
    message?: any,
  ) => void) & {
    withMessage: (
      message: string,
    ) => (entity: any, col: FieldRef<any, string>) => void
    defaultMessage: string
  }
  static unique: ((
    entity: any,
    col: FieldRef<any, any>,
    message?: any,
  ) => Promise<void>) & {
    withMessage: (
      message: string,
    ) => (entity: any, col: FieldRef<any, any>) => Promise<void>
    defaultMessage: string
  }
  static uniqueOnBackend: ((
    entity: any,
    col: FieldRef<any, any>,
    message?: any,
  ) => Promise<void>) & {
    withMessage: (
      message: string,
    ) => (entity: any, col: FieldRef<any, any>) => Promise<void>
  }
}
export interface ValueConverter<valueType> {
  fromJson?(val: any): valueType
  toJson?(val: valueType): any
  fromDb?(val: any): valueType
  toDb?(val: valueType): any
  toInput?(val: valueType, inputType?: string): string
  fromInput?(val: string, inputType?: string): valueType
  displayValue?(val: valueType): string
  readonly fieldTypeInDb?: string
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
      $ne?: valueType | valueType[]
      "!="?: valueType | valueType[]
      $in?: valueType[]
      $nin?: valueType[]
    }
export interface ValueListFieldOptions<entityType, valueType>
  extends FieldOptions<entityType, valueType> {
  getValues?: () => valueType[]
}
export declare function ValueListFieldType<
  valueType extends ValueListItem = any,
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
  byId(key: any): T
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
export declare class WebSqlDataProvider
  implements SqlImplementation, __RowsOfDataForTesting
{
  private databaseName
  rows: {
    [tableName: string]: any
  }
  constructor(databaseName: string, databaseSize?: number)
  static getDb(remult?: Remult): any
  getLimitSqlSyntax(limit: number, offset: number): string
  entityIsUsedForTheFirstTime(entity: EntityMetadata): Promise<void>
  ensureSchema(entities: EntityMetadata<any>[]): Promise<void>
  dropTable(entity: EntityMetadata): Promise<void>
  createTable(entity: EntityMetadata<any>): Promise<void>
  createCommand(): SqlCommand
  transaction(
    action: (dataProvider: SqlImplementation) => Promise<void>,
  ): Promise<void>
  private addColumnSqlSyntax
  toString(): string
}
```

## ./remult-express.js

```ts
export declare function remultExpress(
  options?: RemultServerOptions<express.Request> & {
    bodyParser?: boolean
    bodySizeLimit?: string
  },
): RemultExpressServer
//[ ] RemultServerOptions from ./server/expressBridge is not exported
export type RemultExpressServer = express.RequestHandler &
  RemultServerCore<express.Request> & {
    withRemult: (
      req: express.Request,
      res: express.Response,
      next: VoidFunction,
    ) => void
  }
//[ ] RemultServerCore from ./server/expressBridge is not exported
```

## ./remult-next.js

```ts
export declare function remultNext(
  options?: RemultServerOptions<NextApiRequest>,
): RemultNextServer
//[ ] RemultServerOptions from ./server is not exported
export declare function remultNextApp(
  options?: RemultServerOptions<Request>,
): RemultNextAppServer
export type RemultNextAppServer = RemultServerCore<Request> & {
  GET: (req: Request) => Promise<Response>
  PUT: (req: Request) => Promise<Response>
  POST: (req: Request) => Promise<Response>
  DELETE: (req: Request) => Promise<Response>
  withRemult<T>(what: () => Promise<T>): Promise<T>
}
//[ ] RemultServerCore from ./server is not exported
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
    /** Creates a `next.js` handler with remult defined in the correct context
     * @see
     * https://remult.dev/tutorials/react-next/appendix-1-get-server-side-props.html#using-remult-in-a-next-js-api-handler
     */
    handle<T>(handler: NextApiHandler<T>): NextApiHandler<T>
  }
```

## ./server/index.js

```ts
export declare function createRemultServer<RequestType>(
  options: RemultServerOptions<RequestType>,
  serverCoreOptions?: ServerCoreOptions<RequestType>,
): RemultServer<RequestType>
//[ ] ServerCoreOptions from ./expressBridge is not exported
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
//[ ] Repository from this file probably is not exported
//[ ] LiveQueryStorageEntity from this file probably is not exported
//[ ] DataProvider from this file probably is not exported
//[ ] StoredQuery from this file probably is not exported
export type GenericRequestHandler = (
  req: GenericRequestInfo,
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
  json(data: any): any
  status(statusCode: number): GenericResponse
  end(): any
}
export type GenericRouter = {
  route(path: string): SpecificRoute
}
export interface InitRequestOptions {
  liveQueryStorage: LiveQueryStorage
  readonly remult: Remult
}
//[ ] LiveQueryStorage from this file probably is not exported
//[ ] Remult from this file probably is not exported
export declare class JsonEntityFileStorage implements JsonEntityStorage {
  private folderPath
  getItem(entityDbName: string): string
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
//[ ] queuedJobInfoResponse from this file probably is not exported
export interface QueueStorage {
  createJob(url: string, userId: string): Promise<string>
  getJobInfo(queuedJobId: string): Promise<queuedJobInfo>
}
export interface RemultServer<RequestType>
  extends RemultServerCore<RequestType> {
  withRemult(req: RequestType, res: GenericResponse, next: VoidFunction): any
  registerRouter(r: GenericRouter): void
  handle(
    req: RequestType,
    gRes?: GenericResponse,
  ): Promise<ServerHandleResponse | undefined>
  withRemultPromise<T>(request: RequestType, what: () => Promise<T>): Promise<T>
}
//[ ] ServerHandleResponse from this file probably is not exported
export interface RemultServerCore<RequestType> {
  getRemult(req: RequestType): Promise<Remult>
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
  /** Storage to use for backend methods that use queue */
  queueStorage?: QueueStorage
}
//[ ] ClassType from this file probably is not exported
//[ ] UserInfo from this file probably is not exported
//[ ] SubscriptionServer from this file probably is not exported
export type SpecificRoute = {
  get(handler: GenericRequestHandler): SpecificRoute
  put(handler: GenericRequestHandler): SpecificRoute
  post(handler: GenericRequestHandler): SpecificRoute
  delete(handler: GenericRequestHandler): SpecificRoute
}
export declare class SseSubscriptionServer implements SubscriptionServer {
  private canUserConnectToChannel?
  constructor(
    canUserConnectToChannel?: (channel: string, remult: Remult) => boolean,
  )
  publishMessage<T>(channel: string, message: any): Promise<void>
}
```

## ./server/core.js

```ts
export declare function createRemultServerCore<RequestType>(
  options: RemultServerOptions<RequestType>,
  serverCoreOptions: ServerCoreOptions<RequestType>,
): RemultServer<RequestType>
//[ ] ServerCoreOptions from this file probably is not exported
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
//[ ] Repository from this file probably is not exported
//[ ] LiveQueryStorageEntity from this file probably is not exported
//[ ] DataProvider from this file probably is not exported
//[ ] StoredQuery from this file probably is not exported
export type GenericRequestHandler = (
  req: GenericRequestInfo,
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
  json(data: any): any
  status(statusCode: number): GenericResponse
  end(): any
}
export type GenericRouter = {
  route(path: string): SpecificRoute
}
export declare class JsonEntityFileStorage implements JsonEntityStorage {
  private folderPath
  getItem(entityDbName: string): string
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
//[ ] queuedJobInfoResponse from this file probably is not exported
export interface QueueStorage {
  createJob(url: string, userId: string): Promise<string>
  getJobInfo(queuedJobId: string): Promise<queuedJobInfo>
}
export interface RemultServer<RequestType>
  extends RemultServerCore<RequestType> {
  withRemult(req: RequestType, res: GenericResponse, next: VoidFunction): any
  registerRouter(r: GenericRouter): void
  handle(
    req: RequestType,
    gRes?: GenericResponse,
  ): Promise<ServerHandleResponse | undefined>
  withRemultPromise<T>(request: RequestType, what: () => Promise<T>): Promise<T>
}
//[ ] ServerHandleResponse from this file probably is not exported
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
  /** Storage to use for backend methods that use queue */
  queueStorage?: QueueStorage
}
//[ ] ClassType from this file probably is not exported
//[ ] UserInfo from this file probably is not exported
//[ ] InitRequestOptions from this file probably is not exported
//[ ] Remult from this file probably is not exported
//[ ] SubscriptionServer from this file probably is not exported
//[ ] LiveQueryStorage from this file probably is not exported
export type SpecificRoute = {
  get(handler: GenericRequestHandler): SpecificRoute
  put(handler: GenericRequestHandler): SpecificRoute
  post(handler: GenericRequestHandler): SpecificRoute
  delete(handler: GenericRequestHandler): SpecificRoute
}
export declare class SseSubscriptionServer implements SubscriptionServer {
  private canUserConnectToChannel?
  constructor(
    canUserConnectToChannel?: (channel: string, remult: Remult) => boolean,
  )
  publishMessage<T>(channel: string, message: any): Promise<void>
}
```

## ./remult-fastify.js

```ts
export declare function remultFastify(
  options: RemultServerOptions<FastifyRequest>,
): RemultFastifyServer
//[ ] RemultServerOptions from ./server/expressBridge is not exported
export type RemultFastifyServer = FastifyPluginCallback &
  RemultServerCore<FastifyRequest> & {
    withRemult<T>(req: FastifyRequest, what: () => Promise<T>): Promise<T>
  }
//[ ] RemultServerCore from ./server/expressBridge is not exported
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
//[ ] ResponseInit from this file probably is not exported
export declare function remultFresh(
  options: RemultServerOptions<FreshRequest>,
  response: FreshResponse,
): RemultFresh
//[ ] RemultServerOptions from ./server/expressBridge is not exported
export interface RemultFresh extends RemultServerCore<FreshRequest> {
  handle(req: FreshRequest, ctx: FreshContext): Promise<any>
}
```

## ./remult-sveltekit.js

```ts
export declare function remultSveltekit(
  options?: RemultServerOptions<RequestEvent>,
): RemultSveltekitServer
//[ ] RemultServerOptions from ./server is not exported
export type RemultSveltekitServer = RemultServerCore<RequestEvent> & Handle
//[ ] RemultServerCore from ./server is not exported
```

## ./postgres/index.js

```ts

```

## ./postgres/schema-builder.js

```ts
export declare function postgresColumnSyntax(
  x: FieldMetadata,
  dbName: string,
): string
//[ ] FieldMetadata from ../src/column-interfaces is not exported
export declare class PostgresSchemaBuilder {
  private pool
  private removeQuotes
  private whereTableAndSchema
  private schemaAndName
  verifyStructureOfAllEntities(remult?: Remult): Promise<void>
  ensureSchema(entities: EntityMetadata<any>[]): Promise<void>
  createIfNotExist(entity: EntityMetadata): Promise<void>
  addColumnIfNotExist<T extends EntityMetadata>(
    entity: T,
    c: (e: T) => FieldMetadata,
  ): Promise<void>
  verifyAllColumns<T extends EntityMetadata>(entity: T): Promise<void>
  specifiedSchema: string
  constructor(pool: SqlDatabase, schema?: string)
}
//[ ] Remult from ../src/context is not exported
//[ ] EntityMetadata from ../src/remult3/remult3 is not exported
//[ ] SqlDatabase from ../src/data-providers/sql-database is not exported
export declare function verifyStructureOfAllEntities(
  db: SqlDatabase,
  remult: Remult,
): Promise<void>
```

## ./remult-knex/index.js

```ts
export declare function buildColumn(
  x: FieldMetadata,
  dbName: string,
  b: Knex.CreateTableBuilder,
  supportsJson?: boolean,
): void
//[ ] FieldMetadata from ../src/column-interfaces is not exported
//[ ] Knex.CreateTableBuilder from this file probably is not exported
export declare function createKnexDataProvider(
  config: Knex.Config,
): Promise<KnexDataProvider>
//[ ] Knex.Config from this file probably is not exported
export type CustomKnexFilterBuilderFunction = () => Promise<
  (builder: Knex.QueryBuilder) => void
>
//[ ] Knex.QueryBuilder from this file probably is not exported
export declare class KnexDataProvider implements DataProvider {
  knex: Knex
  constructor(knex: Knex)
  static getDb(remult?: Remult): Knex<any, any[]>
  getEntityDataProvider(entity: EntityMetadata<any>): EntityDataProvider
  transaction(
    action: (dataProvider: DataProvider) => Promise<void>,
  ): Promise<void>
  static rawFilter(build: CustomKnexFilterBuilderFunction): EntityFilter<any>
  static filterToRaw<entityType>(
    entity: RepositoryOverloads<entityType>,
    condition: EntityFilter<entityType>,
  ): Promise<(knex: any) => void>
  isProxy?: boolean
  ensureSchema(entities: EntityMetadata<any>[]): Promise<void>
}
//[ ] Remult from ../src/context is not exported
//[ ] EntityMetadata from ../src/remult3/remult3 is not exported
//[ ] EntityDataProvider from ../src/data-interfaces is not exported
//[ ] DataProvider from ../src/data-interfaces is not exported
//[ ] EntityFilter from ../src/remult3/remult3 is not exported
//[ ] RepositoryOverloads from ../src/remult3/RepositoryImplementation is not exported
export declare class KnexSchemaBuilder {
  private knex
  verifyStructureOfAllEntities(remult?: Remult): Promise<void>
  ensureSchema(entities: EntityMetadata<any>[]): Promise<void>
  createIfNotExist(entity: EntityMetadata): Promise<void>
  addColumnIfNotExist<T extends EntityMetadata>(
    entity: T,
    c: (e: T) => FieldMetadata,
  ): Promise<void>
  verifyAllColumns<T extends EntityMetadata>(entity: T): Promise<void>
  additionalWhere: string
  constructor(knex: Knex)
}
```

## ./remult-mongo.js

```ts
export declare class MongoDataProvider implements DataProvider {
  private db
  private client
  constructor(
    db: Db,
    client: MongoClient,
    options?: {
      session?: ClientSession
      disableTransactions?: boolean
    },
  )
  session?: ClientSession
  disableTransactions: boolean
  static getDb(remult?: Remult): {
    db: Db
    session: ClientSession
  }
  getEntityDataProvider(entity: EntityMetadata<any>): EntityDataProvider
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
//[ ] Remult from . is not exported
//[ ] EntityMetadata from . is not exported
//[ ] EntityDataProvider from . is not exported
//[ ] DataProvider from . is not exported
//[ ] RepositoryOverloads from ./src/remult3/RepositoryImplementation is not exported
//[ ] EntityFilter from . is not exported
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
//[ ] Ably.Types.RealtimePromise from this file probably is not exported
//[ ] SubscriptionClientConnection from ./src/live-query/SubscriptionChannel is not exported
export declare class AblySubscriptionServer implements SubscriptionServer {
  private ably
  constructor(ably: Ably.Types.RestPromise)
  publishMessage<T>(channel: string, message: T): Promise<void>
}
//[ ] Ably.Types.RestPromise from this file probably is not exported
```

## ./graphql.js

```ts
export declare function remultGraphql(options: {
  removeComments?: boolean
  entities: ClassType<any>[]
  getRemultFromRequest?: (req: any) => Remult
}): {
  resolvers: {
    Query: Record<string, unknown>
    Mutation: Record<string, unknown>
  }
  rootValue: Record<string, any>
  typeDefs: string
}
//[ ] ClassType from ./classType is not exported
```

## ./src/remult3/index.js

//[ ] !!! Error: ENOENT: no such file or directory, open 'dist\remult\src\remult3\index.d.ts'

## ./src/server-action.js

```ts
export declare abstract class Action<inParam, outParam>
  implements ActionInterface
{
  private actionUrl
  private queue
  private allowed
  constructor(
    actionUrl: string,
    queue: boolean,
    allowed: AllowedForInstance<any>,
  )
  static apiUrlForJobStatus: string
  run(
    pIn: inParam,
    baseUrl?: string,
    http?: RestDataProviderHttpProvider,
  ): Promise<outParam>
  doWork: (
    args: any[],
    self: any,
    baseUrl?: string,
    http?: RestDataProviderHttpProvider,
  ) => Promise<any>
  protected abstract execute(
    info: inParam,
    req: Remult,
    res: DataApiResponse,
  ): Promise<outParam>
  __register(
    reg: (
      url: string,
      queue: boolean,
      allowed: AllowedForInstance<any>,
      what: (data: any, req: Remult, res: DataApiResponse) => void,
    ) => void,
  ): void
}
//[ ] AllowedForInstance from ./context is not exported
//[ ] RestDataProviderHttpProvider from ./data-interfaces is not exported
//[ ] Remult from ./context is not exported
//[ ] DataApiResponse from ./data-api is not exported
export interface ActionInterface {
  doWork: (
    args: any[],
    self: any,
    baseUrl?: string,
    http?: RestDataProviderHttpProvider,
  ) => Promise<any>
  __register(
    reg: (
      url: string,
      queue: boolean,
      allowed: AllowedForInstance<any>,
      what: (data: any, req: Remult, res: DataApiResponse) => void,
    ) => void,
  ): any
}
export declare function BackendMethod<type = any>(
  options: BackendMethodOptions<type>,
): (
  target: any,
  context: ClassMethodDecoratorContextStub<type> | string,
  descriptor?: any,
) => any
export interface BackendMethodOptions<type> {
  /**Determines when this `BackendMethod` can execute, see: [Allowed](https://remult.dev/docs/allowed.html)  */
  allowed: AllowedForInstance<type>
  /** Used to determine the route for the BackendMethod.
   * @example
   * {allowed:true, apiPrefix:'someFolder/'}
   */
  apiPrefix?: string
  /** EXPERIMENTAL: Determines if this method should be queued for later execution */
  queue?: boolean
  /** EXPERIMENTAL: Determines if the user should be blocked while this `BackendMethod` is running*/
  blockUser?: boolean
  paramTypes?: any[]
}
export const classBackendMethodsArray: unique symbol
export interface ClassMethodDecoratorContextStub<
  This = unknown,
  Value extends (this: This, ...args: any) => any = (
    this: This,
    ...args: any
  ) => any,
> {
  readonly kind: "method"
  readonly name: string | symbol
  readonly access: {
    has(object: This): boolean
  }
}
export declare function Controller(
  key: string,
): (target: any, context?: any) => any
export declare class ForbiddenError extends Error {
  constructor()
  isForbiddenError: true
}
interface inArgs {
  args: any[]
}
export interface jobWasQueuedResult {
  queuedJobId?: string
}
export declare class myServerAction extends Action<inArgs, result> {
  private types
  private options
  originalMethod: (args: any[]) => any
  constructor(
    name: string,
    types: any[],
    options: BackendMethodOptions<any>,
    originalMethod: (args: any[]) => any,
  )
  protected execute(
    info: inArgs,
    remult: Remult,
    res: DataApiResponse,
  ): Promise<result>
}
export declare function prepareArgsToSend(types: any[], args: any[]): any[]
export declare function prepareReceivedArgs(
  types: any[],
  args: any[],
  remult: Remult,
  ds: DataProvider,
  res: DataApiResponse,
): Promise<any[]>
//[ ] DataProvider from ./data-interfaces is not exported
export declare class ProgressListener {
  private res
  constructor(res: DataApiResponse)
  progress(progress: number): void
}
export interface queuedJobInfoResponse {
  done: boolean
  result?: any
  error?: any
  progress?: number
}
interface result {
  data: any
}
```
