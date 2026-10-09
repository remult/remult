import { expect, it } from 'vitest'
import {
  Entity,
  Fields,
  type DroppableDataProvider,
  type Remult,
} from '../../../core'

@Entity('droppable_orders')
class Order {
  @Fields.integer()
  id = 0
  @Fields.string()
  name = ''
}

@Entity('droppable_customers')
class Customer {
  @Fields.integer()
  id = 0
  @Fields.string()
  name = ''
}

@Entity('droppable_auto')
class Auto {
  @Fields.autoIncrement()
  id = 0
  @Fields.string()
  name = ''
}

export function droppableDataProviderTests(
  getDb: () => DroppableDataProvider,
  getRemult: () => Remult,
) {
  it('dropTable removes one entity and recreates on next insert', async () => {
    const remult = getRemult()
    const db = getDb()
    await remult.repo(Order).insert({ id: 1, name: 'a' })
    await remult.repo(Customer).insert({ id: 1, name: 'c' })
    await db.dropTable(Order)
    expect(await remult.repo(Order).find()).toEqual([])
    expect(await remult.repo(Customer).find()).toMatchObject([
      { id: 1, name: 'c' },
    ])
    await remult.repo(Order).insert({ id: 2, name: 'b' })
    expect(await remult.repo(Order).find()).toMatchObject([{ id: 2, name: 'b' }])
  })

  it('dropTable is a no-op when the table was never created', async () => {
    await getDb().dropTable(Order)
    expect(await getRemult().repo(Order).find()).toEqual([])
  })

  it('dropTable resets autoincrement', async () => {
    const remult = getRemult()
    const repo = remult.repo(Auto)
    expect((await repo.insert({ name: 'a' })).id).toBe(1)
    expect((await repo.insert({ name: 'b' })).id).toBe(2)
    await getDb().dropTable(Auto)
    expect((await repo.insert({ name: 'c' })).id).toBe(1)
  })

  it('dropDatabase removes all tables and stays usable', async () => {
    const remult = getRemult()
    const db = getDb()
    await remult.repo(Order).insert({ id: 1, name: 'a' })
    await remult.repo(Customer).insert({ id: 1, name: 'c' })
    await db.dropDatabase()
    expect(await remult.repo(Order).find()).toEqual([])
    expect(await remult.repo(Customer).find()).toEqual([])
    await remult.repo(Order).insert({ id: 3, name: 'z' })
    expect(await remult.repo(Order).find()).toMatchObject([{ id: 3, name: 'z' }])
  })
}
