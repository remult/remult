# Build a Full-Stack Angular Application

### Create a simple todo app with Remult using an Angular frontend

In this tutorial, we are going to create a simple app to manage a task list. We'll use `Angular` for the UI, `Node.js` + `Express.js` for the API server, and Remult as our full-stack CRUD framework. For deployment to production, we'll use `Heroku` and a `PostgreSQL` database. 

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

1. Clone the *angular-express-starter* repository from GitHub and install its dependencies.

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
We need `Express` to serve our app's API, and, of course, `Remult`. For development, we'll use [ts-node-dev](https://www.npmjs.com/package/ts-node-dev) to run the API server, and [concurrently](https://www.npmjs.com/package/concurrently) to run both API server and the Angular dev server from a single command.
```sh
npm i express remult
npm i --save-dev @types/express ts-node-dev concurrently
```
### Create the API server project
The starter API server TypeScript project contains a single module that initializes `Express`, and begins listening for API requests.

1. Open your IDE.

2. Add the following entry to the `compilerOptions` section of the `tsconfig.json` file to enable the use of Synthetic Default Imports and ES Module Interop in the app.
   
*tsconfig.json*
```json
"allowSyntheticDefaultImports": true,
"esModuleInterop": true,
```

3. In the root folder, create a TypeScript configuration file `tsconfig.server.json` for the server project.

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

4. Create a `server` folder under the `src/` folder created by Angular cli.

5. Create an `index.ts` file in the `src/server/` folder with the following code:

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

### Add Angular Modules

In the Angular app we'll be using Angular's `HttpClientModule` and `FormsModule`.

We'll modify the `app.module.ts` file to load Angular's `HttpClientModule` and `FormsModule`.

*src/app/app.module.ts*
```ts{3-4,14-15}
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from "@angular/common/http";
import { FormsModule } from '@angular/forms';

import { TodoComponent } from './todo.component';

@NgModule({
  declarations: [
    TodoComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [TodoComponent]
})
export class AppModule { }
```


### Final tweaks

Our full stack starter project is almost ready. Let's complete these final configurations.

#### Proxy API requests from Angular DevServer to the API server
The Angular app created in this tutorial is intended to be served from the same domain as its API. 
However, for development, the API server will be listening on `http://localhost:3002`, while the Angular dev server is served from the default `http://localhost:4200`. 

We'll use the [proxy](https://angular.io/guide/build#proxying-to-a-backend-server) feature of Angular dev server to divert all calls for `http://localhost:4200/api` to our dev API server.

Create a file `proxy.conf.json` in the root folder, with the following contents:

*proxy.conf.json*
```json
{
   "/api": {
      "target": "http://localhost:3002",
      "secure": false
   }
}
```

### Run the app

1. Create an `npm` script named `dev` to start the dev API server and the Angular dev server, by adding the following entry to the `scripts` section of `package.json`.

*package.json*
```json
"dev": "concurrently -k -n \"API,WEB\" -c \"bgBlue.bold,bgGreen.bold\" \"ts-node-dev -P tsconfig.server.json src/server/\" \"ng serve --proxy-config proxy.conf.json --open\""
```
   
2. Open a terminal and start the app.
```sh
npm run dev
```

The server is now running and listening on port 3002. `ts-node-dev` is watching for file changes and will restart the server when code changes are saved.

The default Angular app main screen should be displayed on the regular port - 4200. Open it in the browser at [http://localhost:4200/](http://localhost:4200/).


### Setup completed
At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.