# Live Query

Our todo list has more than one user, viewing it at a time - try opening multiple tabs with the todo list, update the tasks in one tab and you'll see the other tabs don't reflect these changes unless you reload them.

To fix that, we'll use the `liveQuery` feature of remult.

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

Try changing values in one tab and review these changes on the other tab.
