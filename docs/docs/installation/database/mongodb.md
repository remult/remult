## MongoDB

To use MongoDB as the database provider for your Remult application, follow the steps below.

### Step 1: Install MongoDB Driver

Run the following command to install the `mongodb` package:

```sh
npm i mongodb
```

### Step 2: Set the `dataProvider` Property

In your `api.ts` or server file, configure the `dataProvider` to connect to your MongoDB database:

```ts{3-4,10-14}
import express from "express"
import { remultExpress } from "remult/remult-express"
import { MongoClient } from "mongodb"
import { MongoDataProvider } from "remult/remult-mongo"

const app = express()

app.use(
  remultExpress({
    dataProvider: async () => {
      const client = new MongoClient("mongodb://localhost:27017/local")
      await client.connect()
      return new MongoDataProvider(client.db("test"), client)
    }
  })
)
```

This setup connects to a MongoDB instance running on `localhost` and uses the `test` database. The `MongoDataProvider` manages the connection, allowing Remult to interact with MongoDB seamlessly.
