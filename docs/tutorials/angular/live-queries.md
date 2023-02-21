# Live Queries :rocket:

::: tip New Feature
Live queries are a new feature introduced in version 0.18.
:::

Our todo list app can have multiple users using it at the same time. However, changes made by one user are not seen by others unless they manually refresh the browser.

Let's add realtime multiplayer capabilities to this app.

## One Time Setup

We'll need angular to run it's change detection when we receive messages from teh backend - to do that we'll add the following code to `AppModule`

```ts{1-2,5-7}
import { NgModule, NgZone } from "@angular/core"
import { remult } from "remult"
//...
export class AppModule {
  constructor(zone: NgZone) {
    remult.apiClient.wrapMessageHandling = handler => zone.run(() => handler())
  }
}
```

## Using LiveQuery

Modify the `TodoComponent` with the following changes

```ts{1,5,7-8,13,15-17}
export class TodoComponent implements OnInit, OnDestroy {
  //...
  taskRepo = remult.repo(Task)
  tasks: Task[] = []
  unsubscribe = () => {}
  ngOnInit() {
    this.unsubscribe = this.taskRepo
      .liveQuery({
        limit: 20,
        orderBy: { completed: "asc" }
        //where: { completed: true },
      })
      .subscribe(info => (this.tasks = info.applyChanges(this.tasks)))
  }
  ngOnDestroy() {
    this.unsubscribe()
  }
}
```

Let's review the change:

- Instead of calling the `repository`'s `find` method we now call the `liveQuery` method and it's `subscribe` method.
- The `subscribe` method accepts a callback with an `info` object that has 3 members:
  - `items` - an up to date list of items representing the current result - it's useful for readonly use cases.
  - `applyChanges` - a method that receives an array and applies the changes to it - we send that method to the `setTasks` state function, to apply the changes to the existing `tasks` state.
  - `changes` - a detailed list of changes that were received
- The `subscribe` method return an `unsubscribe` method, which we store in the `unsubscribe` member and call in the `ngOnDestroy` hook

Open the todo app in two (or more) browser windows/tabs, make some changes in one window and notice how the others are updated in realtime.

::: tip Under the hood
The default implementation of live-queries uses HTTP Server-Sent Events (SSE) to push realtime updates to clients, and stores live-query information in-memory.

For scalable production / serverless environments, live-query updates can be pushed using integration with third-party realtime providers, such as [Ably](https://ably.com/), and live-query information can be stored to any database supported by Remult.
:::
