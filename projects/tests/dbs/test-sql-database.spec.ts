import { expect, it, describe } from 'vitest'
import {
  Entity,
  Fields,
  Remult,
  type SqlCommand,
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
    wrapName: (name) => '[' + name + ']',
    createCommand: () =>
      ({
        addParameterAndReturnSqlToken(val: any) {
          if (typeof val === 'string')
            return "'" + val.replace(/'/g, "''") + "'"
          return val
        },
        execute: async (sql) => {
          commands.push(sql)
          return {
            getColumnKeyInResultForIndexInSelect: undefined,
            rows: [],
          }
        },
      }) satisfies SqlCommand,
    async entityIsUsedForTheFirstTime(entity) {},
    getLimitSqlSyntax: () => '',
    transaction: undefined,
  } satisfies SqlImplementation)
  const repo = new Remult(db).repo(task)
  it('test basic select', async () => {
    await repo.find({
      where: {
        completed: true,
      },
    })
    expect(commands).toMatchInlineSnapshot(`
      [
        "select [id], [title], [completed], a+b
       from [tasks] where [completed] = true Order By [id]",
      ]
    `)
  })
  it('test that to raw filter respects wrapping', async () => {
    expect(
      await SqlDatabase.filterToRaw(
        repo,
        {
          completed: true,
        },
        undefined,
        await dbNamesOf(repo, db.wrapName),
      ),
    ).toMatchInlineSnapshot('"[completed] = true"')
  })
  it('test that to raw filter respects wrapping', async () => {
    expect(
      await SqlDatabase.filterToRaw(
        repo,
        {
          completed: true,
        },
        undefined,
        new Proxy(await dbNamesOf(repo, db.wrapName), {
          get(target, p, receiver) {
            return (col) => 'alias.' + target[p](col)
          },
        }),
      ),
    ).toMatchInlineSnapshot('"alias.[completed] = true"')
  })
})
