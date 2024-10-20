### Create a Nuxt Project

To create a new Nuxt project, run the following command:

```sh
npx nuxi init remult-nuxt-todo
cd remult-nuxt-todo
```

### Install Remult

Install Remult in your Nuxt project by running the following command:

```sh
npm install remult
```

### Enable TypeScript Decorators

To enable the use of TypeScript decorators in your Nuxt project, modify the `nuxt.config.ts` file as follows:

```ts [nuxt.config.ts]
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  nitro: {
    esbuild: {
      options: {
        tsconfigRaw: {
          compilerOptions: {
            experimentalDecorators: true,
          },
        },
      },
    },
  },
  vite: {
    esbuild: {
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
        },
      },
    },
  },
})
```

### Bootstrap Remult

1. **Create the API File**

   In the `server/api/` directory, create a dynamic API route that integrates Remult with Nuxt. The following code sets up the API and defines the entities to be used:

   ```ts [server/api/[...remult].ts]
   import { remultNuxt } from 'remult/remult-nuxt'
   import { Task } from '../../demo/todo/Task.js'

   export const api = remultNuxt({
     admin: true,
     entities: [Task],
   })

   export default defineEventHandler(api)
   ```

   This setup uses the Remult `Task` entity and registers the API routes dynamically for the entities within the app.

### Run the App

To start the development server, run:

```sh
npm run dev
```

The Nuxt app will now be running on the default address [http://localhost:3000](http://localhost:3000).

### Setup Completed

Your Nuxt app with Remult is now set up and ready to go. You can now move on to defining your entities and building your task list app.
