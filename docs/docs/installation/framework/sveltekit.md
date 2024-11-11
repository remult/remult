### Create a SvelteKit Project

To create a new SvelteKit project, run the following command:

```sh
npx sv@latest create remult-sveltekit-todo
```

During the setup, answer the prompts as follows:

1. **Which Svelte app template?**: ... `minimal` Project
2. **Add type checking with TypeScript?** ... Yes, using `TypeScript` syntax
3. **Select additional options**: ... We didn't select anything for this tutorial. Feel free to adapt it to your needs.
4. **Which package manager?**: ... We took `npm`, if you perfer others, feel free.

Once the setup is complete, navigate into the project directory:

```sh
cd remult-sveltekit-todo
```

### Install Required Packages and Remult

Install Remult and any necessary dependencies by running:

```sh
npm install remult --save-dev
```

### Bootstrap Remult

To set up Remult in your SvelteKit project:

1. Create your remult `api`

::: code-group

```ts [src/server/api.ts]
import { remultSveltekit } from 'remult/remult-sveltekit'

export const api = remultSveltekit({})
```

:::

2. Create a remult `api route`

::: code-group

```ts [src/routes/api/[...remult]/+server.ts]
import { api } from '../../../server/api'

export const { GET, POST, PUT, DELETE } = api
```

:::

### Final Tweaks

Remult uses TypeScript decorators to enhance classes into entities. To enable decorators in your SvelteKit project, modify the `tsconfig.json` file by adding the following to the `compilerOptions` section:

```json [tsconfig.json]
{
  "compilerOptions": {
    "experimentalDecorators": true // [!code ++]
  }
}
```

### Run the App

To start the development server, run the following command:

```sh
npm run dev
```

Your SvelteKit app will be available at [http://localhost:5173](http://localhost:5173).

### Setup Completed

Your SvelteKit project with Remult is now up and running.

### Remult in other SvelteKit routes

To enable remult across all sveltekit route

::: code-group

```ts [src/hooks.server.ts]
import { sequence } from '@sveltejs/kit/hooks'
import { api as handleRemult } from './server/api'

export const handle = sequence(
  // Manage your sequence of handlers here
  handleRemult,
)
```

:::

### SSR and PageLoad

To Use remult in ssr `PageLoad` - this will leverage the `event`'s fetch to load data on the server without reloading it on the frontend, and abiding to all api rules even when it runs on the server

::: code-group

```ts [src/routes/+page.ts]
import { remult } from 'remult'
import type { PageLoad } from './$types'

export const load = (async (event) => {
  // Instruct remult to use the special svelte fetch
  // Like this univeral load will work in SSR & CSR
  remult.useFetch(event.fetch)
  return repo(Task).find()
}) satisfies PageLoad
```

:::

::: tip
You can add this in `+layout.ts` as well and all routes **under** will have the correct fetch out of the box.
