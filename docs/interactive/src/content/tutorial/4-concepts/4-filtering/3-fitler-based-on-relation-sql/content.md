---
type: lesson
title: Filter Based on Relation Using SQL
template: relations
focus: /shared/Order.ts
---

# Filter Based on Relation Using SQL

In this lesson, we'll explore how to perform advanced filtering using SQL directly within custom filters. While Remult allows us to define filters using high-level syntax, there are cases where SQL queries can provide even more control, flexibility, and performance for filtering based on related entities.

Imagine a scenario where you want to filter orders based on the city of the customer, but this time, we'll leverage raw SQL to enhance performance, handle more complex conditions, and directly access the underlying database features.

## Why Use SQL in Custom Filters?

- **Performance**: SQL-based filters allow you to use the full power of the database's query optimizer, ensuring that complex joins and subqueries are handled efficiently.
- **Advanced Capabilities**: SQL provides access to advanced features like joins, aggregate functions, and subqueries, which can be harder to express in high-level filtering syntax.
- **Flexibility**: SQL filters allow for precise control over how your queries are executed, including optimizations like using indexes or specific execution plans.
- **Backend Execution**: Since these filters run on the server, they take advantage of server-side resources and avoid transferring unnecessary data to the frontend.

## Scenario: Filtering Orders by Customer's City Using SQL

Let's revisit our previous example where we filtered orders based on the customer's city. This time, we'll implement the filter using raw SQL for maximum control and efficiency.

In the `Order` entity, we'll define a custom filter using `SqlDatabase.rawFilter` to filter orders by the `city` field from the related `Customer` entity.

```file:/shared/Order.ts title="shared/Order.ts" collapse={1-15,17-27} {29-47}

```

### Explanation of the Code

1. **Using `dbNamesOf`**:

   - The `dbNamesOf` utility is used to dynamically generate the correct column names for the `Order` and `Customer` entities, including the table name prefixes. This ensures that the generated SQL query matches the database schema and avoids potential naming conflicts.
   - For the `Customer` entity, we specify an alias (`'c'`) for the table to make the SQL query more readable.

2. **SQL-Based Filter**:

   - The `SqlDatabase.rawFilter` function allows us to define a custom SQL query for filtering. We use a subquery to select the `id` values of customers whose `city` matches the provided value. These `id` values are then used to filter orders based on the `customerId` field.
   - The `param` function ensures that the city parameter is properly escaped, protecting against SQL injection and improving security.

3. **Efficiency**: By using SQL directly, we ensure that the filtering is performed in the database, leveraging its optimized querying capabilities. This is particularly useful for large datasets or complex conditions.

---

## Step 2: Using the SQL Filter on the Frontend

Now, let's use the `fromCity` SQL-based custom filter in the frontend component to fetch orders where the customer's city matches "London" or "New York".

```file:/frontend/Page.tsx title="/frontend/Page.tsx" collapse={1-6,23-37} add={12}

```

### Explanation of the Frontend Code

1. **Using the SQL Filter**:

   - We use the `fromCity` custom filter to retrieve orders from customers whose city contains "New York". This filter is applied as part of the `find` query, **just like using any other filter**. The fact that this filter is SQL-based is abstracted away in the frontend code, making it seamless for developers to use without needing to worry about the underlying SQL logic.
   - We also apply an additional condition to filter orders where the `amount` is greater than 5, further showcasing how custom filters can be combined with standard filters for flexible data retrieval.

2. **Combining Filters**:

   - The `$and` operator is used to combine the SQL-based filter with other conditions, such as filtering by order `amount`. This demonstrates the **composability of filters**, where you can easily build more complex queries by combining different filtering logic together.

3. **Displaying the Data**:

   - The customer details (including the city) are included in the result and displayed alongside the order information in the frontend. The SQL filter seamlessly integrates into the data retrieval process, with the **SQL being evaluated on the backend** to maximize security and efficiency. By keeping the SQL processing on the server, the risk of exposing sensitive logic or data manipulation vulnerabilities on the client side is greatly reduced.

   This approach allows you to write highly performant and secure filters while maintaining a clean and familiar syntax on the frontend. The backend handles the complexity and ensures that only the necessary data is passed to the frontend, without exposing raw SQL queries or internal database structures.

---

## SQL Query Logging

To help debug and optimize your queries, you can enable SQL query logging in Remult. This will print the actual SQL queries being executed to the terminal, allowing you to inspect the generated SQL and ensure it's behaving as expected.

To enable SQL logging, simply add the following line to your code:

```ts
SqlDatabase.LogToConsole = true
```

With this enabled, the SQL queries executed by Remult will be logged to the console, giving you insight into how your filters are being translated into SQL.

---

### Translating Standard EntityFilter to SqlFilter Using `filterToRaw`

