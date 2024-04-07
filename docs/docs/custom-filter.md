# Leveraging Custom Filters for Enhanced Data Filtering

In modern web applications, efficiently filtering data is essential for providing a seamless user experience. Whether it's an e-commerce platform filtering products, a task management system sorting tasks, or any other application that requires data manipulation, the ability to apply complex filters is crucial. Custom filters offer a powerful solution, enabling developers to create reusable, declarative, and versatile filters that are executed on the backend and easily utilized from the frontend. This article delves into the concept of custom filters, illustrating their advantages and practical applications.

## The Advantages of Custom Filters

Custom filters provide several benefits that make them an attractive choice for handling data filtering in web applications:

1. **Declarative and Readable:** Custom filters allow you to express filtering logic in a clear, declarative manner. This improves code readability and maintainability, making it easier to understand and modify filtering criteria.

2. **Reusability:** By encapsulating filtering logic in custom filters, you can reuse the same filters across different parts of your application, reducing code duplication and ensuring consistency in filtering behavior.

3. **Backend Execution:** Custom filters are evaluated on the backend, leveraging the full capabilities of the underlying database or data provider. This enables more efficient data processing and allows you to perform complex operations that would be difficult or impossible to handle on the frontend.

4. **Composability:** Custom filters can be combined with other filters, both custom and standard, allowing you to build complex filtering logic in a modular and maintainable way.

5. **Flexibility with Data Providers:** Custom filters can be used with various data providers, including SQL databases, in-memory JSON arrays, and others. This flexibility allows you to apply custom filters in different contexts and with different data storage solutions.

6. **Enhanced Security:** When using custom filters with parameterized queries or data provider-specific filtering methods, you can mitigate the risk of injection attacks and ensure that user input is properly sanitized.

## Practical Example: Filtering Orders in an E-Commerce Application

Consider an e-commerce application where you need to filter orders based on their status and creation year. Without custom filters, the filtering logic might be repetitive and scattered throughout the codebase. By using custom filters, you can encapsulate this logic in a reusable component, simplifying the code and making it more maintainable.

In the following sections, we'll explore how to implement custom filters in this scenario, demonstrating their advantages and how they can be used to create more efficient and readable code.

## The Problem with Repetitive Filtering

Consider a scenario where you have an `Order` entity, and you frequently need to filter orders that are considered "active" based on their status and creation year. Without custom filters, your code might look something like this:

```ts
await repo(Order).find({
  where: {
    status: ['created', 'confirmed', 'pending', 'blocked', 'delayed'],
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1),
    },
  },
})
```

This code is not only repetitive but also clutters your application, making it harder to maintain. Moreover, it generates lengthy REST API calls, such as:

```
/api/orders?status.in=%5B%22created%22%2C%22confirmed%22%2C%22pending%22%2C%22blocked%22%2C%22delayed%22%5D&createdAt.gte=2023-12-31T22%3A00%3A00.000Z&createdAt.lt=2024-12-31T22%3A00%3A00.000Z
```

## Introducing Custom Filters

Custom filters allow you to refactor your filtering logic into a reusable and declarative component. Here's how you can define a custom filter for active orders:

```ts
class Order {
  //...
  static activeOrdersFor = Filter.createCustom<Order, { year: number }>(
    async ({ year }) => {
      return {
        status: ['created', 'confirmed', 'pending', 'blocked', 'delayed'],
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        },
      }
    },
  )
}
```

- **First Generic Parameter (`Order`):** This parameter specifies the entity class that the filter is associated with. In this case, it's the `Order` class. This is important because it ensures that the filter criteria you define are compatible with the fields and types of the `Order` entity.

- **Second Generic Parameter (`{ year: number }`):** This parameter defines the type of the argument that the filter will receive when executed. In this example, the filter expects an object with a single property `year` of type `number`. This allows you to pass dynamic values to the filter when you use it in a query, making the filter more flexible and reusable.

- **Callback Function (`async ({ year }) => { ... }`):** This function is where you define the actual filtering criteria. It receives an argument matching the type specified in the second generic parameter. Inside the function, you return an object representing the filter conditions. In this case, the conditions are based on the `status` and `createdAt` fields of the `Order` entity.

Now, you can use this custom filter in your queries:

```ts
await repo(Order).find({
  where: Order.activeOrders({ year }),
})
```

This generates a much simpler REST API call:

```
/api/orders?%24custom%24activeOrders=%7B%22year%22%3A2024%7D
```

## Composability of Custom Filters

One of the key advantages of custom filters is their ability to be composed with other filters. This means you can combine custom filters with regular filters or even other custom filters to build complex filtering logic.

Let's take a closer look at the example you provided:

```ts
await repo(Order).find({
  where: {
    customerId: '123',
    $and: [Order.activeOrders({ year })],
  },
})
```

In this query, we're filtering orders based on two criteria:

1. The `customerId` should be "123".
2. The order should satisfy the conditions defined in the `activeOrders` custom filter for the specified year.

