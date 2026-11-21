---
llm: "@BackendMethod - typed RPC calls that auto-expose REST endpoints and run server-only logic."
---

# Backend Methods

Backend methods run on the backend and are used to improve performance, execute server-only code (e.g., sending emails), or perform operations not accessible through the API.

## Static Backend Methods

Static backend methods represent the most straightforward type, transmitting their parameters to the backend and delivering their outcome to the frontend.

1. **Define the Backend Method:**

```typescript
import { BackendMethod, repo } from 'remult'
import { Task } from './Task'

export class TasksController {
  /**
   * Sets the completion status of all tasks.
   * @param {boolean} completed - The completion status to set for all tasks.
   */
  @BackendMethod({ allowed: true })
  static async setAll(completed: boolean) {
    const taskRepo = repo(Task)

    for (const task of await taskRepo.find()) {
      await taskRepo.save({ ...task, completed })
    }
  }
}
```

Each controller can house one or more backend methods, each serving distinct purposes tailored to your application's needs. In the provided example, the `TasksController` class contains a single backend method named `setAll`, responsible for setting the completion status of all tasks.

The method name, such as `setAll`, serves as the URL for the corresponding REST endpoint on the backend server. It's worth noting that, by default, the endpoints are not prefixed. This means that if you define the `setAll` method in `TasksController`, and `setAll` in a separate controller, you will have potentially unwanted behaviour - two handlers for one endpoint. You can fix this by configuring a prefix for these endpoints using the `apiPrefix` option, providing flexibility in structuring your backend API routes.

The allowed: true parameter signifies that the backend method can be invoked by anyone. Alternatively, you can customize the authorization settings for finer control over who can access the method.

For instance, setting allow: Allow.authenticated restricts access to authenticated users only, ensuring that only logged-in users can utilize the method.

Similarly, specifying allow: 'admin' limits access to users with administrative privileges, granting access exclusively to administrators.

These options offer granular control over authorization, allowing you to tailor access permissions based on your application's specific requirements and security considerations.

2. **Register the Controller:**

```typescript
// Register TasksController in the controllers array of the remultApi options
export const api = remultApi({
  entities: [Task],
  controllers: [TasksController],
})
```

3. **Call from the Frontend:**

```typescript
await TasksController.setAll(true)
```

This example demonstrates how to define and use a static backend method, `setAll`, within the `TasksController` class. When called from the frontend, this method sets the completion status of all tasks to the specified value (`true` in this case). The method leverages Remult's `BackendMethod` decorator to handle the communication between the frontend and backend seamlessly.

## Serializing arguments and return values

Backend methods send arguments and return values as plain JSON. A `Date` argument arrives as a string unless `paramTypes` lists it, and nested values and return values never convert. Set `BackendMethod.serializer` to send them through a serializer such as superjson. Put it in a file that both the frontend and the backend import.

```ts
import { BackendMethod } from 'remult'
import superjson from 'superjson'

BackendMethod.serializer = superjson
```

Both methods get a second argument with the `Remult` making the call and the options passed to `@BackendMethod`, and either may return a promise. That lets a serializer rebuild entities with `remult.repo(...)`, or read settings you add to the options.

```ts
declare module 'remult' {
  interface BackendMethodOptions<type> {
    returns?: string
  }
}

BackendMethod.serializer = {
  serialize: (value, { remult, options }) => encode(value, options.returns),
  deserialize: async (value, { remult, options }) =>
    decode(value, options.returns, (key, row) => remult.repo(entities[key]).fromJson(row)),
}
```

`paramTypes` still runs first, so an entity listed there is still sent as its id and fetched on the backend.

### Validating arguments

The second argument also has `part`, which is `'args'` for the argument list and `'result'` for the return value. On the backend, `deserialize` with `part: 'args'` runs before the method does, so it's a place to validate. Throw an `EntityError` and its `message` and `modelState` reach the caller.

Here `args` is a zod schema added to `BackendMethodOptions` the same way as `returns` above.

```ts
BackendMethod.serializer = {
  serialize: (value) => superjson.serialize(value),
  deserialize: (value, { options, part }) => {
    const parsed = superjson.deserialize(value as SuperJSONResult)
    if (part !== 'args' || !options.args) return parsed
    const result = options.args.safeParse(parsed)
    if (!result.success)
      throw new EntityError({
        message: 'Invalid arguments',
        modelState: toModelState(result.error),
      })
    return result.data
  },
}
```
