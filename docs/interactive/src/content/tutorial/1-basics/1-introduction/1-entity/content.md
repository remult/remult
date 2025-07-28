---
type: lesson
title: Entity
focus: /shared/Task.ts
template: before-entity
---

# The Entity

In Remult, the core element is an `entity`. An entity represents a business object, such as an order or customer. In our tutorial, we'll use a `Task` entity for our todo application.

Here's the code for the entity we'll use:

```ts title="shared/Task.ts" add={3-5,7,10,13,16,19}
import { Entity, Fields } from 'remult'

@Entity('tasks', {
  allowApiCrud: true,
})
export class Task {
  @Fields.id()
  id = ''

  @Fields.string()
  title = ''

  @Fields.boolean()
  completed = false

  @Fields.createdAt()
  createdAt?: Date
}
```

### Code Explanation

- `@Entity('tasks', { allowApiCrud: true })` defines the `Task` entity and configures it to allow all CRUD operations - later we'll restrict that using authorization.
- `@Fields.id()` generates a unique ID for each task.
- `@Fields.string()` and `@Fields.boolean()` define the `title` and `completed` fields, respectively.
- `@Fields.createdAt()` automatically sets the creation date.

This entity will be used to define the database, API, frontend query language, validation, authorization, and any other definition that revolves around the `task`.

We've placed the entity's source code in the `shared` folder to indicate that it's shared between the frontend and the backend.
