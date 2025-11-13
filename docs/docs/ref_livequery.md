# LiveQuery
The `LiveQuery` interface represents a live query that allows subscribing to changes in the query results.
## subscribe
Subscribes to changes in the live query results.


#### returns:
A function that can be used to unsubscribe from the live query.


#### example:
```ts
// Subscribing to changes in a live query
const unsubscribe = repo(Task)
  .liveQuery({
    limit: 20,
    orderBy: { createdAt: 'asc' }
    //where: { completed: true },
  })
  .subscribe(info => setTasks(info.applyChanges));

// Later, to unsubscribe
unsubscribe();
```

Arguments:
* **next** - A function that will be called with information about changes in the query results.
