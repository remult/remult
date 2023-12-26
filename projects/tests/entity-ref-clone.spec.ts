import { describe, it, expect } from 'vitest'
import {
  Entity,
  EntityBase,
  Fields,
  InMemoryDataProvider,
  Relations,
  Remult,
  remult,
} from '../core'

describe('entity-ref-clone', () => {
  it('test', async () => {
    const remult = new Remult(new InMemoryDataProvider())
    @Entity('categories')
    class Category {
      @Fields.integer()
      id = 0
      @Fields.string()
      name = ''
    }
    @Entity('tasks')
    class Task extends EntityBase {
      @Fields.integer()
      id = 0
      @Fields.string()
      name = ''
      @Fields.string({ includeInApi: false })
      hidden = ''
      @Relations.toOne(() => Category)
      category?: Category
    }
    const repo = remult.repo(Task)
    const t = await repo.insert({
      name: 'test',
      id: 1,
      hidden: 'hidden',
      category: await remult.repo(Category).insert({ id: 11, name: '123' }),
    })
    expect(t.category?.name).toBe('123')
    const t2 = await t._.clone()
    expect(t2.hidden).toBe('hidden')
    expect(t2.category?.name).toBe('123')

    t.name = 'test2'
    expect(t2.name).toBe('test')
    expect(t2._.wasChanged()).toBe(false)
    t2.name = 'test3'
    await t2._.save()
    expect(t.$.name.originalValue).toBe('test')
    expect(t2.$.name.originalValue).toBe('test3')
  })
})
