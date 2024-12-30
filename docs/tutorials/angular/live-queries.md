# Live Queries

Our todo list app can have multiple users using it at the same time. However, changes made by one user are not seen by others unless they manually refresh the browser.

Let's add realtime multiplayer capabilities to this app.

## One Time Setup

We'll need angular to run it's change detection when we receive messages from the backend - to do that we'll add the following code to `AppComponent`

```ts{3-5,7-9}
// src/app/app.component.ts

import { Component, NgZone } from '@angular/core';
import { remult } from "remult"
//...
export class AppComponent {
  constructor(zone: NgZone) {
    remult.apiClient.wrapMessageHandling = handler => zone.run(() => handler())
  }
}
```

## Realtime updated todo list

Let's switch from fetching Tasks once when the Angular component is loaded, and manually maintaining state for CRUD operations, to using a realtime updated live query subscription **for both initial data fetching and subsequent state changes**.

1. Modify the contents of the `ngOnInit` method in the `Todo` component:

Modify the `TodoComponent` with the following changes

```ts{3,5,9,11-12,17,19-21}
// src/app/todo/todo.component.ts

import { Component, OnDestroy, OnInit } from '@angular/core';
...
export class TodoComponent implements OnInit, OnDestroy {
  //...
  taskRepo = remult.repo(Task)
  tasks: Task[] = []
  unsubscribe = () => {}
  ngOnInit() {
    this.unsubscribe = this.taskRepo
      .liveQuery({
        limit: 20,
        orderBy: { createdAt: "asc" }
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

- Instead of calling the `repository`'s `find` method we now call the `liveQuery` method to define the query, and then call its `subscribe` method to establish a subscription which will update the Tasks state in realtime.
- The `subscribe` method accepts a callback with an `info` object that has 3 members:
  - `items` - an up to date list of items representing the current result - it's useful for readonly use cases.
  - `applyChanges` - a method that receives an array and applies the changes to it - we send that method to the `setTasks` state function, to apply the changes to the existing `tasks` state.
  - `changes` - a detailed list of changes that were received
- The `subscribe` method returns an `unsubscribe` method, which we store in the `unsubscribe` member and call in the `ngOnDestroy` hook, so that it'll be called when the component unmounts.

2. As all relevant CRUD operations (made by all users) will **immediately update the component's state**, we should remove the manual adding of new Tasks to the component's state:

```ts{6}
// src/app/todo/todo.component.ts

async addTask() {
  try {
    const newTask = await this.taskRepo.insert({ title: this.newTaskTitle })
    //this.tasks.push(newTask) <-- this line is no longer needed
    this.newTaskTitle = ""
  } catch (error: any) {
    alert(error.message)
  }
}
```

3. Optionally remove other redundant state changing code:

```ts{5}
// src/app/todo/todo.component.ts

async deleteTask(task: Task) {
   await this.taskRepo.delete(task);
   // this.tasks = this.tasks.filter(t => t !== task); <-- this line is no longer needed
}
```

Open the todo app in two (or more) browser windows/tabs, make some changes in one window and notice how the others are updated in realtime.

::: tip Under the hood
The default implementation of live-queries uses HTTP Server-Sent Events (SSE) to push realtime updates to clients, and stores live-query information in-memory.

For serverless environments _(or multi servers)_, live-query updates can be pushed using integration with third-party realtime providers, such as [Ably](https://ably.com/) (or others), and live-query information can be stored to any database supported by Remult.
:::
