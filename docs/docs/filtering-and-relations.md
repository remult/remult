# Filtering and Relations

In this article, we'll discuss several relevant techniques for one-to-many relations.
Consider the following scenario where we have a customer entity and an Orders entity.

We'll use the following entities and data for this article.

```ts
import { Entity, Field, Fields, remult, Relations } from 'remult'

@Entity('customers')
export class Customer {
  @Fields.autoIncrement()
  id = 0
  @Fields.string()
  name = ''
  @Fields.string()
  city = ''
  @Relations.toMany(() => Order)
  orders?: Order[]
}

@Entity('orders')
export class Order {
  @Fields.autoIncrement()
  id = 0
  @Relations.toOne(() => Customer)
  customer!: Customer
  @Fields.number()
  amount = 0
}
```

## Advanced Filtering

Let's say that we want to filter all the orders of customers who are in London.

### Option 1 use In Statement

```ts
console.table(
  await repo(Order).find({
    where: {
      customer: await repo(Customer).find({
        where: {
          city: 'London',
        },
      }),
    },
  }),
)
```

We can refactor this to a custom filter that will be easier to use and will run on the backend

```ts
import { Filter } from 'remult'

@Entity('orders', { allowApiCrud: true })
export class Order {
  //...
  static filterCity = Filter.createCustom<Order, { city: string }>(
    async ({ city }) => ({
      customer: await repo(Customer).find({ where: { city } }),
    }),
  )
}
```

And then we can use it:

```ts
console.table(
  await repo(Order).find({
    where: Order.filterCity({
      city: 'London',
    }),
  }),
)
```

#### Using Sql Capabilities

We can improve on the custom filter by using the database's in statement capabilities:

```ts
import { SqlDatabase } from 'remult'

@Entity('orders', { allowApiCrud: true })
export class Order {
  //...
  static filterCity = Filter.createCustom<Order, { city: string }>(
    async ({ city }) => {
      return SqlDatabase.rawFilter((whereFragment) => {
        whereFragment.sql = `customer in 
            (select id 
               from customers 
              where city = ${whereFragment.addParameterAndReturnSqlToken(
                city,
              )})`
      })
    },
  )
}
```

We can also reuse the entity definitions by using `dbNamesOf` and `filterToRaw`

```ts
import { dbNamesOf } from 'remult'

@Entity('orders', { allowApiCrud: true })
export class Order {
  //...
  static filterCity = Filter.createCustom<Order, { city: string }>(
    async ({ city }) => {
      const orders = await dbNamesOf(Order)
      const customers = await dbNamesOf(Customer)
      return SqlDatabase.rawFilter(async (whereFragment) => {
        whereFragment.sql = `${orders.customer} in 
               (select ${customers.id} 
                  from ${customers} 
                 where ${await whereFragment.filterToRaw(Customer, { city })})`
      })
    },
  )
}
```

### Option 2 use SqlExpression field

```ts
@Entity('orders', { allowApiCrud: true })
export class Order {
  //...
  @Fields.string<Order>({
    sqlExpression: async () => {
      const customer = await dbNamesOf(Customer)
      const order = await dbNamesOf(Order)
      return `(
          select ${customer.city}
            from ${customer}
           where ${customer.id} = ${order.customer}
          )`
    },
  })
  city = ''
}
```

- This adds a calculated `city` field to the `Order` entity that we can use to order by or filter

```ts
console.table(
  await repo(Order).find({
    where: {
      city: 'London',
    },
  }),
)
```
