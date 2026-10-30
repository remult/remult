import type { Db } from 'mongodb'
import { describe, expect, it, vi } from 'vitest'
import { Entity, Fields, Relations, Remult, describeClass } from '../../core'
import { MongoDataProvider } from '../../core/remult-mongo'

describe('mongo insert', () => {
  it.each([true, false])(
    'preserves explicit foreign keys when relation is declared first: %s',
    async (relationFirst) => {
      class Parent {
        id = ''
      }
      describeClass(Parent, Entity('parents'), { id: Fields.string() })

      class Child {
        id = ''
        parentId = ''
        parent?: Parent
      }
      const relation = Relations.toOne(() => Parent, 'parentId')
      describeClass(Child, Entity('children'), {
        id: Fields.string(),
        ...(relationFirst
          ? { parent: relation, parentId: Fields.string() }
          : { parentId: Fields.string(), parent: relation }),
      })

      const insertMany = vi.fn(async () => ({ insertedIds: { 0: 'child-1' } }))
      const mongo = { collection: () => ({ insertMany }) } as unknown as Db
      const provider = new MongoDataProvider(mongo, undefined)
      const remult = new Remult(provider)

      await provider
        .getEntityDataProvider(remult.repo(Child).metadata)
        .insert([{ id: 'child-1', parentId: 'parent-1' }], { select: 'none' })

      expect(insertMany).toHaveBeenCalledWith(
        [{ id: 'child-1', parentId: 'parent-1' }],
        { session: undefined },
      )
    },
  )

  it('does not insert read-only or server-expression fields', async () => {
    class Item {
      id = ''
      readOnly = ''
      computed = ''
    }
    describeClass(Item, Entity('items'), {
      id: Fields.string(),
      readOnly: Fields.string({ dbReadOnly: true }),
      computed: Fields.string({ serverExpression: () => 'computed' }),
    })

    const insertMany = vi.fn(async () => ({ insertedIds: { 0: 'item-1' } }))
    const mongo = { collection: () => ({ insertMany }) } as unknown as Db
    const provider = new MongoDataProvider(mongo, undefined)
    const remult = new Remult(provider)

    await provider
      .getEntityDataProvider(remult.repo(Item).metadata)
      .insert(
        [{ id: 'item-1', readOnly: 'read-only', computed: 'computed' }],
        { select: 'none' },
      )

    expect(insertMany).toHaveBeenCalledWith([{ id: 'item-1' }], {
      session: undefined,
    })
  })
})
