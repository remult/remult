import { describe, expect, it } from 'vitest'
import { Entity, Fields, InMemoryDataProvider, Remult } from '../core/index.js'
import type { StandardSchemaV1 } from '../core/src/standard-schema/StandardSchemaV1.js'

const testSchema = <output>(
  check: (value: unknown) => string | undefined,
  jsonSchema?: object,
): StandardSchemaV1<output> => {
  const validate = (value: unknown) => {
    const message = check(value)
    return message ? { issues: [{ message }] } : { value: value as output }
  }
  return {
    '~standard': {
      version: 1,
      vendor: 'test',
      validate,
      ...(jsonSchema && {
        jsonSchema: { input: () => jsonSchema, output: () => jsonSchema },
      }),
    },
  }
}

const email = testSchema<string>(
  (v) =>
    typeof v === 'string' && v.includes('@') ? undefined : 'Needs an email',
  { type: 'string', format: 'email' },
)
const boxCount = testSchema<number>(
  (v) =>
    Number.isInteger(v) && (v as number) >= 1 ? undefined : 'At least one box',
  { type: 'integer', minimum: 1 },
)
const note = testSchema<string | null>(
  (v) => (v === null || typeof v === 'string' ? undefined : 'Needs text'),
  { type: ['string', 'null'] },
)
const weight = testSchema<number | null>(
  (v) => (v === null || typeof v === 'number' ? undefined : 'Needs a number'),
  { anyOf: [{ type: 'number' }, { type: 'null' }] },
)
const shipped = testSchema<boolean>(
  (v) => (typeof v === 'boolean' ? undefined : 'Needs a boolean'),
  { type: 'boolean' },
)
const tags = testSchema<string[]>(
  (v) => (Array.isArray(v) ? undefined : 'Needs a list'),
  { type: 'array', items: { type: 'string' } },
)
const promisedBy = testSchema<Date>((v) =>
  v instanceof Date && v.getFullYear() >= 2020 ? undefined : 'Too far back',
)

@Entity('quotes')
class Quote {
  @Fields.id() id = ''
  @Fields.schema(email) email = 'a@b.co'
  @Fields.schema(boxCount) boxCount = 1
  @Fields.schema(note) note: string | null = null
  @Fields.schema(weight) weight: number | null = null
  @Fields.schema(shipped) shipped = false
  @Fields.schema(tags) tags: string[] = []
  @Fields.schema(promisedBy, { valueType: Date }) promisedBy = new Date()
}

describe('Fields.schema', () => {
  const repo = new Remult(new InMemoryDataProvider()).repo(Quote)
  const fields = repo.metadata.fields

  it('picks the column from the JSON Schema', () => {
    expect(fields.email.valueType).toBe(String)
    expect(fields.boxCount.valueConverter.fieldTypeInDb).toEqual('integer')
    expect(fields.weight.valueType).toBe(Number)
    expect(fields.shipped.valueType).toBe(Boolean)
    expect(fields.tags.valueConverter.fieldTypeInDb).toEqual('json')
  })

  it('allows null when the schema accepts null', () => {
    expect(fields.note.allowNull).toEqual(true)
    expect(fields.weight.allowNull).toEqual(true)
    expect(fields.email.allowNull).toEqual(false)
  })

  it('validates with the schema message', async () => {
    const result = await repo.validate(
      repo.create({ email: 'nope', boxCount: 0 }),
    )

    expect(result!.modelState).toEqual({
      email: 'Needs an email',
      boxCount: 'At least one box',
    })
  })

  it('passes valid values', async () => {
    const result = await repo.validate(
      repo.create({ email: 'x@y.co', boxCount: 3 }),
    )

    expect(result).toEqual(undefined)
  })

  it('takes the column from a valueType option', async () => {
    const result = await repo.validate(
      repo.create({ promisedBy: new Date('2019-01-01') }),
    )

    expect(fields.promisedBy.valueType).toBe(Date)
    expect(result!.modelState).toEqual({ promisedBy: 'Too far back' })
  })

  it('throws without a JSON Schema or a valueType', () => {
    expect(() => Fields.schema(promisedBy)).toThrowErrorMatchingInlineSnapshot(
      `[Error: Fields.schema can't pick a column for this schema (test doesn't implement Standard JSON Schema). Pass one, e.g. Fields.schema(schema, { valueType: Date }).]`,
    )
  })

  it('runs async schemas alongside other validators', async () => {
    const handle: StandardSchemaV1<string> = {
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: async (v) =>
          v === 'taken'
            ? { issues: [{ message: 'Taken' }] }
            : { value: v as string },
        jsonSchema: {
          input: () => ({ type: 'string' }),
          output: () => ({ type: 'string' }),
        },
      } as StandardSchemaV1.Props<string>,
    }
    @Entity('handles')
    class Handle {
      @Fields.id() id = ''
      @Fields.schema(handle, {
        validate: (_, event) => event.value !== 'admin' || 'Reserved',
      })
      name = ''
    }
    const handles = new Remult(new InMemoryDataProvider()).repo(Handle)

    const taken = await handles.validate(handles.create({ name: 'taken' }))
    const reserved = await handles.validate(handles.create({ name: 'admin' }))

    expect(taken!.modelState).toEqual({ name: 'Taken' })
    expect(reserved!.modelState).toEqual({ name: 'Reserved' })
  })

  it('checks the property type against the schema', () => {
    class Mismatch {
      // @ts-expect-error the schema outputs a number
      @Fields.schema(boxCount) count = ''
      // @ts-expect-error the schema allows null
      @Fields.schema(note) text = ''
      // @ts-expect-error the schema doesn't allow null
      @Fields.schema(email) address: string | null = null
      @Fields.schema(email) optional?: string
    }

    expect(Mismatch).toBeDefined()
  })
})
