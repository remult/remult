import type { MembersOnly, Repository } from '../../index.js'
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

export function standardSchema<
  entityType,
  fieldsType extends Extract<keyof MembersOnly<entityType>, string>[] = [],
>(
  repo: Repository<entityType>,
  ...fields: fieldsType
): RemultEntitySchema<entityType, fieldsType> {
  return {
    '~standard': {
      version: 1,
      vendor: 'remult',
      async validate(value) {
        const item = value as Partial<entityType>
        try {
          const error = await repo.validate(item, ...fields)
          if (error && error.modelState) {
            return {
              issues: Object.entries(error.modelState).map(
                ([key, message]) => ({
                  message: message as string,
                  path: [key],
                }),
              ),
            }
          }
        } catch (err) {
          if (err instanceof Error) {
            return { issues: [{ message: err.message, path: [] }] }
          }
        }

        if (fields.length > 0) {
          const filteredItem = {}
          for (const field of fields) {
            if (field in item) {
              filteredItem[field] = item[field] as any
            }
          }
          return { value: filteredItem as OutputType<entityType, fieldsType> }
        }
        return { value: item as OutputType<entityType, fieldsType> }
      },
    },
  }
}
