# Database

Up until now the todo app has been using a plain JSON file to store the list of tasks. In production, you will often want to use a proper database. Remult supports a (long) list of relational and non-relational databases. In this tutorial, let's use `Postgres`.

::: tip Learn more
See the [Quickstart](https://remult.dev/docs/quickstart.html#connecting-a-database) article to find out more.
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

```ts [src/server/api.ts]
import { remultSveltekit } from 'remult/remult-sveltekit'
import { Task } from './shared/Task'
import { TasksController } from './shared/TasksController'
import { createPostgresDataProvider } from 'remult/postgres' // [!code ++]
import { DATABASE_URL } from '$env/static/private' // [!code ++]

export const api = remultSveltekit({
  entities: [Task],
  controllers: [TasksController],
  dataProvider: DATABASE_URL // [!code ++]
    ? createPostgresDataProvider({ connectionString: DATABASE_URL }) // [!code ++]
    : undefined, // [!code ++]
  getUser: async (event) => {
    const auth = await event?.locals?.auth()
    return auth?.user as UserInfo
  },
})
```

:::

Once the application restarts, it'll try to use postgres as the data source for your application.

If `DATABASE_URL` is found, it'll automatically create the `tasks` table for you.

If `DATABASE_URL` is not has found, it'll just fallback to our local JSON files.

::: tip
You can also disable this automatic migration behavior. It's not part of this tutorial so if you want to learn more, follow this [link](/docs/migrations).
:::
