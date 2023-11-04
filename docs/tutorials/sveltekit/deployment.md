# Deployment

You can deploy the application to a standard Node.js server, or a server-less server.

We'll review both options.

## Deploy to a node.js server

Let's deploy the todo app to [railway.app](https://railway.app/).

In order to deploy to a Node.js environment, you need to change Sveltekit's adaptor to `@sveltejs/adapter-node`.

1. Install `adapter-node`:

```sh
npm i @sveltejs/adapter-node
```

2. In `svelte.config.js`, change the adapter:

```js
//import adapter from '@sveltejs/adapter-auto';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/kit/vite';
```
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
6. Once that's done run the following command to upload the project to railway:
   ```sh
   railway up
   ```
7. got to the `railway` project's site and click on the project
8. Switch to the `settings` tab
9. Under `Environment` click on `Generate Domain`
10. Copy the `generated url`, you'll need it for [NEXTAUTH_URL](https://next-auth.js.org/configuration/options#nextauth_url) on step 14
11. Switch to the `variables` tab
12. Click on `+ New Variable`, and in the `VARIABLE_NAME` click `Add Reference` and select `DATABASE_URL`
13. Add another variable called `SESSION_SECRET` and set it to a random string, you can use an [online UUID generator](https://www.uuidgenerator.net/)
14. Add another variable called `NEXTAUTH_URL` and set it to the `generated url` which was created on step 10.
15. Wait for railway to finish deploying your changes and Click on the newly generated url to open the app in the browser and you'll see the app live in production. (it may take a few minutes to go live)

::: warning Note
If you run into trouble deploying the app to Railway, try using Railway's [documentation](https://docs.railway.app/deploy/deployments).
:::

That's it - our application is deployed to production, on a node js server

Next we'll explore deployment to a server-less environment.

## Deploying to a serverless environment

Let's deploy the todo app to [vercel](https://vercel.com/).

Before deploying to Vercel, you need to change Sveltekit's adaptor to `@sveltejs/adapter-vercel`.

1. Install `adapter-vercel`:

```sh
npm i @sveltejs/adapter-vercel
```

2. In `svelte.config.js`, change the adapter:

```js
//import adapter from '@sveltejs/adapter-auto';
//import adapter from '@sveltejs/adapter-node';
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/kit/vite';
```

### Postgres

We'll use vercel's postgres as out database, and that requires the following changes to the `createPostgresDataProvider` options.

```
// src/hooks.server.js

const dataProvider = createPostgresDataProvider({
  connectionString: process.env["POSTGRES_URL"] || process.env["DATABASE_URL"],
  configuration: {
    ssl: Boolean(process.env["POSTGRES_URL"]),
  },
})
```

- Vercel sends the connection string using the `POSTGRES_URL` environment variable, other providers use the `DATABASE_URL` - this code supports them both.
- SSL is required with vercel - but not by the local `pg`, so we condition ssl based on the environment variable.

### Create a github repo

Vercel deploys automatically whenever you push to github, so the first step of deployment is to create a github repo and push all your changes to it.

### Create a vercel project

1. Create a vercel account if you don't already have one.
2. Goto [https://vercel.com/new](https://vercel.com/new)
3. Select your `github` repo and click `import`
4. Configure the project's name and in the `> Environment Variables` section, `NEXTAUTH_SECRET` environment variables
5. Click `Deploy`
6. Now we need to define the postgres database.
7. Wait for vercel to complete it's deployment
8. Click on `Continue to Dashboard`
9. Select the `Storage` tab
10. Create new Database and select Postgres
11. Accept the terms
12. Select region and click Create & continue
13. Click Connect
14. Click on Settings, Environment Variables and see that the `POSTGRES_URL` and other environment variables were added.
15. At the time of this article, vercel did not yet automatically redeploy once you configure a database, so in order to redeploy, click on the `Deployments` tab
16. 3 dots at the end of the deployment line and select `Redeploy` and click `Redeploy`
17. Once completed click on 'Visit'.

That's it - our application is deployed to production on vercel, play with it and enjoy.

Love Remult?&nbsp;<a href="https://github.com/remult/remult" target="_blank" rel="noopener"> Give our repo a star.⭐</a>
