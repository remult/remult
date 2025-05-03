# Build a Full-Stack SolidStart Application

### Create a simple todo app with Remult using SolidStart

In this tutorial, we are going to create a simple app to manage a task list. We'll use `SolidStart`, and Remult as our full-stack CRUD framework. For deployment to production, we'll use [railway.app](https://railway.app/) and a `PostgreSQL` database.

By the end of the tutorial, you should have a basic understanding of Remult and how to use it to accelerate and simplify full stack app development.

::: tip You want to have a look at the end result ?
You can `degit` the final result and read the `README.md` file in the project to check it out.

```sh
npx degit remult/remult/examples/solid-start-todo remult-solid-start-todo
cd remult-solid-start-todo
```

:::

### Prerequisites

This tutorial assumes you are familiar with `TypeScript`, `Solid` and `SolidStart`.

Before you begin, make sure you have [Node.js](https://nodejs.org) and [git](https://git-scm.com/) installed. <!-- consider specifying Node minimum version with npm -->

# Setup for the Tutorial

This tutorial requires setting up a SolidStart project and a few lines of code to add Remult.

You can either **use a starter project** to speed things up, or go through the **step-by-step setup**.

## Option 1: Clone the Starter Project

1. Clone the _remult-solid-start-todo_ repository from GitHub and install its dependencies.

```sh
git clone https://github.com/remult/solid-start-app-starter.git remult-solid-start-todo
cd remult-solid-start-todo
npm install
```

2. Open your IDE.
3. Open a terminal and run the `dev` npm script.

```sh
npm run dev
```

The default SolidStart app main screen should be displayed (except for the styles which were modified for the tutorial).

At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.

## Option 2: Step-by-step Setup

### Create a SolidStart project

1. Create the new SolidStart project.

```sh
npm init solid@latest remult-solid-start-todo
```

Answer the questions as follows:

```sh
o  Is this a Solid-Start project?
|  Yes
|
o  Which template would you like to use?
|  basic
|
o  Use Typescript?
|  Yes
```

2. Go to the created folder.

```sh
cd remult-solid-start-todo
```

### Install Remult

```sh
npm i remult
```

### Bootstrap Remult in the back-end

Remult is bootstrapped in a `SolidStart` using a [catch all dynamic API route](https://start.solidjs.com/core-concepts/routing#catch-all-routes), that passes the handling of requests to an object created using the `remultApi` function.

1. Open your IDE.

2. Create an `api.ts` file in the `src` folder with the following code - which will have the remult's api configuration.

   ```ts
   // src/api.ts

   import { remultApi } from 'remult/remult-solid-start'

   export const api = remultApi({})
   ```

3. In the `routes` directory within the `src` folder, create an `api` directory. Inside the `src/routes/api/` directory, craft a `[...remult].ts` file with the following code. This file functions as a catch all route for the SolidStart API route, effectively managing all incoming API requests.

   ```ts
   // src/routes/api/[...remult].ts

   import { api } from '../../api.js'

   export const { POST, PUT, DELETE, GET } = api
   ```

### Enable TypeScript decorators

To enable TypeScript decorators:

1. Install the required plugin
   ```sh
   npm i -D @babel/plugin-proposal-decorators @babel/plugin-transform-class-properties
   ```
2. Add the following entry to the `app.config.ts` file to enable the use of decorators in the solid start app.

   ```ts{6-14}
   // app.config.ts

   import { defineConfig } from "@solidjs/start/config"

   export default defineConfig({
     //@ts-ignore
     solid: {
       babel: {
         plugins: [
            ["@babel/plugin-proposal-decorators", { version: "legacy" }],
            ["@babel/plugin-transform-class-properties"],
          ],
       },
     },
   })
   ```

### Run the app

Open a terminal and start the app.

```sh
npm run dev
```

The default `SolidStart` main screen should be displayed.

### Cleanup SolidStart basic example

1. Replace the content of `src/app.tsx` with the following code:

   ```tsx
   //src/app.tsx

   import { MetaProvider, Title } from '@solidjs/meta'
   import { Router } from '@solidjs/router'
   import { FileRoutes } from '@solidjs/start/router'
   import { Suspense } from 'solid-js'
   import './app.css'

   export default function App() {
     return (
       <Router
         root={(props) => (
           <MetaProvider>
             <Title>SolidStart - Basic</Title>
             <Suspense>{props.children}</Suspense>
           </MetaProvider>
         )}
       >
         <FileRoutes />
       </Router>
     )
   }
   ```

### Remove SolidStart default styles

The SolidStart default styles won't fit our todo app. If you'd like a nice-looking app, replace the contents of `src/app.css` with [this CSS file](https://raw.githubusercontent.com/remult/solid-start-app-starter/main/src/app.css). Otherwise, you can simply **delete the contents of `src/app.css`**.

### Setup completed

At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.
