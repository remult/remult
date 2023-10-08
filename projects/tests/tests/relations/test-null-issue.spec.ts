import { describe, expect, it } from 'vitest'
import {
  InMemoryDataProvider,
  Remult,
  Entity,
  Field,
  Fields,
  remult,
  Relations,
  SqlDatabase,
} from '../../../core'

@Entity('customers')
export class Customer {
  @Fields.uuid()
  id?: string
  @Fields.string()
  name = ''
  @Fields.string()
  city = ''
}

@Entity('orders')
export class Order {
  @Fields.cuid()
  id?: string
  @Fields.string({ allowNull: true, dbName: '"customerId"' })
  customerId?: string | null = null
  @Relations.toOne<Order, Customer>(() => Customer, { field: 'customerId' })
  customer?: Customer | null = null
  @Fields.number()
  amount = 0
}

describe('test null issue', () => {
  it('test the null issue', async () => {
    let remult = new Remult(new InMemoryDataProvider())
    const customerRepo = remult.repo(Customer)
    const customers = await customerRepo.insert([
      { name: 'Noam', city: 'London' },
    ])
    await remult
      .repo(Order)
      .insert([{ customerId: customers[0].id, amount: 15 }])
    expect(
      (await remult.repo(Order).find({ include: { customer: true } }))[0]
        .customer.name,
    ).toBe('Noam')
  })
  it('test the null issue b', async () => {
    let remult = new Remult(new InMemoryDataProvider())

    await remult.repo(Order).insert([{ customerId: null, amount: 15 }])
    expect(
      (await remult.repo(Order).find({ include: { customer: true } }))[0]
        .customer,
    ).toBe(null)
  })
})
