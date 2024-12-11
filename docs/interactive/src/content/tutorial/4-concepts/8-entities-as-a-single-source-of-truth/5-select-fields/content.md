---
type: lesson
title: Select Fields
focus: /shared/TaskLight.ts
template: select-fields
---

## Introduction Select Fields

Select fields in Remult allows you to select only the fields you need from an entity. This is useful when you want to reduce the amount of data that is retrieved from the database.

## How to

Create a new entity, and set an `sqlExpression` option to point to the right database name.

```file:/shared/TaskLight.ts title="shared/TaskLight.ts"

```

### Code Explanation

- Setting `sqlExpression` at the entity level will almost act like a dynamic view creation.
- Be aware that it's a complete separate entity, so make sure you set the right access control.

### Try it out

```ts
// Get Task fields
await repo(Task).find()

// TaskLight fields only
await repo(TaskLight).find()
```

### See also

- [Leveraging Database Capabilities with sqlExpression](https://remult.dev/docs/ref_entity#sqlexpression)