By using the `$and` operator, we're able to combine the custom filter with a regular filter. This demonstrates the composability of custom filters, allowing you to build more complex and nuanced filtering logic while maintaining readability and reusability.

### More on Composability

The power of composability doesn't stop there. You can also combine multiple custom filters to create even more specific filters. For example, suppose you have another custom filter called `highValueOrders` that filters orders based on their total value:

```ts
class Order {
  //...
  static highValueOrders = Filter.createCustom<Order>(() => {
    return {
      totalValue: { $gt: 1000 },
    }
  })
}
```

You can then combine this with the `activeOrders` filter to find high-value active orders for a specific year:

```ts
await repo(Order).find({
  where: {
    $and: [Order.activeOrders({ year }), Order.highValueOrders()],
  },
})
```

This ability to compose filters allows you to create modular and reusable filtering logic, which can significantly improve the maintainability and clarity of your code.

### Evaluating Custom Filters on the Backend

One of the significant advantages of custom filters is that they are evaluated on the backend. This allows you to perform complex data-related operations that would be inefficient or impossible to do solely on the frontend. For instance, you can leverage database queries or other server-side logic to build your filtering criteria.

Let's examine the example you provided:

```ts
static activeOrders = Filter.createCustom<
  Order,
  { year: number; customerCity: string }
>(async ({ year, customerCity }) => {
  const customers = await repo(Customer).find({
    where: { city: customerCity },
  })
  return {
    customerId: { $in: customers.map((c) => c.id) },
    status: ["created", "confirmed", "pending", "blocked", "delayed"],
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1),
    },
  }
})
```

In this example, the custom filter `activeOrders` now takes an additional parameter `customerCity`. The filter performs a database query to fetch all customers from the specified city. It then uses the IDs of these customers to filter orders that belong to them. This is combined with the existing criteria of filtering orders based on their status and creation year.

### Key Points

- **Backend Evaluation:** The filter is evaluated on the backend, where it has access to the database and can perform efficient queries. This offloads complex data processing from the frontend to the backend, where it can be handled more effectively.
- **Complex Filtering:** By leveraging backend capabilities, you can create filters that involve complex operations, such as fetching related data from other tables or entities (in this case, fetching customers based on their city).
- **Asynchronous Operations:** Notice the use of `async` in the filter definition. This allows you to perform asynchronous operations, such as database queries, within your custom filter.

## Leveraging Database Capabilities with Raw SQL in Custom Filters

Since custom filters are **evaluated on the backend**, you have the opportunity to harness the raw capabilities of the underlying database. This can be particularly useful when you need to perform complex operations that are more efficiently handled by the database itself. For instance, you can use raw SQL queries to improve the performance or functionality of your custom filters.

Let's modify the `activeOrders` custom filter to use a raw SQL query for filtering orders based on the customer's city:

```ts
static activeOrders = Filter.createCustom<
  Order,
  { year: number; customerCity: string }
>(async ({ year, customerCity }) => {
  return {
    status: ["created", "confirmed", "pending", "blocked", "delayed"],
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1),
    },
    $and: [
      SqlDatabase.rawFilter(({param}) =>  // [!code highlight]
        `"customerId" in (select id from customers where city = ${param(customerCity)})` // [!code highlight]
      ), // [!code highlight]
    ],
  }
})
```

In this example, we've added a `$and` condition that uses `SqlDatabase.rawFilter` to include a raw SQL fragment in our filter. This SQL fragment selects the IDs of customers from the specified city and uses them to filter the orders.

This generates the following sql:

```sql
select "id", "status", "customerId", "createdAt"
from "orders"
where "status" in ($2, $3, $4, $5, $6)
and "createdAt" >= $7
and "createdAt" < $8
and ("customerId" in (select id from customers where city = $9))
Order By "id"
```

#### Important Notes

- **Parameterized Queries:** It's crucial to use parameterized queries (e.g., `builder.param(customerCity)`) when incorporating user-supplied values into your SQL queries. This helps prevent SQL injection attacks by ensuring that user input is properly escaped.
- **Performance Considerations:** Leveraging raw SQL can lead to significant performance improvements, especially for complex queries. However, it's important to ensure that your SQL queries are well-optimized to avoid potential performance issues.

#### Usage Example

Using the custom filter remains straightforward:

```ts
await repo(Order).find({
  where: Order.activeOrders({ year: 2024, customerCity: 'New York' }),
})
```

### Using `dbNamesOf` with Table Names and Aliases

The `dbNamesOf` utility function can be customized to include the table name in the SQL queries. This is particularly useful for ensuring consistency between your entity definitions and your raw SQL queries.

Here's an updated example of the `activeOrders` custom filter using `dbNamesOf` with table names and aliases:

