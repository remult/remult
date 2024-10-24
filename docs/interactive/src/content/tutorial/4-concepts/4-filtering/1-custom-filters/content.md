---
type: lesson
title: Custom Filter
template: relations
focus: /frontend/Page.tsx
---

# Custom Filter

In this lesson, we'll explore how to simplify and reuse filtering logic in your application using **Custom Filters**.

Consider the following scenario where we need to filter `Order` records by status and a specific year:

```file:/frontend/Page.tsx title="frontend/Page.tsx" collapse={1-5,21-100} {11-17}

```

If you need to apply this same filter in multiple places throughout your application, this can lead to repetitive code. Rewriting this filter over and over not only increases the likelihood of errors but also makes the code harder to maintain and less readable.

This is where **Custom Filters** come in handy. Custom Filters allow you to encapsulate and reuse filtering logic, simplifying your code and improving maintainability.

## Benefits of Custom Filters

Custom Filters offer several advantages:

1. **Executes on the Server**: The filter is processed on the server, meaning it has the full power of the backend. This allows for more complex operations, such as database queries, and offloads the filtering from the client, improving performance.
2. **Reusability**: You can reuse the same filtering logic in different parts of your application without rewriting it each time.
3. **Maintainability**: If you need to update your filtering criteria, you can do it in one place, ensuring consistency throughout your app.
4. **Readability**: By encapsulating the filter logic, your code becomes cleaner and easier to understand.
5. **Flexibility**: Custom Filters allow you to pass dynamic parameters, making them adaptable to various scenarios.

## Defining a Custom Filter in the Order Entity

In the `Order` entity, we'll define a custom filter to encapsulate the filtering logic for active orders within a given year.

```solution:/shared/Order.ts title="shared/Order.ts" collapse={1-9,11-28} add={30-40}

```

### Breakdown of the Code

1. **Custom Filter Definition**:

   - `Filter.createCustom<Order, { year: number }>()` defines a custom filter for the `Order` entity.
   - The filter accepts an argument object with a `year` property and returns an object representing the filter criteria.
   - In this case, the filter checks for `Order` records with specific statuses and filters orders within the specified year.

2. **Static Method**:

   - The `activeOrdersFor` is a static method, meaning it belongs to the class itself and can be used without creating an instance of the `Order` class.
   - This method dynamically generates the filter based on the `year` parameter passed in by the user.

3. **Status and Order Date Filters**:
   - The filter checks if the order's status is one of the following: `'created', 'confirmed', 'pending', 'blocked', 'delayed'`.
   - It also filters the orders by their `orderDate`, ensuring only orders from the specified year are included in the results.

## Using the Custom Filter

Once the custom filter is defined, you can use it in your code as follows:

```solution:/frontend/Page.tsx title="shared/Page.tsx" collapse={1-5,15-100} add={11}

```

### Explanation of Usage

- **Simplified Code**: By using `Order.activeOrdersFor({ year })`, you're applying the filtering logic in a clean and reusable manner. You no longer need to duplicate the filtering conditions wherever this logic is required.
- **Dynamic Parameters**: The `{ year }` argument allows the filter to be used with different years, making it adaptable to different contexts.
- **Backend Evaluation**: The filtering is handled on the backend, meaning that you avoid sending large datasets to the client and applying the filters there, which optimizes performance.

## Composability: Combining Filters

One of the powerful features of custom filters is their **composability**. You can combine a custom filter with other filters to create more complex query logic. This is useful when you want to add additional filtering conditions on top of your custom filter.

### Example: Combining with an `amount` Filter

Let’s say you want to find active orders for a given year, but you also want to filter the orders based on their total `amount`. You can easily combine filters using the `$and` operator:

```tsx
repo(Order).find({
  where: {
    $and: [
      Order.activeOrdersFor({ year }),
      {
        amount: { $gt: 100 },
      },
    ],
  },
}),
```

### Explanation

1. **Custom Filter (`activeOrdersFor`)**: Filters the orders by their status and order date for the specified year.
2. **Additional Filter (Amount)**: The second filter adds an extra condition that only includes orders where the total amount is greater than 100.
3. **Combining with `$and`**: The `$and` operator combines both filters, ensuring that only orders that satisfy both the `activeOrdersFor` filter and the `amount` filter are included in the results.

### Recap

With composable custom filters, you can build modular, reusable filters that combine seamlessly with other conditions, making your code more flexible and maintainable. Whether you're filtering by status, date, or custom logic like order amount, custom filters allow you to easily manage complex queries with less effort.

## Recap

By encapsulating filtering logic in a custom filter, we achieve several benefits: reusable and maintainable code, improved readability, and dynamic flexibility. Custom Filters are a powerful tool to simplify repetitive filtering tasks and help you write cleaner, more efficient code.

---

Let me know if you'd like to add anything else to this lesson!
