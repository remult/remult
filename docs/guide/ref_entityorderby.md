# EntityOrderBy
Determines the order of rows returned by the query.
### example
```ts
await this.remult.repo(Products).find({ orderBy: p => p.name })
```

### example
```ts
await this.remult.repo(Products).find({ orderBy: p => [p.price, p.name])
```

### example
```ts
await this.remult.repo(Products).find({ orderBy: p => [{ column: p.price, descending: true }, p.name])
```

