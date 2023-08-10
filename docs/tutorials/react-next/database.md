# Database

Up until now the todo app has been using a plain JSON file to store the list of tasks. **In production, we'd like to use a `Postgres` database table instead.**

::: tip Learn more
See the [Connecting to a Database](../../docs/databases.md) article for the (long) list of relational and non-relational databases Remult supports.
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

4) Add the highlighted code to the `api` server module.

   ```ts{5,9}
   // src/app/api/[...remult]/route.ts

   //...

   import { createPostgresDataProvider } from "remult/postgres"

   const api = remultNextApp({
     //...
     dataProvider: createPostgresDataProvider()
   })
   ```

   Once the application restarts, it'll use postgres as the data source for your application. It'll automatically create the `tasks` table for you - as you'll see in the `terminal` window.

::: tip specifying the connection string
You can specify a connection string, by setting the `connectionString` property, for example::

```ts
createPostgresDataProvider({
  connectionString: "your connection string"
})
```

and You can set more options using the `configuration` property.

```ts
createPostgresDataProvider({
  configuration: {
    ssl: true
  }
})
```

:::
