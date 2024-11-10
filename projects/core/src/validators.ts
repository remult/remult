import { getRelationFieldInfo } from '../internals.js'
import type { FieldValidator } from './column-interfaces.js'
import { isBackend } from './context.js'
import type { ValidateFieldEvent } from './remult3/remult3.js'

export class Validators {
  static required = createValidator<unknown>(
    async (_, e) =>
      !e.valueIsNull() &&
      e.value !== '' &&
      (e.value !== undefined || getRelationFieldInfo(e.metadata) !== undefined),

    'Should not be empty',
  )

  static unique = createValidator<unknown>(async (_, e) => {
    if (!e.entityRef)
      throw 'unique validation may only work on columns that are attached to an entity'

    if (e.isBackend() && (e.isNew || e.valueChanged())) {
      return (
        (await e.entityRef.repository.count({
          [e.metadata.key]: e.value,
        })) == 0
      )
    } else return true
  }, 'already exists')
  /**
   * @deprecated use `unique` instead - it also runs only on the backend
   */
  static uniqueOnBackend = createValidator<unknown>(async (_, e) => {
    if (e.isBackend() && (e.isNew || e.valueChanged())) {
      return (
        (await e.entityRef.repository.count({
          [e.metadata.key]: e.value,
        })) == 0
      )
    } else return true
  }, Validators.unique.defaultMessage)

