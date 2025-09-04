# Sort

The `Sort` class is used to describe sorting criteria for queries. It is mainly used internally,
but it provides a few useful functions for working with sorting.

## toEntityOrderBy

Translates the current `Sort` instance into an `EntityOrderBy` object.

#### returns:

An `EntityOrderBy` object representing the sort criteria.

## constructor

Constructs a `Sort` instance with the provided sort segments.

Arguments:

- **segments** - The sort segments to be included in the sort criteria.

## Segments

The segments of the sort criteria.

## reverse

Reverses the sort order of the current sort criteria.

#### returns:

A new `Sort` instance with the reversed sort order.

## compare

Compares two objects based on the current sort criteria.

#### returns:

A negative value if `a` should come before `b`, a positive value if `a` should come after `b`, or zero if they are equal.

Arguments:

- **a** - The first object to compare.
- **b** - The second object to compare.
- **getFieldKey** - An optional function to get the field key for comparison.

## translateOrderByToSort

Translates an `EntityOrderBy` to a `Sort` instance.

#### returns:

A `Sort` instance representing the translated order by.

Arguments:

- **entityDefs** - The metadata of the entity associated with the order by.
- **orderBy** - The `EntityOrderBy` to be translated.

## createUniqueSort

Creates a unique `Sort` instance based on the provided `Sort` and the entity metadata.
This ensures that the sort criteria result in a unique ordering of entities.

#### returns:

A `Sort` instance representing the unique sort criteria.

Arguments:

- **entityMetadata** - The metadata of the entity associated with the sort.
- **orderBy** - The `Sort` instance to be made unique.

## createUniqueEntityOrderBy

Creates a unique `EntityOrderBy` based on the provided `EntityOrderBy` and the entity metadata.
This ensures that the order by criteria result in a unique ordering of entities.

#### returns:

An `EntityOrderBy` representing the unique order by criteria.

Arguments:

- **entityMetadata** - The metadata of the entity associated with the order by.
- **orderBy** - The `EntityOrderBy` to be made unique.
