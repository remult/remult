import { describe, expect, it } from 'vitest'
import {
  Entity,
  EntityBase,
  Field,
  Fields,
  InMemoryDataProvider,
  Remult,
} from '../core'
describe('test load for find id', () => {
  it('test basic', async () => {
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
      title = ''
      @Field(() => Category, { lazy: true })
      category?: Category
    }
    const remult = new Remult(new InMemoryDataProvider())
    const cat = await remult.repo(Category).insert({ id: 1, name: 'cat1' })
    await remult.repo(Task).insert({ id: 1, title: 'x', category: cat })
    {
      remult.clearAllCache()
      const t = await remult.repo(Task).findId(1)
      expect(t.category).toBe(undefined)
    }
    {
      remult.clearAllCache()
      const t = await remult.repo(Task).findId(1, { load: (e) => [e.category] })
      expect(t.category.name).toBe('cat1')
    }
    {
      remult.clearAllCache()
      let t = await remult.repo(Task).findId(1)
      expect(t.category).toBe(undefined)
      t = await remult.repo(Task).findId(1, { load: (e) => [e.category] })
      expect(t.category.name).toBe('cat1')
    }
  })
})
