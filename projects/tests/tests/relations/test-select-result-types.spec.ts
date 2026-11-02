import { describe, it, expect, expectTypeOf, beforeEach } from 'vitest'
import { Entity, Fields, InMemoryDataProvider, Remult } from '../../../core'

@Entity('select-default-tasks')
class Task {
  @Fields.integer()
  id = 0
  @Fields.string()
  title = ''
}

describe('select result without typedSelect', () => {
  let remult: Remult
  beforeEach(async () => {
    remult = new Remult(new InMemoryDataProvider())
    await remult.repo(Task).insert({ id: 101, title: 'task1' })
  })
  it('keeps the entity type', async () => {
    const tasks = await remult.repo(Task).find({ select: { title: true } })
    expectTypeOf(tasks).toEqualTypeOf<Task[]>()
    expect(tasks[0].title).toBe('task1')
  })
  it('can be reassigned from insert', async () => {
    let task = await remult
      .repo(Task)
      .findFirst({ id: 102 }, { select: { title: true } })
    if (!task) task = await remult.repo(Task).insert({ id: 102, title: 'b' })
    expect(task.title).toBe('b')
  })
})
