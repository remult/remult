# Deployment

Let's deploy the todo app to [vercel](https://vercel.com/).

## LiveQuery Serverless Support

Vercel is a `serverless` platform, as such we can't use it to maintain an active subscription channel for our live query, and we'll need to use a 3rd party provider for that.

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

   _src/api/[...remult].ts_

   ```ts{2-3,6-8}
   //...
   import ably from "ably/promises"
   import { AblySubscriptionServer } from "remult/live-query/ably"

   export default remultNext({
     subscriptionServer: new AblySubscriptionServer(
       new ably.Realtime(process.env["ABLY_API_KEY"]!)
     )
     //...
   })
   ```

7. Next, we'll need to create a route that `ably`'s client on the front-end will use to get a `token` for a user that wants to subscribe to a channel - in the `src/pages/api` folder, create a file called `getAblyToken.ts`

   _src/pages/api/getAblyToken.ts_

   ```ts
   import { NextApiRequest, NextApiResponse } from "next"
   import ably from "ably/promises"

   export default async function handler(
     req: NextApiRequest,
     res: NextApiResponse
   ) {
     const token = await new ably.Realtime(
       process.env["ABLY_API_KEY"]!
     ).auth.createTokenRequest({
       capability: {
         "*": ["subscribe"]
       }
     })
     res.status(200).json(token)
   }
   ```

8) Configure the `front-end` to use ably as it's `subscriptionClient` by adding a new `useEffect` hook and configure `ably` to use the `api/getAblyToken` route we've created as it's `authUrl`

   _src/pages/index.tsx_

   ```tsx
   import ably from "ably/promises"
   import { AblySubscriptionClient } from "remult/live-query/ably"
   //...
   const session = useSession()
   useEffect(() => {
     remult.apiClient.subscriptionClient = new AblySubscriptionClient(
       new ably.Realtime({ authUrl: "/api/getAblyToken" })
     )
   }, [])
   ```

9) Configure `remultNext` to store live-queries in the `dataProvider`

   _src/api/[...remult].ts_

   ```ts{2,4,6-7}
   //...
   import { DataProviderLiveQueryStorage } from "remult/live-query/data-provider-live-query-storage"

   const dataProvider = createPostgresConnection()
   export default remultNext({
     dataProvider,
     liveQueryStorage: new DataProviderLiveQueryStorage(dataProvider)
     //...
   })
   ```

## Create a github repo

Vercel deploys automatically whenever you push to github, so the first step of deployment is to create a github repo and push all your changes to it.

## Create a vercel project

1. Create a vercel account if you don't already have one.
2. Goto [https://vercel.com/new](https://vercel.com/new)
3. Select your `github` repo and click `import`
4. Configure the project's name and in the `> Environment Variables` section, set the `DATABASE_URL`, `NEXTAUTH_SECRET` and `ABLY_API_KEY` environment variables
5. Click `Deploy`

That's it - our application is deployed to production, play with it and enjoy.

To see a larger more complex code base, visit our [CRM example project](https://www.github.com/remult/crm-demo)

Love Remult?&nbsp;<a href="https://github.com/remult/remult" target="_blank" rel="noopener"> Give our repo a star.⭐</a>
