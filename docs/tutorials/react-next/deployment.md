# Deployment

Let's deploy the todo app to [Heroku](https://www.heroku.com/).

## Connect to Heroku Postgres

Modify the highlighted code in the api server module to only use `Postgres` in production, and keep using the simple JSON db in our dev environment.

*src/server/api.ts*
```ts{5-8}
//...

export const api = createRemultServer({
    //...
    dataProvider: process.env["NODE_ENV"] === "production" ?
        createPostgresConnection({
            configuration: "heroku"
        }) : undefined,
    //...
});
```

The `{ configuration: "heroku" }` argument passed to Remult's `createPostgresConnection()` tells Remult to use the `DATABASE_URL` environment variable as the `connectionString` for Postgres. (See [Heroku documentation](https://devcenter.heroku.com/articles/connecting-heroku-postgres#connecting-in-node-js).)

In development, the `dataProvider` function returns `undefined`, causing Remult to continue to use the default JSON-file database.

## Deploy to Heroku

In order to deploy the todo app to [heroku](https://www.heroku.com/) you'll need a `heroku` account. You'll also need [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#download-and-install) installed.

1. Modify the project's `start` npm script to bind the `$PORT` to the port assigned by heroku.

*package.json*
```json
"start": "next start -p $PORT"
```

2. Create a Heroku `app`.

```sh
heroku create
```

3. Set the jwt authentication to something random - you can use an [online UUID generator](https://www.uuidgenerator.net/).

```sh
heroku config:set NEXTAUTH_SECRET=random-secret
```

4. Provision a dev postgres database on Heroku.

```sh
heroku addons:create heroku-postgresql:hobby-dev
```

5. Commit the changes to git and deploy to Heroku using `git push`.

```sh
git add .
git commit -m "todo app tutorial"
git push heroku main
```

6. Open the deployed app using `heroku apps:open` command.

```sh
heroku apps:open
```

::: warning Note
If you run into trouble deploying the app to Heroku, try using Heroku's [documentation](https://devcenter.heroku.com/articles/git).
:::

That's it - our application is deployed to production, play with it and enjoy.

To see a larger more complex code base, visit our [CRM example project](https://www.github.com/remult/crm-demo)

Love Remult?&nbsp;<a href="https://github.com/remult/remult" target="_blank" rel="noopener"> Give our repo a star.⭐</a>