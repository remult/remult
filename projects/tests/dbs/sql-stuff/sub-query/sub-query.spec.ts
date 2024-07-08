import { beforeAll, it, describe, expect } from 'vitest'
import {
  Entity,
  Fields,
  Relations,
  Remult,
  SqlDatabase,
} from '../../../../core/index.js'
import { Sqlite3DataProvider } from '../../../../core/remult-sqlite3.js'
import { Database } from 'sqlite3'
import { sqlRelations, sqlRelationsFilter } from './sql-relations.js'

@Entity('customers')
export class Customer {
  @Fields.autoIncrement()
  id = 0
  @Fields.string()
  name = ''
  @Fields.string()
  city = ''
  @Relations.toMany(() => Order, 'customer')
  orders?: Order[]
}

@Entity('orders')
export class Order {
  @Fields.autoIncrement()
  id = 0
  @Relations.toOne(() => Customer)
  customer?: Customer
  @Fields.number()
  amount = 0
}

describe('test sub query 1', () => {
  it('test count column second variation', async () => {
    @Entity('customers')
    class CustomerExtended extends Customer {
      @Fields.number({
        sqlExpression: () => sqlRelations(CustomerExtended).orders.$count(),
      })
      orderCount = 0
      @Fields.number({
        sqlExpression: () =>
          sqlRelations(CustomerExtended).orders.$count({
            amount: { $gte: 10 },
          }),
      })
      bigOrders = 0
    }
    expect(
      (await remult.repo(CustomerExtended).find()).map((x) => ({
        name: x.name,
        orderCount: x.orderCount,
        bigOrder: x.bigOrders,
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "bigOrder": 2,
          "name": "Fay, Ebert and Sporer",
          "orderCount": 2,
        },
        {
          "bigOrder": 1,
          "name": "Abshire Inc",
          "orderCount": 3,
        },
        {
          "bigOrder": 1,
          "name": "Larkin - Fadel",
          "orderCount": 2,
        },
      ]
    `)
  })
  it('test get value column', async () => {
    @Entity('orders')
    class OrderExtended extends Order {
      @Fields.string({
        sqlExpression: () => sqlRelations(OrderExtended).customer.name,
      })
      customerName = ''
      @Fields.string({
        sqlExpression: () => sqlRelations(OrderExtended).customer.city,
      })
      customerCity = ''
    }
    expect(
      (await remult.repo(OrderExtended).find({ where: { id: 1 } })).map(
        (x) => ({
          id: x.id,
          customer: x.customerName,
          city: x.customerCity,
        }),
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "city": "London",
          "customer": "Fay, Ebert and Sporer",
          "id": 1,
        },
      ]
    `)
  })
  it('test filter', async () => {
    expect(
      (
        await remult.repo(Customer).find({
          where: sqlRelationsFilter(Customer).orders.some({
            amount: { $gte: 50 },
          }),
        })
      ).map((x) => x.id),
    ).toMatchInlineSnapshot(`
      [
        3,
      ]
    `)
  })

  let db: SqlDatabase
  let remult: Remult
  beforeAll(async () => {
    db = new SqlDatabase(new Sqlite3DataProvider(new Database(':memory:')))
    remult = new Remult(db)
    const customerRepo = remult.repo(Customer)
    await db.ensureSchema([customerRepo.metadata, remult.repo(Order).metadata])
    if ((await customerRepo.count()) === 0) {
      const customers = await customerRepo.insert([
        { name: 'Fay, Ebert and Sporer', city: 'London' },
        { name: 'Abshire Inc', city: 'New York' },
        { name: 'Larkin - Fadel', city: 'London' },
      ])
      await remult.repo(Order).insert([
        { customer: customers[0], amount: 10 },
        { customer: customers[0], amount: 15 },
        { customer: customers[1], amount: 40 },
        { customer: customers[1], amount: 5 },
        { customer: customers[1], amount: 7 },
        { customer: customers[2], amount: 90 },
        { customer: customers[2], amount: 3 },
      ])
    }
  })
})
