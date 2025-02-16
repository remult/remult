# Entity Instance Backend Methods

When leveraging the Active Record pattern, backend methods for entity instances offer a powerful way to integrate client-side behavior with server-side logic. These methods, when invoked, transport the entire entity's state from the client to the server and vice versa, even if the data has not yet been saved. This feature is particularly useful for executing entity-specific operations that require a round-trip to the server to maintain consistency and integrity.

## Overview of Entity Backend Methods

Entity backend methods enable all the fields of an entity, including unsaved values, to be sent to and from the server during the method's execution. This approach is essential for operations that rely on the most current state of an entity, whether or not the changes have been persisted to the database.

### Defining a Backend Method

To define a backend method, use the `@BackendMethod` decorator to annotate methods within an entity class. This decorator ensures that the method is executed on the server, taking advantage of server-side resources and permissions.

Here is an example demonstrating how to define and use a backend method in an entity class:

```typescript
@Entity('tasks', {
  allowApiCrud: true,
})
export class Task extends IdEntity {
  @Fields.string()
  title = ''

  @Fields.boolean()
  completed = false

  @BackendMethod({ allowed: true })
  async toggleCompleted() {
    this.completed = !this.completed
    console.log({
      title: this.title,
      titleOriginalValue: this.$.title.originalValue,
    })
    await this.save()
  }
}
```

### Calling the Backend Method from the Frontend

Once the backend method is defined, it can be called from the client-side code. This process typically involves fetching an entity instance and then invoking the backend method as shown below:

```typescript
const task = await repo(Task).findFirst()
await task.toggleCompleted()
```

### Security Considerations

::: danger
It's important to note that backend methods bypass certain API restrictions that might be set on the entity, such as `allowApiUpdate=false`. This means that even if an entity is configured not to allow updates through standard API operations, it can still be modified through backend methods if they are permitted by their `allowed` setting. Consequently, developers must explicitly handle security and validation within these methods to prevent unauthorized actions.

The principle here is that if a user has permission to execute the `BackendMethod`, then all operations within that method are considered authorized. It is up to the developer to implement any necessary restrictions within the method itself.
:::
