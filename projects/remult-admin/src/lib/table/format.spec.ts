import { describe, expect, it } from 'vitest'
import { field } from '../query/fixtures.js'
import { display } from './format.js'

const rel = field({
  key: 'company',
  valFieldKey: 'companyId',
  relationToOne: {
    entityKey: 'companies',
    idField: 'id',
    captionField: 'name',
    allowNull: false,
    fields: { companyId: 'companyId' },
    compoundIdField: undefined,
  },
})

describe('display', () => {
  it('shows the relation caption, else the raw id as missing', () => {
    expect(display(rel, 'id:1', 'Acme')).toMatchObject({ kind: 'relation', text: 'Acme', missing: false })
    expect(display(rel, 'id:2', undefined)).toMatchObject({ kind: 'relation', text: 'id:2', missing: true })
    expect(display(rel, '', undefined).kind).toBe('empty')
  })

  it('shows the value list caption, keeping the id type', () => {
    const f = field({ key: 'size', type: 'number', values: [{ id: 1, caption: 'Small' }] })
    expect(display(f, 1)).toMatchObject({ text: 'Small' })
    expect(display(f, '1')).toMatchObject({ text: '1' })
  })

  it('tells null from a missing value', () => {
    expect(display(field({ key: 'a' }), null)).toEqual({ kind: 'empty', text: 'null' })
    expect(display(field({ key: 'a' }), undefined)).toEqual({ kind: 'empty', text: '' })
  })

  it('keeps date-only values as written', () => {
    const f = field({ key: 'd', type: 'date', inputType: 'date' })
    expect(display(f, '2026-11-24')).toEqual({ kind: 'date', text: '2026-11-24' })
  })
})
