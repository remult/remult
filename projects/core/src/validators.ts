import type { FieldOptions } from '../index.js'
import { isBackend } from './context.js'
import type { FieldRef } from './remult3/remult3.js'

export class Validators {
  static required = buildValidationMethod<any>(
    async (_, col) =>
      col.value != null &&
      col.value != undefined &&
      col.value !== '' &&
      col.value != 0,

    'Should not be empty',
  )

  static unique = buildValidationMethod<any>(async (_, col) => {
    if (!col.entityRef)
      throw 'unique validation may only work on columns that are attached to an entity'
    if (col.entityRef.isNew() || col.valueChanged()) {
      return (
        (await col.entityRef.repository.count({
          [col.metadata.key]: col.value,
        })) == 0
      )
    } else return true
  }, 'already exists')

  static uniqueOnBackend = buildValidationMethod<any>(async (_, col) => {
    if (isBackend()) return Validators.unique.isValid(_, col)
    return true
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
  static in = createValueValidatorWithArgs<any, any[]>((val, values) =>
    values.includes(val),
  )

  static notNull = createValueValidator(
    (val) => val != null,
    'Should not be null',
  )
  static enum = createValueValidatorWithArgs((value, enumObj) =>
    Object.values(enumObj).includes(value),
  )
  static relationExists = buildValidationMethod<any>(async (_, col) => {
    if (col.valueIsNull()) return true
    return Boolean(await col.load())
  }, 'Relation value does not exist')

  static maxLength = createValueValidatorWithArgs<string, number>(
    (val, maxLength) => val.length <= maxLength,
    'Value too long',
  )

  static defaultMessage = 'Invalid value'
}

function buildValidationMethod<valueType>(
  isValid: (
    entity: any,
    col: FieldRef<any, valueType>,
  ) => Promise<boolean | string> | boolean | string,
  defaultMessage?: string,
): ((
  entity: any,
  col: FieldRef<any, valueType>,
  message?: string,
) => Promise<void>) &
  ((
    message?: string,
  ) => (
    entity: any,
    col: FieldRef<any, valueType>,
    message?: string,
  ) => Promise<void>) & {
    //@deprecated use required('message') instead
    withMessage: (
      message: string,
    ) => (entity: any, col: FieldRef<any, valueType>) => Promise<void>
    defaultMessage: string
    isValid: (
      entity: any,
      col: FieldRef<any, valueType>,
    ) => Promise<boolean | string> | boolean | string
  } {
  const validation = async (
    entity: any,
    col: FieldRef<any, valueType>,
    message?: string,
  ) => {
    const valid = await isValid(entity, col)
    if (typeof valid === 'string' && valid.length > 0) col.error = valid
    else if (!valid) col.error = message || defaultMessage
  }
  const result = (
    entityOrMessage: any,
    col?: FieldRef<any, valueType>,
    message?: string,
  ) => {
    if (
      typeof entityOrMessage === 'string' ||
      (entityOrMessage === undefined && col === undefined)
    ) {
      return async (entity, ref, message) =>
        await validation(entity, ref, entityOrMessage || message)
    }
    return validation(entityOrMessage, col!, message)
  }

  //@ts-ignore
  return Object.assign(result, {
    withMessage:
      (message: string) => async (entity: any, col: FieldRef<any, valueType>) =>
        result(entity, col, message),

    get defaultMessage() {
      return defaultMessage
    },
    set defaultMessage(val) {
      defaultMessage = val
    },
    isValid,
  })
}

export function valueValidator<valueType>(
  validate: (value: valueType) => boolean | string | Promise<boolean | string>,
  message?: string,
) {
  return (entity: any, col: FieldRef<any, valueType>) =>
    validate(col.value) || message || false
}

export function createValueValidator<valueType>(
  validate: (value: valueType) => boolean | string | Promise<boolean | string>,
  message?: string,
) {
  return buildValidationMethod<valueType>(
    (_, col) => validate(col.value),
    message,
  )
}
export function createValueValidatorWithArgs<valueType, argsType>(
  validate: (
    value: valueType,
    args: argsType,
  ) => boolean | string | Promise<boolean | string>,
  message?: string,
) {
  return createValidator<valueType, argsType>(
    (_, col, args) => validate(col.value, args),
    message,
  )
}
export function createValidator<valueType, args>(
  isValid: (
    entity: any,
    col: FieldRef<any, valueType>,
    args: args,
  ) => Promise<boolean | string> | boolean | string,
  defaultMessage?: string,
) {
  const result =
    (args: args, message?: string) =>
    async (entity: any, col: FieldRef<any, valueType>) => {
      const valid = await isValid(entity, col, args)
      if (typeof valid === 'string') col.error = valid
      else if (!valid)
        col.error = message || defaultMessage || Validators.defaultMessage
    }

  return Object.assign(result, {
    get defaultMessage() {
      return defaultMessage
    },
    set defaultMessage(val) {
      defaultMessage = val
    },
    isValid,
  })
}

// create basic validator, lambda value , default message & generic type for the parameter
/*
V - required to support being called with optional message :
V * - validators.required("message")
V * - validators.required()
V * - validators.required
V - same for unique and unique on backend.
V - deprecate withMessage
y1 - consider making this `validators.create` createWithArgs | `validators.value` 
y1 - consider if field types should include validation in them by default (string,number that it's not NaN etc...) and if so, what message?
y1 - should enforce integer - currently we probably round / truncate it
y1 - message should support seeing the values - like x is not a valid email, etc...
     https://github.com/colinhacks/zod/blob/3e4f71e857e75da722bd7e735b6d657a70682df2/src/locales/en.ts#L98
y1 = default message of create simple validator should match which signature :)
y1 - should all other validations allow null/ undefined so the user will used required & ?
y1 - relation exist should happen on backend (or non proxy)
*/

/* 
* V - support string argument in validation
  V - valueValidator create two basic validators - with and without args.
* V - createValueValidator
* V - createValueValidator with options
* V - required - !=0 !='' != null != undefined
* V - email
* V - url
* V - regex
* V - in
* V - not null
* VV - enum
* V - relation exists
* V - max length should be enforced? from options - where the default message will be from the validators
* V - required as field option
//y1  -consider placing from json exceptions errors as validations error (like zod parse)
*/
// view issue
//p1 - symbol for!!
//p1 - globalThis for that is static
//p1 - remove reflect metadata
