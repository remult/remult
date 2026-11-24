import { describe, expect, it } from 'vitest'
import type { EntityUIInfo } from '../../../../core/server/remult-admin'
import { field } from '../query/fixtures.js'
import { buildTables } from './god.svelte.js'

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
