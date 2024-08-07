---
type: lesson
title: Welcome to Remult Tutorial
focus: /shared/Task.ts
template: before-entity
---

# Welcome to the Remult Tutorial

Hey there, and welcome to the Remult Tutorial 👋!

Remult is a full-stack JavaScript library that greatly simplifies the development of data entry applications. It includes:

- Backend ORM
- Zero-boilerplate CRUD Rest & Realtime API
- Frontend type-safe API client
- TypeScript entities as a single source of truth (SSO) for:
  - Authorization
  - Validation
  - Entity-related business logic

By following the principles of SSO, Remult makes CRUD application development much simpler.

## The Entity

In Remult, the core element is an `entity`. An entity represents a business object, such as an order or customer. In our tutorial, we'll use a `Task` entity for our todo application.

Here's the code for the entity we'll use:

```ts add={3-5,7,10,13,16,19}
import { Entity, Fields } from 'remult'

@Entity('tasks', {
  allowApiCrud: true,
})
export class Task {
  @Fields.uuid()
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
- `@Fields.uuid()` generates a unique ID for each task.
- `@Fields.string()` and `@Fields.boolean()` define the `title` and `completed` fields, respectively.
- `@Fields.createdAt()` automatically sets the creation date.

This entity will be used to define the database, API, frontend query language, validation, authorization, and any other definition that revolves around the `task`.

We've placed the entity's source code in the `shared` folder to indicate that it's shared between the frontend and the backend.
