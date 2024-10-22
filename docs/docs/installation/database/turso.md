Here’s the polished version of the **Turso** setup:

### Turso Setup

### Step 1: Install Turso Client

Run the following command to install the `@libsql/client` package:

```sh
npm install @libsql/client
```

### Step 2: Configure the `dataProvider`

In your `api.ts` or server file, configure the `dataProvider` to connect to Turso using the Turso client:

```ts
import express from 'express'
import { remultExpress } from 'remult/remult-express'
import { SqlDatabase } from 'remult'
import { createClient } from '@libsql/client'
import { TursoDataProvider } from 'remult/remult-turso'

const app = express()

app.use(
  remultExpress({
    dataProvider: new SqlDatabase(
      new TursoDataProvider(
        createClient({
          url: process.env.TURSO_DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN,
        }),
      ),
    ),
  }),
)
```

### Explanation:

- **Turso Client**: This configuration uses the `@libsql/client` package to connect to the Turso database.
- **Environment Variables**: Ensure you have `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` defined in your environment to securely pass the database connection URL and authentication token.
- **SqlDatabase**: The `TursoDataProvider` is wrapped with the `SqlDatabase` class, allowing seamless integration of Turso as a Remult data provider.

This setup allows you to use Turso as the backend database for your application.
