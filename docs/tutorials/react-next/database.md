# Database

Up until now the todo app has been using a plain JSON file to store the list of tasks. **In production, we'd like to use a `Postgres` database table instead.**

::: tip Learn more
See the [Quickstart](https://remult.dev/docs/quickstart.html#connecting-a-database) article for the (long) list of relational and non-relational databases Remult supports.
:::

::: warning Don't have Postgres installed? Don't have to.
Don't worry if you don't have Postgres installed locally. In the next step of the tutorial, we'll configure the app to use Postgres in production, and keep using JSON files in our dev environment.

**Simply install `postgres-node` per step 1 below and move on to the [Deployment section of the tutorial](deployment.md).**
:::

1. Install `postgres-node` ("pg").

   ```sh
   npm i pg
   ```

2. Add an environment variables called `DATABASE_URL` and set it with your connection string

   ```
   // .env.local

   ...
   DATABASE_URL=your connection string
   ```

3. Add the highlighted code to the `api` server module.

   ```ts{5,7,11-13}
   // src/api.ts

   //...

   import { createPostgresDataProvider } from "remult/postgres"

   const DATABASE_URL = process.env["DATABASE_URL"]

   const api = remultNextApp({
     //...
    dataProvider: DATABASE_URL
      ? createPostgresDataProvider({ connectionString: DATABASE_URL })
      : undefined,
   })
   ```

   Once the application restarts, it'll try to use postgres as the data source for your application.

   If `DATABASE_URL` env variable has found, it'll automatically create the `tasks` table for you - as you'll see in the `terminal` window.

   If no `DATABASE_URL` has found, it'll just fallback to our local JSON files.

::: tip Database configurations
You can set more options using the `configuration` property, for example `ssl` and others.

```ts
createPostgresDataProvider({
  configuration: {
    ssl: true,
  },
})
```

:::
