# LiveQueryChangeInfo

The `LiveQueryChangeInfo` interface represents information about changes in the results of a live query.

## items

The updated array of result items.

## changes

The changes received in the specific message. The change types can be "all" (replace all), "add", "replace", or "remove".

## applyChanges

Applies the changes received in the message to an existing array. This method is particularly useful with React
to update the component's state based on the live query changes.

#### returns:

The updated array of result items after applying the changes.

#### example:

```ts
// Using applyChanges in a React component with useEffect hook
useEffect(() => {
  return taskRepo
    .liveQuery({
      limit: 20,
      orderBy: { createdAt: 'asc' },
      //where: { completed: true },
    })
    .subscribe((info) => setTasks(info.applyChanges))
}, [])
```

Arguments:

- **prevState** - The previous state of the array of result items.
