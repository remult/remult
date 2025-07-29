import type { ClassType, MembersOnly } from '../../index.js'
import { repo } from '../../index.js'
import type { StandardSchemaV1 } from './StandardSchemaV1.js'

// Conditional type for output based on whether fields are provided
type OutputType<entityType, fields extends string[]> = fields extends []
  ? Partial<entityType>
  : Pick<entityType, Extract<keyof entityType, fields[number]>>

interface RemultEntitySchema<entityType, fields extends string[] = []>
  extends StandardSchemaV1<
    Partial<entityType>,
    OutputType<entityType, fields>
  > {}

export function std<
  entityType,
  fieldsType extends Extract<keyof MembersOnly<entityType>, string>[] = [],
>(
  entity: ClassType<entityType>,
  ...fields: fieldsType
): RemultEntitySchema<entityType, fieldsType> {
  return {
    '~standard': {
      version: 1,
      vendor: 'remult',
      async validate(value) {
        const item = value as Partial<entityType>
        const error = await repo(entity).validate(item, ...fields)
        if (error && error.modelState) {
          return {
            issues: Object.entries(error.modelState).map(([key, message]) => ({
              message: message as string,
              path: [key],
            })),
          }
        }
        return { value: item as OutputType<entityType, fieldsType> }
      },
    },
  }
}
