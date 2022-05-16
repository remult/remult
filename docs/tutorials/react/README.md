---
title: Setup
---

# Todo App with React

### Build a production-ready task list app with Remult using a React frontend

In this tutorial, we are going to create a simple app to manage a task list. We'll use `React` for the UI, `Node.js` + `Express.js` for the API server, and Remult as our full-stack framework. For deployment to production, we'll use `Heroku` and a `PostgreSQL` database. 

By the end of the tutorial, you should have a basic understanding of Remult and how to use it to accelerate and simplify full stack app development.

::: tip Prefer Angular?
Check out the [Angular tutorial](../tutorial-angular).
:::

### Prerequisites

This tutorial assumes you are familiar with `TypeScript` and `React`.

Before you begin, make sure you have [Node.js](https://nodejs.org) and [git](https://git-scm.com/) installed. <!-- consider specifying Node minimum version with npm -->

# Setup for the Tutorial
This tutorial requires setting up a React project, an API server project, and a few lines of code to add Remult.

You can either **use a starter project** to speed things up, or go through the **step-by-step setup**.

## Option 1: Clone the Starter Project

1. Clone the *remult-react-todo* repository from GitHub and install its dependencies.

```sh
git clone https://github.com/remult/remult-react-todo.git
cd remult-react-todo
npm install
```

2. Open your IDE.
3. Open a terminal and run the `dev` npm script.

```sh
npm run dev
```

The default React app main screen should be displayed.

At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.

## Option 2: Step-by-step Setup

### Create a React project
Create the new React project.
```sh
npx create-react-app remult-react-todo --template typescript
cd remult-react-todo
```

In this tutorial, we'll be using the root folder created by `React` as the root folder for our server project as well.
### Install required packages
We need [axios](https://axios-http.com/) to serve as an HTTP client, `Express` to serve our app's API, and, of course, `Remult`. For development, we'll use [ts-node-dev](https://www.npmjs.com/package/ts-node-dev) to run the API server, and [concurrently](https://www.npmjs.com/package/concurrently) to run both API server and React app from a single command.
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

3. Create a `server` folder under the `src/` folder created by Create React App.

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

In the React app we'll be using a global `Remult` object to communicate with the API server via a `Promise`-based HTTP client (in this case - `Axios`).

Create an `common.ts` file in the `src/` folder with the following code:

*src/common.ts*
```ts
import axios from "axios";
import { Remult } from "remult";

export const remult = new Remult(axios); 
```


### Final tweaks

Our full stack starter project is almost ready. Let's complete these final configurations.
#### Enable TypeScript decorators in the React app

Add the following entry to the `compilerOptions` section of the `tsconfig.json` file to enable the use of decorators in the React app.
   
*tsconfig.json*
```json
"experimentalDecorators": true
```

#### Proxy API requests from React DevServer to the API server
The React app created in this tutorial is intended to be served from the same domain as its API. 
However, for development, the API server will be listening on `http://localhost:3002`, while the React app is served from the default `http://localhost:3000`. 

We'll use the [proxy](https://create-react-app.dev/docs/proxying-api-requests-in-development/) feature of webpack dev server to divert all calls for `http://localhost:3000/api` to our dev API server.

Configure the proxy by adding the following entry to the main section of the `package.json` file:

*package.json*
```json
"proxy": "http://localhost:3002"
```

### Run the app

1. Create an `npm` script named `dev` to start the dev API server and the React app, by adding the following entry to the `scripts` section of `package.json`.

*package.json*
```json
"dev": "concurrently -k -n \"API,WEB\" -c \"bgBlue.bold,bgGreen.bold\" \"ts-node-dev -P tsconfig.server.json src/server/\" \"react-scripts start\""
```
   
2. Open a terminal and start the app.
```sh
npm run dev
```

The server is now running and listening on port 3002. `ts-node-dev` is watching for file changes and will restart the server when code changes are saved.

The default React app main screen should be displayed.


### Setup completed
At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.