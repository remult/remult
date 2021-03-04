# Setup for React

This tutorial uses the react cli typescript template as a starting point.

## Create React Project
```sh
npx create-react-app react-sample --template typescript
```

### Add Routes to React

```sh
npm i react-router-dom @types/react-router-dom
```

Adjust the `index.tsx` file:
```ts{3,8,10,12}
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from "react-router-dom";
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

window.onerror = function (msg, src, lineno, colno, error) { alert(msg) }
ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
```

* We've adjusted the template to use the router
* we've added general error handling code 

Adjust `app.tsx`
```ts{2,8,9,10}
import React from 'react';
import { Switch, Route, Link } from "react-router-dom";
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Remult with React</h1>
      <Switch>
      </Switch>
    </div>
  );
}

export default App;
```

## Setup Remult
### Install the Server components
Now we'll add the server functionality to the same project.

```sh
npm i express @types/express express-force-https jsonwebtoken compression pg reflect-metadata @types/pg @remult/core @remult/server @remult/server-postgres tsc-watch jsonwebtoken
```


### Add .env file for server configuration
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

### Add the server code
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

### Add tsconfig.server.json
::: danger
 Adjust when done to the final result
:::
Next to the existing `tsconfig.json` we'll add a new `tsconfig` file for the server project. in the root directory add a file called `tsconfig.server.json` and place the following content in it.
```json
{
    "compilerOptions": {
      "rootDir": "./",
      "outDir": "./dist/backend/",
      "module": "commonjs",
      "target": "es5",
      "skipLibCheck": true,
      "emitDecoratorMetadata": true,
      "experimentalDecorators":true,
      "esModuleInterop":true
      
    },
    "files": [
      "./src/server/server.ts" 
    ]
  } 
```

### Exclude server from the React tsconfig.json
```JSON{5-7}
...
  "include": [
    "src"
  ],
  "exclude": [
    "./src/server/**"
  ]
}
```

### Add the dist-server folder to git ignore
The `dist-server` will hold the transpiled version of the server code - there is no need to commit it to git (just like the `dist` forder)

in the `.gitignore` file add:
```sh{4}
...
# production
/build
/dist-server
```

### Add script to build server and proxy to the package.json
::: danger
 Adjust when done to the final result considering deployment as well
:::

```json{6}
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "node-serve": "./node_modules/.bin/tsc-watch -p tsconfig.server.json --onSuccess \"node dist/backend/src/server/server.js"
  },
  "proxy": "http://localhost:3002",
```
