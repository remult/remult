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
13. Add another variable called `AUTH_SECRET` and set it to a random string, you can use an [online UUID generator](https://www.uuidgenerator.net/)
14. Add another variable called `NEXTAUTH_URL` and set it to the `generated url` which was created on step 10.
15. Wait for railway to finish deploying your changes and Click on the newly generated url to open the app in the browser and you'll see the app live in production. (it may take a few minutes to go live)

::: warning Note
If you run into trouble deploying the app to Railway, try using Railway's [documentation](https://docs.railway.app/deploy/deployments).
:::

That's it - our application is deployed to production, on a node js server

<hr />
Love Remult?&nbsp;<a href="https://github.com/remult/remult" target="_blank" rel="noopener"> Give our repo a star.⭐</a>
