import { describe, expect, it } from 'vitest'
import { field } from '../query/fixtures.js'
import {
  fromLocalInput,
  isIsoTimestamp,
  kindOf,
  toLocalInput,
} from './field-kind.js'

describe('kindOf', () => {
  it('picks one editor per field shape', () => {
    expect(
      kindOf(field({ key: 'a', relationToOne: {} as any, type: 'string' })),
    ).toBe('relation')
    expect(kindOf(field({ key: 'a', type: 'json' }))).toBe('json')
    expect(
      kindOf(
        field({
          key: 'a',
          type: 'number',
          values: [{ id: 1, caption: 'one' }],
        }),
      ),
    ).toBe('enum')
    expect(kindOf(field({ key: 'a', type: 'boolean' }))).toBe('boolean')
    expect(kindOf(field({ key: 'a', type: 'number' }))).toBe('number')
    expect(kindOf(field({ key: 'a', type: 'date', inputType: 'date' }))).toBe(
      'date',
    )
    expect(kindOf(field({ key: 'a', type: 'date', inputType: '' }))).toBe(
      'datetime',
    )
    expect(kindOf(field({ key: 'a', inputType: 'color' }))).toBe('color')
    expect(kindOf(field({ key: 'a' }))).toBe('text')
  })
})

describe('local date time', () => {
  // vitest runs in Europe/Paris (UTC+1 in winter)
  it('round trips an instant through the local input format', () => {
    expect(toLocalInput('2026-11-24T08:30:00.000Z')).toBe('2026-11-24T09:30')
    expect(fromLocalInput('2026-11-24T09:30')).toBe('2026-11-24T08:30:00.000Z')
  })

  it('maps empty and invalid to empty / null', () => {
    expect(toLocalInput(null)).toBe('')
    expect(toLocalInput('nope')).toBe('')
    expect(fromLocalInput('')).toBe(null)
  })

  it('spots ISO timestamps, not plain text', () => {
    expect(isIsoTimestamp('2024-06-26T17:07:41.209Z')).toBe(true)
    expect(isIsoTimestamp('a long sentence about 2024')).toBe(false)
  })
})
