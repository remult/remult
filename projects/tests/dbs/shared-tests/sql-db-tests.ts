import { it, expect, describe, beforeEach } from 'vitest'
import { DbTestProps } from './db-tests-props'
import { entity as createEntityClass } from '../../tests/dynamic-classes'
import {
  Entity,
  Fields,
  Remult,
  SqlDatabase,
  dbNamesOf,
  remult,
} from '../../../core'
import { entityWithValidations } from './entityWithValidations.js'
import { cast, isOfType } from '../../../core/src/isOfType.js'
import {
  SqlCommandFactory,
  type HasWrapIdentifier,
} from '../../../core/src/sql-command.js'
import { migrate } from '../../../core/migrations/index.js'
import {
  compareMigrationSnapshot,
  emptySnapshot,
} from '../../../core/migrations/compare-migration-snapshots.js'
import {
  CanBuildMigrations,
  DefaultMigrationBuilder,
  type Migrations,
} from '../../../core/migrations/migration-types.js'
import { MockRestDataProvider } from '../../tests/testHelper.js'

export function SqlDbTests({
  createEntity,
  getRemult,
  getDb,
  skipMigrations,
  doesNotSupportDdlTransactions,
  isKnex,
}: DbTestProps & {
  skipMigrations?: boolean
  doesNotSupportDdlTransactions?: boolean
  isKnex?: boolean
}) {
  it('test dbReadonly ', async () => {
    const e = await createEntity(
      createEntityClass('x', {
        id: Fields.number(),
        a: Fields.number(),
        b: Fields.number({ dbReadOnly: true }),
        c: Fields.number({ sqlExpression: () => 'a+5' }),
      }),
    )
    const result = await e.insert({ id: 1, a: 1, b: 2 })
    expect(result).toMatchInlineSnapshot(`
      x {
        "a": 1,
        "b": 0,
        "c": 6,
        "id": 1,
      }
    `)
  })
  it('test sql expression in parallel', async () => {
    @Entity('x_aTb_c_d')
    class c {
      @Fields.number()
      id = 0
      @Fields.number()
      aTb = 0
      @Fields.number({
        sqlExpression: async (x) => {
          let db = await dbNamesOf(c)
          return `1+2`
        },
      })
      c = 0
    }
    const e = await createEntity(c)
    await e.insert({ id: 2, aTb: 1 })
    expect(
      (await Promise.all([e.find(), e.find(), e.find(), e.find()])).map(
        (x) => x[0].id,
      ),
    ).toMatchInlineSnapshot(`
      [
        2,
        2,
        2,
        2,
      ]
    `)
  })

  it('test wrap identifier', async () => {
    const dp = remult.dataProvider
    try {
      remult.dataProvider = getDb()
      @Entity('x_aTb')
      class c {
        @Fields.number()
        id = 0
        @Fields.number()
        aTb = 0
        @Fields.number({
          sqlExpression: async (x) => {
            let db = await dbNamesOf(c)
            return `${db.aTb}+2`
          },
        })
        c = 0
      }
      const e = await createEntity(c)
      const result = await e.insert({ id: 2, aTb: 1 })
      expect(result).toMatchInlineSnapshot(`
        c {
          "aTb": 1,
          "c": 3,
          "id": 2,
        }
      `)
    } finally {
      remult.dataProvider = dp
    }
  })
  it('test filter to raw', async () => {
    const dp = remult.dataProvider
    try {
      remult.dataProvider = getDb()
      @Entity('x_aTb')
      class c {
        @Fields.number()
        id = 0
        @Fields.number()
        order = 0
      }

      const e = await createEntity(c)
      await e.insert([
        { id: 2, order: 1 },
        { id: 3, order: 2 },
      ])
      const result = await e.find({
        where: SqlDatabase.rawFilter(async ({ filterToRaw }) =>
          SqlDatabase.filterToRaw(e, { order: 1 }),
        ),
      })
      expect(result.length).toBe(1)
    } finally {
      remult.dataProvider = dp
    }
  })
  it('test sql command factory', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const remult = getRemult()

    let f = SqlDatabase.getDb(remult.dataProvider)
    const e = await dbNamesOf(repo, f.wrapIdentifier)

    expect(
      (
        await f.execute(
          `select ${e.myId}, ${e.name} from ${e.$entityName} where ${e.myId} in (1,2)`,
        )
      ).rows.map((x) => ({ ...x })),
    ).toMatchInlineSnapshot(`
      [
        {
          "myId": 1,
          "name": "noam",
        },
        {
          "myId": 2,
          "name": "yael",
        },
      ]
    `)
  })
  it('test expression columns without aliases', async () => {
    // pg names unnamed columns $column$ - other databases do different stuff.
    // postgres has an option called `rowMode` that can return the result as an array - but knex doesn't support it.
    // some databases work well with this test..
    // with alias - this causes problems in where / order by
    @Entity('testSExp1')
    class Test {
      @Fields.integer()
      id = 0
      @Fields.integer({ sqlExpression: () => 'id+1' })
      a = 0
      @Fields.integer({ sqlExpression: () => '2+2' })
      b = 0
      @Fields.integer()
      c = 3
    }
    const r = await createEntity(Test)
    expect(await r.insert({ id: 1 })).toMatchInlineSnapshot(`
      Test {
        "a": 2,
        "b": 4,
        "c": 3,
        "id": 1,
      }
    `)
    expect(await r.findFirst()).toMatchInlineSnapshot(`
      Test {
        "a": 2,
        "b": 4,
        "c": 3,
        "id": 1,
      }
    `)
    expect(await r.findOne({ where: { b: 4 }, orderBy: { a: 'desc' } }))
      .toMatchInlineSnapshot(`
      Test {
        "a": 2,
        "b": 4,
        "c": 3,
        "id": 1,
      }
    `)
  })
  it('test raw filter across databases', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    expect(
      (
        await repo.find({
          where: {
            myId: [1, 2, 3, 4],
            $or: [
              SqlDatabase.rawFilter(async (build) => {
                build.sql =
                  cast<HasWrapIdentifier>(getDb(), 'wrapIdentifier')
                    .wrapIdentifier!('myId') +
                  ` in (${build.param(2)},${build.param(3)})`
              }),
              SqlDatabase.rawFilter(async (build) => {
                build.sql =
                  cast<HasWrapIdentifier>(getDb(), 'wrapIdentifier')
                    .wrapIdentifier!('myId') +
                  ` in (${build.param(9)},${build.param(10)})`
              }),
            ],
          },
        })
      ).length,
    ).toBe(2)
  })
  it('test raw filter across databases with new syntax', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    expect(
      (
        await repo.find({
          where: {
            myId: [1, 2, 3, 4],
            $or: [
              SqlDatabase.rawFilter(async ({ param, wrapIdentifier }) => {
                return wrapIdentifier('myId') + ` in (${param(2)},${param(3)})`
              }),
              SqlDatabase.rawFilter(async ({ filterToRaw }) =>
                filterToRaw(repo, { myId: [9, 10] }),
              ),
            ],
          },
        })
      ).length,
    ).toBe(2)
  })
  it('test sql command factory with params', async () => {
    const repo = await entityWithValidations.create4RowsInDp(createEntity)
    const remult = getRemult()

    let f = SqlDatabase.getDb(remult.dataProvider)
    const e = await dbNamesOf(repo, f.wrapIdentifier)
    const c = f.createCommand()
    const result = await c.execute(
      `select ${e.myId}, ${e.name} from ${e.$entityName} where ${
        e.myId
      } in (${c.param(1)},${c.param(2)})`,
    )

    expect(result.rows.map((x) => ({ ...x }))).toMatchInlineSnapshot(`
      [
        {
          "myId": 1,
          "name": "noam",
        },
        {
          "myId": 2,
          "name": "yael",
        },
      ]
    `)
    expect([0, 1].map((x) => result.getColumnKeyInResultForIndexInSelect(x)))
      .toMatchInlineSnapshot(`
      [
        "myId",
        "name",
      ]
    `)
  })
  describe.skipIf(skipMigrations)('test migrations', () => {
    const migrationsTable = 'remult_migrations'
    let db: SqlCommandFactory
    let remult: Remult
    @Entity('tasks')
    class Task {
      @Fields.number()
      id = ''
      @Fields.string()
      title = ''
    }
    @Entity('tasks')
    class TaskEnhanced extends Task {
      @Fields.boolean()
      completed = false
      @Fields.date()
      createdAt = new Date()
    }
    beforeEach(async () => {
      db = cast<SqlCommandFactory>(getDb(), 'createCommand')
      remult = getRemult()
      for (const iterator of [
        migrationsTable,
        remult.repo(Task).metadata.dbName,
      ]) {
        try {
          await db.execute('drop table  ' + db.wrapIdentifier!(iterator))
        } catch {}
      }
    })
    it('test migrations', async () => {
      await expect(() => remult.repo(Task).find()).rejects.toThrow()
      let migrations: Migrations = {}
      let snapshot = emptySnapshot()
      let code = {
        addSql: (s: string) =>
          (migrations[Object.keys(migrations).length] = async ({ sql }) =>
            await sql(s)),
        addComment: () => {
          throw Error('not implemented')
        },
        addTypescriptCode: () => {
          throw Error('not implemented')
        },
      }
      let migrationBuilder = new DefaultMigrationBuilder(
        code,
        cast<CanBuildMigrations>(
          getDb(),
          'provideMigrationBuilder',
        ).provideMigrationBuilder(code),
      )
      snapshot = await compareMigrationSnapshot({
        entities: [Task],
        snapshot: snapshot,
        migrationBuilder,
        reporter: () => {},
      })
      expect(Object.keys(migrations).length).toBe(1)
      await migrate({
        migrations,
        dataProvider: getDb(),
        migrationsTable,
        endConnection: false,
      })
      expect(await remult.repo(Task).find()).toMatchInlineSnapshot('[]')
      await expect(() => remult.repo(TaskEnhanced).find()).rejects.toThrow()
      snapshot = await compareMigrationSnapshot({
        entities: [TaskEnhanced],
        snapshot: snapshot,
        migrationBuilder,
        reporter: () => {},
      })
      expect(Object.keys(migrations).length).toBe(3)
      await migrate({
        migrations,
        dataProvider: getDb(),
        migrationsTable,
        endConnection: false,
      })
      expect(await remult.repo(TaskEnhanced).find()).toMatchInlineSnapshot('[]')
    })
    it('test #474', async () => {
      @Entity('hash474')
      class myTb {
        @Fields.autoIncrement()
        theId = 0
        @Fields.string()
        name = ''
      }
      const repo = await createEntity(myTb)
      let result = await repo.insert({ name: 'noam' })
      expect(result).toMatchInlineSnapshot(`
        myTb {
          "name": "noam",
          "theId": 1,
        }
      `)
      result.name = 'maayan'
      result = await repo.save(result)
      expect(result).toMatchInlineSnapshot(`
        myTb {
          "name": "maayan",
          "theId": 1,
        }
      `)
    })
    it('test #474_1', async () => {
      @Entity('hash474_1')
      class myTb {
        @Fields.autoIncrement({ dbName: 'someId' })
        theId = 0
        @Fields.string()
        name = ''
      }
      const repo = await createEntity(myTb)
      let result = await repo.insert({ name: 'noam' })
      expect(result).toMatchInlineSnapshot(`
        myTb {
          "name": "noam",
          "theId": 1,
        }
      `)
      result.name = 'maayan'
      result = await repo.save(result)
      expect(result).toMatchInlineSnapshot(`
        myTb {
          "name": "maayan",
          "theId": 1,
        }
      `)
    })
    it('test #474_2', async () => {
      @Entity('hash474_2')
      class myTb {
        @Fields.autoIncrement({ dbName: 'someId' })
        id = 0
        @Fields.string()
        name = ''
      }
      const repo = await createEntity(myTb)
      let result = await repo.insert({ name: 'noam' })
      expect(result).toMatchInlineSnapshot(`
        myTb {
          "id": 1,
          "name": "noam",
        }
      `)
      result.name = 'maayan'
      result = await repo.save(result)
      expect(result).toMatchInlineSnapshot(`
        myTb {
          "id": 1,
          "name": "maayan",
        }
      `)
    })
    it('test migrations transactions', async () => {
      const repo = await entityWithValidations.create4RowsInDp(createEntity)
      expect(await repo.count()).toBe(4)
      const n = await dbNamesOf(
        repo.metadata,
        cast<SqlCommandFactory>(getDb(), 'wrapIdentifier'),
      )
      await expect(
        async () =>
          await migrate({
            migrations: {
              0: async ({ sql }) => {
                await sql(`delete from ${n.$entityName} where ${n.myId} = 1`)
              },
              1: async ({ sql }) => {
                await sql(`delete from ${n.$entityName} where ${n.myId} = 2`)
                throw 'error'
              },
            },
            dataProvider: getDb(),
            migrationsTable,
          }),
      ).rejects.toThrow('error')

      expect(await repo.count()).toBe(4)
    })

    it.skipIf(doesNotSupportDdlTransactions)(
      'test migrations transactions and ddl',
      async () => {
        const db = cast<SqlCommandFactory>(getDb(), 'createCommand')
        const tableName = db.wrapIdentifier!('xyz1')
        try {
          await cast(getDb(), 'execute').execute(`drop table ${tableName}`)
        } catch {}
        await expect(
          async () =>
            await migrate({
              migrations: {
                1: async ({ sql }) => {
                  await sql(`create table ${tableName}(id int)`)
                },
                2: async ({ sql }) => {
                  await sql('insert into ' + tableName + ' values (1)')
                  await sql(`alter table ${tableName} add  x int`)
                  expect(
                    ((await sql('select * from ' + tableName)) as any).rows,
                  ).toMatchInlineSnapshot(`
                    [
                      {
                        "id": 1,
                        "x": null,
                      },
                    ]
                  `)
                  throw 'error'
                },
              },
              dataProvider: getDb(),
              migrationsTable,
              endConnection: false,
            }),
        ).rejects.toThrow('error')

        await expect(() =>
          db.execute(`select * from ${tableName}`),
        ).rejects.toThrow()
      },
    )
  })
  it.skipIf(isKnex)('test to db sql', async () => {
    @Entity('myEntity_to_db_sql')
    class myEntity {
      @Fields.string()
      id = ''
      @Fields.integer({
        valueConverter: {
          toDbSql: (x) => `1+${x}`,
          fromDb: (x) => Number(x),
        },
      })
      exp = 0
    }
    const repo = await createEntity(myEntity)
    expect((await repo.insert({ id: '1', exp: 2 })).exp).toBe(3)
    expect(await repo.find({ where: { exp: 2 } })).toMatchInlineSnapshot(`
      [
        myEntity {
          "exp": 3,
          "id": "1",
        },
      ]
    `)
    expect((await repo.update('1', { exp: 4 })).exp).toBe(5)
    expect(await repo.find({ where: { exp: 4 } })).toMatchInlineSnapshot(`
      [
        myEntity {
          "exp": 5,
          "id": "1",
        },
      ]
    `)
  })
  describe.skipIf(isKnex)('test arguments', () => {
    type args = { testNumber: number }
    @Entity('test')
    class test {
      @Fields.integer()
      id = 0
      @Fields.integer<test>({
        sqlExpression: (me, args: args, c) => {
          if (!c || !args) return `(1)`

          return `${me.fields.id.dbName} + ${c.param(args.testNumber)}`
        },
      })
      exp = 0
    }
    it('test argument', async () => {
      const repo = await createEntity(test)
      await repo.insert([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }])
      expect(
        await repo.find({ args: { testNumber: 3 }, orderBy: { exp: 'asc' } }),
      ).toMatchInlineSnapshot(`
        [
          test {
            "exp": 4,
            "id": 1,
          },
          test {
            "exp": 5,
            "id": 2,
          },
          test {
            "exp": 6,
            "id": 3,
          },
          test {
            "exp": 7,
            "id": 4,
          },
        ]
      `)
    })
    it('arguments on rest', async () => {
      const db = new MockRestDataProvider(getRemult())
      await (
        await createEntity(test)
      ).insert([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }])
      expect(
        await new Remult(db)
          .repo(test)
          .find({ args: { testNumber: 3 }, orderBy: { exp: 'asc' } }),
      ).toMatchInlineSnapshot(`
        [
          test {
            "exp": 4,
            "id": 1,
          },
          test {
            "exp": 5,
            "id": 2,
          },
          test {
            "exp": 6,
            "id": 3,
          },
          test {
            "exp": 7,
            "id": 4,
          },
        ]
      `)
    })
  })
}
