---
type: lesson
title: Select Fields
focus: /shared/TaskLight.ts
template: select-fields
---

## Introduction Select Fields

Select fields in Remult allows you to select only the fields you need from an entity. This is useful when you want to reduce the amount of data groing from client to server.

## How to

Create a new entity, and point to an existing table in the database using the `dbName` option.

```file:/shared/TaskLight.ts title="shared/TaskLight.ts"

```

### Code Explanation

- Be aware that it's a complete separate entity, so make sure you set the right access control.
- Here, `allowApiCrud` options is set to false, and `allowApiRead` is set to true so this entity is read-only (it's also the default, just wanted to show you can set it explicitly)

### Try it out

```ts
// Get Task fields
await repo(Task).find()

// TaskLight fields only
await repo(TaskLight).find()
```

### See also

We showed that you can use `dbName` to point at an existing table in the database.
You can also create a dynamic view, [Leveraging Database Capabilities with sqlExpression](https://remult.dev/docs/ref_entity#sqlexpression).