  static regex = createValueValidatorWithArgs<string, RegExp>((val, regex) =>
    regex.test(val),
  )
  static email = createValueValidator<string>(
    (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    'Invalid Email',
  )
  static url = createValueValidator<string>(
    (val) => !!new URL(val),
    'Invalid Url',
  )
  static in: <T>(
    value: readonly T[],
    withMessage?: ValueValidationMessage<T[]>,
  ) => FieldValidator<unknown, T> & {
    withMessage: ValueValidationMessage<T[]>
  } = createValueValidatorWithArgs(
    <T>(val: T, values: T[]) => values.includes(val),
    <T>(values: T[]) =>
      `Value must be one of: ${values
        .map((y) =>
          typeof y === 'object'
            ? (y as any)?.['id'] !== undefined
              ? (y as any)?.['id']
              : y?.toString()
            : y,
        )
        .join(', ')}`,
  ) as any

  static notNull = createValueValidator(
    (val) => val != null,
    'Should not be null',
  )
  static enum = createValueValidatorWithArgs(
    (value, enumObj) => Object.values(enumObj as object).includes(value),
    (enumObj) =>
      `Value must be one of ${getEnumValues(enumObj as object).join(', ')}`,
  )
  static relationExists = createValidator<unknown>(async (_, e) => {
    if (e.valueIsNull()) return true
    if (!e.isBackend()) return true
    return Boolean(await e.load())
  }, 'Relation value does not exist')

  static biggerThan = createValueValidatorWithArgs<number, number>(
    (val, minValue) => val > minValue,
    (minValue) => `Value must be bingger than ${minValue}`,
  )

  static smallerThan = createValueValidatorWithArgs<number, number>(
    (val, maxValue) => val < maxValue,
    (maxValue) => `Value must be smaller than ${maxValue}`,
  )
  static maxLength = createValueValidatorWithArgs<string, number>(
    (val, maxLength) => val.length <= maxLength,
    (maxLength) => `Value must be at most ${maxLength} characters`,
  )
  static minLength = createValueValidatorWithArgs<string, number>(
    (val, minLength) => val.length >= minLength,
    (maxLength) => `Value must be at least ${maxLength} characters`,
  )

  static defaultMessage = 'Invalid value'
}

export type Validator<valueType> = FieldValidator<unknown, valueType> &
  ((
    message?: ValidationMessage<valueType, undefined>,
  ) => FieldValidator<unknown, valueType>) & {
    defaultMessage: ValidationMessage<valueType, undefined>
    /**
     * @deprecated  use (message:string) instead - for example: Validators.required("Is needed")
     */
    withMessage(
      message: ValidationMessage<valueType, undefined>,
    ): FieldValidator<unknown, valueType>
  }

export function createValidator<valueType>(
  validate: (
    entity: any,
    e: ValidateFieldEvent<any, valueType>,
  ) => Promise<boolean | string> | boolean | string,
  defaultMessage?: ValidationMessage<valueType, undefined>,
): Validator<valueType> {
  const validation = async (
    entity: any,
    e: ValidateFieldEvent<any, valueType>,
    message?: ValidationMessage<valueType, undefined>,
  ) => {
    const valid = await validate(entity, e)
    if (typeof valid === 'string' && valid.length > 0) e.error = valid
    else if (!valid)
      e.error =
        (typeof message === 'function' && message(entity, e, undefined)) ||
        (message as string) ||
        (typeof defaultMessage === 'function' &&
          defaultMessage(entity, e, undefined)) ||
        (defaultMessage as string) ||
        Validators.defaultMessage
  }
  const result = (
    entityOrMessage: any,
    e?: ValidateFieldEvent<any, valueType>,
    message?: ValidationMessage<valueType, undefined>,
  ) => {
    if (
      typeof entityOrMessage === 'string' ||
      entityOrMessage === 'function' ||
      (entityOrMessage === undefined && e === undefined)
    ) {
      return async (entity: any, e: any, message: any) =>
        await validation(entity, e, entityOrMessage || message)
    }
    return validation(entityOrMessage, e!, message)
  }
  Object.defineProperty(result, 'defaultMessage', {
    get: () => {
      return defaultMessage
    },
    set: (val) => {
      defaultMessage = val
    },
    enumerable: true,
  })
  //@ts-ignore
  return Object.assign(result, {
    withMessage:
      (message: ValidationMessage<valueType, undefined>) =>
      async (entity: any, e: ValidateFieldEvent<any, valueType>) =>
        result(entity, e, message),
  })
}

export function valueValidator<valueType>(
  validate: (value: valueType) => boolean | string | Promise<boolean | string>,
  defaultMessage?: string,
) {
  return (entity: any, e: ValidateFieldEvent<any, valueType>) =>
    validate(e.value) || defaultMessage || false
}

export function createValueValidator<valueType>(
  validate: (value: valueType) => boolean | string | Promise<boolean | string>,
  defaultMessage?: ValidationMessage<valueType, undefined>,
) {
  return createValidator<valueType>((_, e) => {
    if (e.value === undefined || e.value === null) return true
    return validate(e.value)
  }, defaultMessage)
}
export function createValueValidatorWithArgs<valueType, argsType>(
  validate: (
    value: valueType,
    args: argsType,
  ) => boolean | string | Promise<boolean | string>,
  defaultMessage?: ValueValidationMessage<argsType>,
): ValidatorWithArgs<valueType, argsType> & {
  defaultMessage: ValueValidationMessage<argsType>
} {
  const result = createValidatorWithArgsInternal<valueType, argsType>(
    (_, e, args) => {
      if (e.value === undefined || e.value === null) return true
      return validate(e.value, args)
    },
    (_, e, args) =>
      (typeof defaultMessage === 'function' && defaultMessage(args)) ||
      (defaultMessage as string),
    true,
  )
  return Object.assign((entity: any, e: any) => result(entity, e), {
    get defaultMessage() {
      return defaultMessage!
    },
    set defaultMessage(val) {
      defaultMessage = val
    },
  })
}

export type ValueValidationMessage<argsType> =
  | string
  | ((args: argsType) => string)

export type ValidationMessage<valueType, argsType> =
  | string
  | ((
      entity: any,
      event: ValidateFieldEvent<any, valueType>,
      args: argsType,
    ) => string)

export type ValidatorWithArgs<valueType, argsType> = (
  args: argsType,
  message?: ValidationMessage<valueType, argsType>,
) => FieldValidator<unknown, valueType>

export function createValidatorWithArgs<valueType, argsType>(
  validate: (
    entity: any,
    e: ValidateFieldEvent<any, valueType>,
    args: argsType,
  ) => Promise<boolean | string> | boolean | string,
  defaultMessage: ValidationMessage<valueType, argsType>,
): ValidatorWithArgs<valueType, argsType> & {
  defaultMessage: ValidationMessage<valueType, argsType>
} {
  return createValidatorWithArgsInternal(validate, defaultMessage)
}
function createValidatorWithArgsInternal<valueType, argsType>(
  validate: (
    entity: any,
    e: ValidateFieldEvent<any, valueType>,
    args: argsType,
  ) => Promise<boolean | string> | boolean | string,
  defaultMessage: ValidationMessage<valueType, argsType>,
  isValueValidator = false,
): ValidatorWithArgs<valueType, argsType> & {
  defaultMessage: ValidationMessage<valueType, argsType>
} {
  const result =
    (args: argsType, message?: ValidationMessage<valueType, argsType>) =>
    async (entity: any, e: ValidateFieldEvent<any, valueType>) => {
      const valid = await validate(entity, e, args)
      if (typeof valid === 'string') e.error = valid
      else if (!valid)
        e.error = message
          ? typeof message === 'function'
            ? isValueValidator
              ? (message as any as (args: argsType) => string)(args)
              : message(entity, e, args)
            : message
          : defaultMessage
          ? typeof defaultMessage === 'function'
            ? defaultMessage(entity, e, args)
            : defaultMessage
          : Validators.defaultMessage
    }

  return Object.assign(result, {
    get defaultMessage() {
      return defaultMessage
    },
    set defaultMessage(val) {
      defaultMessage = val
    },
  }) as ValidatorWithArgs<valueType, argsType> & {
    defaultMessage: ValidationMessage<valueType, argsType>
  }
}

export function getEnumValues<theEnum>(enumObj: theEnum) {
  return Object.values(enumObj as object).filter(
    (x) => typeof (enumObj as any)[x as any] !== 'number',
  )
}
