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
        sqlExpression: myEntity.args.sqlExpression((_, args, c) => {
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
  it('test group by ignores orderBy of a field that is not grouped', async () => {
    await repo.groupBy({
      group: ['title'],
      orderBy: { id: 'asc', $count: 'desc' } as any,
    })
    expect(commands).toMatchInlineSnapshot(`
      [
        "select count(*) as [count], [title] as [title]
       from [tasks] group by [title] order by count(*) desc",
      ]
    `)
  })
  it('groupByToRaw builds the group by select and maps a row by alias', async () => {
    const { sql, toResult } = await SqlDatabase.groupByToRaw(repo, {
      group: ['title'],
      sum: ['id'],
      max: ['completed'],
      where: { completed: true },
    })
    expect(sql).toMatchInlineSnapshot(`
      "select count(*) as [count], [title] as [title], sum( [id] ) as [id_sum], max( [completed] ) as [completed_max]
       from [tasks] where [completed] = true group by [title]"
    `)
    expect(
      toResult({ count: '2', title: 'a', id_sum: '7', completed_max: true }),
    ).toEqual({
      $count: 2,
      title: 'a',
      id: { sum: 7 },
      completed: { max: true },
    })
    expect(commands).toEqual([])
  })
  it('groupByToRaw addresses the table the caller names', async () => {
    const names = await dbNamesOf(repo, db.wrapIdentifier)
    const { sql } = await SqlDatabase.groupByToRaw(
      repo,
      { group: ['title'] },
      { dbNames: { ...names, $entityName: '[other].dbo.[tasks]' } },
    )
    expect(sql).toMatchInlineSnapshot(`
      "select count(*) as [count], [title] as [title]
       from [other].dbo.[tasks] group by [title]"
    `)
  })
  it('groupByToRaw binds parameters through the given command', async () => {
    const params: any[] = []
    const { sql } = await SqlDatabase.groupByToRaw(
      repo,
      { where: { title: 'x' } },
      {
        sqlCommand: {
          param: (v) => `@p${params.push(v)}`,
          addParameterAndReturnSqlToken: (v) => `@p${params.push(v)}`,
        },
      },
    )
    expect(sql).toMatchInlineSnapshot(`
      "select count(*) as [count]
       from [tasks] where [title] = @p1"
    `)
    expect(params).toEqual(['x'])
  })
  it('groupByToRaw refuses a limit without a limit syntax', async () => {
    await expect(
      SqlDatabase.groupByToRaw(repo, { group: ['title'], limit: 5 }),
    ).rejects.toThrow(/limitSyntax/)
  })
  it('selectToRaw aliases every column and adds no order of its own', async () => {
    const { sql, toResult } = await SqlDatabase.selectToRaw(repo, {
      where: { completed: true },
      select: { id: true, exp: true },
    })
    expect(sql).toMatchInlineSnapshot(`
      "select [id] as [id], a+b as [exp]
       from [tasks] where [completed] = true"
    `)
    expect(toResult({ id: 3, exp: 'ab' })).toEqual({ id: 3, exp: 'ab' })
    expect(commands).toEqual([])
  })
  it('selectToRaw keeps an order that was asked for', async () => {
    const { sql } = await SqlDatabase.selectToRaw(repo, {
      orderBy: { title: 'desc' },
      select: { id: true },
    })
    expect(sql).toMatchInlineSnapshot(`
      "select [id] as [id]
       from [tasks] Order By [title] desc"
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
    ) =>
      exp as (
        entityMetadata: EntityMetadata<entityType>,
        args: any,
        c?: SqlCommandWithParameters,
      ) => string | Promise<string>,
  })
}
