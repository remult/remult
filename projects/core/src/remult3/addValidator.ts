import type { FieldOptions } from '../column-interfaces.js'

export function addValidator<entityType, valueType>(
  validators: FieldOptions<entityType, valueType>['validate'],
  newValidator: FieldOptions<entityType, valueType>['validate'],
  atStart = false,
) {
  if (!newValidator) return validators
  const newValidators = Array.isArray(newValidator)
    ? newValidator
    : [newValidator]
  const validatorsArray = Array.isArray(validators)
    ? validators
    : validators
    ? [validators]
    : []
  return atStart
    ? [...newValidators, ...validatorsArray]
    : [...validatorsArray, ...newValidators]
}
