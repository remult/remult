import { describe, expect, it } from 'vitest'
import { field } from './fixtures.js'
import { parseQuery, serializeQuery } from './url-state.js'

const fields = [
  field({ key: 'name' }),
  field({ key: 'age', type: 'number', inputType: 'number' }),
  field({ key: 'createdAt', type: 'date', inputType: 'datetime-local' }),
  field({ key: 'status', values: [{ id: 'open', caption: 'Open' }] }),
  field({ key: 'note', allowNull: true }),
]

describe('url state', () => {
  it('round trips', () => {
    const s =
      'status.in=["open","done"]&createdAt.gte=2026-11-01&createdAt.lte=2026-11-30&_sort=name&_order=desc&_page=3'
    const q = parseQuery(new URLSearchParams(s), fields)
    expect(serializeQuery(q, fields).toString()).toBe(
      new URLSearchParams(s).toString(),
    )
  })
  it('gte+lte pair is a between chip and back', () => {
    const q = parseQuery(
      new URLSearchParams('createdAt.gte=2026-11-01&createdAt.lte=2026-11-30'),
      fields,
    )
    expect(q.filters).toEqual([
      {
        field: 'createdAt',
        op: 'between',
        value: '2026-11-01',
        value2: '2026-11-30',
      },
    ])
    expect(serializeQuery(q, fields).get('createdAt.lte')).toBe('2026-11-30')
  })
  it('parses eq, numbers, null', () => {
    const q = parseQuery(
      new URLSearchParams('name=bob&age.gt=3&note.null=true'),
      fields,
    )
    expect(q.filters).toEqual([
      { field: 'name', op: 'eq', value: 'bob' },
      { field: 'age', op: 'gt', value: 3 },
      { field: 'note', op: 'empty' },
    ])
    expect(serializeQuery(q, fields).toString()).toBe(
      'name=bob&age.gt=3&note.null=true',
    )
  })
  it('drops bad input without throwing', () => {
    const q = parseQuery(
      new URLSearchParams(
        'nope=1&name.weird=1&status.in=[bad&_page=abc&age.gt=x',
      ),
      fields,
    )
    expect(q).toEqual({ filters: [], page: 1 })
    expect(parseQuery(new URLSearchParams('_page=-1'), fields).page).toBe(1)
    expect(
      parseQuery(new URLSearchParams('_sort=nope'), fields).sort,
    ).toBeUndefined()
  })
  it('omits page 1', () => {
    expect(serializeQuery({ filters: [], page: 1 }, fields).toString()).toBe('')
  })
  it('drops invalid dates and non-finite numbers', () => {
    for (const p of [
      'createdAt.gt=abc',
      'createdAt.gte=2026-13-45',
      'createdAt.gte=2026-02-30',
      'age.gt=Infinity',
    ]) {
      expect(parseQuery(new URLSearchParams(p), fields).filters).toEqual([])
    }
  })
  it('between merge does not depend on URL order', () => {
    const q = parseQuery(
      new URLSearchParams('createdAt.lte=2026-11-30&createdAt.gte=2026-11-01'),
      fields,
    )
    expect(q.filters).toEqual([
      {
        field: 'createdAt',
        op: 'between',
        value: '2026-11-01',
        value2: '2026-11-30',
      },
    ])
  })
})
