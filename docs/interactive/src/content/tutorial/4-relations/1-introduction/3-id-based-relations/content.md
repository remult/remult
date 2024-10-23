---
type: lesson
title: Id Based Relations
template: relations
focus: /shared/Order.ts
---

# ID-Based Relations

ID-based relations provide more control over how related entities are managed. By explicitly including the foreign key (such as `customerId`) in the entity, you gain more flexibility and can optimize performance by reducing the need to load the related entity in some cases.

## Defining an ID-Based Relation

In the `Order` entity, we add a `customerId` field to store the ID of the related `Customer`. We then reference this field in the `@Relations.toOne` decorator to establish the relationship between `Order` and `Customer`.

It's important to use the correct type arguments, `<Order, Customer>`, to ensure proper type checking for this relation.

```file:/shared/Order.ts ins={8-10} collapse={1-3} title="shared/Order.ts"


```

In this setup, the `customerId` field holds the reference to the customer, and the `@Relations.toOne` decorator connects the `Order` entity to the `Customer` entity.

## Defining the Inverse Relation

On the `Customer` entity, we define the inverse of the relation using `@Relations.toMany`. This decorator links a `Customer` to multiple `Order` records, allowing us to retrieve all orders related to a specific customer.

```file:/shared/Customer.ts title="shared/Customer.ts" collapse={1-3} ins={12-13}

```

Now, the `Customer` entity has an `orders` array, representing all the orders associated with that customer.

## Try it out

Check out the output and see that the `customerId` is included even if you do not explicitly include the relation. This gives you the flexibility to work directly with the ID without always needing to load the related entity.

## Working with Existing Data

If you already have existing data in your database where the foreign key column is named `customer`, but you want to use `customerId` in your code, you can use the `dbName` property to map the `customerId` field to the `customer` column in the database.

```ts
@Fields.integer({ dbName: 'customer' })
customerId = 0
```

This ensures that your code uses `customerId` while mapping it correctly to the `customer` column in the database, allowing for seamless integration with existing data.

---

By using ID-based relations, you have greater control over your data models and can optimize performance by limiting unnecessary entity loading. This approach also provides a clean and efficient way to manage relations in your Remult applications.

---

Let me know if this works!
