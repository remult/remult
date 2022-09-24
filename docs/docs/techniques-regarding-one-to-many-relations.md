# Techniques regarding one to many relations

In this article, we'll discuss several relevant techniques for one-to-many relations.
Consider the following scenario where we have a customer entity and an Orders entity.

We'll use the following entities and data for this article.
```ts
import { Entity, Field, Fields, remult } from "remult";

@Entity("customers", { allowApiCrud: true })
export class Customer {
  @Fields.uuid()
  id!: string;
  @Fields.string()
  name = '';
  @Fields.string()
  city = '';
}

@Entity("orders", { allowApiCrud: true })
export class Order {
  @Fields.uuid()
  id!: string;
  @Field(() => Customer)
  customer!: Customer
  @Fields.number()
  amount = 0;
}

export async function seed() {
  const customerRepo = remult.repo(Customer);
  if (await customerRepo.count() === 0) {
    const customers = await customerRepo.insert([
      { name: 'Fay, Ebert and Sporer', city: 'London' },
      { name: 'Abshire Inc', city: 'New York' },
      { name: 'Larkin - Fadel', city: 'London' }])
    await remult.repo(Order).insert([
      { customer: customers[0], amount: 10 },
      { customer: customers[0], amount: 15 },
      { customer: customers[1], amount: 40 },
      { customer: customers[1], amount: 5 },
      { customer: customers[1], amount: 7 },
      { customer: customers[2], amount: 90 },
      { customer: customers[2], amount: 3 }])
  }
}
```




## Advanced Filtering
Let's say that we want to filter all the orders of customers who are in London.

### Option 1 use In Statement
```ts
console.table(await remult.repo(Order).find({
  where: {
    customer: await remult.repo(Customer).find({
      where: {
        city: 'London'
      }
    })
  }
}))
```

We can refactor this to a `customFilter` that will be easier to use and will run on the backend

```ts
@Entity("orders", { allowApiCrud: true })
export class Order {
  //...
  static filterCity = Filter.createCustom<Order, { city: string }>(async ({ city }) => ({
    customer: await remult.repo(Customer).find({ where: { city } })
  }));
}
```

And then we can use it:
```ts
console.table(await remult.repo(Order).find({
  where: Order.filterCity({
    city: 'London'
  })
}))
```

#### Using Sql Capabilities
We can improve on the customFilter by using the database's in statement capabilities:
```ts
@Entity("orders", { allowApiCrud: true })
export class Order {
  //...
  static filterCity = Filter.createCustom<Order, { city: string }>(
    async ({ city }) => {
      return SqlDatabase.customFilter(
        whereFragment => {
          whereFragment.sql =
            `select customer in 
            (select id 
               from customers 
              where city = ${whereFragment.addParameterAndReturnSqlToken(city)})`
        });
    });
}
```

We can also reuse the entity definitions by using `dbNamesOf` and `sqlCondition`
```ts
@Entity("orders", { allowApiCrud: true })
export class Order {
  //...
  static filterCity = Filter.createCustom<Order, { city: string }>(
    async ({ city }) => {
      const orders = await dbNamesOf(Order);
      const customers = await dbNamesOf(Customer);
      return SqlDatabase.customFilter(
        async whereFragment => {
          whereFragment.sql =
            `${orders.customer} in 
               (select ${customers.id} 
                  from ${customers} 
                 where ${await whereFragment.sqlCondition(Customer, { city })})`
        });
    });
}
```

### Option 2 use SqlExpression field

```ts
@Entity("orders", { allowApiCrud: true })
export class Order {
  //...
  @Fields.string({
    sqlExpression: async () => {
      const order = await dbNamesOf(Order);
      const customer = await dbNamesOf(Customer);
      return `(
          select ${customer.city}
            from ${customer}
           where ${customer.id} = ${order.customer}
          )`;
    }
  })
  city = '';
}
```

* This adds a calculated `city` field to the `Order` entity that we can use to order by or filter

```ts
console.table(await remult.repo(Order).find({
  where: {
    city: 'London'
  }
}))
```




## Print Customers and Orders
```ts
for (const customer of await remult.repo(Customer).find()) {
  console.log(customer.name);
  console.table(await remult.repo(Order).find({ where: { customer } }));
}
```
#### Alternative 1
```ts
const customers = await remult.repo(Customer).find();
const orders = await remult.repo(Order).find({
  //this will returns all orders for the customers in the customers array
  where: { customer: customers }
})
for (const customer of customers) {
  console.log(customer.name);
  console.table(orders.filter(o => o.customer.id === customer.id));
}
```

#### Alternative 2
```ts
const orders = await remult.repo(Order).find();
const customers = orders.reduce<Customer[]>(
  (customers, order) =>
    customers.includes(order.customer) ?
      customers :
      [...customers, order.customer]
  , []);
for (const customer of customers) {
  console.log(customer.name);
  console.table(orders.filter(o => o.customer.id === customer.id));
}
```

#### Alternative 3
```ts
const orders = await remult.repo(Order).find();
const customers = orders.reduce<[Customer, Order[]][]>(
  (result, order) => {
    let customerOrders = result.find(item => item[0] === order.customer);
    if (!customerOrders)
      result = [...result, customerOrders = [order.customer, []]];
    customerOrders[1].push(order);
    return result
  }
  , []);
for (const [customer, customerOrders] of customers) {
  console.log(customer.name);
  console.table(customerOrders);
}
```