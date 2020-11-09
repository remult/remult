# Setup for Vue

This tutorial uses the Vue cli typescript template as a starting point.


## Create the Vue Project
We'll run the following command:

```sh
vue create my-project
```

And select the following options in each question:
1. "Please pick a preset:" select `Manually select features`
2. "Check the features needed for your project:" select `Choose Vue version`, `Babel`, `TypeScript` and clear everything else.
3. "Choose a version of Vue.js that you want to start the project with:" select `2.x`
4. "Use class-style component syntax?" select `Yes`
5. "Use Babel alongside Typescript?" select `Yes`
6. "Pick additional line features" select `Lint on save`
7. "Where do you prefer placing config for Babel, ESLint, etc.?" select `In package.json`
8. "Save this as a preset for future projects?" select `No`

::: tip Note
These settings are not mandatory, they are simply the ones we have used while creating this article.

The only mandatory setting is  `TypeScript`.
:::


## Install the Server components
Now we'll add the server functionality to the same project.

```sh
cd my-project
npm i express express-force-https compression pg @types/pg @remult/core @remult/server @remult/server-postgres tsc-watch
```


## Add .env file for server configuration
in the root directory of the project, create a file called `.env` this file will hold all the environment information for the server in your development environment.

In the production environment, these variables will be set by environment variables from the server.

Place the following lines in that file:
```
DATABASE_URL='postgres://postgres:somepassword@localhost/postgres'
DISABLE_POSTGRES_SSL=true
DISABLE_HTTPS=true
```

* `DATABASE_URL`: the url for connection to the database, using the structure: `postgres://*USERNAME*:*PASSWORD*@*HOST*:*PORT*/*DATABASE_NAME*`
* `DISABLE_POSTGRES_SSL`: most dev environments are not configured to support ssl, this flag disables ssl for development, in production ssl will be used.
* `DISABLE_HTTPS`: most dev environments do not require ssl, this flags disables ssl for development, in production ssl will  be used.

## Add the server code
create a folder called `server` under the `src` folder, and in it add a file called `server.ts` with the following code

``` ts
import express from 'express';
import { initExpress } from '@remult/server';
import * as fs from 'fs';
import { SqlDatabase } from '@remult/core';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, PostgresSchemaBuilder } from '@remult/server-postgres';


config(); //loads the configuration from the .env file
initDatabase().then(database => { 
    let app = express();
    initExpress(app, database, process.env.DISABLE_HTTPS == "true"); 
    app.use(express.static('dist'));
    app.use('/*', async (req, res) => {

        const index = 'dist/index.html';
        if (fs.existsSync(index)) {
            res.send(fs.readFileSync(index).toString());
        }
        else {
            res.send('No Result: ' + index);
        }
    });
    let port = process.env.PORT || 3002;
    app.listen(port);
    
});

async function initDatabase() {
    let dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        throw "No DATABASE_URL environment variable found, if you are developing locally, please add a '.env' with DATABASE_URL='postgres://*USERNAME*:*PASSWORD*@*HOST*:*PORT*/*DATABASE*'";
    }
    const pool = new Pool({
        connectionString: dbUrl,
        ssl: process.env.DISABLE_POSTGRES_SSL ? false : { rejectUnauthorized: false }
    });
    let database = new SqlDatabase(new PostgresDataProvider(pool));
    await new PostgresSchemaBuilder(database).verifyStructureOfAllEntities();
    return database;
}
```

## Add tsconfig.server.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist-server/",
    "module": "commonjs",
    "target": "es5",
    "skipLibCheck": true,
    "emitDecoratorMetadata": true
    
  },
  "files": [
    "./src/server/server.ts"
  ]
}
```

## Add the dist-server folder to git ignore
The `dist-server` will hold the transpiled version of the server code - there is no need to commit it to git (just like the `dist` forder)

in the .gitignore file add:
```
/dist-server
```

## Exclude server from the Vue tsconfig.json
```JSON{4}
...
 "exclude": [
    "node_modules"
    ,"./src/server/**"
  ]
}

```

## Add script to build server to the package.json
```json{4}
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build",
    "node-serve": "./node_modules/.bin/tsc-watch -p tsconfig.server.json --onSuccess \"node dist-server/server/server.js"
  },
```

## Add a proxy configuration
We'll add a proxy configuration to the Vue cli dev server, to forward all unknown requests to the node server on port 3002.

We'll add a file called `vue.config.js`
```js
module.exports = {
    devServer: {
        proxy: 'http://localhost:3002'
      }
}
```

## Run the Project
We'll run two terminals
1. Vue Dev Server - `npm run serve`
2. Node Server - `npm run node-serve`

