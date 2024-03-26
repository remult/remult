# Migrations

Migrations are essential for maintaining alignment between your application's evolving features and its underlying database schema. They enable structured updates to the database, reflecting changes in the application's data structures and logic over time. This ensures consistency and reliability as your project grows.

## Automatic Schema Validation with `ensureSchema`

Remult provides an automatic schema validation feature called `ensureSchema` that ensures consistency between your entities and the database schema. When your application loads, `ensureSchema` verifies that all entities and their corresponding columns exist in the database. It automatically adds any missing tables or columns, ensuring that your database schema matches your application's entities.

It's important to note that `ensureSchema` is designed with safety in mind. It **never removes or alters existing tables or columns**. This behavior ensures that your application can easily revert to a previous version without losing compatibility with the database.

This automatic schema validation offers a convenient starting point for developing your application. It reduces the initial setup effort and helps maintain consistency as your application evolves.

If needed, you can disable this feature by setting the `ensureSchema` option to `false` in your Remult server configuration.

```ts
export const api = remultExpress({
  //...
  ensureSchema: false,
})
```

While `ensureSchema` provides a basic level of migration support, Remult also offers a more extensive migration solution for managing complex schema changes. We'll explore this advanced migration solution in the following sections of this document.

## Quick Start: Introducing Migrations to Your Application

Introducing migrations to your Remult application involves a few straightforward steps. The goal is to ensure that your migrations and API share the same data provider and entity definitions. Here's how you can do it:

### 1. Refactor Your Configuration

Start by refactoring the `dataProvider` and `entities` definitions from the `api.ts` file to a new file named `src/server/config.ts`. This allows you to use the same configurations for both your API and migrations.

In your `src/server/config.ts` file, define your entities and data provider as follows:

```ts
import { createPostgresDataProvider } from 'remult/postgres'
import { Task } from '../shared/task'

export const entities = [Task /* ...other entities */]
export const dataProvider = createPostgresDataProvider({
  connectionString: 'your connection string',
})
```

### 2. Adjust the API Configuration

Next, adjust your `api.ts` file to use the configurations from the `config.ts` file:

```ts
import { remultExpress } from 'remult/remult-express'
import { dataProvider, entities } from './config'

export const api = remultExpress({
  entities,
  dataProvider,
})
```

### 3. Generate the migration

::: tip Prettier
The migration generator uses `prettier` to format the generated code for better readability and consistency. If you don't already have `prettier` installed in your project, we recommend installing it as a development dependency using the following command:

```sh
npm i -D prettier
```

:::

To enable automatic generation of migration scripts, follow these steps:

1. **Create the Migrations Folder:** In your `src/server` directory, create a new folder named `migrations`. This folder will hold all your migration scripts.

2. **Create the Migration Generator File:** Inside the `migrations` folder, create a file named `generate-migrations.ts`. This file will contain the script that generates migration scripts based on changes in your entities.

3. **Populate the Generator File:** Add the following code to `generate-migrations.ts`:

   ```ts
   import { generateMigrations } from 'remult/migrations'
   import { dataProvider, entities } from '../config'

   generateMigrations({ dataProvider, entities })
   ```

   This script imports the `generateMigrations` function from the `remult/migrations` module and your application's `dataProvider` and `entities` from the `config.js` file. When executed, it generates migration scripts that reflect the changes in your entities.

