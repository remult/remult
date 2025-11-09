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
import {
  sqlRelations,
  sqlRelationsFilter,
} from '../../../../core/src/data-providers/sql-relations.js'

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

describe('sql-relations', () => {
  it('should count column second variation', async () => {
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

  it('should get value column', async () => {
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

  it('should filter', async () => {
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
  it('should filter', async () => {
    expect(
      (
        await remult.repo(Order).find({
          where: sqlRelationsFilter(Order).customer.some({
            city: 'New York',
          }),
        })
      ).map((x) => x.id),
    ).toMatchInlineSnapshot(`
      [
        3,
        4,
        5,
      ]
    `)
  })

  it('should get relation even at entity + 2', async () => {
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
    //SqlDatabase.LogToConsole = true
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

  it('should get expression from another field with expression', async () => {
    // order -> customer -> zone -> group
    // @Entity('customers')
    // class CustomerExtended extends Customer {
    //   @Fields.string({
    //     sqlExpression: () => sqlRelations(CustomerExtended).zone.group,
    //   })
    //   zoneGroupId = ''
    //   @Relations.toOne(() => CustomerGroup, { field: 'zoneGroupId' })
    //   zoneGroup?: CustomerGroup
    // }
    @Entity('orders')
    class OrdersExtended extends Order {
      @Fields.string({
        sqlExpression: () => sqlRelations(OrdersExtended).customer.zone,
      })
      customerZoneId = ''
      @Relations.toOne(() => CustomerZone, { field: 'customerZoneId' })
      customerZone?: CustomerZone

      @Fields.string({
        sqlExpression: () =>
          // This this one in my app having the error with recurssive sqlExpression
          sqlRelations(OrdersExtended).customerZone.group,
      })
      customerZoneGroupId = ''
      @Relations.toOne(() => CustomerGroup, { field: 'customerZoneGroupId' })
      customerZoneGroup?: CustomerGroup
    }

    expect(
      (await remult.repo(OrdersExtended).find()).map((x) => ({
        id: x.id,
        customerZoneId: x.customerZoneId,
        customerZoneGroupId: x.customerZoneGroupId,
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "customerZoneGroupId": "1",
          "customerZoneId": "1",
          "id": 1,
        },
        {
          "customerZoneGroupId": "1",
          "customerZoneId": "1",
          "id": 2,
        },
        {
          "customerZoneGroupId": "1",
          "customerZoneId": "2",
          "id": 3,
        },
        {
          "customerZoneGroupId": "1",
          "customerZoneId": "2",
          "id": 4,
        },
        {
          "customerZoneGroupId": "1",
          "customerZoneId": "2",
          "id": 5,
        },
        {
          "customerZoneGroupId": "2",
          "customerZoneId": "3",
          "id": 6,
        },
        {
          "customerZoneGroupId": "2",
          "customerZoneId": "3",
          "id": 7,
        },
      ]
    `)
  })

  it('should get first element (direct)', async () => {
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

  it('should get first element (with subQuery)', async () => {
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

  it('should get first element (with distance)', async () => {
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

  it('should get first element (with raw subQuery)', async () => {
    @Entity('customers')
    class CustomerExtended extends Customer {
      @Fields.number({
        sqlExpression: () =>
          sqlRelations(CustomerExtended).orders.$first({
            orderBy: { id: 'desc' },
          }).amount,
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

  it('zones should have the number of customers (+1) & number of orders (+2)', async () => {
    @Entity('Customer_zones')
    class CustomerZoneExtended extends CustomerZone {
      @Relations.toMany(() => Customer, { field: 'zone' })
      customers?: Customer

      @Fields.number({
        sqlExpression: () =>
          sqlRelations(CustomerZoneExtended).customers.$count(),
      })
      customerCount = 0

      @Fields.number({
        sqlExpression: () =>
          // TODO : What do you think Noam? Could be easier ? or ?
          // sqlRelations(CustomerZoneExtended).customers.$sum().$relations.orders.$count(),
          sqlRelations(CustomerZoneExtended).customers.$subQuery(
            async () => `SUM(${await sqlRelations(Customer).orders.$count()})`,
          ),
      })
      orderCount?: number | null = null
    }
    expect(
      (await remult.repo(CustomerZoneExtended).find()).map((x) => ({
        zone: x.zone,
        customerCount: x.customerCount,
        orderCount: x.orderCount,
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "customerCount": 1,
          "orderCount": 2,
          "zone": "North",
        },
        {
          "customerCount": 1,
          "orderCount": 3,
          "zone": "South",
        },
        {
          "customerCount": 1,
          "orderCount": 2,
          "zone": "Est",
        },
        {
          "customerCount": 0,
          "orderCount": null,
          "zone": "West",
        },
      ]
    `)
  })

  it('should have the number of customers', async () => {
    @Entity('Customer_zones')
    class CustomerZoneExtended extends CustomerZone {
      @Relations.toMany(() => Customer, { field: 'zone' })
      customers?: Customer[]

      // @Relations.toMany(() => Order, {
      //   SQLException: () => sqlRelations(CustomerZoneExtended).customers.orders,
      // })
      // ordersForPremiumUser?: Order[]
    }

    expect(
      (
        await remult
          .repo(CustomerZoneExtended)
          .find({ include: { customers: { include: { orders: true } } } })
      ).map((x) => {
        return {
          zone: x.zone,
          orders: x.customers?.flatMap((c) => c.orders) ?? [],
        }
      }),
    ).toMatchInlineSnapshot(`
      [
        {
          "orders": [
            Order {
              "amount": 10,
              "id": 1,
            },
            Order {
              "amount": 15,
              "id": 2,
            },
          ],
          "zone": "North",
        },
        {
          "orders": [
            Order {
              "amount": 40,
              "id": 3,
            },
            Order {
              "amount": 5,
              "id": 4,
            },
            Order {
              "amount": 7,
              "id": 5,
            },
          ],
          "zone": "South",
        },
        {
          "orders": [
            Order {
              "amount": 90,
              "id": 6,
            },
            Order {
              "amount": 3,
              "id": 7,
            },
          ],
          "zone": "Est",
        },
        {
          "orders": [],
          "zone": "West",
        },
      ]
    `)
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
