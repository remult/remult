---
type: lesson
title: Sql Relations Filter
template: relations
focus: /shared/Order.ts
---

### SQL Relations Filter

:::warn
**Experimental Feature:** This API is subject to change in future versions of Remult.
:::

Filtering based on relations can be a powerful tool when querying data that involves multiple interconnected entities. The new `sqlRelationsFilter` function is designed to simplify and streamline filtering data based on relational information while utilizing the power of SQL for performance.

### What is `sqlRelationsFilter`?

`sqlRelationsFilter` is a utility designed for simplifying the process of filtering entities based on relational data by using SQL's capabilities to execute the filtering on the backend. It leverages Remult’s entity relations and generates SQL queries that optimize how you query data.

Let's consider an example where we want to filter orders based on their related customer’s city:

```file:/shared/Order.ts title="shared/Order.ts" collapse={1-9,11-22} {26-30}

```

### Breakdown of the Code

1. **Filter Definition**:
   - The `fromCity` filter is defined as a custom filter using `Filter.createCustom`. It takes a single argument, `city`, which will be used to filter orders based on the related customer’s city.
2. **Using `sqlRelationsFilter`**:
   - `sqlRelationsFilter(Order)` is called to set up a filter for the `Order` entity. This function simplifies the task of querying orders based on their relationships (in this case, the `customer` relation).
3. **`customer.some()`**:

   - The `.some()` method is applied to the `customer` relation. It allows you to define a condition that checks whether any related `Customer` entity satisfies the condition. In this case, we are looking for customers whose city contains the specified string (`$contains: city`).

4. **SQL Efficiency**:
   - Behind the scenes, `sqlRelationsFilter` translates this logic into an optimized SQL query that performs the filtering on the backend. This ensures that even complex relation-based filters are executed efficiently at the database level.

### Why Use `sqlRelationsFilter`?

- **Simplified Syntax**: `sqlRelationsFilter` reduces the complexity of writing relation-based queries by abstracting away the SQL translation. You define the filter conditions declaratively, and the utility handles the SQL generation.
- **SQL Power**: While the filter is defined in a high-level, declarative way, it leverages the full power of SQL for execution. This ensures that your relation-based filters are as performant as possible.

- **Optimized for Relations**: Filtering based on relations (e.g., orders based on customer data) can be tricky when working with large datasets. `sqlRelationsFilter` optimizes this process by generating SQL that efficiently queries relational data, preventing performance bottlenecks in your application.

### Example of How to Use It in Your Application

Let’s say you have a frontend application where you want to display orders based on the customer’s city. You can use the `fromCity` filter directly in your component or page like this:

```file:/frontend/Page.tsx title="/frontend/Page.tsx" collapse={1-6,23-37} add={12}

```

### SQL Efficiency and Security

- **Efficient Backend Execution**: Using `sqlRelationsFilter`, the filter is executed directly on the backend. This ensures that the heavy lifting of filtering large datasets is done by the database, not the frontend, improving performance and reducing load times.
- **Security**: Since the filter is executed on the backend, it mitigates risks such as SQL injection. Additionally, all parameters are properly sanitized, ensuring a secure and efficient query execution.

### Example of Generated SQL

Using `sqlRelationsFilter`, a query like the one above may generate the following SQL:

```sql
SELECT "orders"."id", "orders"."orderDate", "orders"."amount", "orders"."customerId"
FROM "orders"
WHERE "orders"."customerId" IN (
  SELECT "customers"."id"
  FROM "customers"
  WHERE "customers"."city" LIKE '%New York%'
);
```

This SQL query:

- Selects orders where the related customer is from a city that contains "New York".
- Uses an efficient `IN` clause to find matching customer IDs and returns the associated orders.

### Summary of Benefits

- **Simple Syntax**: `sqlRelationsFilter` provides a clean, declarative way to filter based on relations.
- **Performance**: The filter is translated to efficient SQL that is executed on the backend, leveraging the power of the underlying database.
- **Security**: By handling filters on the server, it ensures that queries are properly sanitized and secure.
- **Optimized for Relations**: Specifically designed for cases where you need to filter entities based on related entities, such as filtering orders based on customer information.

---

With `sqlRelationsFilter`, handling relation-based filtering in Remult becomes simpler, more efficient, and more powerful. Whether you’re working with large datasets or complex relational models, this utility helps you build queries that are both performant and easy to maintain.
