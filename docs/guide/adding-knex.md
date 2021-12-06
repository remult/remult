# Adding Knex
Knex provides support for multiple sql database, here are instructions for the most common ones:

## Postgres
```sh
npm i knex pg
```

Adjust the server's `index.ts`
```ts{3,8-11}
import express from 'express';
import { remultExpress } from 'remult/remult-express';
import { createKnexDataProvider } from 'remult/remult-knex';
import '../Task';

let app = express();
app.use(remultExpress({
    dataProvider: createKnexDataProvider({
        client: 'pg',
        connection: "postgres://postgres:MASTERKEY@localhost/postgres",
    })
}));

app.listen(3002, () => console.log("Server started"));
```

## sqlite3
```sh
npm i knex sqlite3
```

Adjust the server's `index.ts`
```ts{3,8-13}
import express from 'express';
import { remultExpress } from 'remult/remult-express';
import { createKnexDataProvider } from 'remult/remult-knex';
import '../Task';

let app = express();
app.use(remultExpress({
    dataProvider: createKnexDataProvider({
        client: 'sqlite3',
        connection: {
            filename:'./mydb.sqlite'
        },
    })
}));

app.listen(3002, () => console.log("Server started"));
```

## Microsoft SQL Server
```sh
npm i knex tedious
```

Adjust the server's `index.ts`
```ts{3,8-13}
import express from 'express';
import { remultExpress } from 'remult/remult-express';
import { createKnexDataProvider } from 'remult/remult-knex';
import '../Task';

let app = express();
app.use(remultExpress({
    dataProvider: createKnexDataProvider({
        client: 'sqlite3',
        connection: {
            filename:'./mydb.sqlite'
        },
    })
}));

app.listen(3002, () => console.log("Server started"));
```