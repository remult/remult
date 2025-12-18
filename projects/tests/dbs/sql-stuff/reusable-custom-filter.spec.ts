import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ArrayEntityDataProvider,
  ClassType,
  Entity,
  EntityFilter,
  Fields,
  Filter,
  InMemoryDataProvider,
  Remult,
  SqlDatabase,
  ValueListFieldType,
  ValueListInfo,
  dbNamesOf,
  remult,
  type FieldOptions,
  type ValueListItem,
} from '../../../core/index.js'
import { createPostgresDataProvider } from '../../../core/postgres/postgres-data-provider.js'

function ValueListFieldArray<entityType, valueType extends ValueListItem>(
  type: () => ClassType<valueType>,
  options?: FieldOptions<entityType, valueType[]>,
) {
  return Fields.json<entityType, valueType[]>({
    valueConverter: {
      fieldTypeInDb: 'json',
      toJson: (val: valueType[]) => val.map((y) => y.id),

      fromJson: (val: string[]) =>
        val.map((y) => ValueListInfo.get(type()).byId(y)!),
      toDb: (val: valueType[]) => {
        //  if (!val.map) debugger
        return val.map((y) => y.id)
      },
      fromDb: (val: string[]) =>
        val.map((y) => ValueListInfo.get(type()).byId(y)!),
    },
    ...options,
  })
}

//Your code in your project - this way you can add operators that are not supported by the ORM by default and just register them once to the entity you want to use it with.
export interface MyAppCustomOperators<T extends any[]> {
  arrayContains?: T[number]
  arrayEmpty?: boolean
  arrayStartsWith?: T[number]
  arrayEndsWith?: T[number]
}

export function myAppCustomFilters<entityType>(
  entity: () => ClassType<entityType>,
) {
  return Filter.createCustom<
    entityType,
    {
      [p in keyof entityType]?: MyAppCustomOperators<
        entityType[p] extends any[] ? entityType[p] : never
      >
    }
  >(async (fieldsInFilter) => {
    const dbn = await dbNamesOf(entity())
    const repo = remult.repo(entity())

    const result: EntityFilter<entityType>[] = []
    for (const fieldKey in fieldsInFilter) {
      if (Object.prototype.hasOwnProperty.call(fieldsInFilter, fieldKey)) {
        const operatorsForField: any = fieldsInFilter[fieldKey]
        const fieldDbName = dbn.$dbNameOf(fieldKey)
        const fieldMetadata = repo.metadata.fields.find(fieldKey)
        for (const operator in operatorsForField) {
          if (
            Object.prototype.hasOwnProperty.call(operatorsForField, operator)
          ) {
            const value = fieldMetadata.valueConverter.toDb([
              operatorsForField[operator] as keyof MyAppCustomOperators<
                entityType[keyof entityType] extends any[]
                  ? entityType[keyof entityType]
                  : never
              >,
            ])[0]
            switch (operator) {
              case 'arrayContains': {
                result.push(
                  SqlDatabase.rawFilter(
                    ({ param }) => `${fieldDbName}::jsonb ? ${param(value)}`,
                  ),
                  ArrayEntityDataProvider.rawFilter((x) =>
                    x[fieldKey]?.includes(value),
                  ),
                )
                break
              }
              case 'arrayEmpty': {
                const isEmpty = operatorsForField[operator] === true
                result.push(
                  SqlDatabase.rawFilter(
                    ({ param }) =>
                      `${fieldDbName}::jsonb ${isEmpty ? '=' : '<>'} ${param(JSON.stringify([]))}`,
                  ),
                  ArrayEntityDataProvider.rawFilter((x) =>
                    isEmpty
                      ? (x[fieldKey]?.length ?? 0) === 0
                      : (x[fieldKey]?.length ?? 0) > 0,
                  ),
                )
                break
              }
              case 'arrayStartsWith': {
                result.push(
                  SqlDatabase.rawFilter(
                    ({ param }) =>
                      `jsonb_path_query_first(${fieldDbName}::jsonb, '$[0]') = ${param(
                        JSON.stringify(value),
                      )}`,
                  ),
                )
                break
              }
              case 'arrayEndsWith': {
                result.push(
                  SqlDatabase.rawFilter(
                    ({ param }) =>
                      `jsonb_path_query_first(${fieldDbName}::jsonb, '$[last]') = ${param(
                        JSON.stringify(value),
                      )}`,
                  ),
                )
                break
              }
            }
          }
        }
      }
    }
    return { $and: result } as EntityFilter<entityType>
  })
}

// start testing code

@ValueListFieldType()
class Country {
  static us = new Country('+1')
  static israel = new Country('+972')
  static france = new Country('+33')
  static austria = new Country('+43')
  id!: string
  constructor(public prefix: string) {}
  call() {
    return '+' + this.prefix
  }
}

@Entity('contributor')
export class Contributor {
  @Fields.integer()
  id = 0

  @ValueListFieldArray(() => Country)
  countries: Country[] = [Country.us]

  // register the filters for this specific entity
  static filters = myAppCustomFilters(() => Contributor)
}

function theTests(onBeforeEach: () => Promise<Remult>) {
  let remult: Remult
  beforeEach(async () => {
    remult = await onBeforeEach()
    await remult.repo(Contributor).insert([
      { id: 1, countries: [Country.us] },
      { id: 2, countries: [] },
      { id: 3, countries: [Country.france, Country.austria] },
    ])
  })
  it('values are ok in array', async () => {
    expect(
      (await remult.repo(Contributor).findId(3))?.countries.map((y) =>
        y.call(),
      ),
    ).toEqual(['++33', '++43'])
  })
  it('filters', async () => {
    expect(
      (
        await remult.repo(Contributor).find({
          where: Contributor.filters({
            countries: {
              arrayContains: Country.france,
            },
          }),
        })
      ).map((x) => x.id),
    ).toEqual([3])
  })
  it('arrayEmpty', async () => {
    expect(
      (
        await remult.repo(Contributor).find({
          where: Contributor.filters({
            countries: { arrayEmpty: true },
          }),
        })
      ).map((x) => x.id),
    ).toEqual([2])
  })
  it('arrayEmpty', async () => {
    expect(
      (
        await remult.repo(Contributor).find({
          where: Contributor.filters({
            countries: { arrayEmpty: false },
          }),
        })
      ).map((x) => x.id),
    ).toEqual([1, 3])
  })
}

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
describe.skipIf(!postgresConnection)(
  'Postgres Tests of value type array',
  () => {
    theTests(async () => {
      let db = await createPostgresDataProvider({
        connectionString: postgresConnection,
      })
      const remult = new Remult(db)
      var meta = remult.repo(Contributor).metadata
      await db.execute('drop table if exists ' + meta.dbName)
      await db.ensureSchema([meta])
      return remult
    })
  },
)
describe('json  Tests of value type array', () => {
  theTests(async () => {
    return new Remult(new InMemoryDataProvider())
  })
})

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
  it('test filter in extends', async () => {
    class Base {
      @Fields.integer()
      id = 0
      @Fields.json()
      tags: string[] = []

      // register the filters for this specific entity
      static filters = myAppCustomFilters(() => WPerson)
    }
    @Entity('people')
    class WPerson extends Base {}

    expect(
      await remult.repo(WPerson).find({
        where: WPerson.filters({
          tags: {
            arrayEndsWith: 'e',
          },
        }),
      }),
    ).toMatchInlineSnapshot(`
      [
        WPerson {
          "id": 3,
          "tags": [
            "a",
            "e",
          ],
        },
      ]
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
