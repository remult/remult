---
type: lesson
title: Lifecycle Hooks
focus: /shared/Task.ts
---

## Introduction to Entity Lifecycle Hooks

Entity Lifecycle Hooks in Remult provide a powerful way to add custom actions and validations at key stages of an entity’s lifecycle. These hooks allow you to execute specific logic when saving, updating, or deleting entities, giving you greater control over your data.

### Available Lifecycle Events

1. **Saving** and **Saved**: Triggered when an entity is being saved or after it’s saved. Runs on the backend and can validate, modify data, or log updates.
2. **Deleting** and **Deleted**: Triggered when an entity is being deleted or after deletion. This is useful for cleanup or logging and also runs on the backend.
3. **Validation**: Runs on both the backend and frontend (if possible) and is specifically for validating data before saving. This is often used to enforce constraints across fields.

Any exception thrown within `saving` and `deleting` events will be treated as a validation error, preventing the entity from being saved or deleted. In addition to throwing exceptions, you can set an error message directly on a specific field using `field.error`. This displays an error in the UI and aborts the save operation for that entity.

```file:/shared/Task.ts title="shared/Task.ts" add={5-19} collapse={22-100}

```

### Code Explanation

This example defines the following lifecycle hooks for the `Task` entity:

- **Saving Hook**:

  - Runs before an entity is saved.
  - If the entity is new (indicated by `e.isNew`), it logs the task title with the message "New task."
  - If the entity is being updated, it iterates over all fields in `e.fields`, checking if any values have changed with `field.valueChanged()`.
    - When a field has changed, it logs the field’s caption (`field.metadata.caption`), its original value (`field.originalValue`), and its new value (`field.value`).

- **Deleting Hook**:
  - Runs before an entity is deleted.
  - Logs the title of the task being deleted.

This setup allows you to keep track of any task changes and deletions, capturing all field changes when a task is updated and identifying tasks as they are deleted.

### Field-Level Validation and Saving Hooks

In addition to entity-level hooks, you can also define validation and saving hooks at the field level. This can be particularly useful when specific logic needs to apply only to a particular field. Field-level hooks execute before the main entity’s lifecycle hook, allowing fine-grained control over individual fields.

### Further Reading and Testing

For more information on how to leverage these hooks in your applications, refer to the [Remult Lifecycle Hooks Documentation](https://remult.dev/docs/lifecycle-hooks#entity-lifecycle-hooks).

### Try It Out

Click on the `Toggle Terminal` button on the right, make some changes to tasks, and observe the terminal output to see the messages generated in the saving and deleting hooks.
