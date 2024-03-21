# Database

Up until now the todo app has been using a plain JSON file to store the list of tasks. In production, you will often want to use a proper database. Remult supports a (long) list of relational and non-relational databases. In this tutorial, let's use `Postgres`.

::: tip Learn more
See the [Connecting to a Database](../../docs/databases.md) article to find out more.
:::

::: warning Don't have Postgres installed? Don't have to.
Don't worry if you don't have Postgres installed locally. In the next step of the tutorial, we'll configure the app to use Postgres in production, and keep using JSON files in our dev environment.

**Simply install `postgres-node` per step 1 below and move on to the [Deployment section of the tutorial](deployment.md).**
:::

1. Install `postgres-node` ("pg").

   ```sh
   npm i pg
   ```

2. Add an environment variables called DATABASE_URL and set it with your connection string:

::: code-group

```sh [.env.local]
DATABASE_URL=postgresql://username:password@host:port/dbname[?paramspec]
```

:::

3. Add a `dataProvider` to Remult's handler.

::: code-group

```ts [src/hooks/handleRemult.ts]
import { remultSveltekit } from 'remult/remult-sveltekit'
import { Task } from '../shared/task'
import { TasksController } from '../shared/tasksController'
import type { UserInfo } from 'remult'
import { createPostgresDataProvider } from 'remult/postgres' // [!code ++]
import { DATABASE_URL } from '$env/static/private' // [!code ++]

export const handleRemult = remultSveltekit({
  entities: [Task],
  controllers: [TasksController],
  dataProvider: DATABASE_URL // [!code ++]
    ? createPostgresDataProvider({ connectionString: DATABASE_URL }) // [!code ++]
    : undefined, // [!code ++]
  getUser: async (event) =>
    (await event?.locals?.getSession())?.user as UserInfo,
})
```

Once the application restarts, it'll try to use postgres as the data source for your application.

If `DATABASE_URL` has found, it'll automatically create the tasks table for you - as you'll see in the terminal window.

If no `DATABASE_URL` has found, it'll just fallback to our local JSON files.


:::
