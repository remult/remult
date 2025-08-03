# EntityMetadata

Metadata for an `Entity`, this metadata can be used in the user interface to provide a richer UI experience

## entityType

The class type of the entity

## key

The Entity's key also used as it's url

## fields

Metadata for the Entity's fields

## caption

A human readable caption for the entity. Can be used to achieve a consistent caption for a field throughout the app

#### example:

```ts
<h1>Create a new item in {taskRepo.metadata.caption}</h1>
```

#### see:

EntityOptions.caption

## label

A human readable label for the entity. Can be used to achieve a consistent label for a field throughout the app

#### example:

```ts
<h1>Create a new item in {taskRepo.metadata.label}</h1>
```

#### see:

EntityOptions.label

## dbName

The name of the table in the database that holds the data for this entity.
If no name is set in the entity options, the `key` will be used instead.

#### see:

EntityOptions.dbName

## options

The options send to the `Entity`'s decorator

#### see:

EntityOptions

## apiUpdateAllowed

true if the current user is allowed to update an entity instance

#### see:

EntityOptions.allowApiUpdate

#### example:

```ts
if (repo(Task).metadata.apiUpdateAllowed(task)) {
  // Allow user to edit the entity
}
```

Arguments:

- **item**

## apiReadAllowed

true if the current user is allowed to read from entity

#### see:

EntityOptions.allowApiRead

#### example:

```ts
if (repo(Task).metadata.apiReadAllowed) {
  await taskRepo.find()
}
```

## apiDeleteAllowed

true if the current user is allowed to delete an entity instance

-

#### see:

EntityOptions.allowApiDelete

#### example:

```ts
if (repo(Task).metadata.apiDeleteAllowed(task)) {
  // display delete button
}
```

Arguments:

- **item**

## apiInsertAllowed

true if the current user is allowed to create an entity instance

#### see:

EntityOptions.allowApiInsert

#### example:

```ts
if (repo(Task).metadata.apiInsertAllowed(task)) {
  // display insert button
}
```

Arguments:

- **item**

## getDbName

- **getDbName**

## idMetadata

Metadata for the Entity's id

#### see:

EntityOptions.id for configuration
