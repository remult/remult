import type { ClassType, MembersOnly } from '../../index.js'
import { repo } from '../../index.js'
import type { StandardSchemaV1 } from './StandardSchemaV1.js'

interface RemultEnititySchema<entityType>
  extends StandardSchemaV1<Partial<entityType>, Partial<entityType>> {}

export function std<entityType>(
  entity: ClassType<entityType>,
  ...fields: Extract<keyof MembersOnly<entityType>, string>[]
): RemultEnititySchema<entityType> {
  return {
    '~standard': {
      version: 1,
      vendor: 'remult',
      async validate(value) {
        try {
          const item = value as Partial<entityType>
          const error = await repo(entity).validate(item, ...fields)
          if (error) {
            // Extract field-specific errors from modelState
            const issues: Array<{
              message: string
              path: ReadonlyArray<string | number | symbol>
            }> = []

            if (error.modelState) {
              // Add field-specific errors with proper paths
              for (const [fieldName, fieldError] of Object.entries(
                error.modelState,
              )) {
                if (fieldError) {
                  issues.push({
                    message: fieldError as string,
                    path: [fieldName],
                  })
                }
              }
            }

            // If no field-specific errors but we have a general message, add it
            if (issues.length === 0 && error.message) {
              issues.push({
                message: error.message,
                path: [],
              })
            }

            // Fallback if no specific errors are available
            if (issues.length === 0) {
              issues.push({
                message: 'Validation failed',
                path: [],
              })
            }

            return { issues }
          }
          return { value: item }
        } catch (e) {
          let errorMessage = 'Validation error occurred'

          return {
            issues: [
              {
                message: errorMessage,
                path: [],
              },
            ],
          }
        }
      },
    },
  }
}
