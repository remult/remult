import { describe, it, expect, beforeEach } from 'vitest'
import {
  Entity,
  Fields,
  InMemoryDataProvider,
  Relations,
  Remult,
} from '../../../core'

@Entity('missing-target-customers')
class Customer {
  @Fields.integer()
  id = 0
  @Fields.integer()
  branchId = 0
  @Fields.string()
  name = ''
}

@Entity('missing-target-orders')
class Order {
  @Fields.integer()
  id = 0
  @Fields.integer()
  branchId = 0
  @Fields.integer()
  customerId = 0
  @Relations.toOne<Order, Customer>(() => Customer, { field: 'customerId' })
  customer?: Customer | null
  @Relations.toOne<Order, Customer>(() => Customer, {
    fields: { branchId: 'branchId', id: 'customerId' },
  })
  branchCustomer?: Customer | null
}

describe('included toOne with a missing target', () => {
  let remult: Remult
  const repo = () => remult.repo(Order)
  beforeEach(async () => {
    remult = new Remult(new InMemoryDataProvider())
    await repo().insert({ id: 1, branchId: 1, customerId: 99 })
  })
  for (const rel of ['customer', 'branchCustomer'] as const) {
    describe(rel, () => {
      const load = () => repo().findId(1, { include: { [rel]: true } })
      it('loads as null and keeps the FK', async () => {
        const order = await load()
        expect(order![rel]).toBeNull()
        expect(order!.customerId).toBe(99)
      })
      it('keeps the FK on save', async () => {
        await repo().save((await load())!)
        expect((await repo().findId(1))!.customerId).toBe(99)
      })
      it('keeps the FK when a copy is inserted', async () => {
        const copy = await repo().insert({ ...(await load())!, id: 2 })
        expect(copy.customerId).toBe(99)
      })
      it('keeps the FK when a copy is passed to update', async () => {
        await repo().update(1, { ...(await load())! })
        expect((await repo().findId(1))!.customerId).toBe(99)
      })
    })
  }
  it('an explicit null still clears the FK', async () => {
    await repo().update(1, { customer: null })
    expect((await repo().findId(1))!.customerId).toBe(0)
  })
})
