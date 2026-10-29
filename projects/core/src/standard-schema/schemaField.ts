import { InputTypes } from '../../inputTypes.js'
import type { FieldOptions, FieldValidator } from '../column-interfaces.js'
import { ValueConverters } from '../valueConverters.js'
import type { StandardJSONSchemaV1 } from './StandardJSONSchemaV1.js'
import type { StandardSchemaV1 } from './StandardSchemaV1.js'

type JsonSchema = {
  type?: string | string[]
  enum?: unknown[]
  const?: unknown
  anyOf?: JsonSchema[]
  oneOf?: JsonSchema[]
}
type Column = {
  valueType: (() => any) | undefined
  options: FieldOptions<any, any>
}

const json: Column = {
  valueType: undefined,
  options: {
    valueConverter: { fieldTypeInDb: 'json', inputType: InputTypes.json },
  },
}
const columnsByJsonType: Record<string, Column> = {
  integer: {
    valueType: () => Number,
    options: { valueConverter: ValueConverters.Integer },
  },
  number: { valueType: () => Number, options: {} },
  boolean: { valueType: () => Boolean, options: {} },
  string: { valueType: () => String, options: {} },
}

export const schemaFieldOptions = (
  schema: StandardSchemaV1,
  options: readonly unknown[],
): Column => {
  const passesColumn = namesItsColumn(options)
  const jsonSchema = passesColumn
    ? tryJsonSchemaOf(schema)
    : jsonSchemaOf(schema)
  const types = jsonSchema ? typesOf(jsonSchema) : new Set<string>()
  const column = passesColumn
    ? { valueType: undefined, options: {} }
    : columnFor(types)
  return {
    valueType: column.valueType,
    options: {
      ...column.options,
      allowNull: types.size ? types.has('null') : acceptsNull(schema),
      validate: validatorFor(schema),
    },
  }
}

const namesItsColumn = (options: readonly unknown[]) =>
  options.some(
    (o) =>
      typeof o === 'object' &&
      ((o as FieldOptions).valueType || (o as FieldOptions).valueConverter),
  )

const columnFor = (types: Set<string>): Column => {
  const [type, ...others] = [...types].filter((t) => t !== 'null')
  return (!others.length && columnsByJsonType[type!]) || json
}

// Some libraries describe a union of literals with `enum` or `const` and no `type`, e.g. arktype's
// `'a' | 'b'`, so the type comes from the values.
const typesOf = (jsonSchema: JsonSchema): Set<string> => {
  const branches = jsonSchema.anyOf ?? jsonSchema.oneOf
  if (branches) return new Set(branches.flatMap((b) => [...typesOf(b)]))
  if (jsonSchema.type) return new Set([jsonSchema.type].flat())
  const values =
    jsonSchema.enum ?? ('const' in jsonSchema ? [jsonSchema.const] : [])
  return new Set(values.map((v) => (v === null ? 'null' : typeof v)))
}

const jsonSchemaOf = (schema: StandardSchemaV1): JsonSchema => {
  const converter = (schema['~standard'] as Partial<StandardJSONSchemaV1.Props>)
    .jsonSchema
  if (!converter)
    throw new Error(
      cantPickColumn(
        `${schema['~standard'].vendor} doesn't implement Standard JSON Schema`,
      ) +
        ` If the library has an adapter, wrap the schema in it, e.g. valibot's toStandardJsonSchema(schema).`,
    )
  try {
    return converter.output({ target: 'draft-2020-12' }) as JsonSchema
  } catch (error: any) {
    throw new Error(cantPickColumn(error.message))
  }
}

const tryJsonSchemaOf = (schema: StandardSchemaV1) => {
  try {
    return jsonSchemaOf(schema)
  } catch {
    return undefined
  }
}

const cantPickColumn = (reason: string) =>
  `Fields.schema can't pick a column for this schema (${reason}). Pass one, e.g. Fields.schema(schema, { valueType: Date }).`

// Only for schemas whose JSON Schema doesn't say. Running the schema is less exact, e.g. `z.coerce.number()`
// turns null into 0 and passes.
const acceptsNull = (schema: StandardSchemaV1) => {
  const result = schema['~standard'].validate(null)
  return !(result instanceof Promise) && !result.issues
}

// Writes the schema's output back, so transforms like `.trim()` and `.default()` reach the database.
const validatorFor =
  (schema: StandardSchemaV1): FieldValidator<any, any> =>
  (entity, event) => {
    const apply = (result: StandardSchemaV1.Result<unknown>) => {
      if (result.issues) return result.issues[0]!.message
      ;(entity as any)[event.metadata.key] = result.value
      return true
    }
    const result = schema['~standard'].validate(event.value)
    return result instanceof Promise ? result.then(apply) : apply(result)
  }
