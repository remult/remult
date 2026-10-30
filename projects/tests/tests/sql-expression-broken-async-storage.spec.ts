import { describe, expect, it, vi } from 'vitest'
import { Entity, Fields } from '../../core'
import { initAsyncHooks } from '../../core/server/initAsyncHooks.js'
import { dbNamesOf } from '../../core/src/filter/filter-consumer-bridge-to-sql-request'
import { remultStatic } from '../../core/src/remult-static.js'

// Exists but loses the store after the first await, like in a WebContainer
vi.mock('async_hooks', () => ({
  AsyncLocalStorage: class {
    store: unknown
    run(store: unknown, callback: () => unknown) {
      this.store = store
      try {
        return callback()
      } finally {
        this.store = undefined
      }
    }
    getStore() {
      return this.store
    }
  },
}))

const tick = () => new Promise((res) => setTimeout(res, 5))
const placeholder = (key: string) =>
  `recursive sqlExpression call for entity '${key}'. `

@Entity<Recursive>('recursive', {
  sqlExpression: async (meta) => {
    await tick()
    const names = await dbNamesOf(meta)
    return `(${names.$entityName}${names.id})`
  },
})
class Recursive {
  @Fields.number()
  id = 0
}

@Entity('customers')
class Customer {
  @Fields.number()
  id = 0
  @Fields.string({
    sqlExpression: async () => {
      const names = await dbNamesOf(Customer)
      return `(select ${names.id})`
    },
  })
  city = ''
}

describe('sqlExpression recursion with a broken AsyncLocalStorage', () => {
  it('does not use the chain', async () => {
    initAsyncHooks()
    expect(remultStatic.sqlExpressionChain).toBeDefined()
    await Promise.resolve()
    expect(remultStatic.sqlExpressionChain).toBeUndefined()
  })

  it('stops at the entity', async () => {
    const names = await dbNamesOf(Recursive)
    expect(names.$entityName).toBe(`(${placeholder('recursive')}id)`)
  })

  it('stops at a field reading its own entity', async () => {
    const names = await dbNamesOf(Customer)
    expect(names.city).toBe('(select id)')
  })
})
