# Sql filter and Custom filter
Sometimes we need to use a custom/complex filter that is not yet in remult.
We can specify that filter using SQL (mongo or knex). 
For example, let's say we want to filter and see only tasks whose title length is greater than 10.
To do that with SQL, we can write the following code:

```ts{3-5}
console.table(
  await remult.repo(Task).find({
    where: SqlDatabase.rawFilter((whereFragment) => {
      whereFragment.sql = 'length(title)>10'
    })
  })
)
```
* Note that the `rawFilter` method receives an `async` arrow function, this means that you can create complex logic here and maybe even other queries which their results will be used as part of that `rawFilter`.
This code will work great on the backend, but if we try to run it in the frontend, we'll get the 'database custom is not allowed with api calls.' error.
To call it from the frontend, we need to use a `rawFilter`

In the entity class, we'll add the `titleLengthFilter` static method
```ts{7-11}
@Entity<Task>("tasks", {
  allowApiCrud: true
})
export class Task {
  //...
  
  static titleLengthFilter = Filter.createCustom<Task>(async () => {
    return SqlDatabase.rawFilter((whereFragment) => {
      whereFragment.sql = 'length(title)>10'
    })
  });
}
```
`rawFilter` allows us to wrap server-side filters with an easy-to-use API and use it in the frontend.
Here's how you can use it both in the frontend and also the backend

```ts{3}
console.table(
  await remult.repo(Task).find({
    where: Task.titleLengthFilter()
  })
)
```
::: Under the hood
That custom filter translates to a rest request call that's translated on the backend, and looks like this:
```
http://127.0.0.1:3002/api/tasks?%24custom%24titleLengthFilter=%7B%7D
```
:::

### The `rawFilter` can also receive and use arguments:

```ts{7-13}
@Entity<Task>("tasks", {
  allowApiCrud: true
})
export class Task {
  //...
  
  static titleLengthFilter = Filter.createCustom<Task, { minLength: number }>(
    async ({ minLength }) => {
      return SqlDatabase.rawFilter((whereFragment) => {
        whereFragment.sql = 'length(title)>' 
          + whereFragment.addParameterAndReturnSqlToken(minLength)
      })
    });
}
```
* We use `addParameterAndReturnSqlToken` to prevent sql inject, the sql that will be generated from this will look like this:
  ```sql
  select id, title, completed from tasks where length(title)>$1
  ```

Here's how we use that filter:
```ts
console.table(
  await remult.repo(Task).find({
    where: Task.titleLengthFilter({
      minLength: 10
    })
  })
)
```

## Other database types
We can use custom filter with other data providers:
### knex
```ts{7-9}
  static idBetween = Filter.createCustom<Task,{
    from:number,
    to:number
  }>(
    () => {
      return KnexDataProvider.rawFilter(async ({from,to}) => {
        return knexQueryBuilder => {
          knexQueryBuilder.andWhereBetween('id', [from, to]);
        }
      })
    });

```
### Json
```ts{3-5}
static titleLengthFilter = Filter.createCustom<Task, { minLength: number }>(
  ({ minLength }) => {
    return ArrayEntityDataProvider.rawFilter( (item) => {
      return item.title?.length>minLength
    })
  });
});
```