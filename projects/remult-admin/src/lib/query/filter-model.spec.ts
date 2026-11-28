import { describe, expect, it } from 'vitest'
import { chipsToWhere, operatorsFor } from './filter-model.js'
import { field } from './fixtures.js'

const fields = [
  field({ key: 'name' }),
  field({ key: 'note', allowNull: true }),
  field({ key: 'createdAt', type: 'date', inputType: 'datetime-local' }),
  field({ key: 'dueDate', type: 'date', inputType: 'date', allowNull: true }),
  field({ key: 'age', type: 'number', inputType: 'number' }),
  field({ key: 'done', type: 'boolean', allowNull: true }),
  field({ key: 'status', values: [{ id: 'open', caption: 'Open' }] }),
  field({ key: 'owner', valFieldKey: 'ownerId', relationToOne: {} as any }),
]

describe('operatorsFor', () => {
  it('non-nullable string has no empty', () => {
    const ops = operatorsFor(fields[0])
    expect(ops).toContain('contains')
    expect(ops).not.toContain('empty')
  })
  it('nullable date has between and empty', () => {
    const ops = operatorsFor(fields[3])
    expect(ops).toContain('between')
    expect(ops).toContain('empty')
  })
  it('enum and relation get in/nin', () => {
    for (const f of [fields[6], fields[7]]) {
      expect(operatorsFor(f)).toEqual(['in', 'nin'])
    }
  })
  it('boolean is eq (+ empty if nullable)', () => {
    expect(operatorsFor(fields[5])).toEqual(['eq', 'empty', 'notEmpty'])
  })
})

describe('chipsToWhere', () => {
  it('timestamp between maps to local-day instants (Europe/Paris)', () => {
    expect(
      chipsToWhere(
        [
          {
            field: 'createdAt',
            op: 'between',
            value: '2026-11-01',
            value2: '2026-11-30',
          },
        ],
        fields,
      ),
    ).toEqual({
      createdAt: {
        $gte: '2026-10-31T23:00:00.000Z',
        $lte: '2026-11-30T22:59:59.999Z',
      },
    })
  })
  it('timestamp eq/lt/gt', () => {
    expect(
      chipsToWhere(
        [{ field: 'createdAt', op: 'eq', value: '2026-11-01' }],
        fields,
      ),
    ).toEqual({
      createdAt: {
        $gte: '2026-10-31T23:00:00.000Z',
        $lte: '2026-11-01T22:59:59.999Z',
      },
    })
    expect(
      chipsToWhere(
        [{ field: 'createdAt', op: 'lt', value: '2026-11-01' }],
        fields,
      ),
    ).toEqual({
      createdAt: { $lt: '2026-10-31T23:00:00.000Z' },
    })
    expect(
      chipsToWhere(
        [{ field: 'createdAt', op: 'gt', value: '2026-11-01' }],
        fields,
      ),
    ).toEqual({
      createdAt: { $gt: '2026-11-01T22:59:59.999Z' },
    })
  })
  it('date-only between stays as-is', () => {
    expect(
      chipsToWhere(
        [
          {
            field: 'dueDate',
            op: 'between',
            value: '2026-11-01',
            value2: '2026-11-30',
          },
        ],
        fields,
      ),
    ).toEqual({ dueDate: { $gte: '2026-11-01', $lte: '2026-11-30' } })
  })
  it('empty / notEmpty', () => {
    expect(chipsToWhere([{ field: 'note', op: 'empty' }], fields)).toEqual({
      note: null,
    })
    expect(chipsToWhere([{ field: 'note', op: 'notEmpty' }], fields)).toEqual({
      note: { $ne: null },
    })
  })
  it('relation filters on valFieldKey', () => {
    expect(
      chipsToWhere([{ field: 'owner', op: 'in', value: ['a'] }], fields),
    ).toEqual({
      ownerId: { $in: ['a'] },
    })
  })
  it('combines chips on one field and across fields', () => {
    expect(
      chipsToWhere(
        [
          { field: 'age', op: 'gt', value: 1 },
          { field: 'age', op: 'lt', value: 9 },
          { field: 'name', op: 'contains', value: 'x' },
        ],
        fields,
      ),
    ).toEqual({ age: { $gt: 1, $lt: 9 }, name: { $contains: 'x' } })
  })
})
