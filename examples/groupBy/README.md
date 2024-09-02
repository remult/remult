# Group By

A group by example

```ts
repo(Employee).groupBy({
  group: ['country', 'city'],
  sum: ['salary'],
  where: {
    salary: {
      $gt: 2000,
    },
  },
})
```

[Open in stackblitz](https://stackblitz.com/github/remult/remult/tree/main/examples/groupBy)

## Checkout source

```sh
npx degit https://github.com/remult/remult/examples/groupBy groupBy
```
