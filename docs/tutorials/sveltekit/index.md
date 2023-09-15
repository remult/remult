# Build a Full-Stack Sveltekit Application

### Create a simple todo app with Remult using a Sveltekit frontend

In this tutorial, we are going to create a simple app to manage a task list. We'll use `Sveltekit` and Remult as our full-stack CRUD framework. For deployment to production, we'll use [Vercel](https://vercel.com/) and a `PostgreSQL` database.

By the end of the tutorial, you should have a basic understanding of Remult and how to use it to accelerate and simplify full stack app development.

### Prerequisites

This tutorial assumes you are familiar with `TypeScript` and `Sveltekit`.

Before you begin, make sure you have [Node.js](https://nodejs.org) and [git](https://git-scm.com/) installed. <!-- consider specifying Node minimum version with npm -->

# Setup for the Tutorial

This tutorial requires setting up a Sveltekit project, and a few lines of code to add Remult.

## Step-by-step Setup

### Create a Sveltekit project

Create the new Sveltekit project.

```sh
npm create svelte@latest remult-sveltekit-todo
```

The command prompts you for information about features to include in the initial app project. Here are the answers used in this tutorial:

1. **Which Svelte app template?**: ... Skeleton Project
2. **Add type checking with TypeScript?** ... Yes, using TypeScript syntax**
3. **Select additional options**: ... You may want to include _Prettier_ and _ESLint_ but the options in this step are purely optional.

::: warning Run into issues scaffolding the Vite project?
See [Vite documentation](https://vitejs.dev/guide/#scaffolding-your-first-vite-project) for help.
:::
Once completed, change to the app directory:

```sh
cd remult-sveltekit-todo
```

### Install required packages and Remult

```sh
npm i remult
```

### Bootstrap Remult

Remult is loaded in the back-end as a server hook

1. Open your IDE.

2. Create a `hooks.server.ts` file in the `src/` folder with the following code:

```ts
// src/hooks.server.ts

import { remultSveltekit } from "remult/remult-sveltekit"

export const handle = remultSveltekit()
```

### Final tweaks

Our full stack starter project is almost ready. 

Remult makes use of decorators to enhance regular Typescript classes into entities. Add the following entry to the `compilerOptions` section of the `tsconfig.json` file to enable the use of decorators.

```json{7}
// tsconfig.json

{
...
  "compilerOptions": {
    ...
    "experimentalDecorators": true // add this
   ...
  }
...
}

```
### Run the app

Open a terminal and start the vite dev server.

```sh
npm run dev
```

The default "Sveltekit" app main screen should be available at the default Vite dev server address http://127.0.0.1:5173.

### Setup completed

At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.
