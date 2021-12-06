## Using MongoDB
```sh
npm i mongodb
```

Adjust the server's `index.ts`
```ts{3-4,9-13}
import express from 'express';
import { remultExpress } from 'remult/remult-express';
import { MongoClient } from 'mongodb';
import { MongoDataProvider } from 'remult/remult-mongo';
import '../Task';

let app = express();
app.use(remultExpress({
    dataProvider: async () => {
        let client = new MongoClient("mongodb://localhost:27017/local");
        await client.connect();
        return new MongoDataProvider(client.db('test'), client);
    }
}));

app.listen(3002, () => console.log("Server started"));
```