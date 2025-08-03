# Relations

- **Relations**

## constructor

- **Relations**

## toMany

Define a toMany relation between entities, indicating a one-to-many relationship.
This method allows you to establish a relationship where one entity can have multiple related entities.

#### returns:

A decorator function to apply the toMany relation to an entity field.

Example usage:

```ts
@Relations.toMany(() => Order)
orders?: Order[];

// or with a custom field name:
@Relations.toMany(() => Order, "customerId")
orders?: Order[];
```

Arguments:

- **toEntityType**
- **fieldInToEntity** - (Optional) The field in the target entity that represents the relation.
  Use this if you want to specify a custom field name for the relation.

## toOne

Define a to-one relation between entities, indicating a one-to-one relationship.
If no field or fields are provided, it will automatically create a field in the database
to represent the relation.

#### returns:

A decorator function to apply the to-one relation to an entity field.

Example usage:

```ts
@Relations.toOne(() => Customer)
customer?: Customer;
```

```ts
Fields.string()
customerId?: string;

@Relations.toOne(() => Customer, "customerId")
customer?: Customer;
```

```ts
Fields.string()
customerId?: string;

@Relations.toOne(() => Customer, {
  field: "customerId",
  defaultIncluded: true
})
customer?: Customer;
```

```ts
Fields.string()
customerId?: string;

@Relations.toOne(() => Customer, {
  fields: {
    customerId: "id",
  },
})
customer?: Customer;
```

Arguments:

- **toEntityType**
- **options** - (Optional): An object containing options for configuring the to-one relation.
  - **caption** - A human readable name for the field. Can be used to achieve a consistent caption for a field throughout the app
  #### example:
  ```html
  <input placeholder="{taskRepo.metadata.fields.title.caption}" />
  ```
  - **label** - A human readable name for the field. Can be used to achieve a consistent label for a field throughout the app
  #### example:
  ```html
  <input placeholder="{taskRepo.metadata.fields.title.label}" />
  ```
  - **fields** - An object specifying custom field names for the relation.
    Each key represents a field in the related entity, and its value is the corresponding field in the source entity.
    For example, `{ customerId: 'id' }` maps the 'customerId' field in the related entity to the 'id' field in the source entity.
    This is useful when you want to define custom field mappings for the relation.
  - **field** - The name of the field for this relation.
  - **findOptions** - Find options to apply to the relation when fetching related entities.
    You can specify a predefined set of find options or provide a function that takes the source entity
    and returns find options dynamically.
    These options allow you to customize how related entities are retrieved.
  - **defaultIncluded** - Determines whether the relation should be included by default when querying the source entity.
    When set to true, related entities will be automatically included when querying the source entity.
    If false or not specified, related entities will need to be explicitly included using the `include` option.
