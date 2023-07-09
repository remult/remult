import { isBackend } from './context'
import { FieldRef } from './remult3'

export class Validators {
  static required = Object.assign(
    (entity: any, col: FieldRef<any, string>, message = undefined) => {
      if (
        !col.value ||
        (typeof col.value === 'string' && col.value.trim().length == 0)
      )
        col.error = message || Validators.required.defaultMessage
    },
    {
      withMessage: (message: string) => {
        return (entity: any, col: FieldRef<any, string>) =>
          Validators.required(entity, col, message)
      },
      defaultMessage: 'Should not be empty',
    },
  )
  static unique = Object.assign(
    async (entity: any, col: FieldRef<any, any>, message = undefined) => {
      if (!col.entityRef)
        throw 'unique validation may only work on columns that are attached to an entity'
      if (col.entityRef.isNew() || col.valueChanged()) {
        if (
          await col.entityRef.repository.count({
            [col.metadata.key]: col.value,
          })
        )
          col.error = message || Validators.unique.defaultMessage
      }
    },
    {
      withMessage: (message: string) => {
        return (entity, col: FieldRef<any, any>) =>
          Validators.unique(entity, col, message)
      },
      defaultMessage: 'already exists',
    },
  )
  static uniqueOnBackend = Object.assign(
    async (entity: any, col: FieldRef<any, any>, message = undefined) => {
      if (isBackend()) return Validators.unique(entity, col, message)
    },
    {
      withMessage: (message: string) => {
        return (entity, col: FieldRef<any, any>) =>
          Validators.uniqueOnBackend(entity, col, message)
      },
    },
  )
}
