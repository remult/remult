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

   _.env.local_

   ```
   ...
   DATABASE_URL=your connection string
   ```

4) Add the highlighted code to the `api` server module.

   _src/server/api.ts_

   ```ts{3,7}
   //...

   import { createPostgresConnection } from "remult/postgres"

   export const api = remultNext({
     //...
     dataProvider: createPostgresConnection()
   })
   ```

   Once the application restarts, it'll use postgres as the data source for your application. It'll automatically create the `tasks` table for you - as you'll see in the `terminal` window.

::: tip Use Supabase's free database
1. Visit [https://app.supabase.io/](https://app.supabase.io/) and click "New project".
2. Select a name, password, and region for your database. Make sure to save the password, as you will need it later.
3. Click "Create new project". Creating the project can take a while, so be patient.
4. Once the project is created navigate to the `Project Settings` icon on the left
5. Select the "Database" tab on the left. 
6. Scroll down to the `Connection string` section
7. Select the `URI` tab, and copy the connection string to the `DATABASE_URL` environment variable in your `.env.local` file.
8. Replace the `[YOUR-PASSWORD]` token with the password you created on step 2.
:::


   ::: tip specifying the connection string
   If you want to specify a connection string, by setting the `connectionString` property:

   ```ts
   createPostgresConnection({
     connectionString: "your connection string"
   })
   ```

   :::