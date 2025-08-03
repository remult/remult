# QueryResult

The result of a call to the `query` method in the `Repository` object.

## [asyncIterator]

returns an iterator that iterates the rows in the result using a paging mechanism

#### example:

```ts
for await (const task of taskRepo.query()) {
  await taskRepo.save({ ...task, completed })
}
```

## count

returns the number of rows that match the query criteria

## getPage

gets the items in a specific page

Arguments:

- **pageNumber**

## forEach

Performs an operation on all the items matching the query criteria

Arguments:

- **what**

## paginator

Returns a `Paginator` object that is used for efficient paging
