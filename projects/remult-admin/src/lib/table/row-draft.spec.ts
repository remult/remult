import { describe, expect, it } from 'vitest'
import { field } from '../query/fixtures.js'
import { RowDraft } from './row-draft.svelte.js'

const fields = [
  field({ key: 'name' }),
  field({
    key: 'status',
    values: [{ id: 'open', caption: 'Open' }],
    allowNull: true,
  }),
  field({ key: 'done', type: 'boolean', allowNull: true }),
  field({ key: 'meta', type: 'json' }),
  field({ key: 'owner', valFieldKey: 'ownerId', relationToOne: {} as any }),
]
const server = () => ({
  id: 1,
  name: 'a',
  status: 'open',
  done: false,
  meta: { b: 1, a: 2 },
  ownerId: 'o1',
})

describe('RowDraft', () => {
  it('fresh draft is not dirty', () => {
    const d = new RowDraft(server(), fields)
    expect(d.dirty).toBe(false)
  })

  it('rebase on an untouched field updates the value, not dirty', () => {
    const d = new RowDraft(server(), fields)
    d.rebase({ ...server(), name: 'b' })
    expect(d.values.name).toBe('b')
    expect(d.dirty).toBe(false)
  })

  it('rebase keeps edited fields and re-baselines the rest', () => {
    const d = new RowDraft(server(), fields)
    d.values.name = 'mine'
    d.rebase({ ...server(), status: 'done' })
    expect(d.values.name).toBe('mine')
    expect(d.dirty).toBe(true)
    expect(d.values.status).toBe('done')
    expect(d.isDirty('status')).toBe(false)
    expect(d.isDirty('name')).toBe(true)
  })

  it('missing field is not dirty, editor writing undefined does not dirty', () => {
    const { status: _s, ...rest } = server()
    const d = new RowDraft(rest as any, fields)
    expect(d.dirty).toBe(false)
    d.values.status = undefined
    d.values.status = null
    expect(d.dirty).toBe(false)
  })

  it('json with same content in a new object is not dirty', () => {
    const d = new RowDraft(server(), fields)
    d.values.meta = { a: 2, b: 1 }
    expect(d.dirty).toBe(false)
    d.values.meta = { a: 3, b: 1 }
    expect(d.isDirty('meta')).toBe(true)
  })

  it('editing a relation valFieldKey marks the row dirty', () => {
    const d = new RowDraft(server(), fields)
    d.values.ownerId = 'o2'
    expect(d.dirty).toBe(true)
    expect(d.isDirty('owner')).toBe(true)
    expect(d.isDirty('ownerId')).toBe(true)
    expect(d.changes()).toEqual({ ownerId: 'o2' })
  })

  it('a row whose value-list/boolean field is undefined or null, or whose row object is replaced by a server refresh, renders with no pending change', () => {
    const { status: _s, done: _d, ...rest } = server()
    const d = new RowDraft(rest as any, fields)
    // editors initialize empty fields
    d.values.status = null
    d.values.done = undefined
    expect(d.dirty).toBe(false)
    // live-query refresh, or entity switch reusing the component with a colliding id
    d.rebase({ ...server(), id: 1, name: 'other', status: 'open', done: true })
    expect(d.dirty).toBe(false)
    expect(d.values.status).toBe('open')
    expect(d.values.done).toBe(true)
  })

  it('changes() returns only edited keys; reset() reverts', () => {
    const d = new RowDraft(server(), fields)
    d.values.name = 'x'
    expect(d.changes()).toEqual({ name: 'x' })
    d.reset()
    expect(d.dirty).toBe(false)
    expect(d.values.name).toBe('a')
  })
  it('a dirty field cleared to undefined is emitted as null', () => {
    const d = new RowDraft(server(), fields)
    d.values.name = undefined as any
    expect(d.changes()).toEqual({ name: null })
  })
})
