---
title: Setup
---

# Build a Full-Stack Vue Application

### Create a simple todo app with Remult using a Vue frontend

In this tutorial, we are going to create a simple app to manage a task list. We'll use `Vue` for the UI, `Node.js` + `Express.js` for the API server, and Remult as our full-stack CRUD framework. For deployment to production, we'll use `Heroku` and a `PostgreSQL` database. 

By the end of the tutorial, you should have a basic understanding of Remult and how to use it to accelerate and simplify full stack app development.

::: tip Prefer React?
Check out the [React tutorial](../react/).
:::

### Prerequisites

This tutorial assumes you are familiar with `TypeScript` and `Vue`.

Before you begin, make sure you have [Node.js](https://nodejs.org) and [git](https://git-scm.com/) installed. <!-- consider specifying Node minimum version with npm -->

# Setup for the Tutorial
This tutorial requires setting up a Vue project, an API server project, and a few lines of code to add Remult.

You can either **use a starter project** to speed things up, or go through the **step-by-step setup**.

## Option 1: Clone the Starter Project

1. Clone the *remult-vue-todo* repository from GitHub and install its dependencies.

```sh
git clone https://github.com/remult/remult-vue-todo.git
cd remult-vue-todo
npm install
```

2. Open your IDE.
3. Open a terminal and run the `dev` npm script.

```sh
npm run dev
```

The default Vue app main screen should be displayed.

At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.

## Option 2: Step-by-step Setup

### Create a Vue project
Create the new Vue project.
```sh
npm init vue@latest
```


The command command prompts you for information about features to include in the initial app project. Here are the answers used in this tutorial:
1. Project name: ... **remult-vue-todo**
2. Add Typescript? ... **Yes**
3. For the rest of the answers, simply select the default.

::: warning Need to install the following packages:
If you are running create-vue for the first time, you'll get the following prompt, simply answer **y**es
```sh
Need to install the following packages:
  create-vue@latest
Ok to proceed? (y) y
```
:::

Once completed, run:
```sh
cd remult-vue-todo
npm i
```


In this tutorial, we'll be using the root folder created by `Vue` as the root folder for our server project as well.
### Install required packages
We need [axios](https://axios-http.com/) to serve as an HTTP client, `Express` to serve our app's API, and, of course, `Remult`. For development, we'll use [ts-node-dev](https://www.npmjs.com/package/ts-node-dev) to run the API server, and [concurrently](https://www.npmjs.com/package/concurrently) to run both API server and the Vue dev server from a single command.
```sh
npm i axios express remult
npm i --save-dev @types/express ts-node-dev concurrently
```
### Create the API server project
The starter API server TypeScript project contains a single module that initializes `Express`, and begins listening for API requests.

1. Open your IDE.

2. In the root folder, create a TypeScript configuration file `tsconfig.server.json` for the server project.

*tsconfig.server.json*
```json
{
   "extends": "./tsconfig.json",
   "compilerOptions": {
      "module": "commonjs",
      "emitDecoratorMetadata": true
   }
}
```

3. Create a `server` folder under the `src/` folder created by Create Vue App.

4. Create an `index.ts` file in the `src/server/` folder with the following code:

*src/server/index.ts*
```ts
import express from 'express';

const app = express();

app.listen(3002, () => console.log("Server started"));
```

### Bootstrap Remult in the back-end
Remult is loaded in the back-end as an `Express middleware`.

1. Create an `api.ts` file in the `src/server/` folder with the following code:

*src/server/api.ts*
```ts
import { remultExpress } from 'remult/remult-express';

export const api = remultExpress();
```

2. Add the highlighted code lines to register the middleware in the main server module `index.ts`.

*src/server/index.ts*
```ts{2,5}
import express from 'express';
import { api } from './api';

const app = express();
app.use(api);

app.listen(3002, () => console.log("Server started"));
```

### Bootstrap Remult in the front-end

In the Vue app we'll be using a global `Remult` object to communicate with the API server via a `Promise`-based HTTP client (in this case - `Axios`).

Create an `common.ts` file in the `src/` folder with the following code:

*src/common.ts*
```ts
import axios from "axios";
import { Remult } from "remult";

export const remult = new Remult(axios); 
```


### Final tweaks

Our full stack starter project is almost ready. Let's complete these final configurations.
#### Enable TypeScript decorators in the Vue app

Add the following entry to the `compilerOptions` section of the `tsconfig.json` file to enable the use of decorators in the Vue app.
   
*tsconfig.json*
```json
"experimentalDecorators": true
```

#### Proxy API requests from Vue DevServer (vite) to the API server
The Vue app created in this tutorial is intended to be served from the same domain as its API. 
However, for development, the API server will be listening on `http://localhost:3002`, while the Vue app is served from the default `http://localhost:3000`. 

We'll use the [proxy](https://vitejs.dev/config/#server-proxy) feature of vite to divert all calls for `http://localhost:3000/api` to our dev API server.

Configure the proxy by adding the following entry to the `vite.config.ts` file:

*vite.config.ts*
```ts{14-20}
import { fileURLToPath, URL } from 'url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3002'
      }
    }
  }
})

```

### Run the app

1. Replace the `npm` script named `dev` to start the dev API server and the Vue dev server (vite), by adding the following entry to the `scripts` section of `package.json`.

*package.json*
```json
    "dev": "concurrently -k -n \"API,WEB\" -c \"bgBlue.bold,bgGreen.bold\" \"ts-node-dev -P tsconfig.server.json src/server/\" \"vite\""
```
   
2. Open a terminal and start the app.
```sh
npm run dev
```

The server is now running and listening on port 3002. `ts-node-dev` is watching for file changes and will restart the server when code changes are saved.

Open the app by navigating to [http://localhost:3000](http://localhost:3000), The default Vue app main screen should be displayed.


### Setup completed
At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.