import { beforeAll, it, describe, expect } from 'vitest'
import {
  dbNamesOf,
  Entity,
  Fields,
  Relations,
  Remult,
  SqlDatabase,
} from '../../../../core/index.js'
import { Sqlite3DataProvider } from '../../../../core/remult-sqlite3.js'
import { Database } from 'sqlite3'
import { sqlRelations, sqlRelationsFilter } from './sql-relations.js'

@Entity('Customer_groups')
export class CustomerGroup {
  @Fields.autoIncrement()
  id = 0
  @Fields.string()
  group = ''
  @Fields.string()
  color = ''
}

@Entity('Customer_zones')
export class CustomerZone {
  @Fields.autoIncrement()
  id = 0
  @Fields.string()
  zone = ''
  @Fields.string()
  short = ''
  @Relations.toOne(() => CustomerGroup, { dbName: 'group_id' })
  group?: CustomerGroup
}

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

  @Relations.toOne(() => CustomerZone)
  zone?: CustomerZone
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

  it('relation entity+2', async () => {
    @Entity('customers')
    class CustomerExtended extends Customer {
      @Fields.string({
        sqlExpression: () => sqlRelations(CustomerExtended).zone.short,
      })
      zoneShort = ''
      @Fields.string({
        sqlExpression: () =>
          // Option 1: sqlRelations(CustomerExtended).zone.$subQuery(()=>sqlRelations(CustomerZone).group.color),
          sqlRelations(CustomerExtended).zone.$relations.group.color, // I didn't do zone.group.color because there is no way of knowing if you want the zone group or one of its members and sql expression requires string
      })
      groupColor = ''
    }
    SqlDatabase.LogToConsole = true
    expect(
      (await remult.repo(CustomerExtended).find({ where: { id: 1 } })).map(
        (x) => ({
          id: x.id,
          zoneShort: x.zoneShort,
          groupColor: x.groupColor,
        }),
      ),
    ).toMatchInlineSnapshot(`
      [
        {
          "groupColor": "green",
          "id": 1,
          "zoneShort": "N",
        },
      ]
    `)
  })
  it('test sql relation sql', async () => {
    expect(
      await sqlRelations(Customer).orders.$first({
        orderBy: { id: 'desc' },
      }).amount,
    ).toMatchInlineSnapshot(`
      "
      ( SELECT orders.amount 
        FROM orders 
        WHERE orders.customer = customers.id
        ORDER BY orders.id desc
        LIMIT 1
      )"
    `)
  })
  it('test sql relation sql2', async () => {
    expect(
      await sqlRelations(Customer)
        .orders.$first({
          orderBy: { id: 'desc' },
        })
        .$subQuery((x) => x.amount),
    ).toMatchInlineSnapshot(`
      "
      ( SELECT orders.amount 
        FROM orders 
        WHERE orders.customer = customers.id
        ORDER BY orders.id desc
        LIMIT 1
      )"
    `)
  })
  it('test sql relation sql3', async () => {
    expect(
      await sqlRelations(Customer).orders.$first({
        orderBy: { id: 'desc' },
      }).$relations.customer.city,
    ).toMatchInlineSnapshot(`
      "
      ( SELECT   
        ( SELECT customers.city 
          FROM customers 
          WHERE customers.id = orders.customer
        ) 
        FROM orders 
        WHERE orders.customer = customers.id
        ORDER BY orders.id desc
        LIMIT 1
      )"
    `)
  })

  it('relation to many select first', async () => {
    @Entity('customers')
    class CustomerExtended extends Customer {
      @Fields.number({
        sqlExpression: () =>
          sqlRelations(CustomerExtended).orders.$first({
            orderBy: { id: 'desc' },
          }).amount,
        //})
        //`-1`
        //  ,

        //   sqlExpression: () => `(
        // 	SELECT amount
        // 	FROM orders
        // 	WHERE customers.id = orders.customer    -- Need maybe to add additional filters ?
        // 	ORDER BY id DESC                        -- Need to be able to tweak this (taking the default order by if not set)
        // 	LIMIT 1                                 -- Has to be limit 1
        // )`,
      })
      lastAmount = ''
      @Fields.number({
        sqlExpression: () =>
          sqlRelations(CustomerExtended).orders.$subQuery(
            (names) => names.amount,
            {
              orderBy: { id: 'desc' },
              first: true,
            },
          ),
      })
      lastAmount1 = ''
    }

    expect(
      (await remult.repo(CustomerExtended).find()).map((x) => ({
        id: x.id,
        lastAmount: x.lastAmount,
        lastAmount1: x.lastAmount1,
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "id": 1,
          "lastAmount": 15,
          "lastAmount1": 15,
        },
        {
          "id": 2,
          "lastAmount": 7,
          "lastAmount1": 7,
        },
        {
          "id": 3,
          "lastAmount": 3,
          "lastAmount1": 3,
        },
      ]
    `)
  })
  it('test recursive sql', async () => {
    @Entity('me')
    class me {
      @Fields.integer()
      id = 0

      @Fields.integer({
        sqlExpression: async () => {
          const db = await dbNamesOf(me)
          return `1 + ${db.id}`
        },
      })
      a = 0
      @Fields.integer({
        sqlExpression: async () => {
          const db = await dbNamesOf(me)
          return `3+${db.a}`
        },
      })
      b = 0
    }
    const y = await dbNamesOf(me)
    expect(y.b).toMatchInlineSnapshot(`"3+1 + id"`)
  })

  let db: SqlDatabase
  let remult: Remult
  beforeAll(async () => {
    db = new SqlDatabase(new Sqlite3DataProvider(new Database(':memory:')))
    remult = new Remult(db)
    await db.ensureSchema([
      remult.repo(CustomerGroup).metadata,
      remult.repo(CustomerZone).metadata,
      remult.repo(Customer).metadata,
      remult.repo(Order).metadata,
    ])
    if ((await remult.repo(Customer).count()) === 0) {
      const groups = await remult.repo(CustomerGroup).insert([
        { group: 'End User', color: 'green' },
        { group: 'System Integrator', color: 'orange' },
      ])

      const zones = await remult.repo(CustomerZone).insert([
        { zone: 'North', short: 'N', group: groups[0] },
        { zone: 'South', short: 'S', group: groups[0] },

        { zone: 'Est', short: 'E', group: groups[1] },
        { zone: 'West', short: 'W', group: groups[1] },
      ])

      const customers = await remult.repo(Customer).insert([
        { name: 'Fay, Ebert and Sporer', city: 'London', zone: zones[0] },
        { name: 'Abshire Inc', city: 'New York', zone: zones[1] },
        { name: 'Larkin - Fadel', city: 'London', zone: zones[2] },
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
