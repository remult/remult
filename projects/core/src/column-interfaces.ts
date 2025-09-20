import type { ClassType } from '../classType.js'
import type { Allowed, AllowedForInstance } from './context.js'
import type {
  EntityMetadata,
  FieldRef,
  LifecycleEvent,
  ValidateFieldEvent,
} from './remult3/remult3.js'
import type { SqlCommandWithParameters } from './sql-command.js'

export interface FieldOptions<entityType = unknown, valueType = unknown> {
  /** A human readable name for the field. Can be used to achieve a consistent caption for a field throughout the app
   * @example
   * ```html
   * <input placeholder={taskRepo.metadata.fields.title.caption} />
   * ```
   */
  caption?: string
  /** A human readable name for the field. Can be used to achieve a consistent label for a field throughout the app
   * @example
   * ```html
   * <input placeholder={taskRepo.metadata.fields.title.label} />
   * ```
   */
  label?: string
  /** If it can store `null` in the database. @default false */
  allowNull?: boolean
  /** If a value is required. Short-cut to say `validate: Validators.required`.
   * @default false
   * @see option [validate](https://remult.dev/docs/ref_field#validate)
   * @see validator [required](https://remult.dev/docs/ref_validators#required)
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
    | ((
        entity: EntityMetadata<entityType>,
        args?: any,
        command?: SqlCommandWithParameters,
      ) => string | Promise<string>)
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
  target?: ClassType<entityType> //confusing it'll sometime reference an entity/controller and sometime the datatype itself
  /** The key to be used for this field */
  key?: string
}
/**Metadata for a `Field`, this metadata can be used in the user interface to provide a richer UI experience */
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
  /** A human readable label for the field. Can be used to achieve a consistent label for a field throughout the app
   * @example
   * <input placeholder={taskRepo.metadata.fields.title.label}/>
   * @see {@link FieldOptions.label} for configuration details
   */
  readonly label: string
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
/**
 * Interface for converting values between different formats, such as in-memory objects, database storage,
 * JSON data transfer objects (DTOs), and HTML input elements.
 *
 * @template valueType The type of the value that the converter handles.
 */
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

  toDbSql?(val: string): string

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
export declare type ValueOrExpression<valueType> = valueType | (() => valueType)

export function valueOrExpressionToValue<valueType>(
  f: ValueOrExpression<valueType>,
): valueType {
  if (typeof f === 'function') {
    let x = f as any
    return x()
  }
  return <valueType>f
}

export interface ValueListItem {
  id?: any
  caption?: any
  label?: any
}
