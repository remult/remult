import { describe, expect, it } from 'vitest'
import { InMemoryDataProvider } from '../../core/src/data-providers/in-memory-database'
import { Remult } from '../../core/src/context'
import { getEntityRef } from '../../core'
// `*.tc39.ts` files are transpiled with standard (tc39) decorators by the
// `remult-tc39-decorators` vite plugin in vitest.config.ts.
import { Category, Task } from './entities.tc39'

function newRemult() {
  const r = new Remult()
  r.dataProvider = new InMemoryDataProvider()
  return r
}

describe('tc39 standard decorators', () => {
  it('collects field metadata from a tc39-decorated entity', async () => {
    const remult = newRemult()
    const repo = remult.repo(Task)
    const keys = repo.metadata.fields.toArray().map((f) => f.key)
    // own fields + inherited base-class field (createdBy)
    expect(keys).toEqual([
      'createdBy',
      'id',
      'title',
      'completed',
      'priority',
      'categoryId',
      'category',
    ])
    expect(repo.metadata.key).toBe('tc39_tasks')
  })

  it('honors field options (maxLength validator)', async () => {
    const remult = newRemult()
    const repo = remult.repo(Task)
    expect(repo.metadata.fields.find('title').options.maxLength).toBe(50)
    const t = repo.create()
    t.title = '*'.repeat(51)
    expect(await getEntityRef(t).fields.title.validate()).toBe(false)
  })

  it('supports full CRUD', async () => {
    const remult = newRemult()
    const repo = remult.repo(Task)
    expect(await repo.count()).toBe(0)
    const created = await repo.insert({ id: 1, title: 'first', priority: 5 })
    expect(created.title).toBe('first')
    expect(created.completed).toBe(false)
    expect(created.priority).toBe(5)
    expect(created.createdBy).toBe('system')

    const found = await repo.findId(1)
    expect(found!.title).toBe('first')

    await repo.update(1, { completed: true })
    expect((await repo.findId(1))!.completed).toBe(true)

    await repo.delete(1)
    expect(await repo.count()).toBe(0)
  })

  it('registration is idempotent across many instances and pre-repo construction', async () => {
    // Construct several instances *before* repo() is ever called (the field
    // decorator initializers register columns on each construction). The
    // per-class guard must prevent duplicate/compounding registration.
    for (let i = 0; i < 25; i++) new Task()
    const remult = newRemult()
    const repo = remult.repo(Task)
    const keys = repo.metadata.fields.toArray().map((f) => f.key)
    expect(keys).toEqual([
      'createdBy',
      'id',
      'title',
      'completed',
      'priority',
      'categoryId',
      'category',
    ])
    // building metadata again (new remult) still yields the same shape
    const repo2 = newRemult().repo(Task)
    expect(repo2.metadata.fields.toArray().length).toBe(7)
    expect(repo2.metadata.fields.find('title').options.maxLength).toBe(50)
  })

  it('supports relations (toOne) defined with tc39 decorators', async () => {
    const remult = newRemult()
    await remult.repo(Category).insert({ id: 10, name: 'work' })
    const tasks = remult.repo(Task)
    await tasks.insert({ id: 1, title: 'a', categoryId: 10 })
    const loaded = await tasks.findFirst(
      { id: 1 },
      { include: { category: true } },
    )
    expect(loaded!.category!.name).toBe('work')
  })
})
