# Deployment

Let's deploy the todo app to [Heroku](https://www.heroku.com/).

## Connect to Postgres
Up until now the todo app has been using a plain JSON file to store the list of tasks. **In production, we'd like to use a `Postgres` database table instead.**

1. Install `postgres-node` ("pg").

```sh
yarn add pg
yarn add --dev @types/pg
```

2. Adding the highlighted code to the `api` server module.

*src/server/api.ts*
```ts{5,8-12}
import { remultExpress } from "remult/remult-express";
import { Task } from "../shared/Task";
import { TasksController } from "../shared/TasksController";
import { AuthController } from "../shared/AuthController";
import { createPostgresConnection } from "remult/postgres";

export const api = remultExpress({
    dataProvider: async () => {
        if (process.env["NODE_ENV"] === "production")
            return createPostgresConnection({ configuration: "heroku" });
        return undefined;
    },
    entities: [Task],
    controllers: [TasksController, AuthController],
    initApi: async remult => {
        const taskRepo = remult.repo(Task);
        if (await taskRepo.count() === 0) {
            await taskRepo.insert([
                { title: "Task a" },
                { title: "Task b", completed: true },
                { title: "Task c" },
                { title: "Task d" },
                { title: "Task e", completed: true }
            ]);
        }
    },
    bodyParser: false
});
```

The `{ configuration: "heroku" }` argument passed to Remult's `createPostgresConnection()` tells Remult to use the `DATABASE_URL` environment variable as the `connectionString` for Postgres. (See [Heroku documentation](https://devcenter.heroku.com/articles/connecting-heroku-postgres#connecting-in-node-js).)

In development, the `dataProvider` function returns `undefined`, causing Remult to continue to use the default JSON-file database.

::: tip Learn more
See [documentation](../../docs/databases.md) for the (long) list of relational and non-relational databases Remult supports.
:::


## Deploy to Heroku

In order to deploy the todo app to [heroku](https://www.heroku.com/) you'll need a `heroku` account. You'll also need [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#download-and-install) installed.

1. Modify the project's `start` npm script to bind the `$PORT` to the port assigned by heroku.

*package.json*
```json
"start": "next start -p $PORT"
```

2. Create a Heroku `app`.

```sh
heroku create
```

3. Set the jwt authentication to something random - you can use an [online UUID generator](https://www.uuidgenerator.net/).

```sh
heroku config:set JWT_SECRET=random-secret
```

4. Provision a dev postgres database on Heroku.

```sh
heroku addons:create heroku-postgresql:hobby-dev
```

5. Commit the changes to git and deploy to Heroku using `git push`.

```sh
git add .
git commit -m "todo app tutorial"
git push heroku main
```

6. Open the deployed app using `heroku apps:open` command.

```sh
heroku apps:open
```

::: warning Note
If you run into trouble deploying the app to Heroku, try using Heroku's [documentation](https://devcenter.heroku.com/articles/git).
:::

That's it - our application is deployed to production, play with it and enjoy.

To see a larger more complex code base, visit our [CRM example project](https://www.github.com/remult/crm-demo)

Love Remult?&nbsp;<a href="https://github.com/remult/remult" target="_blank" rel="noopener"> Give our repo a star.⭐</a>