```ts
static activeOrders = Filter.createCustom<
  Order,
  { year: number; customerCity: string }
>(async ({ year, customerCity }) => {
  const order = await dbNamesOf(Order, { // [!code highlight]
    tableName: true, // [!code highlight]
  })
  const customer = await dbNamesOf(Customer, { // [!code highlight]
    tableName: "c", // [!code highlight]
  }) // [!code highlight]

  return {
    status: ["created", "confirmed", "pending", "blocked", "delayed"],
    createdAt: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1),
    },
    $and: [
      SqlDatabase.rawFilter(({param}) => // [!code highlight]
        `${order.customerId} in (select ${customer.id} from ${customer} as c // [!code highlight]
           where c.${customer.city} = ${param(customerCity)})` // [!code highlight]
      ),
    ],
  }
})
```

In this example:

- The `Order` table is referenced with its full name.
- The `Customer` table is aliased as `"c"`, and this alias is used in the SQL query.

### Explanation of `tableName` and Aliases

- **`tableName: true`:** By setting `tableName: true`, you indicate that you want to include the table name when referring to fields, resulting in SQL expressions like `"customer"."id"`.
- **Aliases:** You can use aliases for table names, which is particularly useful in complex join scenarios. For example, setting `tableName: "c"` would use the alias `"c"` for the table name in the SQL query.

### Resulting SQL Query

Using the `activeOrders` custom filter with the enhancements mentioned above would generate the following SQL query:

```sql
select "id", "status", "customerId", "createdAt"
from "orders"
where "status" in ($2, $3, $4, $5, $6)
and "createdAt" >= $7
and "createdAt" < $8
and ("orders"."customerId" in (select "c"."id" from "customers" as c
           where c."city" = $9))
Order By "id"
```

In this SQL query, the `Customer` table is aliased as `"c"`, and this alias is used throughout the query to ensure consistency with the entity definitions and to handle complex join scenarios effectively.

### SQL-Based Custom Filters: Unleashing the Power of Composability

The greatest advantage of using SQL-based custom filters lies in their composability and the ability to handle complex situations. By breaking down filtering logic into smaller, atomic custom filters, developers can compose these filters to create more sophisticated and nuanced filtering criteria. This modular approach not only enhances the readability and maintainability of the code but also allows for greater flexibility in constructing complex queries.

For instance, consider a scenario where you need to filter orders based on multiple criteria, such as status, creation year, customer location, and order value. By creating separate custom filters for each of these criteria, you can easily combine them to form a comprehensive filtering solution. This composability ensures that your filtering logic can adapt to various requirements without becoming convoluted or difficult to manage.

Furthermore, the ability to handle complex situations is a significant advantage of SQL-based custom filters. By leveraging the raw power of SQL, you can perform advanced operations such as subqueries, joins, and aggregate functions directly within your filters. This opens up a wide range of possibilities for data analysis and manipulation, enabling you to tackle complex filtering scenarios with ease.

In summary, the composability of SQL-based custom filters, coupled with their ability to handle complex situations, makes them an invaluable tool for developers seeking to create flexible, efficient, and powerful data filtering solutions in their web applications.

### Using Raw Filters with Different Data Providers

Custom filters with raw filters are not limited to SQL databases. You can also use raw filters with other data providers, such as Knex or an in-memory JSON data provider. This flexibility allows you to leverage the power of raw filters in various contexts, depending on your application's needs.

#### Knex Example

Knex is a popular SQL query builder for Node.js. You can use Knex with custom filters to define complex filtering logic directly using the Knex query builder syntax.

```typescript
static idBetween = Filter.createCustom<Task, {
  from: number,
  to: number
}>(
  ({ from, to }) => {
    return KnexDataProvider.rawFilter(({ knexQueryBuilder }) => {
      knexQueryBuilder.andWhereBetween('id', [from, to]);
    });
  }
);
```

In this example, the `idBetween` custom filter uses Knex to filter `Task` entities whose `id` falls between the specified `from` and `to` values.

#### JSON Example

For applications that use an in-memory JSON data provider, you can define custom filters that operate directly on the JSON data.

```typescript
static titleLengthFilter = Filter.createCustom<Task, { minLength: number }>(
  ({ minLength }) => {
    return ArrayEntityDataProvider.rawFilter((item) => {
      return item.title?.length > minLength;
    });
  }
);
```

In this example, the `titleLengthFilter` custom filter filters `Task` entities based on the length of their `title` property, ensuring that it exceeds the specified `minLength`.

## Conclusion

Custom filters represent a powerful tool in the arsenal of web developers, offering a flexible and efficient way to handle data filtering in web applications. By encapsulating filtering logic into reusable components, custom filters not only enhance code readability and maintainability but also enable the execution of complex filtering operations on the backend. This leads to improved performance and security, as well as the ability to compose intricate filtering criteria with ease.

The versatility of custom filters extends to their compatibility with various data providers, from SQL databases to in-memory JSON arrays, allowing developers to leverage the most suitable data handling mechanisms for their specific use cases. Moreover, the declarative nature of custom filters ensures that the filtering logic remains clear and concise, facilitating easier debugging and future modifications.

In conclusion, adopting custom filters in your web development projects can significantly streamline the process of data filtering, resulting in cleaner, more efficient, and more secure code. By embracing this approach, developers can focus on delivering a seamless user experience, confident in the knowledge that their data filtering logic is both robust and adaptable.
