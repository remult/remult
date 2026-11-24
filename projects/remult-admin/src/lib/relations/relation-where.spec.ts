import { describe, expect, it } from 'vitest'
import { relationWhere } from './relation-where.js'

const same = (json: any) => json

describe('relationWhere', () => {
  it('maps the parent values onto the child keys, plus the relation where', () => {
    const rel = { fields: { companyId: 'companyId' }, where: { hasNewsletter: true } }
    expect(relationWhere(rel, { id: 'c1', companyId: 'id:c1' }, same)).toEqual({
      hasNewsletter: true,
      companyId: 'id:c1',
    })
  })
  it('own keys win over the relation where', () => {
    const rel = { fields: { company: 'id' }, where: { company: 'other' } }
    expect(relationWhere(rel, { id: 'c1' }, same)).toEqual({ company: 'c1' })
  })
  it('a missing parent value filters to nothing, not to everything', () => {
    expect(relationWhere({ fields: { companyId: 'companyId' } }, { companyId: null }, same)).toBeUndefined()
    expect(relationWhere({ fields: { a: 'x', b: 'y' } }, { x: 1 }, same)).toBeUndefined()
  })
})
