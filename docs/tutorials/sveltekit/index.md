# Build a Full-Stack SvelteKit Application

### Create a simple todo app with Remult using a SvelteKit

In this tutorial, we are going to create a simple app to manage a task list. We'll use `SvelteKit` for the UI & the backend and Remult as our full-stack CRUD framework.

By the end of the tutorial, you should have a basic understanding of Remult and how to use it to accelerate and simplify full stack app development.

::: tip You want to have a look at the end result ?
You can `degit` the final result and read the `README.md` file in the project to check it out.

```sh
npx degit remult/remult/examples/sveltekit-todo remult-sveltekit-todo
cd remult-sveltekit-todo
```

:::

### Prerequisites

This tutorial assumes you are familiar with `SvelteKit`.

Before you begin, make sure you have [Node.js](https://nodejs.org) and [git](https://git-scm.com/) installed.

# Setup for the Tutorial

This tutorial requires setting up a Sveltekit project, and a few lines of code to add Remult.

## Step-by-step Setup

### Create a Sveltekit project

Create the new Sveltekit project.

```sh
npm create svelte@latest remult-sveltekit-todo
```

The command prompts you for information about features to include in the initial app project. Here are the answers used in this tutorial:

1. **Which Svelte app template?**: ... `Skeleton` Project
2. **Add type checking with TypeScript?** ... Yes, using `TypeScript` syntax
3. **Select additional options**: ... You may want to include _Prettier_ and _ESLint_ but the options in this step are purely optional.

Once completed, change to the app directory:

```sh
cd remult-sveltekit-todo
```

### Install required packages and Remult

```sh
npm i remult --save-dev
```

### Bootstrap Remult

Remult is loaded in the back-end as a server hook

1. Open your IDE.

2. Create a remult handle and add it to your hooks sequence. You can do so by creating these two files:

::: code-group

```ts [src/hooks.server.ts]
import { sequence } from '@sveltejs/kit/hooks'
import { handleRemult } from './hooks/handleRemult'

export const handle = sequence(handleRemult)
```

```ts [src/hooks/handleRemult.ts]
import { remultSveltekit } from 'remult/remult-sveltekit'

export const handleRemult = remultSveltekit({})
```

:::

### Final tweaks

Our full stack starter project is almost ready.

Remult makes use of decorators to enhance regular Typescript classes into entities. Add the following entry to the `compilerOptions` section of the `tsconfig.json` file to enable the use of decorators.

::: code-group

```json [tsconfig.json]
{
  "compilerOptions": {
    "experimentalDecorators": true // [!code ++]
  }
}
```

:::

### Run the app

Open a terminal and start the vite dev server.

```sh
npm run dev
```

The default "Sveltekit" app main screen should be available at the default Vite dev server address http://127.0.0.1:5173.

### Setup completed

At this point, our starter project is up and running. We are now ready to move to the [next step of the tutorial](./entities.md) and start creating the task list app.
