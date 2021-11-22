# Adding Postgres
To use postgres as the backend database, first install the following packages:
```sh
npm i pg 
npm i --save-dev @types/pg
```

And adjust the server's `index.ts`
```ts{3,7-8}
import express from 'express';
import { remultExpress } from 'remult/remult-express';
import { createPostgresConnection } from 'remult/postgres';

const app = express();
app.use(remultExpress({
    dataProvider: () => createPostgresConnection({
         connectionString:"postgres://postgres:MASTERKEY@localhost/postgres" })
}));
app.listen(3002, () => console.log("Server started"));
```
* replace the connection string with your own :)


It's also common to use an environment variable for that

```ts
dataProvider: () => createPostgresConnection({
         connectionString:process.env.DATABASE_URL })
```

::: tip Use `dotenv` package for dev
To load environment variable from a configuration file in dev, you can use the `dotenv` package to store them in a `.env` file.
1. Install package
   ```sh
   npm i --save-dev dotnet
   ```
2. Create `.env` file
   ```sh
   DATABASE_URL=postgres://postgres:MASTERKEY@localhost/postgres
   ```

3. Add `config` to the server's `index.ts` file
   ```ts{4-6,9}
   import express from 'express';
   import { remultExpress } from 'remult/remult-express';
   import { createPostgresConnection } from 'remult/postgres';
   import { config } from 'dotenv';
   
   config();
   const app = express();
   app.use(remultExpress({
       dataProvider: () => createPostgresConnection({ connectionString: process.env.DATABASE_URL })
   }));
   app.listen(3002, () => console.log("Server started"));
   ```
   **Don't forget to add the .env file to your .gitignore file so it'll not be stored with your source code**
:::


## Heroku
When deploying to heroku, you can simply use the `heroku` configuration.
```ts{3}
app.use(remultExpress({
    dataProvider: () => createPostgresConnection({ 
        configuration: "heroku" 
    })
}));
```

If you want to connect from you dev machine to the heroku postgres database, you'll need ssl also in dev
```ts{4}
app.use(remultExpress({
    dataProvider: () => createPostgresConnection({
        configuration: "heroku",
        sslInDev: true
    })
}));
```

## Any postgres configuration
You can use `pg`'s config object for fine grained control
```ts{3-8}
app.use(remultExpress({
    dataProvider: () => createPostgresConnection({
        configuration: {
            user: "postgres",
            password: "MASTERKEY",
            host: "localhost",
            database: "postgres"
        }
    })
}));
```