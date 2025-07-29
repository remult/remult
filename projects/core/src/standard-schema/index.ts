import type { ClassType } from '../../index.js'
import { repo } from '../../index.js'
import type { StandardSchemaV1 } from './StandardSchemaV1.js'

// Step 1: Define the schema interface
interface RemultEnititySchema<entityType>
  extends StandardSchemaV1<Partial<entityType>, Partial<entityType>> {}

// Step 2: Implement the schema interface
export function v<entityType>(
  e: ClassType<entityType>,
): RemultEnititySchema<entityType> {
  return {
    '~standard': {
      version: 1,
      vendor: 'remult',
      async validate(value) {
        try {
          const item = value as Partial<entityType>
          const error = await repo(e).validate(item)
          if (error) {
            return { issues: [{ message: 'Invalid', path: [] }] }
          }
          return { value: item }
        } catch (e) {
          return { issues: [{ message: 'Invalid', path: [] }] }
        }
      },
      types: {
        input: {} as Partial<entityType>,
        output: {} as Partial<entityType>,
      },
    },
  }
}
