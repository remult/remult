import { describe, expect, test, beforeEach } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Relations,
  Remult,
  repo,
  type remult,
} from '../../core/index.js'

describe('Test validations with relations', () => {
  @Entity('task')
  class Task {
    @Fields.integer()
    id = 0
    @Fields.string()
    name = ''
    @Relations.toOne(() => Category, { required: true })
    category?: Category
  }
  @Entity('category')
  class Category {
    @Fields.integer()
    id = 0
    @Fields.string({ required: true })
    title = ''
  }
  let repo: (typeof remult)['repo']
  beforeEach(async () => {
    repo = new Remult(new InMemoryDataProvider()).repo
    await repo(Task).insert({
      id: 1,
      name: 'task1',
      category: await repo(Category).insert({ id: 1, title: 'category1' }),
    })
  })
  test('should be valid by id', async () => {
    expect((await repo(Task).update(1, { name: 'updated' })).name).toBe(
      'updated',
    )
  })
  test('should be valid by item without include', async () => {
    expect(
      (
        await repo(Task).update((await repo(Task).findId(1))!, {
          name: 'updated',
        })
      ).name,
    ).toBe('updated')
  })
  test('should be valid by item with include', async () => {
    expect(
      (
        await repo(Task).update(
          (await repo(Task).findId(1, { include: { category: true } }))!,
          {
            name: 'updated',
          },
        )
      ).name,
    ).toBe('updated')
  })
  test('validate works', async () => {
    await expect(() =>
      repo(Category).insert({ id: 2, title: '' }),
    ).rejects.toThrowError()
  })
  test('validate works', async () => {
    await expect(() =>
      repo(Category).insert({ id: 2, title: undefined }),
    ).rejects.toThrowError()
  })
})
