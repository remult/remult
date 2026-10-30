import { Hono } from 'hono'
import initSqlJs from 'sql.js'
import { describe, expect, it } from 'vitest'
import { Entity, Fields, Remult, SqlDatabase } from '../../core'
import { remultApi } from '../../core/remult-hono.js'
import { SqlJsDataProvider } from '../../core/remult-sql-js.js'
import { RemultAsyncLocalStorage } from '../../core/src/context.js'
import { initAsyncHooks } from '../../core/server/initAsyncHooks.js'
import { dbNamesOf } from '../../core/src/filter/filter-consumer-bridge-to-sql-request'

initAsyncHooks()

const tick = () => new Promise((res) => setTimeout(res, 5))
const newDb = () =>
  new SqlDatabase(
    new SqlJsDataProvider(initSqlJs().then((x) => new x.Database())),
  )
const placeholder = (key: string) =>
  `recursive sqlExpression call for entity '${key}'. `

const thingTable = `(select 1 as id, 'a' as name) as t`
@Entity('things', {
  allowApiCrud: true,
  sqlExpression: async () => {
    await tick()
    return thingTable
  },
})
class Thing {
  @Fields.number()
  id = 0
  @Fields.string()
  name = ''
}

@Entity<Recursive>('recursive', {
  sqlExpression: async (meta) => {
    // past this await nothing synchronous can identify the caller
    await tick()
    const names = await dbNamesOf(meta)
    return `(${names.$entityName}${names.id})`
  },
})
class Recursive {
  @Fields.number()
  id = 0
}

@Entity('mutual-a', {
  sqlExpression: async () => {
    await tick()
    return `a(${(await dbNamesOf(MutualB)).$entityName})`
  },
})
class MutualA {
  @Fields.number()
  id = 0
}
@Entity('mutual-b', {
  sqlExpression: async () => {
    await tick()
    return `b(${(await dbNamesOf(MutualA)).$entityName})`
  },
})
class MutualB {
  @Fields.number()
  id = 0
}

describe('recursive sqlExpression', () => {
  it('stops at the entity', async () => {
    const names = await dbNamesOf(new Remult(newDb()).repo(Recursive))
    expect(names.$entityName).toBe(`(${placeholder('recursive')}id)`)
  })

  it('stops through another entity', async () => {
    const [a, b] = await Promise.all([dbNamesOf(MutualA), dbNamesOf(MutualB)])
    expect(a.$entityName).toBe(`a(b(${placeholder('mutual-a')}))`)
    expect(b.$entityName).toBe(`b(a(${placeholder('mutual-b')}))`)
  })
})

describe('concurrent sqlExpression', () => {
  it('resolves both queries of one query request', async () => {
    const app = new Hono()
    app.route(
      '',
      remultApi({
        entities: [Thing],
        dataProvider: newDb(),
        ensureSchema: false,
      }),
    )
    try {
      const res = await app.request('/api/things?__action=query', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ aggregate: {} }),
      })
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({
        items: [{ id: 1, name: 'a' }],
        aggregates: { $count: 1 },
      })
    } finally {
      RemultAsyncLocalStorage.disable()
    }
  })

  it('resolves find and count on one remult', async () => {
    const repo = new Remult(newDb()).repo(Thing)
    const [items, count] = await Promise.all([repo.find(), repo.count()])
    expect(items).toEqual([{ id: 1, name: 'a' }])
    expect(count).toBe(1)
  })

  it('keeps recursion detection per caller', async () => {
    const repo = new Remult(newDb()).repo(Recursive)
    const names = await Promise.all([dbNamesOf(repo), dbNamesOf(repo)])
    expect(names.map((x) => x.$entityName)).toEqual([
      `(${placeholder('recursive')}id)`,
      `(${placeholder('recursive')}id)`,
    ])
  })

  it('gives every caller the field expression', async () => {
    @Entity('async-field')
    class AsyncField {
      @Fields.string({
        sqlExpression: async () => {
          await tick()
          return `'x'`
        },
      })
      s = ''
    }
    const repo = new Remult(newDb()).repo(AsyncField)
    const names = await Promise.all([dbNamesOf(repo), dbNamesOf(repo)])
    expect(names.map((x) => x.s)).toEqual([`'x'`, `'x'`])
  })

  it('re-evaluates the entity expression on every call', async () => {
    let calls = 0
    @Entity('uncached', {
      sqlExpression: async () => {
        calls++
        return 'uncached'
      },
    })
    class Uncached {
      @Fields.number()
      id = 0
    }
    const repo = new Remult(newDb()).repo(Uncached)
    await dbNamesOf(repo)
    await dbNamesOf(repo)
    expect(calls).toBe(2)
  })
})
