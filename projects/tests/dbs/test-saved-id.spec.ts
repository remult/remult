import { describe, expect, it } from 'vitest'
import { entity } from '../tests/dynamic-classes.js'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Remult,
} from '../../core/index.js'
import { createId } from '@paralleldrive/cuid2'

describe('test-saved-id', () => {
  it('test-saved-id', async () => {
    const e = entity(
      'test-saved-id',
      {
        a: Fields.integer(),
        b: Fields.integer(),
      },
      {
        id: { a: true, b: true },
        saved: (t, e) => {
          expect(e.id).toMatchInlineSnapshot('"1,2"')
        },
      },
    )
    await new Remult(new InMemoryDataProvider()).repo(e).insert({ a: 1, b: 2 })
  })
  it('test-saved-id2', async () => {
    const e = entity(
      'test-saved-id',
      {
        a: Fields.id({ idFactory: () => createId() }),
        b: Fields.integer(),
      },
      {
        saved: (t, e) => {
          expect(e.id).toEqual(t.a)
        },
      },
    )
    await new Remult(new InMemoryDataProvider()).repo(e).insert({ b: 2 })
  })
  it('test original example', async () => {
    @Entity<Task>('tasks', {
      allowApiCrud: true,
      saved(entity, e) {
        expect(e.id).toEqual(entity.id)
      },
    })
    class Task {
      @Fields.id({ idFactory: () => createId() })
      id = ''

      @Fields.string()
      title = ''
    }
    await new Remult(new InMemoryDataProvider())
      .repo(Task)
      .insert({ title: 'test' })
  })
})
