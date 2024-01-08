import type { FieldValidator } from './column-interfaces.js'
import { isBackend } from './context.js'
import type { ValidateFieldEvent } from './remult3/remult3.js'

export class Validators {
  static required = createValidator<any>(
    async (_, e) =>
      e.value != null && e.value != undefined && e.value !== '' && e.value != 0,

    'Should not be empty',
  )

  static unique = createValidator<any>(async (_, e) => {
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
   * @deprecated is `unique` instead - it also runs only on the backend
   */
  static uniqueOnBackend = createValidator<any>(async (_, e) => {
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
  ) => FieldValidator<any, T> & {
    withMessage: ValueValidationMessage<T[]>
  } = createValueValidatorWithArgs(
    <T>(val: T, values: T[]) => values.includes(val),
    <T>(values: T[]) => `Value must be one of ${values.join(', ')}`,
  ) as any

  static notNull = createValueValidator(
    (val) => val != null,
    'Should not be null',
  )
  static enum = createValueValidatorWithArgs<any, any>(
    (value, enumObj) => Object.values(enumObj).includes(value),
    (enumObj) =>
      `Value must be one of ${Object.values(enumObj)
        .filter((x) => typeof enumObj[x as any] !== 'number')
        .join(', ')}`,
  )
  static relationExists = createValidator<any>(async (_, e) => {
    if (e.valueIsNull()) return true
    if (!e.isBackend()) return true
    return Boolean(await e.load())
  }, 'Relation value does not exist')

  static maxLength = createValueValidatorWithArgs<string, number>(
    (val, maxLength) => val.length <= maxLength,
    (maxLength) => `Value must be at most ${maxLength} characters`,
  )

  static defaultMessage = 'Invalid value'
}

export type Validator<valueType> = FieldValidator<any, valueType> &
  ((
    message?: ValidationMessage<valueType, undefined>,
  ) => FieldValidator<any, valueType>) & {
    defaultMessage: ValidationMessage<valueType, undefined>
    /**
     * @deprecated  use (message:string) instead - for example: Validators.required("Is needed")
     */
    withMessage(
      message: ValidationMessage<valueType, undefined>,
    ): FieldValidator<any, valueType>
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
      return async (entity, e, message) =>
        await validation(entity, e, entityOrMessage || message)
    }
    return validation(entityOrMessage, e!, message)
  }

  //@ts-ignore
  return Object.assign(result, {
    withMessage:
      (message: ValidationMessage<valueType, undefined>) =>
      async (entity: any, e: ValidateFieldEvent<any, valueType>) =>
        result(entity, e, message),

    get defaultMessage() {
      return defaultMessage
    },
    set defaultMessage(val) {
      defaultMessage = val
    },
    isValid: validate,
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
  const result = createValidatorWithArgs<valueType, argsType>(
    (_, e, args) => {
      if (e.value === undefined || e.value === null) return true
      return validate(e.value, args)
    },
    (_, e, args) =>
      (typeof defaultMessage === 'function' && defaultMessage(args)) ||
      (defaultMessage as string),
  )
  return Object.assign((entity, e) => result(entity, e), {
    get defaultMessage() {
      return defaultMessage
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
) => FieldValidator<any, valueType>

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
  const result =
    (args: argsType, message?: string) =>
    async (entity: any, e: ValidateFieldEvent<any, valueType>) => {
      const valid = await validate(entity, e, args)
      if (typeof valid === 'string') e.error = valid
      else if (!valid)
        e.error =
          message || defaultMessage
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
  })
}
//y1 - talk about the 3rd parameter as message
//y1 - talk about the changed signature breaking existing validations and preventing the usage of unique outside the normal flow
//y1 - talk about the defaultMessage value now being a function that get's too many arguments, that makes it's reuse that much harder
