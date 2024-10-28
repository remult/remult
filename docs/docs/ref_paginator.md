# Paginator
An interface used to paginating using the `query` method in the `Repository` object


#### example:
```ts

```


#### example:
```ts
const query = taskRepo.query({
  where: { completed: false },
  pageSize: 100,
})
const count = await query.count()
console.log('Paged: ' + count / 100)
let paginator = await query.paginator()
console.log(paginator.items.length)
if (paginator.hasNextPage) {
  paginator = await paginator.nextPage()
  console.log(paginator.items.length)
}
```
## items
the items in the current page
## hasNextPage
True if next page exists
## count
the count of the total items in the `query`'s result
## nextPage
Gets the next page in the `query`'s result set
