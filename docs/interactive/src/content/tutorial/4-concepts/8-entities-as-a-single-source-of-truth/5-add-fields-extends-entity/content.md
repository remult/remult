---
type: lesson
title: Extend Entity (add fields)
focus: /shared/TaskExtra.ts
template: select-fields
---

## Introduction Extend Entity

When you application grows, you entities will grow too. At some point, it could be useful to refactor your entities to make them more readable and maintainable by making them smaller.

Imagine a `Task` having an `id`, `title`, `completed` and `description` fields _(and way more!)_. It could be good to refactor it to have a `Task` entity with only the `id`, `title` and `completed` fields, and then have a `TaskExtra` entity with the rest of the fields, here `description`.

Extending an entity is a powerful feature that allows you to add new fields to an existing entity without changing the base entity.
By doing this, you will not overload the base entity with fields that are not relevant all the time.

### How to

Create a new entity that extends the base entity and add the new fields to it.

```file:/shared/TaskExtra.ts title="shared/TaskExtra.ts"

```

### Code Explanation

- You need to have a dedicated key for this new entity, here `TaskExtraKey`.
  - It's to really differentiate between the two entities for remult.
  - It will also create two different entries in Admin UI.
- You need to set the `dbName` option to point to the right database name (same as the base entity).
  - By default, remult will use the entity key as the database name.

### Try it out

```ts
// Get Task fields
await repo(Task).find()

// Get Task & TaskExtra fields
await repo(TaskExtra).find()
```
