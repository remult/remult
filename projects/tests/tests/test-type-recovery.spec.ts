import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryDataProvider } from '../../core/src//data-providers/in-memory-database'
import { Remult } from '../../core/src/context'
import { Entity, Fields } from '../../core/src/remult3'
import { describeClass } from '../../core/src/remult3/DecoratorReplacer'

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
