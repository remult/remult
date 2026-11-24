import { describe, expect, it, vi } from 'vitest'
import type { TableInfo } from '../core/god.svelte.js'
import { field } from '../query/fixtures.js'
import { orderByFor } from './order.js'
import {
  fieldErrors,
  prefillFrom,
  TableData,
  type LoadRequest,
} from './table-data.svelte.js'

type Verdicts = Record<string, { update: boolean; delete: boolean }>

function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

const tick = () => new Promise((r) => setTimeout(r))

function fakeTable(o: {
  find?: () => Promise<any[]>
  liveQuery?: () => any
  update?: (id: unknown, changes: any) => Promise<any>
  insert?: (values: any) => Promise<any>
  permissions?: Partial<TableInfo['permissions']>
}) {
  const fields = [
    field({ key: 'id', readOnly: true }),
    field({ key: 'name' }),
    field({ key: 'note' }),
    field({
      key: 'company',
      valFieldKey: 'companyId',
      relationToOne: {} as any,
    }),
    field({ key: 'companyId' }),
  ]
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
      update: o.update,
      insert: o.insert,
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
    const find = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
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

  it('a live update counts past the read cache, a plain find does not', async () => {
    let push!: (items: any[]) => void
    const calls: string[] = []
    const freshReads = vi.fn(() => calls.push('fresh'))
    const liveQuery = () => ({
      subscribe: (l: { next: (info: { items: any[] }) => void }) => {
        push = (items) => l.next({ items })
        return () => {}
      },
    })
    const table = fakeTable({ liveQuery, find: async () => [] })
    ;(table.repo as any).count = async () => (calls.push('count'), 1)
    const data = new TableData(table, { freshReads })
    data.load(req())
    await tick()
    expect(freshReads).not.toHaveBeenCalled()
    calls.length = 0
    data.load(req({ live: true }))
    push([{ id: 'a' }])
    await tick()
    expect(calls).toEqual(['fresh', 'count'])
    data.dispose()
  })

  it("keeps 'row' permissions closed until the server answers", async () => {
    const answer =
      deferred<Record<string, { update: boolean; delete: boolean }>>()
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
    answer.resolve({
      a: { update: true, delete: true },
      b: { update: false, delete: false },
    })
    await tick()
    expect(data.can('delete', 'a')).toBe(true)
    expect(data.can('update', 'b')).toBe(false)
    expect(data.can('delete', 'c')).toBe(false)
    expect(data.resolved('c')).toBe(true)
  })

  it('skips the permissions route when no flag is per row', async () => {
    const rowPermissions = vi.fn()
    const data = new TableData(
      fakeTable({
        find: async () => [{ id: 'a' }],
        permissions: { delete: false },
      }),
      { rowPermissions },
    )
    data.load(req())
    await tick()
    expect(rowPermissions).not.toHaveBeenCalled()
    expect(data.can('delete', 'a')).toBe(false)
    expect(data.can('update', 'a')).toBe(true)
  })

  it('keeps row verdicts across a refresh, and drops them when the filter changes', async () => {
    const answers: {
      promise: Promise<Verdicts>
      resolve: (v: Verdicts) => void
    }[] = []
    const rowPermissions = vi.fn(() => {
      answers.push(deferred<Verdicts>())
      return answers.at(-1)!.promise
    })
    const data = new TableData(
      fakeTable({
        find: async () => [{ id: 'a' }],
        permissions: { update: 'row', delete: 'row' },
      }),
      { rowPermissions },
    )
    data.load(req())
    await tick()
    answers[0].resolve({ a: { update: true, delete: true } })
    await tick()
    expect(data.can('update', 'a')).toBe(true)

    data.refresh()
    await tick()
    expect(answers).toHaveLength(2)
    // the second answer is still pending: no flicker to locked
    expect(data.can('update', 'a')).toBe(true)

    data.load(req({ where: { name: 'x' } }))
    expect(data.can('update', 'a')).toBe(false)
  })

  it('ignores an older verdict answer that lands after a newer one', async () => {
    let push!: (items: any[]) => void
    const liveQuery = () => ({
      subscribe: (l: { next: (info: { items: any[] }) => void }) => {
        push = (items) => l.next({ items })
        return () => {}
      },
    })
    const first = deferred<Verdicts>()
    const second = deferred<Verdicts>()
    const rowPermissions = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    const data = new TableData(
      fakeTable({ liveQuery, permissions: { update: 'row', delete: 'row' } }),
      {
        rowPermissions,
      },
    )
    data.load(req({ live: true }))
    push([{ id: 'a' }])
    push([{ id: 'a' }])
    second.resolve({ a: { update: false, delete: false } })
    await tick()
    first.resolve({ a: { update: true, delete: true } })
    await tick()
    expect(data.can('update', 'a')).toBe(false)
    data.dispose()
  })

  it('updates only the changed keys and comes back clean', async () => {
    const update = vi.fn(async (_id: unknown, changes: any) => ({
      id: 'a',
      name: 'b',
      note: 'n',
      ...changes,
    }))
    const data = new TableData(
      fakeTable({
        find: async () => [{ id: 'a', name: 'b', note: 'n' }],
        update,
      }),
    )
    data.load(req())
    await tick()
    const row = data.rows[0]
    row.draft.values.name = 'B'
    row.draft.values.companyId = 'c1'
    expect(data.dirtyRows()).toEqual([row])
    expect(await data.save(row)).toEqual({ ok: true })
    expect(update).toHaveBeenCalledWith('a', { name: 'B', companyId: 'c1' })
    expect(row.draft.dirty).toBe(false)
    expect(row.draft.values.name).toBe('B')
  })

  it('a save while the row is saving reports busy, not success', async () => {
    const pending = deferred<any>()
    const update = vi.fn(() => pending.promise)
    const data = new TableData(
      fakeTable({ find: async () => [{ id: 'a', name: 'b' }], update }),
    )
    data.load(req())
    await tick()
    const row = data.rows[0]
    row.draft.values.name = 'B'
    const first = data.save(row)
    expect(await data.save(row)).toEqual({ ok: false, busy: true })
    pending.resolve({ id: 'a', name: 'B' })
    expect(await first).toEqual({ ok: true })
    expect(update).toHaveBeenCalledOnce()
  })

  it('maps modelState to the edited key, and other errors to a message', async () => {
    const update = vi
      .fn()
      .mockRejectedValueOnce({
        message: 'invalid',
        modelState: { name: 'Should not be empty', company: 'Required' },
      })
      .mockRejectedValueOnce({ message: 'Network down' })
    const data = new TableData(
      fakeTable({ find: async () => [{ id: 'a', name: 'b' }], update }),
    )
    data.load(req())
    await tick()
    const row = data.rows[0]
    row.draft.values.name = ''
    expect(await data.save(row)).toEqual({ ok: false })
    expect(data.errors.a).toEqual({
      name: 'Should not be empty',
      companyId: 'Required',
    })
    expect(row.draft.dirty).toBe(true)

    data.clearError(row, 'name')
    expect(data.errors.a).toEqual({ companyId: 'Required' })

    expect(await data.save(row)).toEqual({ ok: false, message: 'Network down' })
    expect(data.errors.a).toBeUndefined()
  })

  it('inserts a new row with its typed values, without read only fields', async () => {
    const insert = vi.fn(async (v: any) => ({ id: 'n', ...v }))
    const find = vi.fn(async () => [])
    const data = new TableData(fakeTable({ find, insert }))
    data.load(req())
    await tick()
    const row = data.addNew({ companyId: 'c1', id: 'ignored' })
    expect(row.draft.dirty).toBe(false)
    row.draft.values.name = 'fresh'
    expect(data.dirtyRows()).toEqual([row])
    expect(await data.save(row)).toEqual({ ok: true })
    expect(insert).toHaveBeenCalledWith({ companyId: 'c1', name: 'fresh' })
    expect(data.newRows).toEqual([])
    // live off: the page reloads to show the new row
    expect(find).toHaveBeenCalledTimes(2)
  })

  it('inserts a drawer draft without listing it in the table', async () => {
    const insert = vi.fn(async (v: any) => ({ id: 'n', ...v }))
    const data = new TableData(fakeTable({ find: async () => [], insert }))
    data.load(req())
    await tick()
    const row = data.draftNew({ companyId: 'c1' })
    expect(data.newRows).toEqual([])
    expect(data.dirtyRows()).toEqual([])
    row.draft.values.name = 'drawer'
    expect(await data.save(row)).toEqual({ ok: true })
    expect(insert).toHaveBeenCalledWith({ companyId: 'c1', name: 'drawer' })
  })

  it('cancel resets an edit and drops a new row', async () => {
    const data = new TableData(
      fakeTable({ find: async () => [{ id: 'a', name: 'b' }] }),
    )
    data.load(req())
    await tick()
    data.rows[0].draft.values.name = 'x'
    data.cancel(data.rows[0])
    expect(data.rows[0].draft.dirty).toBe(false)
    const row = data.addNew()
    data.cancel(row)
    expect(data.newRows).toEqual([])
  })
})

