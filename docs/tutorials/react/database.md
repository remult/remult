# Database
Up until now the todo app has been using a plain JSON file to store the list of tasks. **In production, we'd like to use a `Postgres` database table instead.**

::: tip Learn more
See the [Connecting to a Database](../../docs/databases.md) article for the (long) list of relational and non-relational databases Remult supports.
:::

1. Install `postgres-node` ("pg").

   ```sh
   npm i pg
   npm i --save-dev @types/pg
   ```

2. Adding the highlighted code to the `api` server module.

   *src/server/api.ts*
   ```ts{5,8-10}
   import { remultExpress } from 'remult/remult-express';
   import { Task } from '../shared/Task';
   import { remult } from 'remult';
   import { TasksController } from '../shared/TasksController';
   import { createPostgresConnection } from "remult/postgres";
   
   export const api = remultExpress({
       dataProvider: createPostgresConnection({
           connectionString: "your connection string"
       }),
       entities: [Task],
       controllers: [TasksController],
       getUser: request => request.session!['user'],
       initApi: async () => {
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
       }
   });
   ```

::: tip postgres is optional for this tutorial
Don't worry if you don't have postgres, in the next step of the tutorial, we'll configure the app only to use postgres in production, and keep using json files in our dev environment.

If you want, you can download `postgres` from [this web site](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads).
:::