# Appendix - Observable Live Query

To use `liveQuery` as an observable add the following utility function to your code

```ts
// src/app/from-live-query.ts

import { LiveQuery } from 'remult'
import { Observable } from 'rxjs'

export function fromLiveQuery<T>(q: LiveQuery<T>) {
  return new Observable<T[]>((sub) =>
    q.subscribe(({ items }) => sub.next(items)),
  )
}
```

1. Adjust the `TodoComponent`

   ```ts{4,6-11}
   // src/app/todo/todo.component.ts

   ...
   export class TodoComponent {
     taskRepo = remult.repo(Task);
     tasks$ = fromLiveQuery(
       this.taskRepo.liveQuery({
         limit: 20,
         orderBy: { createdAt: 'asc' },
       })
     );
   ```

   Note that we've removed `ngOnInit` and `ngOnDestroy` as they are no longer needed

2. Adjust the `todo.component.html`

   ```html{3}
   <!-- src/app/todo/todo.component.html -->

   <div *ngFor="let task of tasks$ | async">
     <input
       type="checkbox"
       [(ngModel)]="task.completed"
       (change)="saveTask(task)"
     />
     <input [(ngModel)]="task.title" />
     <button (click)="saveTask(task)">Save</button>
     <button
       *ngIf="taskRepo.metadata.apiDeleteAllowed(task)"
       (click)="deleteTask(task)"
     >
       Delete
     </button>
   </div>
   ```
