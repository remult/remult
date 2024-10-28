---
type: lesson
title: Sql Relations
template: relations
focus: /shared/Order.ts
---

### Leveraging `sqlRelations` for Advanced SQL-Based Relationships

:::warn
**Experimental Feature:** This API is subject to change in future versions of Remult.
:::

The `sqlRelations` API (currently experimental) enhances the way you handle relationships in Remult by enabling SQL-like expressions directly on related entities. This allows for the seamless use of fields from related entities, simplifying complex queries and calculations. Let’s explore its use in a few examples that demonstrate the power of `sqlRelations`.

---

## Example 1: Adding Customer City to the Order Entity

In many cases, you may want to display information from a related entity, such as a customer’s city, directly within the `Order` entity. With `sqlRelations`, you can do this using a straightforward syntax.

```file:/shared/Order.ts title="shared/Order.ts" collapse={1-5,7-14} add={16-19}

```

### Explanation

- **Direct Relation Field**: `sqlRelations(Order).customer.city` pulls the `city` field from the `Customer` entity, eliminating the need for a join.
- **Dynamic Data**: The `customerCity` field within `Order` automatically updates whenever the related `Customer` data changes.

---

## Example 2: Counting Related Records in Customer

To show the number of orders a customer has, you can define a `orderCount` field in the `Customer` entity using `sqlRelations`.

```file:/shared/Customer.ts title="shared/Customer.ts" collapse={1-5,7-14,21-100} add={16-19}

```

### Explanation

- **Counting Relations**: `sqlRelations(Customer).orders.$count()` counts the number of related `Order` records for each customer.
- **Efficient Aggregation**: This aggregation is done directly in SQL, making it highly efficient for large datasets.

---

## Example 3: Counting Orders with Specific Conditions

Suppose you want to count only the customer’s orders where the amount is over a certain threshold (e.g., greater than 50). You can add a `bigOrderCount` field to the `Customer` entity.

```file:/shared/Customer.ts title="shared/Customer.ts" collapse={1-5,7-20,28-100} add={21-27}

```

### Explanation

- **Conditional Counting**: This field uses `$count` with a filter condition to count only orders with an amount greater than 50.
- **Dynamic Filtering**: You can specify any criteria here, providing flexibility for conditional counts within the related entity.

---

## Example 4: Dynamic SQL Aggregation

For advanced calculations, such as summing up the total order amount for each customer, you can use `$subQuery` to create custom SQL aggregations.

```file:/shared/Customer.ts title="shared/Customer.ts" collapse={1-5,7-28} add={29-33}

```

### Explanation

- **Custom Aggregations**: The `$subQuery` method allows you to define a custom SQL expression for advanced calculations. Here, it calculates the total order amount for each customer.
- **Dynamic Syntax**: `sqlRelations` provides flexibility for creating any kind of SQL-based aggregation, allowing you to customize the expression to fit your needs.

---

## Summary of `sqlRelations` Benefits

1. **Efficiency**: By generating SQL expressions directly within entity fields, `sqlRelations` minimizes database calls and performs calculations in SQL, improving performance.
2. **Simplified Code**: Directly including related entity fields and aggregations within your entity definitions streamlines code and enhances readability.
3. **Dynamic Aggregations**: With `$subQuery`, you can create complex aggregations based on related data, enabling powerful data insights with minimal effort.

This approach provides a powerful way to manage complex relationships and aggregations in Remult, bringing the flexibility of SQL into the realm of structured, type-safe TypeScript fields.
