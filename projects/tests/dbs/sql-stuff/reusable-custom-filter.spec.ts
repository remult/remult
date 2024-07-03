import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ClassType,
  Entity,
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

  static arrayContains = buildArrayContainsFilter(() => Person)
}

const postgresConnection = process.env.DATABASE_URL
describe.skipIf(!postgresConnection)('Postgres Tests', () => {
  it('test reusable custom filter', async () => {
    let repo = remult.repo(Person)

    await repo.insert([
      { id: 1, tags: ['a', 'c'] },
      { id: 2, tags: ['a', 'd'] },
      { id: 3, tags: ['a', 'e'] },
    ])
    expect(
      await repo.find({
        where: Person.arrayContains({ field: 'tags', value: 'd' }),
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

  beforeEach(async () => {
    var meta = remult.repo(Person).metadata

    await db.execute('drop table if exists ' + meta.dbName)
    await db.ensureSchema([meta])
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

export function buildArrayContainsFilter<entityType>(
  entity: () => ClassType<entityType>,
) {
  return Filter.createCustom<
    entityType,
    { field: keyof entityType; value: string }
  >(async ({ field, value }) => {
    const dbn = await dbNamesOf(entity())
    return SqlDatabase.rawFilter(
      ({ param }) =>
        `${dbn.$dbNameOf(field as string)}::jsonb @> ${param([value])}`,
    )
  })
}