4. **Generate Migrations:** To generate the migration scripts, run the `generate-migrations.ts` script using the following command:

   ```sh
   npx tsx src/server/migrations/generate-migrations.ts
   ```

   This command will create two important files:

   1. **`migrations-snapshot.json`**: This file stores the last known state of your entities. It helps the migration generator understand what changes have been made since the last migration was generated.
   2. **`migrations.ts`**: This file contains the actual migration scripts that need to be run to update your database schema. The structure of this file is as follows:

      ```ts
      import type { Migrations } from 'remult/migrations'

      export const migrations: Migrations = {
        0: async ({ sql }) => {
          await sql(`--sql
            CREATE SCHEMA IF NOT EXISTS public;
            CREATE TABLE "tasks" (
              "id" VARCHAR DEFAULT '' NOT NULL PRIMARY KEY,
              "title" VARCHAR DEFAULT '' NOT NULL
            )`)
        },
      }
      ```

      Each migration script is associated with a unique identifier (in this case, `0`) and contains the SQL commands necessary to update the database schema.

      By running this script whenever you make changes to your entities, you can automatically generate the necessary migration scripts to keep your database schema in sync with your application's data model.

      It's important to note that each migration can include any code that the developer wishes to include, not just SQL statements. The `sql` parameter is provided to facilitate running SQL commands, but you can also include other logic or code as needed. Additionally, developers are encouraged to add their own custom migrations to address specific requirements or changes that may not be covered by automatically generated migrations. This flexibility allows for a more tailored approach to managing database schema changes.

      #### Transactional Migrations

      Each migration runs within a transaction, which means that either all the database changes in that script succeed or fail as a unit. This ensures that your database remains in a consistent state, even if something goes wrong during the migration process.

      However, it's worth noting that some databases, like MySQL, do not support rolling back structural changes as part of a transaction. This means that if you make changes to the database schema (such as adding or dropping tables or columns) and something goes wrong, those changes might not be automatically rolled back. Developers need to be aware of this limitation and plan their migrations accordingly to avoid leaving the database in an inconsistent state.

      Always consult your database's documentation to understand the specifics of transaction support and plan your migrations accordingly.

### 4. Run the Migrations

To apply the migrations to your database, you'll need to create a script that executes them.

#### Setting Up the Migration Script

1. **Create the Migration Script:** In the `src/server/migrations` folder, add a file named `migrate.ts`.

2. **Populate the Script:** Add the following code to `migrate.ts`:

   ```ts
   import { migrate } from 'remult/migrations'
   import { dataProvider } from '../config'
   import { migrations } from './migrations'

   migrate({
     dataProvider,
     migrations,
   })
   ```

   This script imports the `migrate` function from the `remult/migrations` module, your application's `dataProvider` from the `config` file, and the `migrations` from the `migrations.ts` file. It then calls the `migrate` function to apply the migrations to your database.

3. **Execute the Script:** Run the migration script using the following command:

   ```sh
   npx tsx src/server/migrations/migrate.ts
   ```

## Integrating Migrations into Your Deployment Process

You have a couple of options for when and how to run your migrations:

- **As Part of the Build Step:** You can include the migration script as part of your build or deployment process. This way, if the migration fails, the deployment will also fail, preventing potential issues with an inconsistent database state.

- **During Application Initialization:** Alternatively, you can run the migrations when your application loads by using the `initApi` option in your `api.ts` file:

  ```ts
  // src/server/api.ts
  import { remultExpress } from 'remult/remult-express'
  import { dataProvider, entities } from './config'
  import { migrate } from 'remult/migrations/migrate'
  import { migrations } from './migrations/migrations'
  import { remult } from 'remult'

  export const api = remultExpress({
    entities,
    dataProvider,
    initApi: async () => {
      await migrate({
        dataProvider: remult.dataProvider,
        migrations,
        endConnection: false,
      })
    },
  })
  ```

  This approach ensures that the migrations are applied each time the API initializes. Note that the `migrate` and `generateMigrations` functions typically close the connection used by the `dataProvider` when they complete. In this code, we disable this behavior using the `endConnection: false` option, instructing the `migrate` function to keep the `dataProvider` connection open when it completes.

Choose the approach that best fits your application's deployment and initialization process.

### Manually Triggering `ensureSchema`

In certain scenarios, you might want to manually trigger the `ensureSchema` function to ensure that your database schema is up-to-date with your entity definitions. Here's how you can do it:

```ts
remult.dataProvider.ensureSchema!(entities.map((x) => remult.repo(x).metadata))
```

In this code snippet, the `ensureSchema` function is called on the `dataProvider` associated with your Remult instance. It is passed an array of entity metadata, obtained by mapping over the `entities` array and using the `remult.repo()` function to get the repository for each entity, and then accessing its `metadata` property.

This manual invocation of `ensureSchema` ensures that any missing tables or columns are added to the database schema to reflect the current state of your entities.
