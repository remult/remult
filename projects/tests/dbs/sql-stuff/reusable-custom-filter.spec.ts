import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ClassType,
  Entity,
  EntityFilter,
  Fields,
  Filter,
  Remult,
  SqlDatabase,
  dbNamesOf,
} from '../../../core/index.js'
import { createPostgresDataProvider } from '../../../core/postgres/postgres-data-provider.js'

@Entity('people')
export class Person {
  @Fields.integer()
  id = 0
  @Fields.json()
  tags: string[] = []

  // register the filters for this specific entity
  static filters = myAppCustomFilters(() => Person)
}

const postgresConnection = process.env.DATABASE_URL
describe.skipIf(!postgresConnection)('Postgres Tests', () => {
  it('test array contains custom filter', async () => {
    expect(
      await remult.repo(Person).find({
        where: Person.filters({
          tags: {
            arrayContains: 'd',
          },
        }),
      }),
    ).toMatchInlineSnapshot(`
      [
        Person {
          "id": 2,
          "tags": [
            "a",
            "d",
          ],
        },
      ]
    `)
  })
  it('test array ends with custom filter', async () => {
    let repo = remult.repo(Person)

    expect(
      await remult.repo(Person).find({
        where: Person.filters({
          tags: {
            arrayEndsWith: 'e',
          },
        }),
      }),
    ).toMatchInlineSnapshot(`
    [
      Person {
        "id": 3,
        "tags": [
          "a",
          "e",
        ],
      },
    ]
  `)
  })
  it('test array starts with custom filter', async () => {
    expect(
      await remult.repo(Person).find({
        where: Person.filters({
          tags: {
            arrayStartsWith: 'e',
          },
        }),
      }),
    ).toMatchInlineSnapshot(`
  []
`)
  })

  beforeEach(async () => {
    var meta = remult.repo(Person).metadata
    await db.execute('drop table if exists ' + meta.dbName)
    await db.ensureSchema([meta])
    await remult.repo(Person).insert([
      { id: 1, tags: ['a', 'c'] },
      { id: 2, tags: ['a', 'd'] },
      { id: 3, tags: ['a', 'e'] },
    ])
  })
  beforeAll(async () => {
    db = await createPostgresDataProvider({
      connectionString: postgresConnection,
    })

    remult = new Remult(db)
  })
  let db: SqlDatabase
  let remult: Remult
})

//Your code in your project - this way you can add operators that are not supported by the ORM by default and just register them once to the entity you want to use it with.
export interface MyAppCustomOperators {
  arrayContains?: string
  arrayStartsWith?: string
  arrayEndsWith?: string
}

export function myAppCustomFilters<entityType>(
  entity: () => ClassType<entityType>,
) {
  return Filter.createCustom<
    entityType,
    { [p in keyof entityType]?: MyAppCustomOperators }
  >(async (fieldsInFilter) => {
    const dbn = await dbNamesOf(entity())
    return SqlDatabase.rawFilter(({ param }) => {
      const result = []
      for (const fieldKey in fieldsInFilter) {
        if (Object.prototype.hasOwnProperty.call(fieldsInFilter, fieldKey)) {
          const operatorsForField: any = fieldsInFilter[fieldKey]
          const field = dbn.$dbNameOf(fieldKey)
          for (const operator in operatorsForField) {
            if (
              Object.prototype.hasOwnProperty.call(operatorsForField, operator)
            ) {
              const value = operatorsForField[
                operator
              ] as keyof MyAppCustomOperators
              switch (operator) {
                case 'arrayContains': {
                  result.push(`${field}::jsonb ? ${param(value)}`)
                  break
                }
                case 'arrayStartsWith': {
                  result.push(
                    `jsonb_path_query_first(${field}::jsonb, '$[0]') = ${param(
                      JSON.stringify(value),
                    )}`,
                  )
                  break
                }
                case 'arrayEndsWith': {
                  result.push(
                    `jsonb_path_query_first(${field}::jsonb, '$[last]') = ${param(
                      JSON.stringify(value),
                    )}`,
                  )
                  break
                }
              }
            }
          }
        }
        return result.join(' and ')
      }
    })
  })
}
