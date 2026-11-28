import { describe, expect, it } from 'vitest'
import {
  choiceOf,
  isComplete,
  opChoices,
  upsertChip,
  valueText,
} from './filter-labels.js'
import { field } from './fixtures.js'

const name = field({ key: 'name' })
const amount = field({ key: 'amount', type: 'number' })
const created = field({
  key: 'createdAt',
  type: 'date',
  inputType: 'datetime-local',
})
const done = field({ key: 'done', type: 'boolean', allowNull: true })
const stage = field({
  key: 'stage',
  values: [
    { id: 'won', caption: 'Won' },
    { id: 'lost', caption: 'Lost' },
  ],
})
const owner = field({
  key: 'owner',
  valFieldKey: 'ownerId',
  relationToOne: {} as any,
})

describe('opChoices', () => {
  it('dates read as before / after', () => {
    expect(opChoices(created).map((c) => c.label)).toEqual([
      'is',
      'after',
      'on or after',
      'before',
      'on or before',
      'between',
    ])
  })
  it('boolean splits eq into is true / is false', () => {
    expect(opChoices(done).map((c) => c.label)).toEqual([
      'is true',
      'is false',
      'is empty',
      'is not empty',
    ])
    expect(choiceOf(done, { op: 'eq', value: false })?.label).toBe('is false')
  })
  it('numbers use symbols', () => {
    expect(opChoices(amount).map((c) => c.label)).toContain('>=')
  })
})

describe('valueText', () => {
  it('enum shows captions', () => {
    expect(
      valueText(stage, { field: 'stage', op: 'in', value: ['won', 'lost'] }),
    ).toBe('Won, Lost')
  })
  it('relation shows captions from the lookup, raw id when unknown', () => {
    const captions = new Map([['a1', 'Acme']])
    expect(
      valueText(
        owner,
        { field: 'owner', op: 'in', value: ['a1', 'zz'] },
        (id) => captions.get(id as string),
      ),
    ).toBe('Acme, zz')
  })
  it('long lists collapse to +N', () => {
    expect(
      valueText(owner, {
        field: 'owner',
        op: 'in',
        value: ['a', 'b', 'c', 'd'],
      }),
    ).toBe('a, b +2')
  })
  it('dates are formatted, between as a range', () => {
    expect(
      valueText(created, {
        field: 'createdAt',
        op: 'gte',
        value: '2026-11-01',
      }),
    ).toContain('2026')
    const range = valueText(created, {
      field: 'createdAt',
      op: 'between',
      value: '2026-11-01',
      value2: '2026-11-30',
    })
    expect(range).toContain('30')
    expect(range).not.toContain('2026-11')
  })
  it('strings are quoted, boolean and empty have no value', () => {
    expect(
      valueText(name, { field: 'name', op: 'contains', value: 'acme' }),
    ).toBe('"acme"')
    expect(
      valueText(done, { field: 'done', op: 'eq', value: true }),
    ).toBeUndefined()
  })
})

describe('isComplete', () => {
  it('needs both ends of a between', () => {
    expect(
      isComplete(created, {
        field: 'createdAt',
        op: 'between',
        value: '2026-11-01',
      }),
    ).toBe(false)
    expect(
      isComplete(created, {
        field: 'createdAt',
        op: 'between',
        value: '2026-11-01',
        value2: '2026-11-02',
      }),
    ).toBe(true)
  })
  it('needs one item in a list', () => {
    expect(isComplete(stage, { field: 'stage', op: 'in', value: [] })).toBe(
      false,
    )
  })
  it('a number must be a number', () => {
    expect(
      isComplete(amount, { field: 'amount', op: 'gt', value: Number.NaN }),
    ).toBe(false)
    expect(isComplete(amount, { field: 'amount', op: 'gt', value: 0 })).toBe(
      true,
    )
  })
})

describe('upsertChip', () => {
  const a = { field: 'name', op: 'contains' as const, value: 'a' }
  const b = { field: 'amount', op: 'gt' as const, value: 1 }
  it('adds at the end', () => {
    expect(upsertChip([a], b)).toEqual([a, b])
  })
  it('replaces the chip with the same field and operator', () => {
    const a2 = { ...a, value: 'z' }
    expect(upsertChip([a, b], a2)).toEqual([a2, b])
  })
  it('an edit keeps its place, even when its operator changes', () => {
    const a2 = { field: 'name', op: 'startsWith' as const, value: 'q' }
    expect(upsertChip([a, b], a2, a)).toEqual([a2, b])
  })
})
