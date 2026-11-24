import { describe, expect, it, vi } from 'vitest'
import { field } from '../query/fixtures.js'
import { RelationSearch } from './relation-search.svelte.js'

const company = field({
  key: 'company',
  relationToOne: { entityKey: 'companies', fields: { id: 'company' }, captionField: 'name' } as any,
})

describe('RelationSearch', () => {
  it('debounces typing and keeps only the latest answer', async () => {
    vi.useFakeTimers()
    try {
      const resolvers: ((v: any) => void)[] = []
      const load = vi.fn(() => new Promise<any>((r) => resolvers.push(r)))
      const s = new RelationSearch(company, load)
      s.search('a')
      s.search('ac')
      await vi.advanceTimersByTimeAsync(200)
      expect(load).toHaveBeenCalledTimes(1)
      expect(load).toHaveBeenLastCalledWith(company, 'ac')
      s.search('acm')
      await vi.advanceTimersByTimeAsync(200)
      // the older answer arrives last: dropped
      resolvers[1]({ items: [{ id: 'c2', caption: 'Acme' }], $count: 1 })
      resolvers[0]({ items: [{ id: 'c1', caption: 'Ac' }], $count: 9 })
      await vi.advanceTimersByTimeAsync(0)
      expect(s.items).toEqual([{ id: 'c2', caption: 'Acme' }])
      expect(s.count).toBe(1)
      expect(s.loading).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('an empty query loads right away', async () => {
    const load = vi.fn(async () => ({ items: [], $count: 0 }))
    const s = new RelationSearch(company, load)
    s.search('  ')
    await vi.waitFor(() => expect(load).toHaveBeenCalledWith(company, undefined))
  })
})
