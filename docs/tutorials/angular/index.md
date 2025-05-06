# Build a Full-Stack Angular Application

### Create a simple todo app with Remult using an Angular frontend

In this tutorial, we are going to create a simple app to manage a task list. We'll use `Angular` for the UI, `Node.js` + `Express.js` for the API server, and Remult as our full-stack CRUD framework. For deployment to production, we'll use [railway.app](https://railway.app/) and a `PostgreSQL` database.

By the end of the tutorial, you should have a basic understanding of Remult and how to use it to accelerate and simplify full stack app development.

::: tip Prefer React?
Check out the [React tutorial](../react/).
:::

### Prerequisites

This tutorial assumes you are familiar with `TypeScript` and `Angular`.

Before you begin, make sure you have [Node.js](https://nodejs.org) and [git](https://git-scm.com/) installed. <!-- consider specifying Node minimum version with npm -->

If Angular CLI is not already installed - then install it.

```sh
npm i -g @angular/cli
```

# Setup for the Tutorial

This tutorial requires setting up an Angular project, an API server project, and a few lines of code to add Remult.

You can either **use a starter project** to speed things up, or go through the **step-by-step setup**.

## Option 1: Clone the Starter Project

1. Clone the _angular-express-starter_ repository from GitHub and install its dependencies.

```sh
git clone https://github.com/remult/angular-express-starter.git remult-angular-todo
cd remult-angular-todo
npm install
```

2. Open your IDE.
3. Open a terminal and run the `dev` npm script.

```sh
npm run dev
```

The default Angular app main screen should be displayed.

At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.

## Option 2: Step-by-step Setup

### Create an Angular project

Create the new Angular project.

```sh
ng new remult-angular-todo
```

::: warning Note
The `ng new` command prompts you for information about features to include in the initial app project. Accept the defaults by pressing the Enter or Return key.
:::

In this tutorial, we'll be using the root folder created by `Angular` as the root folder for our server project as well.

```sh
cd remult-angular-todo
```

### Install required packages

We need `Express` to serve our app's API, and, of course, `Remult`. For development, we'll use [tsx](https://www.npmjs.com/package/tsx) to run the API server.

```sh
npm i express remult
npm i --save-dev @types/express tsx
```

### Create the API server project

The starter API server TypeScript project contains a single module that initializes `Express`, and begins listening for API requests.

1. Open your IDE.

2. Add the following entry to the `compilerOptions` section of the `tsconfig.json` file to enable the use of Synthetic Default Imports.

```json{7-8}
// tsconfig.json

{
...
  "compilerOptions": {
    ...
    "allowSyntheticDefaultImports": true,
   ...
  }
...
}

```

2. Create a `server` folder under the `src/` folder created by Angular cli.

3. Create an `index.ts` file in the `src/server/` folder with the following code:

```ts
// src/server/index.ts

import express from 'express'

const app = express()

app.listen(3002, () => console.log('Server started'))
```

### Bootstrap Remult in the back-end

Remult is loaded in the back-end as an `Express middleware`.

1. Create an `api.ts` file in the `src/server/` folder with the following code:

```ts
// src/server/api.ts

import { remultApi } from 'remult/remult-express'

export const api = remultApi()
```

2. Add the highlighted code lines to register the middleware in the main server module `index.ts`.

```ts{4,7}
// src/server/index.ts

import express from "express"
import { api } from "./api"

const app = express()
app.use(api)

app.listen(3002, () => console.log("Server started"))
```

### Final tweaks

Our full stack starter project is almost ready. Let's complete these final configurations.

#### Proxy API requests from Angular DevServer to the API server

The Angular app created in this tutorial is intended to be served from the same domain as its API.
However, for development, the API server will be listening on `http://localhost:3002`, while the Angular dev server is served from the default `http://localhost:4200`.

We'll use the [proxy](https://angular.io/guide/build#proxying-to-a-backend-server) feature of Angular dev server to divert all calls for `http://localhost:4200/api` to our dev API server.

Create a file `proxy.conf.json` in the root folder, with the following contents:

```json
// proxy.conf.json

{
  "/api": {
    "target": "http://localhost:3002",
    "secure": false
  }
}
```

### Run the app

1. Add a script called `dev` that will run the angular `dev` server with the proxy configuration we've set and a script called `dev-node` to run the api.

```json
// package.json
"scripts": {
  ...
  "dev": "ng serve --proxy-config proxy.conf.json --open",
  "dev-node": "tsx watch src/server",
  ...
}
```

1. Open a terminal and start the angular dev server.

```sh
npm run dev
```

3. Open another terminal and start the `node` server

```sh
npm run dev-node
```

The server is now running and listening on port 3002. `tsx` is watching for file changes and will restart the server when code changes are saved.

The default Angular app main screen should be displayed on the regular port - 4200. Open it in the browser at [http://localhost:4200/](http://localhost:4200/).

### Remove Angular default styles

The angular default styles won't fit our todo app. If you'd like a nice-looking app, replace the contents of `src/styles.css` with [this CSS file](https://raw.githubusercontent.com/remult/angular-express-starter/master/src/styles.css). Otherwise, you can simply **delete the contents of `src/styles.css`**.

### Setup completed

At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.
