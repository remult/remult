# Deployment

Let's deploy the todo app to [railway.app](https://railway.app/).

## Prepare for Production

In order to deploy to a Node.js environment, you need to change Sveltekit's adaptor to `@sveltejs/adapter-node`.

1. Install `adapter-node`:

```sh
npm i @sveltejs/adapter-node --save-dev
```

2. In `svelte.config.js`, change the adapter:

::: code-group

```js [svelte.config.js]
import adapter from '@sveltejs/adapter-auto' // [!code --]
import adapter from '@sveltejs/adapter-node' // [!code ++]
```
::: 

You also need to change the dataProvider on the remult initilizer a little bit. By default Sveltekit will try to access your database when running the `npm run build` command, but on railway, the postgres database is not accessible at this time, and it will make your deployment fail.

To solve this, we need to make Sveltekit use the default JSON database when building, and use Postgres only in production.

Make the following changes on your `server/api.ts` file:

::: code-group
```ts [src/server/api.ts]
import { remultApi } from 'remult/remult-sveltekit'
import { Task } from './shared/Task'
import { TasksController } from './shared/TasksController'
import { createPostgresDataProvider } from 'remult/postgres' 
import { DATABASE_URL } from '$env/static/private'
import { building } from '$app/environment'; // [!code ++]

export const api = remultApi({
  entities: [Task],
  controllers: [TasksController],
  dataProvider: DATABASE_URL // [!code --]
    ? createPostgresDataProvider({ connectionString: DATABASE_URL }) // [!code --]
    : undefined, // [!code --]
   dataProvider: async () => { // [!code ++]
		if (DATABASE_URL && !building) { // [!code ++]
			return createPostgresDataProvider({ // [!code ++]
				connectionString: DATABASE_URL // [!code ++]
			}); // [!code ++]
		} // [!code ++]
		return undefined; // [!code ++]
	}, // [!code ++]
  getUser: async (event) => {
    const auth = await event?.locals?.auth()
    return auth?.user as UserInfo
  },
})
```
:::

In order to deploy the todo app to [railway](https://railway.app/) you'll need a `railway` account. You'll also need [Railway CLI](https://docs.railway.app/develop/cli#npm) installed, and you'll need to login to railway from the cli, using `railway login`.

Click enter multiple times to answer all its questions with the default answer

1. Create a Railway `project`.

   From the terminal in your project folder run:

   ```sh
   railway init
   ```

2. Select `Empty Project`
3. Set a project name.
4. Once it's done add a database by running the following command:
   ```sh
   railway add
   ```
5. Select `postgressql` as the database.
6. You need to modify your package.json file and tell the railway to use the correct version of NodeJS, like this:
   ```jsonc [package.json]
	"type": "module",
   "engines": { // [!code ++]
		"node": ">=20.19" // [!code ++]
	}, // [!code ++]
   "scripts": {
		// ... your scripts
	},
   ```
8. Once that's done run the following command to upload the project to railway:
   ```sh
   railway up
   ```
::: warning Note
Due to a bug in the way the default Railway builds, the first time you use the `railway up` command, it will fail to deploy. Continue to follow the steps to fix it
:::

9. Go to the `railway` project's site and click on the project
10. Switch to the `settings` tab
11. Under `Build` change the build from the default `Nixpacks` to the `Railpack`
12. Switch to the `variables` tab
13. Click on `+ New Variable`, and in the `VARIABLE_NAME` click `Add Reference` and select `DATABASE_URL`
14. Add another variable called `AUTH_SECRET` and set it to a random string, you can use an [online UUID generator](https://www.uuidgenerator.net/)
15. Wait for railway to finish deploying your changes and Click on the newly generated url to open the app in the browser and you'll see the app live in production. (it may take a few minutes to go live)

::: warning Note
If you run into trouble deploying the app to Railway, try using Railway's [documentation](https://docs.railway.app/deploy/deployments).
:::

That's it - our application is deployed to production, on a node js server

<hr />
Love Remult?&nbsp;<a href="https://github.com/remult/remult" target="_blank" rel="noopener"> Give our repo a star.⭐</a>
