import type { Db } from 'mongodb'
import { describe, expect, it, vi } from 'vitest'
import { Entity, Fields, Remult, describeClass } from '../../core'
import { MongoDataProvider } from '../../core/remult-mongo'

describe('mongo update', () => {
  it.each(['stored_title', 'title'])(
    'updates fields using database column %s',
    async (dbName) => {
      class Item {
        id = ''
        title = ''
        note = ''
        untouched = ''
      }
      describeClass(Item, Entity('items'), {
        id: Fields.string(),
        title: Fields.string({ dbName }),
        note: Fields.string(),
        untouched: Fields.string(),
      })

      const updateOne = vi.fn(async () => ({
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 1,
      }))
      const mongo = { collection: () => ({ updateOne }) } as unknown as Db
      const provider = new MongoDataProvider(mongo, undefined)
      const remult = new Remult(provider)

      await provider
        .getEntityDataProvider(remult.repo(Item).metadata)
        .update(
          'item-1',
          { title: 'new title', note: 'new note' },
          { select: 'none' },
        )

      expect(updateOne).toHaveBeenCalledWith(
        { $and: [{ id: { $eq: 'item-1' } }] },
        { $set: { [dbName]: 'new title', note: 'new note' } },
        { session: undefined },
      )
    },
  )
})
