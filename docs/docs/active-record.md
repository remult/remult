# Mutability and the Active Record Pattern

The Active Record pattern is a concept in software architecture, particularly useful when working with mutable objects whose state may change over time. This design pattern facilitates direct interaction with the database through the object representing a row of the data table. In this article, we'll delve into the fundamentals of the Active Record pattern, contrasting it with immutable patterns, and exploring its implementation and advantages in software development.

### Immutable vs. Mutable Patterns

In modern software development, handling data objects can generally be approached in two ways: immutable and mutable patterns.

**Immutable objects** do not change once they are created. Any modification on an immutable object results in a new object. For example, in the React framework, immutability is often preferred:

```typescript
// Immutable update
const updatePerson = { ...person, name: 'newName' }
```

However, libraries like MobX offer the flexibility to work with mutable objects while still providing the reactivity that React components need.

**Mutable objects**, on the other hand, allow for changes directly on the object itself:

```typescript
// Mutable update
person.name = 'newName'
```

Mutable patterns are especially prevalent in scenarios where the state of objects changes frequently, making them a staple in many programming environments outside of React.

### The Role of Active Record Pattern

The Active Record pattern embodies the concept of mutability by binding business logic to object data models. Typically, each model instance corresponds to a row in the database, with the class methods providing the functionality to create, read, update, and delete records.

### Warning: Mutable Objects in React

Using mutable objects with the Active Record pattern in React (without libraries like MobX) requires careful handling. React’s rendering cycle is built around the premise of immutability; it typically relies on immutable state management to trigger re-renders. When mutable objects change state outside the scope of React's `useState` or `useReducer`, React does not automatically know to re-render the affected components. This can lead to issues where the UI does not reflect the current application state.

These challenges can be mitigated by integrating state management tools that are designed to work well with mutable objects, such as MobX. MobX provides mechanisms to track changes in data and automatically re-render components when mutations occur. This aligns more naturally with the Active Record pattern within the context of React, ensuring that the UI stays in sync with the underlying data.

#### Using EntityBase and IdEntity

In practice, leveraging the Active Record pattern often involves inheriting from classes such as `EntityBase` or `IdEntity` (a variant of `EntityBase` with a UUID as the identifier). These base classes enrich models with methods that simplify manipulations of their attributes and their persistence in the database.

```typescript
@Entity('people')
export class Person extends IdEntity {
  @Fields.string()
  name = ''
}
```

**Explanation:**
The `Person` class represents individuals in the 'people' table and inherits from `IdEntity`. This inheritance means that there is no need to explicitly define an `id` field for this class, as `IdEntity` automatically includes a UUID field (`id`). Consequently, `Person` benefits from all the functionalities of `EntityBase`, which include tracking changes and handling CRUD operations, while also automatically gaining a UUID as the identifier.

### Mutable vs EntityBase (active-record)

**Traditional approach without Active Record:**

```typescript
// Updating a person's name the traditional way
await repo(Person).update(person, { name: 'newName' })
```

**Using Active Record with EntityBase:**

```typescript
// Active Record style
person.name = 'newName'
await person.save()
```

This pattern also simplifies other operations:

```typescript
// Deleting a record
await person.delete()

// Checking if the record is new
if (person.isNew()) {
  // Perform a specific action
}
```

#### Helper Members in EntityBase

EntityBase provides additional utility members like `_` and `$` to facilitate more complex interactions:

- **`_` (EntityRef Object):** Allows performing operations on a specific instance of an entity.

```typescript
await person._.reload()
```

- **`$` (FieldsRef):** Provides access to detailed information about each field in the current instance, such as their original and current values:

```typescript
// Logging changes in a field
console.log(
  `Name changed from "${person.$.name.originalValue}" to "${person.name}"`,
)
```

### Alternative Implementations

Even without direct inheritance from `EntityBase`, similar functionalities can be achieved using helper functions such as `getEntityRef`, which encapsulates an entity instance for manipulation and persistence:

```typescript
const ref = getEntityRef(person)
await ref.save()
```

### Conclusion

The Active Record pattern offers a straightforward and intuitive approach to interacting with database records through object-oriented models. It is particularly beneficial in environments where business logic needs to be tightly coupled with data manipulation, providing a clear and efficient way to handle data state changes. However, integrating the Active Record pattern with mutable objects in React can be challenging.
