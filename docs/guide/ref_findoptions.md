# FindOptions
## where
filters the data
### example
```ts
where p => p.price.isGreaterOrEqualTo(5)
```

### see
For more usage examples see [EntityWhere](https://remult-ts.github.io/guide/ref_entitywhere)

## orderBy
Determines the order in which the result will be sorted in
### see
See [EntityOrderBy](https://remult-ts.github.io/guide/ref__entityorderby) for more examples on how to sort

## limit
Determines the number of rows returned by the request, on the browser the default is 25 rows
### example
```ts
this.products = await this.remult.repo(Products).find({
 limit:10,
 page:2
})
```

## page
Determines the page number that will be used to extract the data
### example
```ts
this.products = await this.remult.repo(Products).find({
 limit:10,
 page:2
})
```

