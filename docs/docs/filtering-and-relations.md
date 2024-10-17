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

::: tip Use Case in this article
Let's say that we want to filter all the orders of customers who are in London.

Let's have a look at the different options to achieve this.
:::

## Option 1 - Use In Statement

Add the `where` inline to the `find` method.

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

## Option 2 - Use Custom Filter

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

## Option 3 - Custom Filter (SQL)

We can improve on the custom filter by using the database's in statement capabilities:

```ts
import { SqlDatabase } from 'remult'

@Entity('orders', { allowApiCrud: true })
export class Order {
  //...
  static filterCity = Filter.createCustom<Order, { city: string }>(
    async ({ city }) =>
      SqlDatabase.rawFilter(
        ({ param }) =>
          `customer in (select id from customers where city = ${param(city)})`,
      ),
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
      return SqlDatabase.rawFilter(
        async ({ filterToRaw }) =>
          `${orders.customer} in 
               (select ${customers.id} 
                  from ${customers} 
                 where ${await filterToRaw(Customer, { city })})`,
      )
    },
  )
}
```

## Option 4 - sqlExpression field

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

::: details Side Note
In this option, `city` is always calculated, and the `sqlExpression` is always executed. Not a big deal, but it's woth mentioning. (Check out Option 5 for a solution)
:::

## Option 5 - Dedicated entity

```ts
export class OrderWithCity extends Order {
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

Like this, in your code, you can use `OrderWithCity` or `Order` depending on your needs.

::: tip
As `OrderWithCity` extends `Order`, everything in `Order` is also available in `OrderWithCity` 🎉.
:::
