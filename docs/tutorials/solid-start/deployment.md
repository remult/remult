# Deployment

Let's deploy the todo app to [railway.app](https://railway.app/).

## Prepare for Production

Modify the highlighted code in the `src/api.ts` to prefer a `connectionString` provided by the production host's `DATABASE_URL` environment variable.

```ts{4,6-8}
// src/api.ts

//...
const DATABASE_URL = process.env["DATABASE_URL"];
export const api = remultApi({
 dataProvider: DATABASE_URL
   ? createPostgresDataProvider({ connectionString: DATABASE_URL })
   : undefined,
   //...
 })
```

::: warning Note
In order to connect to a local PostgresDB, add `DATABASE_URL` to an .env file, or simply replace `process.env["DATABASE_URL"]` with your `connectionString`.

If no `DATABASE_URL` has found, it'll fallback to our local JSON files.
:::

## Test Locally

To test the application locally run

```sh
npm run build
npm run start
```

Now navigate to http://localhost:3000 and test the application locally

## Deploy to Railway

In order to deploy the todo app to [railway](https://railway.app/) you'll need a `railway` account. You'll also need [Railway CLI](https://docs.railway.app/develop/cli#npm) installed, and you'll need to login to railway from the cli, using `railway login`.

Click enter multiple times to answer all its questions with the default answer

1. Create a Railway `project`.

   From the terminal in your project folder run:

   ```sh
   railway init
   ```

2. Select `Empty Project`
3. Set a project name.
4. Open the project on `railway` using:
   ```sh
   railway open
   ```
5. Click the `Add Service` and add:
   - a Postgres Database
   - an Empty service
6. Once that's done run the following command to upload the project to railway:
   ```sh
   railway up
   ```
   And select the empty service name that was just created to upload the source code to it.
7. Once completed, go back to the railway UI in the browser and select the created service (not the database)
8. Switch to the `variables` tab
9. Click on `+ New Variable`, and in the `VARIABLE_NAME` click `Add Reference` and select `DATABASE_URL`
10. Add another variable called `SESSION_SECRET` and set it to a random string, you can use an [online UUID generator](https://www.uuidgenerator.net/)
11. Switch to the `settings` tab
12. Under `Environment` click on `Generate Domain`
13. Click the `deploy` button to deploy the changes, and wait for the deployment to complete
14. Click on the newly generated url to open the app in the browser and you'll see the app live in production. (it may take a few minutes to go live)

::: warning Note
If you run into trouble deploying the app to Railway, try using Railway's [documentation](https://docs.railway.app/deploy/deployments).
:::

That's it - our application is deployed to production, play with it and enjoy.

To see a larger more complex code base, visit our [CRM example project](https://www.github.com/remult/crm-demo)

Love Remult?&nbsp;<a href="https://github.com/remult/remult" target="_blank" rel="noopener"> Give our repo a star.⭐</a>
