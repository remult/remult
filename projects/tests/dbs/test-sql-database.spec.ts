import { expect, it, describe, beforeEach } from 'vitest'
import {
  Entity,
  type EntityMetadata,
  Fields,
  Remult,
  type SqlCommand,
  type SqlCommandWithParameters,
  SqlDatabase,
  type SqlImplementation,
  dbNamesOf,
} from '../../core'

describe('test sql implementation', () => {
  @Entity('tasks')
  class task {
    @Fields.integer()
    id = 0
    @Fields.string()
    title = ''
    @Fields.boolean()
    completed = false
    @Fields.string({ sqlExpression: () => 'a+b' })
    exp = ''
  }
  let commands: string[] = []
  const db = new SqlDatabase({
    wrapIdentifier: (name) => '[' + name + ']',
    createCommand: () =>
      ({
        addParameterAndReturnSqlToken(val: any) {
          if (typeof val === 'string')
            return "'" + val.replace(/'/g, "''") + "'"
          return val
        },
        param(val: any) {
          if (typeof val === 'string')
            return "'" + val.replace(/'/g, "''") + "'"
          return val
        },

        execute: async (sql) => {
          commands.push(sql)
          return { getColumnKeyInResultForIndexInSelect: undefined!, rows: [] }
        },
      }) satisfies SqlCommand,
    async entityIsUsedForTheFirstTime(entity) {},
    getLimitSqlSyntax: () => '',
    transaction: undefined!,
    end: async () => {},
  } satisfies SqlImplementation)
  const repo = new Remult(db).repo(task)
  beforeEach(() => (commands = []))
  it('test basic select', async () => {
    await repo.find({ where: { completed: true } })
    expect(commands).toMatchInlineSnapshot(`
      [
        "select [id], [title], [completed], a+b as exp
       from [tasks] where [completed] = true Order By [id]",
      ]
    `)
  })

  it('test basic select with select', async () => {
    await repo.find({
      where: { completed: true },
      select: { id: true, title: true },
    })
    expect(commands).toMatchInlineSnapshot(`
      [
        "select [id], [title]
       from [tasks] where [completed] = true Order By [id]",
      ]
    `)
  })
  it('test that to raw filter respects wrapping', async () => {
    expect(
      await SqlDatabase.filterToRaw(
        repo,
        { completed: true },
        undefined,
        await dbNamesOf(repo, db.wrapIdentifier),
      ),
    ).toMatchInlineSnapshot('"[completed] = true"')
  })
  it('test that to raw filter respects wrapping', async () => {
    expect(
      await SqlDatabase.filterToRaw(
        repo,
        { completed: true },
        undefined,
        new Proxy(await dbNamesOf(repo, db.wrapIdentifier), {
          get(target: any, p, receiver) {
            return (col: string) => 'alias.' + target[p](col)
          },
        }),
      ),
    ).toMatchInlineSnapshot('"alias.[completed] = true"')
  })
  it('test argument', async () => {
    type args = { testNumber: number }
    @Entity('myEntity')
    class myEntity {
      static args = prepareArg<myEntity, args>()
      @Fields.string()
      id = ''
      @Fields.integer({
        sqlExpression: myEntity.args.sqlExpression((col, args, c) => {
          if (!c || !args) return `111`
          return `3 + ${c.param(args.testNumber)}`
        }),
      })
      exp = 0
    }
    const repo = new Remult(db).repo(myEntity)
    await repo.find({
      args: myEntity.args({ testNumber: 5 }),
      orderBy: { exp: 'asc' },
    })
    expect(commands).toMatchInlineSnapshot(`
      [
        "select [id], (3 + 5) as exp
       from [myEntity] Order By exp",
      ]
    `)
  })
  it('test to db sql', async () => {
    @Entity('myEntity')
    class myEntity {
      @Fields.string()
      id = ''
      @Fields.integer({
        valueConverter: {
          toDbSql: (x) => `1+${x}`,
        },
      })
      exp = 0
    }
    const repo = new Remult(db).repo(myEntity)
    await repo.find({ where: { exp: 2 } })
    expect(commands).toMatchInlineSnapshot(`
      [
        "select [id], [exp]
       from [myEntity] where [exp] = 1+2 Order By [id]",
      ]
    `)
  })
})

function prepareArg<entityType, argsType>() {
  const result = (arg: argsType) => arg
  return Object.assign(result, {
    sqlExpression: (
      exp: (
        entityMetadata: EntityMetadata<entityType>,
        args: argsType,
        c: SqlCommandWithParameters,
      ) => string | Promise<string>,
    ) => exp,
  })
}