One of the powerful features of Remult is the ability to translate standard `EntityFilter` objects into SQL queries using `filterToRaw`. This allows you to define filters in a more declarative, high-level way while still taking advantage of SQL's performance and flexibility on the backend. In this section, we'll demonstrate how using `filterToRaw` within a custom filter can enhance flexibility and reduce complexity.

#### Example: `fromCity` Filter with `filterToRaw`

In this example, we enhance the `fromCity` custom filter by using `filterToRaw` to dynamically translate a standard `EntityFilter` into a SQL query. This approach combines the declarative nature of `EntityFilter` with the efficiency of SQL-based filtering.

```solution:/shared/Order.ts title="shared/Order.ts" collapse={1-15,17-28} {42,44-46}

```

### Breakdown of the Code

1. **Declarative Filter with `EntityFilter`**:

   - Instead of manually crafting a SQL filter for the customer's `city` field, we define a standard `EntityFilter` using `{ city: { $contains: city } }`. This makes the filter more flexible, readable, and consistent with how you would typically filter data using Remult.

2. **Dynamic SQL Translation with `filterToRaw`**:

   - The `filterToRaw` function takes the `EntityFilter` and translates it into a SQL condition. This SQL condition is then inserted directly into the larger SQL query that filters orders based on their associated customers' cities.
   - In this case, we are dynamically generating the `WHERE` clause for the `Customer` table to match records where the `city` contains the specified string.

3. **Efficient SQL Query Generation**:
   - The final SQL query is generated based on both the `EntityFilter` for the `Customer` and the overall filter for the `Order`. This ensures that the query is executed efficiently on the backend, leveraging the power of SQL to perform the filtering operation.
   - By relying on `filterToRaw`, the SQL translation is handled automatically, ensuring that the query is optimized and preventing potential errors when manually crafting SQL conditions.

### Advantages of Using `filterToRaw`

1. **Simplified Code**:

   - Using `filterToRaw` allows you to avoid manually writing raw SQL conditions for each filter. Instead, you can rely on the higher-level, declarative `EntityFilter` syntax, which is easier to read, maintain, and reuse.

2. **Consistency Across Filters**:

   - `filterToRaw` ensures that your filters are consistent with how filtering is typically done in Remult. Whether you are using the standard `find` method or a custom SQL-based filter, the filter logic remains the same, reducing duplication and potential errors.

3. **Leverage SQL Efficiency**:

   - While the filter is written in a declarative form, it is translated into highly efficient SQL that runs on the backend. This ensures that complex filtering logic can still take advantage of SQL's performance and indexing capabilities.

4. **Flexibility**:
   - With `filterToRaw`, you can easily apply other standard Remult filters in conjunction with SQL-based filters. This allows you to build complex filtering logic without losing the benefits of either approach.

### Example of Generated SQL Query

When using the `fromCity` filter with `filterToRaw`, the following SQL query might be generated:

```sql
SELECT "id", "status", "customerId", "orderDate", "amount"
FROM "orders"
WHERE "customerId" IN (
  SELECT "c"."id"
  FROM "customers" AS c
  WHERE c."city" LIKE '%New York%'
)
ORDER BY "orderDate" ASC
```

In this example:

- The `filterToRaw` function dynamically translates the `{ city: { $contains: city } }` filter into the SQL condition `c."city" LIKE '%New York%'`.
- This SQL is then combined with the main query that retrieves the orders, ensuring that the filter is efficiently executed on the backend.

### Conclusion

By using `filterToRaw`, you can combine the best of both worlds: the simplicity and readability of declarative filters with the power and performance of SQL-based filtering. This approach not only simplifies your code but also ensures that your filters are executed efficiently on the server, making it ideal for complex data retrieval scenarios.

## Benefits of SQL-Based Filters

### 1. Performance

SQL-based filters allow you to take full advantage of the database's query optimizer, which can significantly improve the performance of complex filtering operations. By offloading the filtering to the database, you can reduce the amount of data that needs to be transferred to the frontend and improve response times.

### 2. Full Control Over SQL Queries

When using SQL-based filters, you have full control over the generated SQL queries. This allows you to fine-tune the queries for specific use cases, optimize performance, and handle complex conditions that may be difficult to express using high-level filtering syntax.

### 3. Handling Complex Relations

With SQL, you can handle complex relational queries that involve multiple entities, joins, subqueries, and more. This is especially useful when working with large datasets or when you need to perform operations that go beyond simple filtering.

### 4. Backend Execution

By executing the SQL queries on the backend, you leverage the full power of the server's database, ensuring efficient data processing. This also minimizes the load on the frontend and reduces data transfer, leading to better performance and scalability.

---

## Summary

In this lesson, we've explored how to use raw SQL within custom filters to perform advanced filtering based on relations. By leveraging SQL, you can take full advantage of the database's querying capabilities, handle complex relational logic, and improve the performance of your application.

By combining SQL-based filters with the power of Remult, you can create highly efficient and flexible filtering logic that runs on the backend, making it a powerful tool for building scalable and performant web applications.
