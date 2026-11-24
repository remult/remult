import { describe, expect, it, vi } from 'vitest'
import type { TableInfo } from '../core/god.svelte.js'
import { field } from '../query/fixtures.js'
import { TableData, type LoadRequest } from './table-data.svelte.js'

function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

const tick = () => new Promise((r) => setTimeout(r))

function fakeTable(o: {
  find?: () => Promise<any[]>
  liveQuery?: () => any
  permissions?: Partial<TableInfo['permissions']>
}) {
  const fields = [field({ key: 'id' }), field({ key: 'name' })]
  return {
    superKey: 'things',
    key: 'things',
    caption: 'Things',
    fields,
    ids: { id: true },
    relations: [],
    hidden: false,
    editMode: 'inline',
    editModeLocked: false,
    permissions: { insert: true, update: true, delete: true, ...o.permissions },
    repo: {
      metadata: {
        fields: { toArray: () => fields },
        idMetadata: { getId: (r: any) => r.id },
      },
      find: o.find ?? (async () => []),
      liveQuery: o.liveQuery,
      count: async () => 42,
    },
  } as unknown as TableInfo
}

const req = (p: Partial<LoadRequest> = {}): LoadRequest => ({
  where: {},
  page: 1,
  limit: 25,
  live: false,
  ...p,
})

describe('TableData', () => {
  it('drops a find that resolves after a newer load', async () => {
    const first = deferred<any[]>()
    const second = deferred<any[]>()
    const find = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const data = new TableData(fakeTable({ find }))
    data.load(req({ page: 1 }))
    data.load(req({ page: 2 }))
    second.resolve([{ id: 'b', name: 'new' }])
    await tick()
    first.resolve([{ id: 'a', name: 'stale' }])
    await tick()
    expect(data.rows.map((r) => r.id)).toEqual(['b'])
    expect(data.total).toBe(42)
  })

  it('ignores results once disposed', async () => {
    const pending = deferred<any[]>()
    const data = new TableData(fakeTable({ find: () => pending.promise }))
    data.load(req())
    data.dispose()
    pending.resolve([{ id: 'a', name: 'late' }])
    await tick()
    expect(data.rows).toEqual([])
    expect(data.loaded).toBe(false)
  })

  it('rebases the existing draft on a live update, keeping it clean', async () => {
    let push!: (items: any[]) => void
    const unsubscribe = vi.fn()
    const liveQuery = () => ({
      subscribe: (l: { next: (info: { items: any[] }) => void }) => {
        push = (items) => l.next({ items })
        return unsubscribe
      },
    })
    const data = new TableData(fakeTable({ liveQuery }))
    data.load(req({ live: true }))
    push([{ id: 'a', name: 'one' }])
    const draft = data.rows[0].draft
    push([{ id: 'a', name: 'two' }])
    expect(data.rows[0].draft).toBe(draft)
    expect(draft.values.name).toBe('two')
    expect(draft.dirty).toBe(false)
    data.dispose()
    expect(unsubscribe).toHaveBeenCalled()
  })

  it("keeps 'row' permissions closed until the server answers", async () => {
    const answer = deferred<Record<string, { update: boolean; delete: boolean }>>()
    const rowPermissions = vi.fn(() => answer.promise)
    const data = new TableData(
      fakeTable({
        find: async () => [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        permissions: { update: 'row', delete: 'row' },
      }),
      { rowPermissions },
    )
    data.load(req())
    await tick()
    expect(rowPermissions).toHaveBeenCalledWith('things', ['a', 'b', 'c'])
    expect(data.can('delete', 'a')).toBe(false)
    expect(data.resolved('a')).toBe(false)
    answer.resolve({ a: { update: true, delete: true }, b: { update: false, delete: false } })
    await tick()
    expect(data.can('delete', 'a')).toBe(true)
    expect(data.can('update', 'b')).toBe(false)
    expect(data.can('delete', 'c')).toBe(false)
    expect(data.resolved('c')).toBe(true)
  })

  it('skips the permissions route when no flag is per row', async () => {
    const rowPermissions = vi.fn()
    const data = new TableData(
      fakeTable({ find: async () => [{ id: 'a' }], permissions: { delete: false } }),
      { rowPermissions },
    )
    data.load(req())
    await tick()
    expect(rowPermissions).not.toHaveBeenCalled()
    expect(data.can('delete', 'a')).toBe(false)
    expect(data.can('update', 'a')).toBe(true)
  })
})
