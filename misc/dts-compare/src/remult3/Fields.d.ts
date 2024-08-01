import type { ClassType } from '../../classType'
import type { FieldOptions } from '../column-interfaces'
import type { Remult } from '../context'
import type {
  FindOptions,
  RelationOptions,
  ClassFieldDecorator,
  ClassFieldDecoratorContextStub,
} from './remult3'
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
      | FieldOptions<entityType, Number>
      | ((options: FieldOptions<entityType, Number>, remult: Remult) => void)
    )[]
  ): ClassFieldDecorator<entityType, number | undefined>
  static autoIncrement<entityType = unknown>(
    ...options: (
      | FieldOptions<entityType, Number>
      | ((options: FieldOptions<entityType, Number>, remult: Remult) => void)
    )[]
  ): ClassFieldDecorator<entityType, number | undefined>
  static number<entityType = unknown>(
    ...options: (
      | FieldOptions<entityType, Number>
      | ((options: FieldOptions<entityType, Number>, remult: Remult) => void)
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
  static cuid<entityType = unknown>(
    ...options: (
      | FieldOptions<entityType, string>
      | ((options: FieldOptions<entityType, string>, remult: Remult) => void)
    )[]
  ): ClassFieldDecorator<entityType, string | undefined>
  static string<entityType = unknown>(
    ...options: (
      | StringFieldOptions<entityType>
      | ((options: StringFieldOptions<entityType>, remult: Remult) => void)
    )[]
  ): ClassFieldDecorator<entityType, string | undefined>
  static boolean<entityType = unknown>(
    ...options: (
      | FieldOptions<entityType, boolean>
      | ((options: FieldOptions<entityType, boolean>, remult: Remult) => void)
    )[]
  ): ClassFieldDecorator<entityType, boolean | undefined>
}
export declare class Relations {
  /** A to one relation with an automatically generated field */
  static toOne<entityType, toEntityType>(
    toEntityType: () => ClassType<toEntityType>,
    options?: FieldOptions<entityType, toEntityType> &
      Pick<
        RelationOptions<entityType, toEntityType, any, any>,
        'defaultIncluded'
      >,
  ): ClassFieldDecorator<entityType, toEntityType | undefined>
  /** A to one relation with fields defined in the second parameter */
  static toOne<entityType, toEntityType>(
    toEntityType: () => ClassType<toEntityType>,
    fieldInMyEntity?: keyof entityType,
  ): ClassFieldDecorator<entityType, toEntityType | undefined>
  /** A to one relation with fields defined in the field/fields parameter */
  static toOne<entityType, toEntityType>(
    toEntityType: () => ClassType<toEntityType>,
    options: Omit<
      RelationOptions<entityType, toEntityType, entityType>,
      keyof Pick<RelationOptions<entityType, toEntityType, entityType>, 'field'>
    >,
  ): ClassFieldDecorator<entityType, toEntityType | undefined>
  /** A to one relation with fields defined in the field/fields parameter */
  static toOne<entityType, toEntityType>(
    toEntityType: () => ClassType<toEntityType>,
    options: Omit<
      RelationOptions<entityType, toEntityType, entityType>,
      keyof Pick<
        RelationOptions<entityType, toEntityType, entityType>,
        'fields'
      >
    >,
  ): ClassFieldDecorator<entityType, toEntityType | undefined>
  static toMany<entityType, toEntityType>(
    toEntityType: () => ClassType<toEntityType>,
    fieldInToEntity?: keyof toEntityType,
  ): ClassFieldDecorator<entityType, toEntityType[] | undefined>
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
export declare function Field<entityType = unknown, valueType = unknown>(
  valueType: (() => ClassType<valueType>) | undefined,
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
export interface StringFieldOptions<entityType = unknown>
  extends FieldOptions<entityType, string> {
  maxLength?: number
}
export declare function checkTarget(target: any): void
