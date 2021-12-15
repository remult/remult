# Optional Databases

## Postgres
### Options 1, remult
To use postgres as the backend database, first install the following packages:
```sh
npm i pg 
npm i --save-dev @types/pg
```

And adjust the server's `index.ts`
```ts{3,7-9}
import express from 'express';
import { remultExpress } from 'remult/remult-express';
import { createPostgresConnection } from 'remult/postgres';

const app = express();
app.use(remultExpress({
    dataProvider: () => createPostgresConnection({
         connectionString:"postgres://postgres:MASTERKEY@localhost/postgres" 
    })
}));
app.listen(3002, () => console.log("Server started"));
```
Options:
* **connectionString** - the connection string to use. If none is specified the `process.env.DATABASE_URL` will be used.
* **autoCreateTables** - default `true`, verifies that all tables and columns exist in the database and creates the missing ones. 
* **configuration** - can be set to `heroku` or to the `pg.PoolConfig` options object.
    When set to `heroku`, it'll:
    * Use `process.env.DATABASE_URL` if no `connectionString` is provided
    * Use ssl, with the `rejectUnauthorized:false` flag as required by postgres on heroku
    * Disable ssl for non production environments (`process.env.NODE_ENV !== "production"`). To use ssl also for dev, set the `sslInDev` option to true.
* **sslInDev** - see `configuration:"heroku"`


### Option 2, Knex

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
#### createKnexDataProvider Function
We use Knex to support many different database (see [knex.org](https://knexjs.org/)):

**Parameters:**
* **config** - the  Knex.Config object
* **autoCreateTables** - default `true`, verifies that all tables and columns exist in the database and creates the missing ones. 


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
* see [createKnexDataProvider Function](#createknexdataprovider-function)

## MongoDB
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
* see [createKnexDataProvider Function](#createknexdataprovider-function)


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
* see [createKnexDataProvider Function](#createknexdataprovider-function)


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
* see [createKnexDataProvider Function](#createknexdataprovider-function)

## Json File
A basic json file based database.
Adjust the server's `index.ts`
```ts{2-3,8}
import express from 'express';
import { JsonDataProvider } from 'remult';
import { JsonEntityFileStorage } from 'remult/server';
import { remultExpress } from 'remult/remult-express';
import '../Task';

let app = express();
app.use(remultExpress({
    dataProvider: async () => new JsonDataProvider(new JsonEntityFileStorage('./db'))
}));

app.listen(3002, () => console.log("Server started"));
```

* Note that if no `dataProvider`  is provided to `remultExpress` this db will be used as the default

## Frontend Databases
Although the common use case of `Remult` on the front end, is to call the backend using rest api, in some use cases using a local in browser database can be useful.

### Local Storage
```ts
import { JsonDataProvider, Remult } from "remult";
export const remultLocalStorage = new Remult(new JsonDataProvider(localStorage))
```

### Session Storage
```ts
import { JsonDataProvider, Remult } from "remult";
export const remultSessionStorage = new Remult(new JsonDataProvider(sessionStorage))
```

### Web Sql
```ts
import { Remult, SqlDatabase, WebSqlDataProvider } from "remult";
export const remultWebSql = new Remult(new SqlDatabase(new WebSqlDataProvider("db")))
```

### In Memory object array
```ts
import { Remult, InMemoryDataProvider } from "remult";
export const remult = new Remult(new InMemoryDataProvider())
```