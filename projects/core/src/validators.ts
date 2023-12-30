import type { FieldOptions } from '../index.js'
import { isBackend } from './context.js'
import type { FieldRef } from './remult3/remult3.js'

export class Validators {
  /*y1 - consider breaking the validate method signature or adding another method called `isValid` that returns a boolean | string or promise of them with an Event parameter that looks like:
    {
      entity: entityType
      col: FieldRef<any, valueType>
      value: valueType
      isNew: boolean
      wasChanged: boolean
      options: FieldOptions<valueType>
    }
  */
  //y1 - consider if field types should include validation in them by default (string,number that it's not NaN etc...) and if so, what message?
  //y1 - https://github.com/validatorjs/validator.js
  //y1 - consider that required has specific meaning in forms, needs and asterisk in the caption
  //y1 - maybe not null is a validation?
  //y1  -consider placing from json exceptions errors as validations error (like zod parse)
  static required = buildValidationMethod<string>(
    async (_, col) =>
      col.value && typeof col.value === 'string' && col.value.trim().length > 0,
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
}

function buildValidationMethod<valueType>(
  isValid: (
    entity: any,
    col: FieldRef<any, valueType>,
  ) => Promise<boolean | string> | boolean | string,
  //y1 consider changing to a function that gets the column, value and parameters and returns a string
  defaultMessage = 'Invalid Value',
) {
  const result = async (
    entity: any,
    col: FieldRef<any, valueType>,
    message?: string,
  ) => {
    const valid = await isValid(entity, col)
    if (typeof valid === 'string') col.error = valid
    else if (!valid) col.error = message || defaultMessage
  }

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

function buildValidationMethod2<valueType, args>(
  isValid: (
    entity: any,
    col: FieldRef<any, valueType>,
    args: args,
  ) => Promise<boolean | string> | boolean | string,
  defaultMessage = 'Invalid Value',
) {
  const result =
    (args: args, message?: string) =>
    async (entity: any, col: FieldRef<any, valueType>) => {
      const valid = await isValid(entity, col, args)
      if (typeof valid === 'string') col.error = valid
      else if (!valid) col.error = message || defaultMessage
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

function buildValidationMethod_<valueType>(
  isValid: (args: {
    entity: any
    col: FieldRef<any, valueType>
    value: valueType
    isNew: boolean
    wasChanged: boolean
    options: FieldOptions<valueType>
  }) => Promise<boolean | string> | boolean | string,
  defaultMessage = 'Invalid Value',
) {
  return buildValidationMethod<valueType>(
    (entity, col) =>
      isValid({
        entity,
        col,
        value: col.value,
        isNew: col.entityRef?.isNew(),
        wasChanged: col.valueChanged(),
        options: col.metadata.options,
      }),
    defaultMessage,
  )
}
function buildValidationMethod_2<valueType, args>(
  isValid: (
    args: {
      entity: any
      col: FieldRef<any, valueType>
      value?: valueType
      originalValue?: valueType
      isNew: boolean
      wasChanged: boolean
    },
    x: args,
  ) => Promise<boolean | string> | boolean | string,
  defaultMessage = 'Invalid Value',
) {
  return buildValidationMethod2<valueType, args>(
    (entity, col, args) =>
      isValid(
        {
          entity,
          col,
          value: col.value,
          originalValue: col.originalValue,
          isNew: col.entityRef?.isNew(),
          wasChanged: col.valueChanged(),
        },
        args,
      ),
    defaultMessage,
  )
}

const containsA = buildValidationMethod<string>(
    (_, col) => col.value?.includes('a'),
  ),
  containsA1 = buildValidationMethod_<string>(
    ({ value }) => value?.includes('a'),
  ),
  containsA11 = buildValidationMethod_<string>(
    ({ value }) => value?.includes('a') || 'must contain a',
  ),
  contains2 = buildValidationMethod2<string, { char: string }>(
    (_, col, { char }) => col.value?.includes(char),
  ),
  contains21 = buildValidationMethod_2<string, { char: string }>(
    ({ value }, { char }) => value?.includes(char),
  ),
  contains3 = buildValidationMethod_2<string, string>(
    ({ value }, char) => value?.includes(char),
  )

const validators: FieldOptions<any, string>['validate'] = [
  Validators.required,
  containsA,
  containsA1,
  contains2({ char: 'b' }),
  contains3('c'),
]
