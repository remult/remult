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
    permissions: { insert: true, update: true, delete: true },
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

describe('god.reload and rowPermissions', () => {
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

  it('reload clears captions; rowPermissions sends custom headers and flags a 401', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, _init?: RequestInit) => {
        const url = String(input)
        if (url.endsWith('/__row-permissions'))
          return new Response('', { status: 401 })
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
    await expect(god.rowPermissions('things', ['1'])).rejects.toThrow('401')
    expect(god.unauthorized).toBe(true)
    const init = fetchMock.mock.calls.find(([u]) =>
      String(u).endsWith('/__row-permissions'),
    )![1]!
    expect(init.headers).toMatchObject({
      'content-type': 'application/json',
      'x-tenant': 't1',
    })
  })
})
