# Build a Full-Stack Next.js Application

### Create a simple todo app with Remult using Next.js

In this tutorial, we are going to create a simple app to manage a task list. We'll use `Next.js`, and Remult as our full-stack CRUD framework. For deployment to production, we'll use [Vercel](https://vercel.com/) and a [Supabase](https://supabase.com/) `PostgreSQL` database.

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

The default Next.js app main screen should be displayed (except for the styles which were modified for the tutorial).

At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.

## Option 2: Step-by-step Setup

### Create a Next.js project

1. Create the new Next.js project.

```sh
npx -y create-next-app@latest remult-nextjs-todo --typescript --src-dir
```
Answer all the questions (default answers are fine). 

2. Go to the created folder.

```sh
cd remult-nextjs-todo
```

### Install Remult

```sh
npm i remult
```

### Bootstrap Remult in the back-end

Remult is bootstrapped in a `Next.js` using a [catch all dynamic API route](https://nextjs.org/docs/api-routes/dynamic-api-routes#optional-catch-all-api-routes), that passes the handling of requests to an object created using the `remultNext` function.

1. Open your IDE.

2. Create a `[...remult].ts` file in the `src/pages/api` folder. This file is a "catch all" `Next.js` API route which will be used to handle all API requests.

```ts
// src/pages/api/[...remult].ts

import { remultNext } from "remult/remult-next"

export default remultNext({})
```

### Enable TypeScript decorators

Add the following entry to the `compilerOptions` section of the `tsconfig.json` file to enable the use of decorators in the React app.

_tsconfig.json_

```json
"experimentalDecorators": true
```

### Run the app

Open a terminal and start the app.

```sh
npm run dev
```

The default `Next.js` main screen should be displayed.


### Remove Next.js default styles

The Next.js default styles won't fit our todo app. If you'd like a nice-looking app, replace the contents of `src/styles/globals.css` with [this CSS file](https://raw.githubusercontent.com/remult/nextjs-starter/new-tutorial-18/src/styles/globals.css). Otherwise, you can simply **delete the contents of `src/styles/globals.css`**.

### Setup completed

At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.
