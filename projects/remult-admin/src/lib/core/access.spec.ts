import { describe, expect, it } from 'vitest'
import {
  accessLabel,
  accessRow,
  accessState,
  initials,
  userExtras,
  userRoles,
} from './access.js'

const table = {
  superKey: 'deals',
  key: 'deals',
  caption: 'Deals',
  color: '120',
  apiPrefilter: true,
  permissions: { insert: true, update: 'row', delete: false } as const,
}

describe('accessState / accessLabel', () => {
  it('maps permissions to one state and label', () => {
    expect(accessState(true)).toBe('yes')
    expect(accessState(false)).toBe('no')
    expect(accessState('row')).toBe('row')
    expect(accessLabel('yes')).toBe('Yes')
    expect(accessLabel('no')).toBe('No')
    expect(accessLabel('row')).toBe('Function')
  })
})

describe('accessRow', () => {
  it('builds one matrix row', () => {
    expect(accessRow(table, [])).toEqual({
      superKey: 'deals',
      key: 'deals',
      caption: 'Deals',
      color: '120',
      read: 'yes',
      create: 'yes',
      edit: 'row',
      delete: 'no',
      prefilter: true,
    })
  })

  it('read is no once the server refused the entity', () => {
    expect(accessRow(table, ['deals']).read).toBe('no')
    expect(accessRow(table, ['tasks']).read).toBe('yes')
  })

  it('a missing apiPrefilter (older server) is no prefilter', () => {
    const { apiPrefilter: _, ...old } = table
    expect(accessRow(old as typeof table, []).prefilter).toBe(false)
  })
})

describe('initials', () => {
  it('takes first and last word', () => {
    expect(initials('Admin')).toBe('A')
    expect(initials('jean yves couet')).toBe('JC')
    expect(initials('jean-yves')).toBe('JY')
    expect(initials('  ops ')).toBe('O')
  })
  it('falls back for empty names', () => {
    expect(initials(undefined)).toBe('?')
    expect(initials('   ')).toBe('?')
  })
})

describe('userExtras', () => {
  it('skips id, name and roles', () => {
    expect(userExtras({ id: '1', name: 'A', roles: ['x'] })).toEqual({
      entries: [],
      more: 0,
    })
  })

  it('stringifies non strings and truncates long values', () => {
    const { entries } = userExtras({
      id: '1',
      tenant: 'acme',
      age: 3,
      flags: { a: true },
      long: 'x'.repeat(200),
    })
    expect(entries.slice(0, 3)).toEqual([
      ['tenant', 'acme'],
      ['age', '3'],
      ['flags', '{"a":true}'],
    ])
    expect(entries[3][1]).toHaveLength(80)
    expect(entries[3][1].endsWith('…')).toBe(true)
  })

  it('survives cycles and caps the count', () => {
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    const user: Record<string, unknown> = { id: '1', cyclic }
    for (let i = 0; i < 20; i++) user['k' + i] = i
    const { entries, more } = userExtras(user)
    expect(entries[0]).toEqual(['cyclic', '[object Object]'])
    expect(entries).toHaveLength(12)
    expect(more).toBe(9)
  })

  it('handles no user', () => {
    expect(userExtras(null)).toEqual({ entries: [], more: 0 })
  })
})

describe('userRoles', () => {
  it('returns roles or none', () => {
    expect(userRoles({ roles: ['admin'] })).toEqual(['admin'])
    expect(userRoles({})).toEqual([])
    expect(userRoles(undefined)).toEqual([])
    expect(userRoles({ roles: 'admin' })).toEqual([])
  })
})
