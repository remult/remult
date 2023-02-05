# Live Query

Since next and vercel are truly server-less, we'll need to use a 3rd party provider for our live query implementation.

## Onetime Setup

1. ```sh
   npm i ably
   ```
2. Goto [ably.com](https://ably.com/) create a user and click on the "Create new app" button
3. Select a name and click `create app`
4. Click on the `API Keys` button on top.
5. Create two entries in your `.env.local`, and place the first api key (with the many capabilities) on the `ABLY_PUBLISHER_API_KEY` and the second api key (with only the `Subscribe` capability) to the `ABLY_SUBSCRIBER_API_KEY`.

   ```
   ABLY_PUBLISHER_API_KEY=VpWfCA.FPUUDw:*******************************************
   ABLY_SUBSCRIBER_API_KEY=VpWfCA.cYWafw:*******************************************
   ```

6. Adjust the `[...remult].ts` file

   ```ts{2-3,5-8}
   //...
   import ably from "ably"
   import { AblySubscriptionServer } from "remult/live-query/ably"

   export default remultNext({
     subscriptionServer: new AblySubscriptionServer(
       new ably.Realtime.Promise(process.env["ABLY_PUBLISHER_API_KEY"]!)
     )
     //...
   })
   ```