describe('fieldErrors', () => {
  it('is undefined when no message maps to a field', () => {
    expect(
      fieldErrors({ message: 'x', modelState: { other: 'y' } }, [
        field({ key: 'a' }),
      ]),
    ).toBeUndefined()
    expect(fieldErrors(new Error('x'), [field({ key: 'a' })])).toBeUndefined()
  })
})

describe('prefillFrom', () => {
  it('keeps plain values of the parent filter', () => {
    expect(
      prefillFrom({
        contactId: 'c1',
        n: 2,
        $and: [{ a: 1 }],
        tags: { $in: ['x'] },
      }),
    ).toEqual({ contactId: 'c1', n: 2 })
    expect(prefillFrom(undefined)).toEqual({})
  })
})

describe('orderByFor', () => {
  const fields = [
    field({ key: 'id' }),
    field({ key: 'name' }),
    field({ key: 'calc' }),
  ]
  const base = {
    fields,
    ids: { id: true as const },
    known: new Set(['id', 'name']),
  }

  it('sorts by the URL field, ids breaking ties', () => {
    expect(orderByFor({ field: 'name', dir: 'desc' }, base)).toEqual({
      name: 'desc',
      id: 'asc',
    })
  })

  it('falls back to the default order when the URL field is not sortable', () => {
    const withDefault = {
      ...base,
      defaultOrderBy: { name: 'asc', gone: 'desc' },
    }
    expect(orderByFor({ field: 'calc', dir: 'asc' }, withDefault)).toEqual({
      name: 'asc',
      id: 'asc',
    })
    expect(orderByFor({ field: 'nope', dir: 'asc' }, base)).toEqual({
      id: 'asc',
    })
  })
})
