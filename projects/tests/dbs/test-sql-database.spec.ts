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
import { KnexDataProvider } from '../../core/remult-knex'

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
  it('find applies defaultOrderBy, selectToRaw does not', async () => {
    @Entity('tasks', { defaultOrderBy: { title: 'asc' } })
    class ordered {
      @Fields.integer()
      id = 0
      @Fields.string()
      title = ''
    }
    const orderedRepo = new Remult(db).repo(ordered)
    await orderedRepo.find()
    const { sql } = await SqlDatabase.selectToRaw(orderedRepo, {
      select: { id: true },
    })
    expect(commands).toMatchInlineSnapshot(`
      [
        "select [id], [title]
       from [tasks] Order By [title]",
      ]
    `)
    expect(sql).toMatchInlineSnapshot(`
      "select [id] as [id]
       from [tasks]"
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

describe('json columns stored as text', () => {
  function dbReturning(parts: any, supportsJsonColumnType?: boolean) {
    return new SqlDatabase({
      wrapIdentifier: (name: string) => '[' + name + ']',
      createCommand: () =>
        ({
          addParameterAndReturnSqlToken: (val: any) => String(val),
          param: (val: any) => String(val),
          execute: async () => ({
            rows: [{ id: 1, parts }],
            getColumnKeyInResultForIndexInSelect: (i: number) =>
              (['id', 'parts'] as const)[i],
          }),
        }) satisfies SqlCommand,
      entityIsUsedForTheFirstTime: async () => {},
      getLimitSqlSyntax: () => '',
      transaction: undefined!,
      end: async () => {},
      supportsJsonColumnType,
    } satisfies SqlImplementation)
  }

  function capturingCommand() {
    const params: any[] = []
    return {
      params,
      command: {
        param: (v: any) => {
          params.push(v)
          return '@p' + params.length
        },
        addParameterAndReturnSqlToken: (v: any) => {
          params.push(v)
          return '@p' + params.length
        },
      } satisfies SqlCommandWithParameters,
    }
  }

  it('selectToRaw and groupByToRaw parse json text before any find', async () => {
    @Entity('jsonChats')
    class chat {
      @Fields.integer()
      id = 0
      @Fields.json()
      parts: { name: string } | null = null
    }
    const repo = new Remult(dbReturning('["a","b"]')).repo(chat)
    const selected = await SqlDatabase.selectToRaw(repo, {
      select: { parts: true },
    })
    expect(selected.toResult({ parts: '["a","b"]' })).toEqual({
      parts: ['a', 'b'],
    })

    const grouped = await SqlDatabase.groupByToRaw(repo, { group: ['parts'] })
    expect(grouped.toResult({ count: '1', parts: '["a","b"]' })).toEqual({
      $count: 1,
      parts: ['a', 'b'],
    })
    const maxed = await SqlDatabase.groupByToRaw(repo, { max: ['parts'] })
    expect(maxed.toResult({ count: '1', parts_max: '["c"]' })).toEqual({
      $count: 1,
      parts: { max: ['c'] },
    })

    const where = capturingCommand()
    await SqlDatabase.selectToRaw(
      repo,
      { where: { parts: { name: 'a' } }, select: { id: true } },
      { sqlCommand: where.command },
    )
    expect(where.params).toEqual(['{"name":"a"}'])

    expect((await repo.find())[0].parts).toEqual(['a', 'b'])
    expect(
      repo.metadata.fields.parts.valueConverter.toDb({ name: 'a' }),
    ).toEqual({ name: 'a' })
  })

  it('jsonAsString overrides the repository provider', async () => {
    @Entity('jsonChatsOverride')
    class chat {
      @Fields.integer()
      id = 0
      @Fields.json()
      parts: string[] = []
    }
    const text = new Remult(dbReturning('["a","b"]')).repo(chat)
    const asString = await SqlDatabase.selectToRaw(
      text,
      { select: { parts: true } },
      { jsonAsString: false },
    )
    expect(asString.toResult({ parts: '["a","b"]' })).toEqual({
      parts: '["a","b"]',
    })

    const native = new Remult(dbReturning(['a', 'b'], true)).repo(chat)
    const forced = await SqlDatabase.selectToRaw(
      native,
      { select: { parts: true } },
      { jsonAsString: true },
    )
    expect(forced.toResult({ parts: '["a","b"]' })).toEqual({
      parts: ['a', 'b'],
    })
  })

  it('a text provider and a json provider do not change each other', async () => {
    @Entity('jsonChatsTwoProviders')
    class chat {
      @Fields.integer()
      id = 0
      @Fields.json()
      parts: { name: string } | null = null
    }
    const text = new Remult(dbReturning('["a","b"]', false)).repo(chat)
    const native = new Remult(dbReturning(['a', 'b'], true)).repo(chat)

    expect((await text.find())[0].parts).toEqual(['a', 'b'])
    expect((await native.find())[0].parts).toEqual(['a', 'b'])
    expect(
      text.metadata.fields.parts.valueConverter.toDb({ name: 'a' }),
    ).toEqual({ name: 'a' })

    const nativeWhere = capturingCommand()
    await SqlDatabase.selectToRaw(
      native,
      { where: { parts: { name: 'a' } }, select: { id: true } },
      { sqlCommand: nativeWhere.command },
    )
    expect(nativeWhere.params).toEqual([{ name: 'a' }])
  })

  it('opening the json provider first still parses text on the other', async () => {
    @Entity('jsonChatsNativeFirst')
    class chat {
      @Fields.integer()
      id = 0
      @Fields.json()
      parts: string[] = []
    }
    const native = new Remult(dbReturning(['a', 'b'], true)).repo(chat)
    const text = new Remult(dbReturning('["a","b"]')).repo(chat)
    expect((await native.find())[0].parts).toEqual(['a', 'b'])
    const selected = await SqlDatabase.selectToRaw(text, {
      select: { parts: true },
    })
    expect(selected.toResult({ parts: '["a","b"]' })).toEqual({
      parts: ['a', 'b'],
    })
    expect((await text.find())[0].parts).toEqual(['a', 'b'])
    expect((await native.find())[0].parts).toEqual(['a', 'b'])
  })

  it('knex mssql parses json text and mysql2 only stringifies on write', async () => {
    @Entity('jsonChatsKnex')
    class chat {
      @Fields.integer()
      id = 0
      @Fields.json()
      parts: { name: string } | null = null
    }
    function knexRepo(client: string) {
      return new Remult(
        new KnexDataProvider({
          client: { config: { client } },
          ref: (name: string) => '[' + name + ']',
        } as any),
      ).repo(chat)
    }
    const mssql = knexRepo('mssql')
    const selected = await SqlDatabase.selectToRaw(mssql, {
      select: { parts: true },
    })
    expect(selected.toResult({ parts: '["a","b"]' })).toEqual({
      parts: ['a', 'b'],
    })
    const mssqlWhere = capturingCommand()
    await SqlDatabase.selectToRaw(
      mssql,
      { where: { parts: { name: 'a' } }, select: { id: true } },
      { sqlCommand: mssqlWhere.command },
    )
    expect(mssqlWhere.params).toEqual(['{"name":"a"}'])

    const mysql2 = knexRepo('mysql2')
    const raw = await SqlDatabase.selectToRaw(mysql2, {
      select: { parts: true },
    })
    expect(raw.toResult({ parts: '["a","b"]' })).toEqual({
      parts: '["a","b"]',
    })
    const mysql2Where = capturingCommand()
    await SqlDatabase.selectToRaw(
      mysql2,
      { where: { parts: { name: 'a' } }, select: { id: true } },
      { sqlCommand: mysql2Where.command },
    )
    expect(mysql2Where.params).toEqual(['{"name":"a"}'])
    expect(
      mysql2.metadata.fields.parts.valueConverter.toDb({ name: 'a' }),
    ).toEqual({
      name: 'a',
    })
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
