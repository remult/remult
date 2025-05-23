# Entity Lifecycle Hooks

In Remult, you can take advantage of Entity Lifecycle Hooks to add custom logic and actions at specific stages of an entity's lifecycle. There are five lifecycle events available: `validation`, `saving`, `saved`, `deleting`, and `deleted`. These hooks allow you to perform actions or validations when specific events occur in the entity's lifecycle.

## Validation

- **Runs On**: Backend and Frontend.
- **Purpose**: To perform validations on the entity's data before saving. This is the best place to check how individual fields in entity relate to each other.
- **Example**:
  ```ts
  @Entity<Task>("tasks", {
    validation: async (task, e) => {
      // simple validation of single field
      if (task.title.length < 5) {
        e.fields.collection.error = "Task title must be at least 5 characters long."
      }

      // checking few fields for joint validity
      if (task.completed && task.assignedToId === null){
        throw new Error(`Task ${task.title} must be assigned to someone before beeing completed.`)
      }
    },
  })
  ```

  ::: tip
  You can run custom validation like in this example to check separate fields one by one as we do with `title.length`, but probably better place to do it with [field validation](./validation.md).
  :::

  ::: tip
  When validation runs on backend it do not load [relations](./entity-relations.md) automatically! On server side hook receives only relation primary keys and relation data is `undefined` if you try to use it. There is two ways to overcome it:
  * `load()` relation:
  ```ts
  @Entity<Order>("orders", {
    validation: async (order, e) => {
      // option 1 - load relation when you need it
      await e.fields.items.load()
      if (length(order.items) > 3 && order.destinationCountry == 'US') {
        throw new Error("We can't ship such large orders to USA! :-(");
      }
    },
  })
  ```

  * add [`relationExists`](./ref_validators#relationexists) validation to field:
  ```ts
  @Relations.toMany(() => Items, {
    // option 2 - relation is loaded by byproduct of this validation
    validate: Validators.relationExists
  })
  items?: Item[];
  ```
  :::

## Saving

- **Runs On**: Backend (or Frontend if using a local frontend database).
- **Purpose**: To execute custom logic before an entity is saved.
- **Example**:
  ```ts
  @Entity<Task>("tasks", {
    saving: async (task, e) => {
      if (e.isNew) {
        task.createdAt = new Date(); // Set the creation date for new tasks.
      }
      task.lastUpdated = new Date(); // Update the last updated date.
    },
  })
  ```

## Saved

- **Runs On**: Backend (or Frontend if using a local frontend database).
- **Purpose**: To perform actions after an entity has been successfully saved.
- **Example**: Useful for triggering additional processes or updates after saving.

## Deleting

- **Runs On**: Backend (or Frontend if using a local frontend database).
- **Purpose**: To execute custom logic before an entity is deleted.
- **Example**: You can use this to ensure related data is properly cleaned up or archived.

## Deleted

- **Runs On**: Backend (or Frontend if using a local frontend database).
- **Purpose**: To perform actions after an entity has been successfully deleted.
- **Example**: Similar to the `saved` event, this is useful for any post-deletion processes.

## Field Saving Hook

Additionally, you can define a field-specific `saving` hook that allows you to perform custom logic on a specific field before the entity `saving` hook. It has the following signature:

```ts
@Fields.Date<Task>({
  saving: (task, fieldRef, e) => {
    if (e.isNew) task.createdAt = new Date()
  },
})
createdAt = new Date()
```

or using the fieldRef

```ts
@Fields.Date({
  saving: (_, fieldRef, e) => {
    if (e.isNew) fieldRef.value = new Date()
  },
})
createdAt = new Date()
```

You can use the field `saving` hook to perform specialized actions on individual fields during the entity's saving process.

## Lifecycle Event Args

Each lifecycle event receives an instance of the relevant entity and an event args of type `LifecycleEvent`. The `LifecycleEvent` object provides various fields and methods to interact with the entity and its context. Here are the fields available in the `LifecycleEvent`:

- `isNew`: A boolean indicating whether the entity is new (being created).
- `fields`: A reference to the entity's fields, allowing you to access and modify field values.
- `id`: The ID of the entity.
- `originalId`: The original ID of the entity, which may differ during certain operations.
- `repository`: The repository associated with the entity.
- `metadata`: The metadata of the entity, providing information about its structure.
- `preventDefault()`: A method to prevent the default behavior associated with the event.
- `relations`: Access to repository relations for the entity, allowing you to work with related data.

## Example Usage

Here's an example of how to use Entity Lifecycle Hooks to add custom logic to the `saving` event:

```ts
@Entity<Task>("tasks", {
  saving: async (task, e) => {
    if (e.isNew) {
      task.createdAt = new Date(); // Set the creation date for new tasks.
    }
    task.lastUpdated = new Date(); // Update the last updated date.
  },
})
```

In this example, we've defined a `saving` event for the `Task` entity. When a task is being saved, the event handler is called. If the task is new (not yet saved), we set its `createdAt` field to the current date. In either case, we update the `lastUpdated` field with the current date.

Entity Lifecycle Hooks provide a powerful way to customize the behavior of your entities and ensure that specific actions or validations are performed at the right time in the entity's lifecycle. You can use these hooks to streamline your application's data management and enforce business rules.
