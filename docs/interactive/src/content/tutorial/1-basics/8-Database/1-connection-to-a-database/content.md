---
type: lesson
title: Database
focus: /backend/index.ts
template: after-backend-methods
---

# Database

Up until now the todo app has been using a plain JSON file to store the list of tasks. In this lesson we'll demontstrate how easy it is to switch to one of the many databases that are supported by remult, in this case Sqlite.

> ##### Learn more
>
> See the [Quickstart](https://remult.dev/docs/quickstart.html#connecting-a-database) article for the (long) list of relational and non-relational databases Remult supports.

In the `backend/index.ts` file, set the `dataProvider` to use `sqlite`

```ts title="backend/index.ts" add={4-6}
export const api = remultApi({
  entities: [Task],
  controllers: [TasksController],
  dataProvider: new SqlDatabase(
    new Sqlite3DataProvider(new sqlite3.Database('.database.sqlite')),
  ),
  //...
})
```

And that's it, now you use `sqlite` as the database.

> ##### Don't believe it?
>
> You can see the actual sql's executed by remult, by adding the following line
>
> ```ts
> SqlDatabase.LogToConsole = 'oneLiner'
> ```
>
> And click on `Toggle Terminal` button to see the sql's that execute with the operations you perform
> Just don't forget to turn it off once you're done, to improve performance
