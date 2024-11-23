import { Entity, Fields, InMemoryDataProvider, Remult } from '../../core'
import { expect, test } from 'vitest'

test("test options object doesn't change", async () => {
  @Entity('tasks', {
    defaultOrderBy: {
      name: 'asc',
    },
  })
  class Task {
    @Fields.integer()
    id = ''
    @Fields.string()
    name = ''
  }
  const remult = new Remult(new InMemoryDataProvider())
  const options = {}
  const op2 = { ...options }
  expect(options).toEqual(op2)
  await remult.repo(Task).find(options)
  expect(options).toEqual(op2)
})
