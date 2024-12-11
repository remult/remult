---
type: lesson
title: Extend Entity (add fields)
focus: /shared/TaskExtra.ts
template: select-fields
---

## Introduction Extend Entity

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
  - Yes, by default, remult will use the entity key as the database name.

### Try it out

```ts
// Get Task fields
await repo(Task).find()

// Get Task & TaskExtra fields
await repo(TaskExtra).find()
```
