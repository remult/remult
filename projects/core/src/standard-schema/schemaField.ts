import { InputTypes } from '../../inputTypes.js'
import type { FieldOptions, FieldValidator } from '../column-interfaces.js'
import { ValueConverters } from '../valueConverters.js'
import type { StandardJSONSchemaV1 } from './StandardJSONSchemaV1.js'
import type { StandardSchemaV1 } from './StandardSchemaV1.js'

type JsonSchema = { type?: string | string[]; anyOf?: JsonSchema[] }
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

export function schemaFieldOptions(
  schema: StandardSchemaV1,
  options: readonly unknown[],
): Column {
  const column = namesItsColumn(options)
    ? { valueType: undefined, options: {} }
    : columnFor(schema)
  return {
    valueType: column.valueType,
    options: {
      ...column.options,
      allowNull: acceptsNull(schema),
      validate: validatorFor(schema),
    },
  }
}

function namesItsColumn(options: readonly unknown[]) {
  return options.some(
    (o) =>
      typeof o === 'object' &&
      ((o as FieldOptions).valueType || (o as FieldOptions).valueConverter),
  )
}

function columnFor(schema: StandardSchemaV1): Column {
  const jsonSchema = jsonSchemaOf(schema)
  const types = new Set(
    (jsonSchema.anyOf ?? [jsonSchema])
      .flatMap((branch) => [branch.type ?? []].flat())
      .filter((type) => type !== 'null'),
  )
  const [type] = types
  return (types.size === 1 && columnsByJsonType[type!]) || json
}

function jsonSchemaOf(schema: StandardSchemaV1): JsonSchema {
  const converter = (schema['~standard'] as Partial<StandardJSONSchemaV1.Props>)
    .jsonSchema
  if (!converter)
    throw new Error(
      cantPickColumn(
        `${schema['~standard'].vendor} doesn't implement Standard JSON Schema`,
      ),
    )
  try {
    return converter.output({ target: 'draft-2020-12' }) as JsonSchema
  } catch (error: any) {
    throw new Error(cantPickColumn(error.message))
  }
}

const cantPickColumn = (reason: string) =>
  `Fields.schema can't pick a column for this schema (${reason}). Pass one, e.g. Fields.schema(schema, { valueType: Date }).`

// Any Standard Schema can validate null, so nullability works without JSON Schema support.
function acceptsNull(schema: StandardSchemaV1) {
  const result = schema['~standard'].validate(null)
  return !(result instanceof Promise) && !result.issues
}

function validatorFor(schema: StandardSchemaV1): FieldValidator<any, any> {
  return (_, event) => {
    const result = schema['~standard'].validate(event.value)
    return result instanceof Promise
      ? result.then(firstIssueMessage)
      : firstIssueMessage(result)
  }
}

function firstIssueMessage(result: StandardSchemaV1.Result<unknown>) {
  return result.issues ? result.issues[0]!.message : true
}
