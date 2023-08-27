import { Remult } from '../context'
import { InMemoryDataProvider } from '../data-providers/in-memory-database'
import { Entity, Fields } from '../remult3'
import { describeClass } from '../remult3/DecoratorReplacer'
import { describe, it, expect,beforeEach,afterEach,beforeAll } from 'vitest'

describe('type recovery', () => {
  const entity = class {
    id = 0
    date = new Date()
  }
  describeClass(entity, Entity('x'), {
    id: Fields.number(),
    date: Fields.dateOnly({
      validate: (_, ref) => ref.value.getFullYear() < 1980,
    }),
  })
  let mem = new InMemoryDataProvider()

  const repo = new Remult(mem).repo(entity)
  beforeEach(async () => {
    for (const item of await repo.find()) {
      await repo.delete(item)
    }
  })

  it('test insert works with Date', async () => {
    let r = await repo.insert({ id: 0, date: '1976-06-16' as any })
    expect(r.date.getFullYear()).toBe(1976)
  })
  it('test validate with Date', async () => {
    let r = await repo.validate({ id: 0, date: '1976-06-16' as any })
    expect(r).toBeUndefined()
  })
  it('test create', async () => {
    let r = repo.create({ id: 0, date: '1976-06-16' as any })
    expect(r.date.getFullYear()).toBe(1976)
  })
  it('test save works with Date', async () => {
    let r = await repo.save({ date: '1976-06-16' as any })
    expect(r.date.getFullYear()).toBe(1976)
  })
  it('test update using save', async () => {
    await repo.insert({ id: 1, date: '1975-06-16' as any })
    let r = await repo.save({ id: 1, date: '1976-06-16' as any })
    expect(r.date.getFullYear()).toBe(1976)
  })
  it('test update ', async () => {
    await repo.insert({ id: 1, date: '1975-06-16' as any })
    let r = await repo.update(1, { date: '1976-06-16' as any })
    expect(r.date.getFullYear()).toBe(1976)
  })
})
