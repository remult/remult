---
outline: [2, 3]
---

# Relations Between Entities

::: tip **Interactive Learning Available! 🚀**

Looking to get hands-on with this topic? Try out our new [**interactive tutorial**](https://learn.remult.dev/in-depth/1-relations/1-many-to-one) on Relations, where you can explore and practice directly in the browser. This guided experience offers step-by-step lessons to help you master relations in Remult with practical examples and exercises.

[Click here to dive into the interactive tutorial on Relations!](https://learn.remult.dev/in-depth/1-relations/1-many-to-one)

:::

### Understanding Entity Relations in Remult

In Remult, entity relations play a useful role in modeling and navigating the complex relationships that exist within your data. To illustrate this concept, we will use two primary entities: `Customer` and `Order`. These entities will serve as the foundation for discussing various types of relations and how to define and work with them .

To experiment with these entities online, you can access the following CodeSandbox link, which is preconfigured with these two entities and a postgres database:

[CodeSandbox - Remult Entity Relations Example](https://codesandbox.io/p/devbox/remult-postgres-demo-f934f8)

Feel free to explore and experiment with the provided entities and their relations in the CodeSandbox environment.

#### Customer Entity

```typescript
// customer.ts

import { Entity, Fields } from 'remult'

@Entity('customers')
export class Customer {
  @Fields.cuid()
  id = ''
  @Fields.string()
  name = ''
  @Fields.string()
  city = ''
}
```

The `Customer` entity represents individuals or organizations with attributes such as an ID, name, and city. Each customer can be uniquely identified by their `id`.

#### Order Entity

```typescript
// order.ts

import { Entity, Fields } from 'remult'

@Entity('orders')
export class Order {
  @Fields.cuid()
  id = ''
  @Fields.string()
  customer = ''
  @Fields.number()
  amount = 0
}
```

The `Order` entity represents transactions or purchases made by customers. Each order is associated with a `customer`, representing the customer who placed the order, and has an `amount` attribute indicating the total purchase amount.

Throughout the following discussion, we will explore how to define and use relations between these entities, enabling you to create sophisticated data models and efficiently query and manipulate data using Remult. Whether you are dealing with one-to-one, one-to-many, or many-to-many relationships, understanding entity relations is essential for building robust and feature-rich applications with Remult.

## Simple Many-to-One

In Remult, many-to-one relations allow you to establish connections between entities, where multiple records of one entity are associated with a single record in another entity. Let's delve into a common use case of a many-to-one relation, specifically the relationship between the `Order` and `Customer` entities.

### Defining the Relation

To establish a many-to-one relation from the `Order` entity to the `Customer` entity, you can use the `@Relations.toOne()` decorator in your entity definition:

```typescript
// order.ts

import { Entity, Fields, Relations } from 'remult'
import { Customer } from '../customer.js'

@Entity('orders')
export class Order {
  @Fields.cuid()
  id = ''
  @Fields.string() // [!code --]
  customer = '' // [!code --]
  @Relations.toOne(() => Customer) // [!code ++]
  customer?: Customer // [!code ++]
  @Fields.number()
  amount = 0
}
```

In this example, each `Order` is associated with a single `Customer`. The `customer` property in the `Order` entity represents this relationship.

### Fetching Relational Data

When querying data that involves a many-to-one relation, you can use the `include` option to specify which related entity you want to include in the result set. In this case, we want to include the associated `Customer` when querying `Order` records.

Here's how you can include the relation in a query using Remult:

```typescript{3-5}
const orderRepo = remult.repo(Order)
const orders = await orderRepo.find({
  include: {
    customer: true,
  },
})
```

#### Resulting Data Structure

The result of the query will contain the related `Customer` information within each `Order` record, creating a nested structure.

Here's an example result of running `JSON.stringify` on the `orders` array:

```json
[
  {
    "id": "adjkzsio3efees8ew0wnsqma",
    "customer": {
      "id": "m4ozs74onwwroav3o1xs1qi8",
      "name": "Larkin - Fadel",
      "city": "London"
    },
    "amount": 90
  },
  {
    "id": "gefhsed1clknmogcgiigo9jo",
    "customer": {
      "id": "m4ozs74onwwroav3o1xs1qi8",
      "name": "Larkin - Fadel",
      "city": "London"
    },
    "amount": 3
  }
]
```

As shown in the result, each `Order` object contains a nested `customer` object, which holds the details of the associated customer, including their `id`, `name`, and `city`. This structured data allows you to work seamlessly with the many-to-one relationship between `Order` and `Customer` entities .

### Querying a Single Item

To retrieve a single `Order` item along with its associated `Customer`, you can use the `findFirst` method provided by your repository (`orderRepo` in this case). Here's an example of how to perform this query:

```typescript
const singleOrder = await orderRepo.findFirst(
  {
    id: 'adjkzsio3efees8ew0wnsqma',
  },
  {
    include: {
      customer: true,
    },
  },
)
```

### Relation Loading

In Remult, by default, a relation is not loaded unless explicitly specified in the `include` statement of a query. This behavior ensures that you only load the related data you require for a specific task, optimizing performance and minimizing unnecessary data retrieval.

Here's an example:

```typescript
const orderRepo = remult.repo(Order)

// Query without including the 'customer' relation
const ordersWithoutCustomer = await orderRepo.find({})
```

In the above query, the `customer` relation will not be loaded and have the value of `undefined` because it is not specified in the `include` statement.

#### Overriding Default Behavior with `defaultIncluded`

Sometimes, you may have scenarios where you want a relation to be included by default in most queries, but you also want the flexibility to exclude it in specific cases. Remult allows you to control this behavior by using the `defaultIncluded` setting in the relation definition.

```typescript
@Relations.toOne(() => Customer, {
  defaultIncluded: true, // [!code ++]
})
customer = "";
```

In this example, we set `defaultIncluded` to `true` for the `customer` relation in the `Order` entity. This means that, by default, the `customer` relation will be loaded in most queries unless explicitly excluded.

#### Example: Excluding `customer` Relation in a Specific Query

```typescript
const orders = await orderRepo.find({
  include: {
    customer: false, // [!code ++]
  },
})
```

In this query, we override the default behavior by explicitly setting `customer: false` in the `include` statement. This instructs Remult not to load the `customer` relation for this specific query, even though it is set to be included by default.

By combining the default behavior with the ability to override it in specific queries, Remult provides you with fine-grained control over relation loading, ensuring that you can optimize data retrieval based on your application's requirements and performance considerations.

## Advanced Many-to-One

In certain scenarios, you may require more granular control over the behavior of relations and want to access specific related data without loading the entire related entity. Remult provides advanced configuration options to meet these requirements. Let's explore how to achieve this level of control through advanced relation configurations.

### Custom Relation Field

In Remult, you can define custom relation fields that allow you to access the `id` without loading the entire related entity. To define a custom relation field, follow these steps:

#### Step 1: Define a Custom Field in the Entity

In your entity definition, define a custom field that will hold the identifier or key of the related entity. This field serves as a reference to the related entity without loading the entity itself.

```typescript{5-8}
@Entity("orders")
export class Order {
  @Fields.cuid()
  id = "";
  @Fields.string() // [!code ++]
  customerId = ""; // Custom field to hold the related entity's identifier // [!code ++]
  @Relations.toOne<Order, Customer>(() => Customer, "customerId")  // [!code ++]
  @Relations.toOne(() => Customer) // [!code --]
  customer?: Customer;
  @Fields.number()
  amount = 0;
}
```

In this example, we define a custom field called `customerId`, which stores the identifier of the related `Customer` entity.

#### Step 2: Define the Relation Using `toOne`

Use the `@Relations.toOne` decorator to define the relation, specifying the types for the `fromEntity` and `toEntity` in the generic parameters. Additionally, provide the name of the custom field (in this case, `"customerId"`) as the third argument.

```typescript
@Entity('orders')
export class Order {
  @Fields.cuid()
  id = ''
  @Fields.string()
  customerId = '' // Custom field to hold the related entity's identifier
  @Relations.toOne<Order, Customer>(() => Customer, 'customerId') // [!code ++]
  customer = ''
  @Fields.number()
  amount = 0
}
```

This configuration establishes a relation between `Order` and `Customer` using the `customerId` field as the reference.

#### Migrating from a Simple `toOne` Relation to a Custom Field Relation with Existing Data

When transitioning from a simple `toOne` relation to a custom field relation in Remult and you already have existing data, it's important to ensure a smooth migration. In this scenario, you need to make sure that the newly introduced custom field (`customerId` in this case) can access the existing data in your database. This is accomplished using the `dbName` option. Here's how to perform this migration:

##### 1. Understand the Existing Data Structure

Before making any changes, it's crucial to understand the structure of your existing data. In the case of a simple `toOne` relation, there may be rows in your database where a field (e.g., `customer`) holds the identifier of the related entity.

##### 2. Define the Custom Field with `dbName`

When defining the custom field in your entity, use the `dbName` option to specify the name of the database column where the related entity's identifier is stored. This ensures that the custom field (`customerId` in this example) correctly accesses the existing data in your database.

```typescript
@Entity('orders')
export class Order {
  @Fields.cuid()
  id = ''
  @Fields.string({ dbName: 'customer' }) // Use dbName to match existing data // [!code ++]
  customerId = ''
  @Relations.toOne(() => Customer, 'customerId')
  customer?: Customer
  @Fields.number()
  amount = 0
}
```

In this example, we use the `dbName` option to specify that the `customerId` field corresponds to the `customer` column in the database. This mapping ensures that the custom field can access the existing data that uses the `customer` column for the related entity's identifier.

#### Using the `field` Option for Custom Relation Configuration

When you require additional customization for a relation field in Remult, you can utilize the field option to specify additional options for the related field.

```typescript
@Relations.toOne<Order, Customer>(() => Customer, {
  field: "customerId", // [!code ++]
  caption: "The Customer",
})
```

In this example, we use the `field` option to define a custom relation between the `Order` and `Customer` entities. Here are some key points to understand about using the `field` option:

1. **Custom Relation Field**: The `field` option allows you to specify a custom field name (e.g., `"customerId"`) that represents the relationship between entities. This field can be used to access related data without loading the entire related entity.

2. **Additional Configuration**: In addition to specifying the `field`, you can include other options as well. In this example, we set the `caption` option to provide a descriptive caption for the relation field.

Using the `field` option provides you with granular control over how the relation field is configured and accessed . You can customize various aspects of the relation to meet your specific requirements, enhance documentation, and improve the overall usability of your codebase.

### Relation Based on Multiple Fields

In some scenarios, establishing a relation between entities requires considering multiple fields to ensure the correct association. Remult provides the flexibility to define relations based on multiple fields using the `fields` option. Here's how to create a relation based on multiple fields in Remult:

#### Defining Entities

Let's consider a scenario where both `Order` and `Customer` entities belong to specific branches, and we need also the `branchId` fields to ensure the correct association. First, define your entities with the relevant fields:

```typescript{0}
@Entity('customers')
export class Customer {
  @Fields.cuid()
  id = ''
  @Fields.number() // [!code ++]
  branchId = 0 // [!code ++]
  @Fields.string()
  name = ''
  @Fields.string()
  city = ''
}

@Entity('orders')
export class Order {
  @Fields.cuid()
  id = ''
  @Fields.number() // [!code ++]
  branchId = 0 // [!code ++]
  @Fields.string({ dbName: 'customer' })
  customerId = ''
  @Relations.toOne<Order, Customer>(() => Customer, {
    fields: {//[!code ++]
      branchId: 'branchId', // Field from Customer entity : Field from Order// [!code ++]
      id: 'customerId', // [!code ++]
    }, // [!code ++]
  })
  customer?: Customer
  @Fields.number()
  amount = 0
}
```

In this example, we have two entities: `Customer` and `Order`. Both entities have a `branchId` field that represents the branch they belong to. To create a relation based on these fields, we specify the `fields` option in the relation configuration.

#### Using the `fields` Option

In the `@Relations.toOne` decorator, use the `fields` option to specify the mapping between fields in the related entity (`Customer`) and your entity (`Order`). Each entry in the `fields` object corresponds to a field in the related entity and maps it to a field in your entity.

```typescript
@Relations.toOne<Order, Customer>(() => Customer, {
  fields: {// [!code ++]
    branchId: 'branchId', // Field from Customer entity : Field from Order// [!code ++]
    id: 'customerId',// [!code ++]
  },// [!code ++]
})
customer?: Customer;
```

In this configuration:

- `branchId` from the `Customer` entity is mapped to `branchId` in the `Order` entity.
- `id` from the `Order` entity is mapped to `customerId` in the `Customer` entity.

This ensures that the relation between `Order` and `Customer` is based on both the `branchId` and `customerId` fields, providing a comprehensive association between the entities.

By utilizing the `fields` option, you can create relations that consider multiple fields, ensuring accurate and meaningful associations between your entities in Remult.

## One-to-Many

In Remult, you can easily define a `toMany` relation to retrieve multiple related records. Let's consider a scenario where you want to retrieve a list of orders for each customer. We'll start with the basic `toOne` relation example and then add a `toMany` relation to achieve this:

#### Basic `toOne` Relation Example

First, let's define the `Customer` and `Order` entities with a basic `toOne` relation:

```typescript{9-10}
@Entity("customers")
export class Customer {
  @Fields.cuid()
  id = "";
  @Fields.string()
  name = "";
  @Fields.string()
  city = "";
}

@Entity("orders")
export class Order {
  @Fields.cuid()
  id = "";
  @Relations.toOne(() => Customer)
  customer?: Customer;
  @Fields.number()
  amount = 0;
}
```

In this initial setup:

- The `Order` entity has a property `customer`, which is decorated with `@Relations.toOne(() => Customer)`. This establishes a relation between an order and its associated customer.

### Adding a `toMany` Relation

Now, let's enhance this setup to include a `toMany` relation that allows you to retrieve a customer's orders:

```typescript
@Entity('customers')
export class Customer {
  @Fields.cuid()
  id = ''
  @Fields.string()
  name = ''
  @Fields.string()
  city = ''
  @Relations.toMany(() => Order) // [!code ++]
  orders?: Order[] // [!code ++]
}
```

In this updated configuration:

- The `Customer` entity has a property `orders`, which is decorated with `@Relations.toMany(() => Order)`. This indicates that a customer can have multiple orders.

With this setup, you can use the `orders` property of a `Customer` entity to retrieve all the orders associated with that customer. This provides a convenient way to access and work with a customer's orders.

By defining a `toMany` relation, you can easily retrieve and manage multiple related records, such as a customer's orders.

### Fetching Relational Data

To retrieve customers along with their associated order in Remult, you can use the `include` option in your query. Let's see how to fetch customers with their orders using the `include` option:

```typescript
const customerRepo = remult.repo(Customer)
const customers = await customerRepo.find({
  include: {
    orders: true,
  },
})
```

In this code snippet:

- We first obtain a repository for the `Customer` entity using `remult.repo(Customer)`.

- Next, we use the `find` method to query the `Customer` entity. Within the query options, we specify the `include` option to indicate that we want to include related records.

- Inside the `include` option, we specify `orders: true`, indicating that we want to fetch the associated orders for each customer.

As a result, the `customers` variable will contain an array of customer records, with each customer's associated orders included. This allows you to easily access and work with both customer and order data.

#### Resulting Data Structure

When you fetch customers along with their associated orders using the `include` option in Remult, the result will be an array that includes both customer and order data.

Here's an example result of running `JSON.stringify` on the `customers` array:

```json
[
  {
    "id": "ik68p3oxqg1ygdffpryqwkpw",
    "name": "Fay, Ebert and Sporer",
    "city": "London",
    "orders": [
      {
        "id": "m7m3xqyx4kwjaqcd0cu33q8g",
        "amount": 15
      },
      {
        "id": "rbkcrz6nc45zn4xfxmjise21",
        "amount": 10
      }
    ]
  }
]
```

In this example:

- Each customer is represented as an object with properties such as `id`, `name`, and `city`.

- The `orders` property within each customer object contains an array of associated order records.

- Each order record within the `orders` array includes properties like `id` and `amount`.

This structured result allows you to easily navigate and manipulate the data . You can access customer information as well as the details of their associated orders, making it convenient to work with related records in your application's logic and UI.

### Specifying Reference Fields

In Remult, you can specify a field or fields for `toMany` relations to have more control over how related records are retrieved. This can be useful when you want to customize the behavior of the relation. Here's how you can specify a field or fields for `toMany` relations:

#### Specifying a Single Field

To specify a single field for a `toMany` relation, you can use the `field` option. This option allows you to define the field in your entity that establishes the relation. For example:

```typescript
@Relations.toMany<Customer, Order>(() => Order, {
  field: "customer",
})
```

In this case, the `field` option is set to `"customer"`, indicating that the `customer` field in the `Order` entity establishes the relation between customers and their orders.

#### Specifying Multiple Fields

In some cases, you may need to specify multiple fields to establish a `toMany` relation. To do this, you can use the `fields` option, which allows you to define a mapping of fields between entities. Here's an example:

```typescript
@Relations.toMany<Customer, Order>(() => Order, {
  fields: {
    branchId: "branchId",
    customerId: "id",
  },
})
```

In this example, the `fields` option is used to specify that the `branchId` field in the `Order` entity corresponds to the `branchId` field in the `Customer` entity, and the `customerId` field in the `Order` entity corresponds to the `id` field in the `Customer` entity.

By specifying fields in this manner, you have fine-grained control over how the relation is established and how related records are retrieved. This allows you to tailor the behavior of `toMany` relations to your specific use case and data model.

### Customizing a `toMany` Relation

In Remult, you can exercise precise control over a `toMany` relation by utilizing the `findOptions` option. This option allows you to define specific criteria and behaviors for retrieving related records. Here's how you can use `findOptions` to fine-tune a `toMany` relation:

```typescript
@Relations.toMany<Customer, Order>(() => Order, {
  fields: {
    branchId: "branchId",
    customerId: "id",
  },
  findOptions: {
    limit: 5,
    orderBy: {
      amount: "desc",
    },
    where: {
      amount: { $gt: 10 },
    },
  },
})
```

In this example, we've specified the following `findOptions`:

- `limit: 5`: Limits the number of related records to 5. Only the first 5 related records will be included.

- `orderBy: { amount: "desc" }`: Orders the related records by the `amount` field in descending order. This means that records with higher `amount` values will appear first in the result.

- `where: { amount: { $gt: 10 } }`: Applies a filter to include only related records where the `amount` is greater than 10. This filters out records with an `amount` of 10 or lower.

By using `findOptions` in this manner, you gain precise control over how related records are retrieved and included in your query results. This flexibility allows you to tailor the behavior of the `toMany` relation to suit your specific application requirements and use cases.

#### Fine-Tuning a `toMany` Relation with `include`

In Remult, you can exercise even more control over a `toMany` relation by using the `include` option within your queries. This option allows you to further customize the behavior of the relation for a specific query. Here's how you can use `include` to fine-tune a `toMany` relation:

```typescript
const orders = await customerRepo.find({
  include: {
    orders: {
      limit: 10,
      where: {
        completed: true,
      },
    },
  },
})
```

In this code snippet:

- We use the `include` option within our query to specify that we want to include the related `orders` for each customer.

- Inside the `include` block, we can provide additional options to control the behavior of this specific inclusion. For example:
  - `limit: 10` limits the number of related orders to 10 per customer. This will override the `limit` set in the original relation.
  - `where: { completed: true }` filters the included orders to only include those that have been marked as completed.

The `where` option specified within `include` will be combined with the `where` conditions defined in the `findOptions` of the relation using an "and" relationship. This means that both sets of conditions must be satisfied for related records to be included.

Using `include` in this way allows you to fine-tune the behavior of your `toMany` relation to meet the specific requirements of each query, making Remult a powerful tool for building flexible and customized data retrieval logic in your application.

## Repository `relations`

In Remult, managing relationships between entities is a crucial aspect of working with your data. When dealing with a `toMany` relationship, Remult provides you with powerful tools through the repository's `relations` property to handle related rows efficiently, whether you want to retrieve them or insert new related records.

### Inserting Related Records

Consider a scenario where you have a `Customer` entity with a `toMany` relationship to `Order` entities. You can create a new customer and insert related orders in a straightforward manner:

```typescript
const customer = await customerRepo.insert({ name: 'Abshire Inc' })
await customerRepo.relations(customer).orders.insert([
  {
    amount: 5,
  },
  {
    amount: 7,
  },
])
```

In this example, you first create a new `Customer` entity with the name "Abshire Inc." Then, using the `relations` method, you access the related `orders`. By calling the `insert` method on the `orders` relation, you can add new order records. Remult automatically sets the `customer` field for these orders based on the specific customer associated with the `relations` call.

### Loading Unfetched Relations

Another powerful use of the `repository` methods is to load related records that were not initially retrieved. Let's say you have found a specific customer and want to access their related orders:

```typescript
const customerRepo = remult.repo(Customer)
const customer = await customerRepo.findFirst({ name: 'Abshire Inc' })
const orders = await customerRepo.relations(customer).orders.find()
```

Here, you first search for a customer with the name "Abshire Inc." After locating the customer, you can use the `relations` method again to access their related orders. By calling the `find` method on the `orders` relation, you retrieve all related order records associated with the customer.

#### Contextual Repository: Tailored Operations for Related Data

The `relations` method serves as a specialized repository, tightly associated with the particular customer you supply to it. This dedicated repository offers a tailored context for performing operations related to the specific customer's connection to orders. It enables you to seamlessly find related records, insert new ones, calculate counts, and perform other relevant actions within the precise scope of that customer's relationship with orders. This versatile capability streamlines the management of intricate relationships in your application, ensuring your data interactions remain organized and efficient.

Remult's repository methods empower you to seamlessly manage and interact with related data, making it easier to work with complex data structures and relationships in your applications. Whether you need to insert related records or load unfetched relations, these tools provide the flexibility and control you need to handle your data efficiently.

Certainly, here's an extension of the "Loading Unfetched Relations" section that covers the topic of fetching unloaded `toOne` relations using the `findOne` function:

---

### Fetching Unloaded `toOne` Relations with `findOne`

In addition to loading unfetched `toMany` relations, Remult offers a convenient way to retrieve `toOne` relations that were not initially loaded. This capability is especially useful when dealing with many-to-one relationships.

Consider the following example, where we have a many-to-one relation between orders and customers. We want to fetch the customer related to a specific order, even if we didn't load it initially:

```ts
const orderRepo = remult.repo(Order)
const order = await orderRepo.findFirst({ id: 'm7m3xqyx4kwjaqcd0cu33q8g' })
const customer = await orderRepo.relations(order).customer.findOne()
```

In this code snippet:

1. We first obtain the order using the `findFirst` function, providing the order's unique identifier.
2. Next, we use the `relations` method to access the repository's relations and then chain the `customer` relation using dot notation.
3. Finally, we call `findOne()` on the `customer` relation to efficiently retrieve the related customer information.

This approach allows you to access and load related data on-demand, providing flexibility and control over your data retrieval process. Whether you're working with loaded or unloaded relations, Remult's intuitive functions give you the power to seamlessly access the data you need.

---

You can seamlessly incorporate this extension into the "Loading Unfetched Relations" section of your documentation to provide a comprehensive overview of working with both `toMany` and `toOne` relations.

---

### Accessing Relations with `activeRecord`

If you're following the `activeRecord` pattern and your entity inherits from `EntityBase` or `IdEntity`, you can access relations directly from the entity instance. This approach offers a convenient and straightforward way to work with relations.

#### Inserting Related Records

You can insert related records directly from the entity instance. For example, consider a scenario where you have a `Customer` entity and a `toMany` relation with `Order` entities. Here's how you can insert related orders for a specific customer:

```ts
const customer = await customerRepo.insert({ name: 'Abshire Inc' })
await customer._.relations.orders.insert([
  {
    amount: 5,
  },
  {
    amount: 7,
  },
])
```

In this code:

- We create a new `Customer` instance using `customerRepo.insert()` and set its properties.
- Using `customer._.relations.orders`, we access the `orders` relation of the customer.
- We insert two orders related to the customer by calling `.insert()` on the `orders` relation.

#### Retrieving Related Records

Fetching related records is just as straightforward. Let's say you want to find a customer by name and then retrieve their related orders:

```ts
const customer = await customerRepo.findFirst({ name: 'Abshire Inc' })
const orders = await customer._.relations.orders.find()
```

In this code:

- We search for a customer with the specified name using `customerRepo.findFirst()`.
- Once we have the customer instance, we access their `orders` relation with `customer._.relations.orders`.
- We use `.find()` to retrieve all related orders associated with the customer.

Using the `activeRecord` pattern and direct access to relations simplifies the management of related data, making it more intuitive and efficient.

## Many-to-Many

In Remult, you can effectively handle many-to-many relationships between entities by using an intermediate table. This approach is especially useful when you need to associate multiple instances of one entity with multiple instances of another entity. In this section, we'll walk through the process of defining and working with many-to-many relationships using this intermediate table concept.

#### Entity Definitions:

To illustrate this concept, let's consider two entities: `Customer` and `Tag`. In this scenario, multiple customers can be associated with multiple tags.

```ts
@Entity('customers')
export class Customer {
  @Fields.cuid()
  id = ''
  @Fields.string()
  name = ''
  @Fields.string()
  city = ''
}

@Entity('tags')
export class Tag {
  @Fields.cuid()
  id = ''
  @Fields.string()
  name = ''
}
```

### Intermediate Table

To establish this relationship, we'll create an intermediate table called `tagsToCustomers`. In this table, both `customerId` and `tagId` fields are combined as the primary key.

```ts
@Entity<TagsToCustomers>('tagsToCustomers', {
  id: {
    customerId: true,
    tagId: true,
  },
})
export class TagsToCustomers {
  @Fields.string()
  customerId = ''
  @Fields.string()
  tagId = ''
  @Relations.toOne<TagsToCustomers, Tag>(() => Tag, 'tagId')
  tag?: Tag
}
```

- To uniquely identify associations between customers and tags in a many-to-many relationship, we use the combined `customerId` and `tagId` fields as the primary key, specified using the 'id' option in the `@Entity` decorator.

- In this scenario, we've defined a `toOne` relation to the `Tag` entity within the `TagsToCustomers` entity to efficiently retrieve tags associated with a specific customer. This approach simplifies the management of many-to-many relationships while ensuring unique identification of each association.

Now, let's enhance our customer entity with a toMany relationship, enabling us to fetch all of its associated tags effortlessly.

```ts
@Entity('customers')
export class Customer {
  @Fields.cuid()
  id = ''
  @Fields.string()
  name = ''
  @Fields.string()
  city = ''
  @Relations.toMany(() => TagsToCustomers, 'customerId') // [!code ++]
  tags?: TagsToCustomers[] // [!code ++]
}
```

### Working with Many-to-Many Relationships

Let's explore how to interact with many-to-many relationships using an intermediate table in Remult.

#### 1. Adding Tags to a Customer:

To associate a tag with a customer, consider the follow code:

```ts
const tags = await remult
  .repo(Tag)
  .insert([
    { name: 'vip' },
    { name: 'hot-lead' },
    { name: 'influencer' },
    { name: 'manager' },
  ]) // Create the tags

const customerRepo = remult.repo(Customer)
const customer = await customerRepo.findFirst({ name: 'Abshire Inc' })
await customerRepo
  .relations(customer)
  .tags.insert([{ tag: tags[0] }, { tag: tags[2] }])
```

Here's an explanation of what's happening in this code:

1. We first insert some tags into the "tags" entity.

2. We then create a repository instance for the "customer" entity using `remult.repo(Customer)`.

3. We retrieve a specific customer by searching for one with the name "Abshire Inc" using `customerRepo.findFirst({ name: "Abshire Inc" })`. The `customer` variable now holds the customer entity.

4. To associate tags with the customer, we use the `relations` method provided by the repository. This method allows us to work with the customer's related entities, in this case, the "tags" relation to the TagsToCustomers entity.

5. Finally, we call the `insert` method on the "tags" relationship and provide an array of tag objects to insert. In this example, we associate the customer with the "vip" tag and the "influencer" tag by specifying the tags' indices in the `tags` array.

**2. Retrieving Tags for a Customer:**
To fetch the tags associated with a specific customer:

Certainly, here's a shorter explanation:

```ts
const customer = await customerRepo.findFirst(
  { name: 'Abshire Inc' },
  {
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  },
)
```

In this code, we're querying the "customer" entity to find a customer named "Abshire Inc." We're also including the related "tags" for that customer, along with the details of each tag. This allows us to fetch both customer and tag data in a single query, making it more efficient when working with related entities.

### Resulting Data Structure

Here's an example result of running `JSON.stringify` on the `customer` object:

```json
{
  "id": "fki6t24zkykpljvh4jurzs97",
  "name": "Abshire Inc",
  "city": "New York",
  "tags": [
    {
      "customerId": "fki6t24zkykpljvh4jurzs97",
      "tagId": "aewm0odq9758nopgph3x7brt",
      "tag": {
        "id": "cf8xv3myluc7pmsgez3p9hn9",
        "name": "vip"
      }
    },
    {
      "customerId": "fki6t24zkykpljvh4jurzs97",
      "tagId": "aewm0odq9758nopgph3x7brt",
      "tag": {
        "id": "aewm0odq9758nopgph3x7brt",
        "name": "influencer"
      }
    }
  ]
}
```

Utilizing an intermediate table for managing many-to-many relationships in Remult allows for a flexible and efficient approach to handle complex data associations. Whether you are connecting customers with tags or other entities, this method provides a powerful way to maintain data integrity and perform queries effectively within your application.

---

In this guide, we've explored the essential concepts of managing entity relations within the Remult library. From one-to-one to many-to-many relationships, we've covered the declaration, customization, and querying of these relations. By understanding the nuances of entity relations, users can harness the full potential of Remult to build robust TypeScript applications with ease.
