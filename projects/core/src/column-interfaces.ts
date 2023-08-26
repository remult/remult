import { ClassType } from '../classType'
import { Allowed, Remult, AllowedForInstance } from './context'
import { EntityMetadata, FieldRef, OmitEB } from './remult3'

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
  target?: ClassType<entityType> //confusing it'll sometime reference an entity/controller and sometype the datatype iteslf
  /** The key to be used for this field */
  key?: string
}
/**Metadata for a `Field`, this metadata can be used in the user interface to provide a richer UI experience */
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

export declare type FieldValidator<entityType = any, valueType = any> = (
  entity: entityType,
  fieldRef: FieldRef<entityType, valueType>,
) => void | Promise<void>

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
}
