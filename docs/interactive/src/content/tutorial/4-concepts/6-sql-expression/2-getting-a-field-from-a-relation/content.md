---
type: lesson
title: Getting a field from a relation
template: relations
focus: /shared/Order.ts
---

### SQL Expressions for Fields Based on Relations

With Remult’s `sqlExpression` feature, you can create fields that pull data from related entities. This approach is especially useful when you want to sort, filter, or display information from a related entity directly within the current entity’s context.

---

## Example: Adding Customer City to the Order Entity

Suppose you want to display and sort orders based on the city of each order’s customer. Instead of loading each customer’s data separately, you can add a `customerCity` field to the `Order` entity, which will retrieve the customer’s city information directly from the database.

```file:/shared/Order.ts title="Shared/Order.ts" collapse={1-4,6-13} add={14-23}

```

### Explanation of the Code

- **SQL Expression as a Related Field**: The `sqlExpression` for `customerCity` pulls the `city` field from the `Customer` entity, using a subquery to fetch the value based on the `customerId` in the `Order` entity.
- **`dbNamesOf` Utility**: Ensures that table and column names match the schema, reducing errors and improving consistency.
- **Dynamic Data**: The `customerCity` field provides real-time data from the related `Customer` entity, allowing you to view the customer’s city alongside order information.

### Using `customerCity` for Sorting and Filtering

With `customerCity` as a field in the `Order` entity, you can now sort and filter orders by their customer’s city without needing to load or query the `Customer` entity directly.

#### Sorting by `customerCity`

To sort orders by the customer’s city in ascending order:

```ts
const ordersSortedByCity = await repo(Order).find({
  orderBy: {
    customerCity: 'asc',
  },
})
```

#### Filtering by `customerCity`

To retrieve orders where the customer’s city is "London":

```ts
const ordersFromLondon = await repo(Order).find({
  where: {
    customerCity: 'London',
  },
})
```

In this query:

- Sorting and filtering directly by `customerCity` keeps your code cleaner and reduces the need for extra joins or nested queries.
- By leveraging `sqlExpression`, you optimize performance as the field data is retrieved from the database in a single query.

---

## Benefits of Using `sqlExpression` for Related Fields

1. **Efficient Data Retrieval**: Fetch data from related entities without additional queries or client-server communication.
2. **Improved Performance**: Since the database performs the subquery, it remains efficient even with large datasets.
3. **Simplified Code**: Sorting and filtering by related fields becomes as simple as using any other field.
4. **Real-time Information**: The related field’s data remains current, reflecting any changes to the related entity.

---

In this lesson, you’ve seen how `sqlExpression` can transform your data handling by enabling seamless access to fields from related entities. This feature is ideal for situations where you need to use related data for sorting, filtering, or displaying, all while keeping your code efficient and streamlined.
