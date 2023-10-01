import { createId } from '@paralleldrive/cuid2'
import { v4 as uuid } from 'uuid'
import type { ClassType } from '../../classType'
import type { FieldOptions } from '../column-interfaces'
import type { Remult } from '../context'
import type {
  FindOptions,
  RelationInfo,
  RelationOptions,
  RelationOptionsBase,
} from './remult3'
import { ValueConverters } from '../valueConverters'
import { getEntityRef } from './getEntityRef'
import {
  type ClassFieldDecoratorContextStub,
  buildOptions,
  columnsOfType,
} from './RepositoryImplementation'
import { relationInfoMember } from './relationInfoMember'
import type { columnInfo } from './columnInfo'

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
  //[ ] docking the move from reference to one will not be fun,since the parameter order changes
  static reference<entityType, toEntityType>(
    toEntityType: () => ClassType<toEntityType>,
    options?: RelationOptionsBase<entityType, toEntityType>,
  ) {
    let op: RelationOptions<entityType, toEntityType, entityType> = (!options
      ? {}
      : options) as any as RelationOptions<entityType, toEntityType, entityType>

    return Field(toEntityType, {
      ...op,
      //@ts-ignore
      [relationInfoMember]: {
        //field,
        toType: toEntityType,
        type: 'reference',
      } satisfies RelationInfo,
    })
  }

  static many<entityType, toEntityType>(
    toEntityType: () => ClassType<toEntityType>,
    options:
      | (RelationOptions<
          entityType,
          toEntityType,
          toEntityType,
          FindOptions<toEntityType>
        > & {
          fromEntityType?: ClassType<entityType>
        })
      | keyof toEntityType,
  ) {
    let op: RelationOptions<
      entityType,
      toEntityType,
      toEntityType,
      FindOptions<toEntityType>
    > = (typeof options === 'string'
      ? { field: options }
      : options) as any as RelationOptions<
      entityType,
      toEntityType,
      toEntityType,
      FindOptions<toEntityType>
    >
    return Field(() => undefined!, {
      ...op,
      serverExpression: () => undefined,
      //@ts-ignore
      [relationInfoMember]: {
        //field,
        toType: toEntityType,

        type: 'toMany',
      } satisfies RelationInfo,
    })
  }
  static one<entityType, toEntityType>(
    toEntityType: () => ClassType<toEntityType>,
    options?:
      | RelationOptions<entityType, toEntityType, entityType>
      | keyof entityType,
  ) {
    let op: RelationOptions<entityType, toEntityType, entityType> =
      (typeof options === 'string'
        ? { field: options }
        : !options
        ? {}
        : options) as any as RelationOptions<
        entityType,
        toEntityType,
        entityType
      >

    return Field(() => undefined!, {
      ...op,
      serverExpression: () => undefined,
      //@ts-ignore
      [relationInfoMember]: {
        //field,
        toType: toEntityType,

        type: 'toOne',
      } satisfies RelationInfo,
    })
  }
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
  // import ANT!!!! if you call this in another decorator, make sure to set It's return type correctly with the | undefined

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

export interface StringFieldOptions<entityType = any>
  extends FieldOptions<entityType, string> {
  maxLength?: number
}
export function checkTarget(target: any) {
  if (!target)
    throw new Error(
      "Set the 'experimentalDecorators:true' option in your 'tsconfig' or 'jsconfig' (target undefined)",
    )
}
