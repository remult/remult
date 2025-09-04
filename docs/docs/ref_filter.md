# Filter

The `Filter` class is a helper class that focuses on filter-related concerns. It provides methods
for creating and applying filters in queries.

## getPreciseValues

Retrieves precise values for each property in a filter for an entity.

#### returns:

A promise that resolves to a FilterPreciseValues object containing the precise values for each property.

#### example:

```ts
const preciseValues = await Filter.getPreciseValues(meta, {
  status: { $ne: 'active' },
  $or: [{ customerId: ['1', '2'] }, { customerId: '3' }],
})
console.log(preciseValues)
// Output:
// {
//   "customerId": ["1", "2", "3"], // Precise values inferred from the filter
//   "status": undefined,           // Cannot infer precise values for 'status'
// }
```

Arguments:

- **metadata** - The metadata of the entity being filtered.
- **filter** - The filter to analyze.

## getPreciseValues

Retrieves precise values for each property in a filter for an entity.

#### returns:

A promise that resolves to a FilterPreciseValues object containing the precise values for each property.

#### example:

```ts
const preciseValues = await where.getPreciseValues()
console.log(preciseValues)
// Output:
// {
//   "customerId": ["1", "2", "3"], // Precise values inferred from the filter
//   "status": undefined,           // Cannot infer precise values for 'status'
// }
```

## createCustom

Creates a custom filter. Custom filters are evaluated on the backend, ensuring security and efficiency.
When the filter is used in the frontend, only its name is sent to the backend via the API,
where the filter gets translated and applied in a safe manner.

#### returns:

A function that returns an `EntityFilter` of type `entityType`.

#### example:

```ts
class Order {
  //...
  static activeOrdersFor = Filter.createCustom<Order, { year: number }>(
    async ({ year }) => {
      return {
        status: ['created', 'confirmed', 'pending', 'blocked', 'delayed'],
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        },
      }
    },
  )
}
// Usage
await repo(Order).find({
  where: Order.activeOrders({ year }),
})
```

#### see:

[Sql filter and Custom filter](/docs/custom-filter.html)
[Filtering and Relations](/docs/filtering-and-relations.html)

Arguments:

- **translator** - A function that returns an `EntityFilter`.
- **key** - An optional unique identifier for the custom filter.

## entityFilterToJson

Translates an `EntityFilter` to a plain JSON object that can be stored or transported.

#### returns:

A plain JSON object representing the `EntityFilter`.

#### example:

```ts
// Assuming `Task` is an entity class
const jsonFilter = Filter.entityFilterToJson(Task, { completed: true })
// `jsonFilter` can now be stored or transported as JSON
```

Arguments:

- **entityDefs** - The metadata of the entity associated with the filter.
- **where** - The `EntityFilter` to be translated.

## entityFilterFromJson

Translates a plain JSON object back into an `EntityFilter`.

#### returns:

The reconstructed `EntityFilter`.

#### example:

```ts
// Assuming `Task` is an entity class and `jsonFilter` is a JSON object representing an EntityFilter
const taskFilter = Filter.entityFilterFromJson(Task, jsonFilter)
// Using the reconstructed `EntityFilter` in a query
const tasks = await remult.repo(Task).find({ where: taskFilter })
for (const task of tasks) {
  // Do something for each task based on the filter
}
```

Arguments:

- **entityDefs** - The metadata of the entity associated with the filter.
- **packed** - The plain JSON object representing the `EntityFilter`.

## fromEntityFilter

Converts an `EntityFilter` to a `Filter` that can be used by the `DataProvider`. This method is
mainly used internally.

#### returns:

A `Filter` instance that can be used by the `DataProvider`.

#### example:

```ts
// Assuming `Task` is an entity class and `taskFilter` is an EntityFilter
const filter = Filter.fromEntityFilter(Task, taskFilter)
// `filter` can now be used with the DataProvider
```

Arguments:

- **entity** - The metadata of the entity associated with the filter.
- **whereItem** - The `EntityFilter` to be converted.

## constructor

- **Filter**

Arguments:

- **apply**

## resolve

Resolves an entity filter.

This method takes a filter which can be either an instance of `EntityFilter`
or a function that returns an instance of `EntityFilter` or a promise that
resolves to an instance of `EntityFilter`. It then resolves the filter if it
is a function and returns the resulting `EntityFilter`.

#### returns:

The resolved entity filter.

Arguments:

- **filter** - The filter to resolve.

## toJson

- **toJson**
