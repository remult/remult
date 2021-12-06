# Additional Database
We use Knex to support many different database (see [knex.org](https://knexjs.org/)), here are instructions for the most common ones:

::: tip Tables creation 
By default, the `createKnexDataProvider` verifies that all tables and columns exist in the database and creates the missing ones. To disable this functionality and handle db creation yourself, send `false` as the second parameter to the `createKnexDataProvider` function and handle table creation yourself.

For more info on knex migrations, see [knex.org/#Installation-migrations](https://knexjs.org/#Installation-migrations)
:::

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

## MySQL
```sh
npm i knex mysql2
```

Adjust the server's `index.ts`
```ts{3,8-16}
import express from 'express';
import { remultExpress } from 'remult/remult-express';
import { createKnexDataProvider } from 'remult/remult-knex';
import '../Task';

let app = express();
app.use(remultExpress({
    dataProvider: createKnexDataProvider({
        client: 'mysql2',
        connection: {
            user: 'sa',
            password: 'MASTERKEY',
            host: '127.0.0.1',
            database:'test'
        },
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
```ts{3,8-20}
import express from 'express';
import { remultExpress } from 'remult/remult-express';
import { createKnexDataProvider } from 'remult/remult-knex';
import '../Task';

let app = express();
app.use(remultExpress({
    dataProvider: createKnexDataProvider({
        client: 'mssql',
        connection: {
            server: '127.0.0.1',
            database: 'test',
            user: 'sa',
            password: 'MASTERKEY',
            options: {
                enableArithAbort: true,
                encrypt:false
            }
        },
    })
}))

app.listen(3002, () => console.log("Server started"));
```
* these are the options we used in testing, feel free to remove them :)


## Oracle
```sh
npm i knex oracledb
```

Adjust the server's `index.ts`
```ts{3,8-15}
import express from 'express';
import { remultExpress } from 'remult/remult-express';
import { createKnexDataProvider } from 'remult/remult-knex';
import '../Task';

let app = express();
app.use(remultExpress({
    dataProvider: createKnexDataProvider({
        client: 'oracledb',
        connection: {
            user: 'sa',
            password: 'MASTERKEY',
            connectString: 'SERVER',
        },
    })
}));

app.listen(3002, () => console.log("Server started"));
```

