---
type: lesson
title: Extend Entity (add fields)
focus: /shared/TaskExtra.ts
template: select-fields
---

## Introduction Extend Entity

Extending an entity is a powerful feature that allows you to add new fields to an existing entity without rewriting the entity. By doing this, you will not overload the base entity with fields that are not relevant all the time.

### How to

Create a new entity that extends the base entity and add the new fields to the new entity.

```ts
import { Entity, Fields } from 'remult'
import { Task } from './Task.js'

@Entity<TaskExtra>('TaskExtraKey', {
  dbName: 'tasks',
})
export class TaskExtra extends Task {
  @Fields.string()
  description = ''
}
```

### Code Explanation

- You need to have a dedicaed key for this new entity, here `TaskExtraKey`.
- You need to set the `dbName` option to point to the right database name (same as the base entity).

### Try it out

```ts
// Get Task fields
repo(Task).find()

// Get Task & TaskExtra fields
repo(TaskExtra).find()
```
