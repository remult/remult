---
type: lesson
title: Introduction
template: relations
focus: /shared/Customer.ts
---

### SQL Expressions for Entity Fields

In Remult, `sqlExpression` fields provide a convenient way to bring SQL’s computational power directly into your entity fields. This allows you to define fields based on SQL expressions, which perform calculations on the backend and can be easily used for sorting and filtering, making your application more efficient and reducing the need for additional queries.

---

## Example: Total Order Amount for Each Customer

In this example, we’ll add a `totalAmount` field to the `Customer` entity. This field calculates the total order amount for each customer using a SQL sum function, which aggregates the `amount` field from the `Order` table.

```file:/shared/Customer.ts title="shared/Customer.ts" collapse={1-4,6-13} add={15-26}

```

### Explanation of the Code

- **`sqlExpression`**: The `sqlExpression` option allows you to define a SQL-based calculation as an entity field. Here, it’s used to sum up the `amount` values in the `Order` table where the `customerId` matches the current customer’s ID.
- **`dbNamesOf` Utility**: This function ensures that the table and column names align with the database schema, providing consistency and accuracy when constructing SQL queries.
- **Dynamic Calculation**: The `totalAmount` field dynamically calculates the sum of order amounts for each customer, offering real-time insights into customer spending.

### Using `totalAmount` in Queries

With `sqlExpression`, you can treat `totalAmount` like a standard field, enabling advanced filtering and sorting directly within your queries.

#### Sorting by `totalAmount`

To retrieve customers ordered by the total amount they’ve spent, in descending order:

```ts
const customersSortedByAmount = await repo(Customer).find({
  orderBy: {
    totalAmount: 'desc',
  },
})
```

#### Filtering by `totalAmount`

You can also filter customers based on their total spending. For example, to find customers who have spent more than $50:

```ts
const highSpendingCustomers = await repo(Customer).find({
  where: {
    totalAmount: { $gt: 50 },
  },
})
```

In this query:

- The `where` condition filters customers based on their `totalAmount`, letting you retrieve only those who meet the specified spending criteria.
- As the calculation is performed on the backend, it remains efficient even with large datasets.

---

## Benefits of `sqlExpression`

1. **Backend Efficiency**: By offloading calculations to the database, `sqlExpression` fields enable faster query performance, especially for large datasets.
2. **Single Query**: Aggregation and calculations happen in the same query, reducing code complexity and minimizing client-server communication.
3. **Real-time Values**: Fields like `totalAmount` reflect the latest data, as they’re calculated each time the field is accessed.
4. **Sorting and Filtering**: You can seamlessly sort or filter based on `sqlExpression` fields, making it easier to create complex queries without additional backend logic.

---

With `sqlExpression` fields, you can incorporate powerful SQL computations into your entities, simplifying data aggregation and improving application performance. This feature is ideal for cases like summing order totals, calculating averages, or performing other backend-based calculations, all while keeping your code clean and efficient.
