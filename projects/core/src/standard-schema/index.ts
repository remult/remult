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
  fields extends Extract<keyof MembersOnly<entityType>, string>[] = [],
>(
  entity: ClassType<entityType>,
  ...fields: fields
): RemultEntitySchema<entityType, fields> {
  return {
    '~standard': {
      version: 1,
      vendor: 'remult',
      async validate(value) {
        try {
          const item = value as Partial<entityType>
          const error = await repo(entity).validate(item, ...fields)
          if (error) {
            const issues: Array<StandardSchemaV1.Issue> = []

            if (error.modelState) {
              for (const [key, message] of Object.entries(error.modelState)) {
                issues.push({
                  message: message as string,
                  path: [key],
                })
              }
            }

            if (issues.length === 0 && error.message) {
              issues.push({ message: error.message, path: [] })
            }

            return { issues }
          }

          // Return the item with proper type assertion
          return { value: item as OutputType<entityType, fields> }
        } catch (e) {
          let errorMessage = 'Validation error occurred'
          return { issues: [{ message: errorMessage, path: [] }] }
        }
      },
    },
  }
}
