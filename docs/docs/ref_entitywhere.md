# EntityWhere
Used to filter the desired result set
### example
```ts
where: p=> p.availableFrom.isLessOrEqualTo(new Date()).and(p.availableTo.isGreaterOrEqualTo(new Date()))
```

