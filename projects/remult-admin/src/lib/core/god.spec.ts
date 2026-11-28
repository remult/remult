import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EntityUIInfo } from '../../../../core/server/remult-admin'
import { field } from '../query/fixtures.js'
import { captions } from '../relations/caption-cache.svelte.js'
import { buildTables, god } from './god.svelte.js'
import { settings } from './settings.svelte.js'

const info = (fields: EntityUIInfo['fields']): EntityUIInfo =>
  ({
    key: 'things',
    superKey: 'things',
    caption: 'Things',
    fields,
    ids: { id: true },
    relations: [],
    hidden: false,
    editMode: 'inline',
    editModeLocked: false,
    apiPrefilter: false,
    permissions: { insert: true, update: true, delete: true },
    rules: { insert: 'bool', update: 'bool', delete: 'bool' },
  }) as EntityUIInfo

describe('buildTables', () => {
  it('keeps numeric value list ids numbers, and turns plain string values into items', () => {
    const [t] = buildTables([
      info([
        field({ key: 'id' }),
        field({ key: 'size', values: [{ id: 1, caption: 'one' }] }),
        field({ key: 'gender', values: ['male', 'female'] as any }),
      ]),
    ])
    expect(
      t.repo.metadata.fields.find('size').valueConverter.fromJson!(1),
    ).toBe(1)
    expect(t.fields.find((f) => f.key === 'gender')!.values).toEqual([
      { id: 'male', caption: 'male' },
      { id: 'female', caption: 'female' },
    ])
  })
})

describe('god.reload', () => {
  const am = field({
    key: 'owner',
    relationToOne: {
      entityKey: 'users',
      fields: { id: 'owner' },
      captionField: 'name',
    } as any,
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    settings.customHeaders = ''
  })

  it('reload clears captions', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, _init?: RequestInit) => {
        const url = String(input)
        return new Response(url.endsWith('/me') ? 'null' : '[]', {
          status: 200,
        })
      },
    )
    vi.stubGlobal('fetch', fetchMock)
    settings.customHeaders = 'x-tenant: t1'
    captions.set(am, 'u1', 'Previous user caption')
    await god.reload()
    expect(captions.get(am, 'u1')).toBeUndefined()
    expect(god.unauthorized).toBe(false)
  })
})
