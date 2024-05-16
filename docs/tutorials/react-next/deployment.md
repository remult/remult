# Deployment

You can deploy the application to a standard node.js server, or a server-less server.

We'll review both options.

## Deploy to a node.js server

Let's deploy the todo app to [railway.app](https://railway.app/).

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

### LiveQuery Serverless Support

Any `serverless` platform can't be used to maintain an active subscription channel for our live query, we'll need to use a 3rd party provider for that.

If you're not using `liveQuery` you can skip to the next step.

In this demo, we'll use [ably.com](https://ably.com/)
Follow these steps only if you want to use `liveQuery` in the app

1. ```sh
   npm i ably
   ```
2. Goto [ably.com](https://ably.com/) create a user and click on the "Create new app" button
3. Select a name and click `create app`
4. Click on the `API Keys` button on top.
5. Copy the first api key (with the many capabilities), create an entry in the `.env.local` file, name it `ABLY_API_KEY` and paste the api key there.
6. Configure `ably` as the `subscriptionServer`

   ```ts{4-5,8-10}
   // src/api.ts

   //...
   import ably from "ably/promises"
   import { AblySubscriptionServer } from "remult/ably"

   const api = remultNextApp({
     subscriptionServer: new AblySubscriptionServer(
       new ably.Rest(process.env["ABLY_API_KEY"]!)
     )
     //...
   })
   ```

7. Next, we'll need to create a route that `ably`'s client on the front-end will use to get a `token` for a user that wants to subscribe to a channel - in the `src/app/api` folder, createa folder called `getAblyToken` and in it create a file called `route.ts`

   ```ts
   // src/app/api/getAblyToken/route.ts

   import ably from 'ably/promises'
   import { NextResponse } from 'next/server'

   export async function POST() {
     const token = await new ably.Rest(
       process.env['ABLY_API_KEY']!,
     ).auth.createTokenRequest({ capability: { '*': ['subscribe'] } })
     return NextResponse.json(token)
   }
   ```

8) Configure the `front-end` to use ably as it's `subscriptionClient` by adding a new `useEffect` hook and configure `ably` to use the `api/getAblyToken` route we've created as it's `authUrl` - we'll that in the `Auth` component

   ```tsx{3-4,12-15}
   // src/components/auth.tsx

   import ably from "ably/promises"
   import { AblySubscriptionClient } from "remult/ably"

   export default function Auth() {
     const session = useSession()
     remult.user = session.data?.user as UserInfo

     useEffect(() => {
       if (session.status === "unauthenticated") signIn()
       else if (session.status === "authenticated")
         remult.apiClient.subscriptionClient = new AblySubscriptionClient(
           new ably.Realtime({ authUrl: "/api/getAblyToken", authMethod: "POST" })
         )
     }, [session])
   ```

9) Configure `remultNextApp` to store live-queries in the `dataProvider`

   ```ts{4,6,8-9}
   // src/api.ts

   //...
   import { DataProviderLiveQueryStorage } from "remult/server"

   const dataProvider = createPostgresDataProvider()
   const api = remultNextApp({
     dataProvider,
     liveQueryStorage: new DataProviderLiveQueryStorage(dataProvider)
     //...
   })
   ```

Let's deploy the todo app to [vercel](https://vercel.com/).

### Postgres

We'll use vercel's postgres as out database, and that requires the following changes to the `createPostgresDataProvider` options.

```ts{4-7}
// src/api.ts

const dataProvider = createPostgresDataProvider({
  connectionString: process.env["POSTGRES_URL"] || process.env["DATABASE_URL"],
  configuration: {
    ssl: Boolean(process.env["POSTGRES_URL"]),
  },
})
```

- Vercel sends the connection string using the `POSTGRES_URL` environment variable, other providers use the `DATABASE_URL` - this code supports them both.
- Ssl is required with vercel - by my local pg doesn't, so we condition ssl based on the environment variable.

### Create a github repo

Vercel deploys automatically whenever you push to github, so the first step of deployment is to create a github repo and push all your changes to it.

### Create a vercel project

1. Create a vercel account if you don't already have one.
2. Goto [https://vercel.com/new](https://vercel.com/new)
3. Select your `github` repo and click `import`
4. Configure the project's name and in the `> Environment Variables` section, `NEXTAUTH_SECRET` and `ABLY_API_KEY` environment variables
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

[Code at this stage](https://github.com/noam-honig/remult-nextjs-app-router-todo)

To see a larger more complex code base, visit our [CRM example project](https://www.github.com/remult/crm-demo)

Love Remult?&nbsp;<a href="https://github.com/remult/remult" target="_blank" rel="noopener"> Give our repo a star.⭐</a>
