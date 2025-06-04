# SvelteKit

## Create a SvelteKit Project

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

## Install Required Packages and Remult

Install Remult and any necessary dependencies by running:

```sh
npm install remult --save-dev
```

## Bootstrap Remult

To set up Remult in your SvelteKit project:

1. Create your remult `api`

::: code-group

```ts [src/server/api.ts]
import { remultApi } from 'remult/remult-sveltekit'

export const api = remultApi({})
```

:::

2. Create a remult `api route`

::: code-group

```ts [src/routes/api/[...remult]/+server.ts]
import { api } from '../../../server/api'

export const { GET, POST, PUT, DELETE } = api
```

:::

## Final Tweaks

Remult uses TypeScript decorators to enhance classes into entities. To enable decorators in your SvelteKit project, modify the `tsconfig.json` file by adding the following to the `compilerOptions` section:

```json [tsconfig.json]
{
  "compilerOptions": {
    "experimentalDecorators": true // [!code ++]
  }
}
```

## Run the App

To start the development server, run the following command:

```sh
npm run dev
```

Your SvelteKit app will be available at [http://localhost:5173](http://localhost:5173).

Your SvelteKit project with Remult is now up and running.

# Extra

## Extra - Remult in other SvelteKit routes

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

## Extra - Universal load & SSR

To Use remult in ssr `PageLoad` - this will leverage the `event`'s fetch to load data on the server
without reloading it on the frontend, and abiding to all api rules even when it runs on the server

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
:::

## Extra - Server load

If you return a remult entity from the `load` function of a `+page.server.ts`,
SvelteKit will complain and show this error:

```bash
Error: Data returned from `load` while rendering / is not serializable:
Cannot stringify arbitrary non-POJOs (data.tasks[0])
```

To fix this, you can use `repo(Entity).toJson()` in the server load function and `repo(Entity).fromJson()` in the .svelte file
to serialize and deserialize well the entity.

::: code-group

```ts [src/routes/+page.server.ts]
import { repo } from 'remult'
import type { PageServerLoad } from './$types'
import { Task } from '../demo/todo/Task'

export const load = (async () => {
  const tasks = repo(Task).toJson(await repo(Task).find())
  return {
    tasks,
  }
}) satisfies PageServerLoad
```

```svelte [src/routes/+page.svelte]
<script lang="ts">
  import type { PageData } from "./$types";
  import { Task } from "../demo/todo/Task";
  import { repo } from "remult";

  let { data }: { data: PageData } = $props();

  let tasks = repo(Task).fromJson(data.tasks);
</script>
```

:::

---

#### Since `@sveltejs/kit@2.11.0`, there is a new feature: [Universal-hooks-transport](https://svelte.dev/docs/kit/hooks#Universal-hooks-transport)

With this new feature, you can get rid of `repo(Entity).toJson()` and `repo(Entity).fromJson()` thanks to this file: `hooks.ts`.

::: code-group

```ts [src/hooks.ts]
import { repo, type ClassType } from 'remult'
import { Task } from './demo/todo/Task'
import type { Transport } from '@sveltejs/kit'
import { api } from './server/api'

// You can have:
// A/ a local entity array to work only these ones (like here)
//  or
// B/ import a global entity array that will be
//    shared between backend and frontend (not in ./server/api.ts)
const entities = [Task]

export const transport: Transport = {
  remultTransport: {
    encode: (value: any) => {
      for (let index = 0; index < entities.length; index++) {
        const element = entities[index] as ClassType<any>
        if (value instanceof element) {
          return {
            ...repo(element).toJson(value),
            entity_key: repo(element).metadata.key,
          }
        }
      }
    },
    decode: (value: any) => {
      for (let index = 0; index < entities.length; index++) {
        const element = entities[index] as ClassType<any>
        if (value.entity_key === repo(element).metadata.key) {
          return repo(element).fromJson(value)
        }
      }
    },
  },
}
```

```ts [src/routes/+page.server.ts]
import { repo } from 'remult'
import type { PageServerLoad } from './$types'
import { Task } from '../demo/todo/Task'

export const load = (async () => {
  // const tasks = repo(Task).toJson(await repo(Task).find()) // [!code --]
  const tasks = await repo(Task).find()
  return {
    tasks,
  }
}) satisfies PageServerLoad
```

```svelte [src/routes/+page.svelte]
<script lang="ts">
  import type { PageData } from "./$types";
  import { repo } from "remult";

  let { data }: { data: PageData } = $props();

  // let tasks = repo(Task).fromJson(data.tasks) // [!code --]
  let tasks = data.tasks
</script>
```

:::

## Extra - Svelte 5 & Reactivity

Remult is fully compatible with Svelte 5, Rune, and Reactivity.

To take full advantage of it, add this snippet:

::: code-group

```html [src/routes/+layout.svelte]
<script lang="ts">
  import { Remult } from 'remult'
  import { createSubscriber } from 'svelte/reactivity'

  // To be done once in the application.
  function initRemultSvelteReactivity() {
    // Auth reactivity (remult.user, remult.authenticated(), ...)
    {
      let update = () => {}
      let s = createSubscriber((u) => {
        update = u
      })
      remult.subscribeAuth({
        reportObserved: () => s(),
        reportChanged: () => update(),
      })
    }

    // Entities reactivity
    {
      Remult.entityRefInit = (x) => {
        let update = () => {}
        let s = createSubscriber((u) => {
          update = u
        })
        x.subscribe({
          reportObserved: () => s(),
          reportChanged: () => update(),
        })
      }
    }
  }
  initRemultSvelteReactivity()
</script>
```

:::

Then you can use `$state`, `$derived` like any other places

::: code-group

```html [src/routes/+page.svelte]
<script lang="ts">
  // Prepare a new task
  let editingTask = $state(repo(Task).create())

  // Check if the form has empty fields
  let formHasEmpty = $derived(!editingTask || editingTask.title.length === 0)

  // Clone the task to edit
  const editTask = async (task: Task) => {
    editingTask = repo(Task).getEntityRef(task).clone()
  }
</script>
```

:::

### Focus on auth reactivity

Anywhere in your frontend code you can set `remult.user = xxx` and all remult auth reactivity will work (remult.user, remult.authenticated(), ...)

```ts
const logout = async () => {
  try {
    remult.user = await AuthController.signOut()
  } catch (error) {
    alert(error.message)
  }
}
```

If you want `remult.user` to be filled in SSR, here is the code:

::: code-group

```svelte [src/routes/+layout.svelte]
<script lang="ts">
  import { untrack } from 'svelte'
  import type { LayoutData } from './$types'

  interface Props {
    data: LayoutData
    children?: import('svelte').Snippet
  }

  let { data, children }: Props = $props()

  $effect(() => {
    // Trigger the effect only on data.user update
    data.user
    untrack(() => {
      remult.user = data.user
    })
  })

  // initRemultSvelteReactivity stuff
</script>

{@render children?.()}
```

```ts [src/routes/+layout.server.ts]
import { remult } from 'remult'

import type { LayoutServerLoad } from './$types'

export const load = (async () => {
  return { user: remult.user }
}) satisfies LayoutServerLoad
```

:::

And you can trigger this with :

```ts
import { invalidateAll } from '$app/navigation'

const logout = async () => {
  try {
    await AuthController.signOut()
    invalidateAll() // [!code ++] // This will trigger the layout.server.ts load function
  } catch (error) {
    alert(error.message)
  }
}
```
