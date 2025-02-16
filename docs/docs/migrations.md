# Migrations

Managing database schemas is crucial in web development. Traditional migration approaches introduce complexity and risks. Remult, designed for data-driven web apps with TypeScript, offers a simpler method.

## You Don't Necessarily Need Migrations

Migration files are standard but can complicate database schema management. They're prone to errors, potentially leading to conflicts or downtime. Remult proposes a streamlined alternative: automatic schema synchronization. This approach simplifies schema management by ensuring your database schema aligns with your application code without the manual overhead of traditional migrations.

### Embracing Schema Synchronization with Remult

Remult offers an alternative: automatic schema synchronization. **By default, Remult checks for and synchronizes your database schema with the entity types** provided in the `RemultServerOptions.entities` property when the server loads. This feature automatically adds any missing tables or columns, significantly simplifying schema management.

::: tip No Data Loss with Remult's Safe Schema Updates
**Remult's schema synchronization** ensures **safe and automatic updates** to your database schema. By only adding new tables or columns without altering existing ones, Remult prevents data loss. This design offers a secure way to evolve your application's database schema.
:::

#### Disabling Automatic Schema Synchronization

For manual control, Remult allows disabling automatic schema synchronization:

```typescript
const api = remultExpress({
  entities: [], // Your entities here
  ensureSchema: false, // Disables automatic schema synchronization, Default: true
})
```

#### Manually Triggering Schema Synchronization

In certain scenarios, you might want to manually trigger the `ensureSchema` function to ensure that your database schema is up-to-date with your entity definitions. Here's how you can do it:

```ts
remult.dataProvider.ensureSchema!(entities.map((x) => repo(x).metadata))
```

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

:::tip Using environment variables
In most cases, the connection string for your database will not be hard-coded but stored in an environment variable for security and flexibility. A common practice is to use a `.env` file to store environment variables in development and load them using the `dotenv` npm package. Here's how you can set it up:

1. Install the `dotenv` package:

   ```sh
   npm install dotenv
   ```

2. Create a `.env` file in the root of your project and add your database connection string:

   ```
   DATABASE_URL=your_connection_string
   ```

3. At the beginning of your `src/server/config.ts` file, load the environment variables:

   ```ts
   import { config } from 'dotenv'
   config()
   ```

4. Access the connection string using `process.env`:

   ```ts
   export const dataProvider = createPostgresDataProvider({
     connectionString: process.env['DATABASE_URL'],
   })
   ```

By following these steps, you ensure that your application securely and flexibly manages the database connection string.

:::

### 2. Adjust the API Configuration

Next, adjust your `api.ts` file to use the configurations from the `config.ts` file, and disable the `ensureSchema` migrations:

```ts
import { remultExpress } from 'remult/remult-express'
import { dataProvider, entities } from './config'

export const api = remultExpress({
  entities,
  dataProvider,
  ensureSchema: false,
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
   Here's the revised section:

3. **Populate the Generator File:** Add the following code to `generate-migrations.ts`:

   ```ts
   import { generateMigrations } from 'remult/migrations'
   import { dataProvider, entities } from '../config'

   generateMigrations({
     dataProvider, // The data provider for your database
     entities, // Entity classes to include in the migration
     endConnection: true, // Close the database connection after generating migrations (useful for standalone scripts)
   })
   ```

   This script generates migration scripts based on changes in your entities. If you're calling this method on a server where the database connection should remain open, omit the `endConnection` parameter or set it to `false`.

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
     endConnection: true, // Close the database connection after applying migrations
   })
   ```

   This script sets up the migration process. The `migrate` function checks the last migration executed on the database and runs all subsequent migrations based on their index in the `migrations` file. The entire call to `migrate` is executed in a transaction, ensuring that either all required migration steps are executed or none at all, maintaining the integrity of your database schema.

   ::: warning Warning: Database Transaction Support for Structural Changes
   It's important to note that some databases, like MySQL, do not support rolling back structural changes as part of a transaction. This means that if you make changes to the database schema (such as adding or dropping tables or columns) and something goes wrong, those changes might not be automatically rolled back. Developers need to be aware of this limitation and plan their migrations accordingly to avoid leaving the database in an inconsistent state.

   Always consult your database's documentation to understand the specifics of transaction support and plan your migrations accordingly.
   :::

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
        endConnection: false, //it's the default :)
      })
    },
  })
  ```

  This approach ensures that the migrations are applied each time the API initializes. Note that the `migrate` and `generateMigrations` functions typically close the connection used by the `dataProvider` when they complete. In this code, we disable this behavior using the `endConnection: false` option, instructing the `migrate` function to keep the `dataProvider` connection open when it completes.

Choose the approach that best fits your application's deployment and initialization process.

### Migration Philosophy: Embracing Backward Compatibility

We believe in designing migrations with a backward compatibility mindset. This approach ensures that older versions of the code can operate smoothly with newer versions of the database. To achieve this, we recommend:

- Never dropping columns or tables.
- Instead of altering a column, adding a new column and copying the data to it as part of the migration process.

This philosophy minimizes disruptions and ensures a smoother transition during database schema updates.
