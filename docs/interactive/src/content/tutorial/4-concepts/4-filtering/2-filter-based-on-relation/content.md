---
type: lesson
title: Filter Based on Relation
template: relations
focus: /shared/Order.ts
---

# Filter Based on Relation

When working with relational data, you might encounter scenarios where you need to filter records based on data from related entities. A common example is retrieving all orders for customers located in specific cities, such as London or New York.

In this lesson, we'll explore how to achieve this by utilizing **custom filters** that apply conditions to related entities. This approach makes it easier to handle complex filtering requirements while keeping your code clean and reusable.

## Scenario: Filtering Orders by Customer's City

Imagine we want to display all orders from customers who live in either London or New York. To accomplish this, we need to filter the `Order` entity based on a related field (`city`) from the `Customer` entity.

We'll define a **custom filter** in the `Order` entity that allows us to query orders based on the city of the related customer.

## Step 1: Define the Custom Filter

In the `Order` entity, we will create a custom filter called `fromCity` that will filter orders based on the city of the related customer. This filter will retrieve the customers from the specified city and then use their `id` values to filter the corresponding orders.

```file:/shared/Order.ts title="shared/Order.ts" collapse={1-8,10-21} {23-35}

```

### Explanation of the Code

1. **Customer and Order Entities**: The `Order` entity is related to the `Customer` entity via the `customerId` field. The `@Relations.toOne` decorator establishes this relation.
2. **Custom Filter (`fromCity`)**:

   - This custom filter queries the `Customer` repository to find customers whose `city` contains the specified string (e.g., "New York" or "London").
   - Once the customers are retrieved, their `id` values are used to filter orders by `customerId`. This approach allows us to query orders based on data from the related `Customer` entity.

3. **Backend Execution**: The custom filter logic is executed on the server, meaning the customer retrieval and the subsequent filtering happen on the backend, ensuring efficient data handling.

---

## Step 2: Using the Filter on the Frontend

To apply the `fromCity` custom filter in our frontend component, we'll use it in a `find` method to retrieve the relevant orders. Additionally, we will combine this filter with an extra condition to only include orders with an `amount` greater than 5.

Here’s the implementation in the frontend:

```file:/frontend/Page.tsx title="/frontend/Page.tsx" collapse={1-6,23-37} add={12}

```

### Explanation of the Frontend Code

1. **Combining Filters**:

   - We use the `fromCity` custom filter to get all orders from customers living in New York.
   - The `$and` operator combines this filter with an additional condition, ensuring that only orders with an `amount` greater than 5 are included.

2. **Including Related Data**:

   - The `include` option is used to include customer data (e.g., city, name) in the result, allowing us to display the customer's city alongside the order information.

3. **Displaying the Data**:
   - The fetched data is displayed in the component, with each order showing its ID, order date, customer city, and amount.

---

## Benefits of Using Custom Filters with Relations

### 1. Flexibility in Filtering

Custom filters allow you to define dynamic filtering logic that can be reused across your application. In this example, the `fromCity` filter can be applied in any scenario where you need to retrieve orders based on the customer's city, making the filtering logic more flexible and reusable.

### 2. Backend Efficiency

By executing the filter on the server, custom filters can take full advantage of backend resources, such as querying a database. This offloads the data processing from the frontend, resulting in faster performance and reduced data transfer.

### 3. Composability

Custom filters can be combined with other conditions (e.g., filtering by order amount) to create complex and nuanced queries. This composability ensures that you can handle a wide variety of filtering needs without duplicating logic.

### 4. Cleaner Code

By encapsulating the filtering logic in the `Order` entity, we avoid cluttering the frontend code with complex query conditions. This makes the frontend code cleaner and easier to maintain.

---

### Summary

Filtering based on relations is a common requirement in web applications, and custom filters provide an elegant way to handle it. By encapsulating the filtering logic in reusable components, we can efficiently query data based on related entities while keeping the code clean, readable, and maintainable.

The flexibility, efficiency, and composability of custom filters make them an essential tool for managing complex filtering scenarios in your applications.
