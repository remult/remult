import { describe, expect, it, vi } from 'vitest'
import { field } from '../query/fixtures.js'
import { CaptionCache } from './caption-cache.svelte.js'

const am = field({
  key: 'accountManager',
  relationToOne: { entityKey: 'accountManagers', fields: { id: 'accountManager' }, captionField: 'firstName' } as any,
})
const am2 = field({
  key: 'owner',
  valFieldKey: 'ownerId',
  relationToOne: { entityKey: 'accountManagers', fields: { id: 'ownerId' }, captionField: 'firstName' } as any,
})

describe('CaptionCache', () => {
  it('batches requests per relation and asks once', async () => {
    const load = vi.fn(async (_f, ids: unknown[]) => new Map(ids.map((id) => [id, `name ${id}`])))
    const cache = new CaptionCache(load)
    cache.request(am, 'a')
    cache.request(am, 'b')
    cache.request(am2, 'c')
    cache.request(am, 'a')
    await vi.waitFor(() => expect(cache.get(am, 'b')).toBe('name b'))
    expect(load).toHaveBeenCalledTimes(1)
    expect(load.mock.calls[0][1]).toEqual(['a', 'b', 'c'])
    // same target key: shared
    expect(cache.get(am2, 'a')).toBe('name a')
    cache.request(am, 'a')
    await new Promise((r) => setTimeout(r, 5))
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('a known caption needs no lookup; 1 and "1" stay apart', async () => {
    const load = vi.fn(async () => new Map())
    const cache = new CaptionCache(load)
    cache.set(am, 1, 'One')
    cache.request(am, 1)
    await new Promise((r) => setTimeout(r, 5))
    expect(load).not.toHaveBeenCalled()
    expect(cache.get(am, '1')).toBeUndefined()
  })
})
