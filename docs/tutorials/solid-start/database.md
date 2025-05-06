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

2. Add the highlighted code to the `api` server module.

   ```ts{5,9-11}
   // src/api.ts

   //...

   import { createPostgresDataProvider } from "remult/postgres"

   export const api = remultApi({
     //...
   dataProvider: createPostgresDataProvider({
       connectionString: "your connection string"
     })
   })
   ```
