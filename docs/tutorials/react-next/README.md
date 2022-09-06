# Build a Full-Stack Next.js Application

### Create a simple todo app with Remult using Next.js

In this tutorial, we are going to create a simple app to manage a task list. We'll use `Next.js`, and Remult as our full-stack CRUD framework. For deployment to production, we'll use `Heroku` and a `PostgreSQL` database. 

By the end of the tutorial, you should have a basic understanding of Remult and how to use it to accelerate and simplify full stack app development.

### Prerequisites

This tutorial assumes you are familiar with `TypeScript`, `React` and `Next.js`.

Before you begin, make sure you have [Node.js](https://nodejs.org) and [git](https://git-scm.com/) installed. <!-- consider specifying Node minimum version with npm -->

# Setup for the Tutorial
This tutorial requires setting up a Next.js project and a few lines of code to add Remult.

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
yarn dev
```

The default Next.js app main screen should be displayed.

At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.

## Option 2: Step-by-step Setup

### Create a Next.js project

Create the new Next.js project.
```sh
npx -y create-next-app@latest remult-nextjs-todo --typescript
cd remult-nextjs-todo
```

### Install Remult

```sh
yarn add remult
```

### Bootstrap Remult in the back-end
Remult is bootstrapped in a `Next.js` app by adding it the `remultServer` [API middleware](https://nextjs.org/docs/api-routes/api-middlewares) to a [catch all dynamic API route](https://nextjs.org/docs/api-routes/dynamic-api-routes#optional-catch-all-api-routes).

1. Open your IDE.

2. Create a folder named `src` in the project's root.

3. Create a folder named `server` in the `src` folder

4. Create an `api.ts` file in the `src/server` folder with the following code:

*src/server/api.ts*
```ts
import { createRemultServer } from "remult/server";

export const api = createRemultServer({})
```

5. Add a file named `[...remult].ts` in the folder `pages/api`. This file is a "catch all" `Next.js` API route which will be used to handle all API requests.

*pages/api/[...remult].ts*
```ts
import { NextApiRequest, NextApiResponse } from 'next'
import { api } from '../../src/server/api';

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
    await api.handle(_req, res);;
}

export default handler
```

### Enable TypeScript decorators 

Add the following entry to the `compilerOptions` section of the `tsconfig.json` file to enable the use of decorators in the React app.
   
*tsconfig.json*
```json
"experimentalDecorators": true,
"emitDecoratorMetadata": true
```
   
### Run the app
   
Open a terminal and start the app.

```sh
yarn dev
```

The default `Next.js` main screen should be displayed.

### Setup completed
At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.