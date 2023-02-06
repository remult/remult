# Live Query

Since next and vercel are truly server-less, we'll need to use a 3rd party provider for our live query implementation.

## Onetime Setup

1. ```sh
   npm i ably
   ```
2. Goto [ably.com](https://ably.com/) create a user and click on the "Create new app" button
3. Select a name and click `create app`
4. Click on the `API Keys` button on top.
5. Copy the first api key (with the many capabilities), create an entry in the `.env.local` file, name it `ABLY_API_KEY` and paste the api key there.

   ```
   ABLY_API_KEY=VpWfCA.FPUUDw:*******************************************
   ```

7) Adjust the `[...remult].ts` file to setup the subscription server
   //TODO - implement entity based live query storage
   //TODO - chase down the set all completed issue - that doesn't seem to update the state correctly without the fetch tasks
   //TODO - liveQueryStorage = new DataProviderLiveQueryStorage(dataProvider)

   ```ts{2-3,6-8}
   //...
   import ably from "ably"
   import { AblySubscriptionServer } from "remult/live-query/ably"

   export default remultNext({
     subscriptionServer: new AblySubscriptionServer(
       new ably.Realtime.Promise(process.env["ABLY_API_KEY"]!)
     )
     //...
   })
   ```

8) Copy the second api key (with only the `subscribe` capability) and Set the `subscriptionClient` on the frontend - we'll add a new useEffect for it (since in most cases it'll be elsewhere in the code)

   ```tsx{2-3,7-13}
   //...
   import ably from "ably"
   import { AblySubscriptionClient } from "remult/live-query/ably"

   export default function Home() {
     //...
     useEffect(() => {
       remult.apiClient.subscriptionClient = new AblySubscriptionClient(
         new ably.Realtime.Promise(
           "VpWfCA.cYWafw:fXnIBogAXL2Rnl3n0aI0-****************"
         )
       )
     }, [])
     //...
   }
   ```

## Use live Query

Now in the original `useEffect` we'll replace the call to `fetchTasks()` with a call to `liveQuery`

```tsx{4-10}
useEffect(() => {
  if (session.status === "unauthenticated") signIn()
  else {
    return taskRepo
      .liveQuery({
        orderBy: {
          completed: "asc"
        }
      })
      .subscribe(({ applyChanges }) => setTasks(applyChanges))
  }
}, [session])
```

Now that live query works, we can actually remove `fetchTasks` and all it's calls, since it'll automatically update from the live query

And we can also remove all the calls that waited for a reply from the backend to change the tasks state, since now it'll automatically update by the subscription
