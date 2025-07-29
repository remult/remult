import type { ClassType, MembersOnly } from '../../index.js'
import { repo } from '../../index.js'
import type { StandardSchemaV1 } from './StandardSchemaV1.js'

interface RemultEntitySchema<entityType>
  extends StandardSchemaV1<Partial<entityType>, Partial<entityType>> {}

export function std<entityType>(
  entity: ClassType<entityType>,
  ...fields: Extract<keyof MembersOnly<entityType>, string>[]
): RemultEntitySchema<entityType> {
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
          return { value: item }
        } catch (e) {
          let errorMessage = 'Validation error occurred'
          return { issues: [{ message: errorMessage, path: [] }] }
        }
      },
    },
  }
}
