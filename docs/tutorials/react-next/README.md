# Build a Full-Stack Next.js Application

### Create a simple todo app with Remult using Next.js

In this tutorial, we are going to create a simple app to manage a task list. We'll use `Next.js`, and Remult as our full-stack CRUD framework. For deployment to production, we'll use [railway.app](https://railway.app/) to host the application and a `PostgreSQL` database.

By the end of the tutorial, you should have a basic understanding of Remult and how to use it to accelerate and simplify full stack app development.

### Prerequisites

This tutorial assumes you are familiar with `TypeScript`, `React` and `Next.js`.

Before you begin, make sure you have [Node.js](https://nodejs.org) and [git](https://git-scm.com/) installed. <!-- consider specifying Node minimum version with npm -->

# Setup for the Tutorial

This tutorial requires setting up a Next.js project and a few lines of code to add Remult.

You can either **use a starter project** to speed things up, or go through the **step-by-step setup**.

## Option 1: Clone the Starter Project

1. Clone the _remult-nextjs-todo_ repository from GitHub and install its dependencies.

```sh
git clone https://github.com/remult/nextjs-starter.git remult-nextjs-todo
cd remult-nextjs-todo
npm install
```

2. Open your IDE.
3. Open a terminal and run the `dev` npm script.

```sh
npm run dev
```

The default Next.js app main screen should be displayed.

At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.

## Option 2: Step-by-step Setup

### Create a Next.js project

Create the new Next.js project.

```sh
npx -y create-next-app@latest remult-nextjs-todo --typescript --src-dir
cd remult-nextjs-todo
```

Open your IDE

### Cleanup Next.js default css
To start from scratch, let's cleanup the default css provided by nest.

You can either:

1. **Delete the content** of the `src/styles/globals.css` file

2. Or Optionally, make the app look a little better by replacing the contents of `src/styles/globals.css` with [this CSS file](https://raw.githubusercontent.com/remult/react-vite-express-starter/completed-tutorial/src/index.css).
// TODO - update css to a new one

### Install Remult

```sh
npm i remult
```

### Bootstrap Remult in the back-end

Remult is bootstrapped in a `Next.js` using a [catch all dynamic API route](https://nextjs.org/docs/api-routes/dynamic-api-routes#optional-catch-all-api-routes), that passes the handling of requests to an object created using the `remultNext` function.

Add a file named `[...remult].ts` in the folder `src/pages/api`. This file is a "catch all" `Next.js` API route which will be used to handle all API requests.

_src/pages/api/[...remult].ts_

```ts
import { remultNext } from "remult/remult-next";

export default remultNext({})
```

### Enable TypeScript decorators

Add the following entry to the `compilerOptions` section of the `tsconfig.json` file to enable the use of decorators in the React app.

_tsconfig.json_

```json
"experimentalDecorators": true,
"emitDecoratorMetadata": true
```

### Run the app

Open a terminal and start the app.

```sh
npm run dev
```

The default `Next.js` main screen should be displayed.

### Setup completed

At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.

