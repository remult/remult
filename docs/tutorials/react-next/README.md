---
title: Setup
---

# Build a Full-Stack React Application

### Create a simple todo app with Remult using a React and next.js

In this tutorial, we are going to create a simple app to manage a task list. We'll use `next.js` with `React`  and Remult as our full-stack CRUD framework. For deployment to production, we'll use `Heroku` and a `PostgreSQL` database. 

By the end of the tutorial, you should have a basic understanding of Remult and how to use it to accelerate and simplify full stack app development.

::: tip Prefer Angular?
Check out the [Angular tutorial](../angular/).
:::

### Prerequisites

This tutorial assumes you are familiar with `TypeScript`, `React` and `next.js`.

Before you begin, make sure you have [Node.js](https://nodejs.org) and [git](https://git-scm.com/) installed. <!-- consider specifying Node minimum version with npm -->

# Setup for the Tutorial
This tutorial requires setting up a next.js project and a few lines of code to add Remult.

You can either **use a starter project** to speed things up, or go through the **step-by-step setup**.

## Option 1: Clone the Starter Project

1. Clone the *remult-nextjs-todo* repository from GitHub and install its dependencies.

```sh
git clone https://github.com/remult/remult-nextjs-todo.git
cd remult-nextjs-todo
yarn
```

2. Open your IDE.
3. Open a terminal and run the `dev` npm script.

```sh
npm run dev
```

The default next.js app main screen should be displayed.

At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.

## Option 2: Step-by-step Setup

### Create a React project
Create the new next.js project.
```sh
npx create-next-app@latest remult-nextjs-todo --typescript
cd remult-nextjs-todo
```

### Install required packages
We need [axios](https://axios-http.com/) to serve as an HTTP client, and, of course, `Remult`. We'll also need `Express` to help manage routes for `Remult` (this dependency will be removed in future versions);
```sh
yarn add axios express remult
```

### Bootstrap Remult in the back-end
Remult is loaded in `next.js` as a catch all route.

1. Open your IDE.

2. Create a folder called `src` in the project's root.

3. Create a folder called `server` in the `src` folder

3. Create an `api.ts` file in the `src/server` folder with the following code:

*lib/api.ts*
```ts
import { remultExpress } from 'remult/remult-express';

export const api = remultExpress({
    bodyParser: false
});
```

* `bodyParser` is set to `false` because `next.js` does that for us

2. Add a file called `[[...slug]].ts` in the folder `pages/api` this file is a "catch all" `next.js` route which will be used to server all api calls.

*pages/api/[[...slug]].ts*
```ts
import { NextApiRequest, NextApiResponse } from 'next'
import * as util from 'util';
import { api } from '../../src/server/api';

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
    await util.promisify((api as any))(_req, res);
}

export default handler
```

### Bootstrap Remult in the front-end

In the React app we'll be using a global `Remult` object to communicate with the API server via a `Promise`-based HTTP client (in this case - `Axios`).

Create a `common.ts` file in the `src/` folder with the following code:

*src/common.ts*
```ts
import axios from "axios";
import { Remult } from "remult";

export const remult = new Remult(axios); 
```


### Final tweaks

Our full stack starter project is almost ready. Let's complete these final configurations.
#### Enable TypeScript decorators 

1. Add the following entry to the `compilerOptions` section of the `tsconfig.json` file to enable the use of decorators in the React app.
   
*tsconfig.json*
```json
"experimentalDecorators": true,
"emitDecoratorMetadata": true
```
   
### Run the app
   
2. Open a terminal and start the app.
```sh
yarn dev
```

The default `next.hs` main screen should be displayed.


### Setup completed
At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.