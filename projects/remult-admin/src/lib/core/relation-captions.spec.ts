import { describe, expect, it } from 'vitest'
import {
  captionOf,
  relationCaptions,
  targetKeyOf,
} from './relation-captions.js'

const rel = (fields: Record<string, string>) => ({
  fields,
  captionField: 'name',
})

describe('relationCaptions', () => {
  it('keys by the id field of the target', () => {
    const map = relationCaptions(rel({ id: 'company' }), 'company', [
      { id: 'c1', name: 'Acme' },
    ])
    expect(map.get('c1')).toBe('Acme')
  })

  it('keys by the relation target field when it is not `id`', () => {
    const map = relationCaptions(rel({ companyId: 'companyId' }), 'companyId', [
      { id: 'c1', companyId: 'id:c1', name: 'Acme' },
      { id: 'c2', companyId: 'id:c2', name: 'Globex' },
    ])
    expect(map.get('id:c1')).toBe('Acme')
    expect(map.get('id:c2')).toBe('Globex')
    expect(map.has('c1')).toBe(false)
  })

  it('picks the target field mapped to valFieldKey in a compound relation', () => {
    expect(targetKeyOf(rel({ a: 'srcA', b: 'srcB' }), 'srcB')).toBe('b')
  })
})

describe('captionOf', () => {
  it('falls back to the next filled key when the caption field is hidden', () => {
    expect(
      captionOf({ id: '1', lastName: 'Mills' }, 'firstName', [
        'firstName',
        'lastName',
      ]),
    ).toBe('Mills')
    expect(
      captionOf(
        { id: '1', firstName: 'Lauren', lastName: 'Mills' },
        'firstName',
        ['lastName'],
      ),
    ).toBe('Lauren')
    expect(captionOf({ id: '1' }, 'firstName', ['lastName'])).toBeUndefined()
  })
})
