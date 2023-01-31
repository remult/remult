# Deployment

Let's deploy the todo app to [Railway](https://railway.app/).

## Database connection string

Modify the highlighted code in the api server module to get the postgres connection string from the `DATABASE_URL` environment variable.

_src/server/api.ts_

```ts{5-8}
//...

export const api = remultNext({
  //...
  dataProvider: createPostgresConnection({
    connectionString: process.env["DATABASE_URL"] || "your connection string",
  }),
  //...
});
```

## Deploy to Railway

In order to deploy the todo app to [railway](https://railway.app/) you'll need a `railway` account. You'll also need [Railway CLI](https://docs.railway.app/develop/cli#npm) installed, and you'll need to login to railway from the cli, using `railway login`.

1. Modify the project's `start` npm script to bind the `$PORT` to the port assigned by railway.

_package.json_

```json
"start": "next start -p $PORT"
```

2. Create a Railway `project`.

From the terminal in your project folder run:
```sh
railway init
```
3. Select `Empty Project`
4. Set a project name.
5. Once it's done add a database by running the following command:
   ```sh
   railway add
   ```
6. Select `postgressql` as the database.
7. Once that's done run the following command to upload the project to railway:
   ```sh
   railway up
   ```
8. After it completes the build, let's define a domain for it:
   1. got to the `railway` project's site and click on the project:
   2. Select settings
   3. Under `Environment` click on `Generate Domain`
   4. Copy the newly generated domain .
   5. Switch to the `variables` tab
   6. Add a new variable called `NEXTAUTH_URL` and set it the the newly generated domain you copied on step 4.
   7. Add another variable called `NEXTAUTH_SECRET` and set it to a random string, you can use an [online UUID generator](https://www.uuidgenerator.net/)
   8. Wait for railway to complete the build and deployment
   9. Open the newly generated domain in the browser and you'll see the app live in production. (it may take a few minutes to go live)

::: warning Note
If you run into trouble deploying the app to Railway, try using Railway's [documentationhttps://docs.railway.app/deploy/deployments).
:::

That's it - our application is deployed to production, play with it and enjoy.

To see a larger more complex code base, visit our [CRM example project](https://www.github.com/remult/crm-demo)

Love Remult?&nbsp;<a href="https://github.com/remult/remult" target="_blank" rel="noopener"> Give our repo a star.⭐</a>
