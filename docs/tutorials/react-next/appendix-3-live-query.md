# Live Query

Since next and vercel are truly server-less, we'll need to use a 3rd party provider for our live query implementation.

## Onetime Setup

1. ```sh
   npm i ably
   ```
2. Goto [ably.com](https://ably.com/) create a user and click on the "Create new app" button
3. Select a name and click `create app`
4. Click on the `API Keys` button on top.
5. Copy the api key (with the many capabilities), create a key in the `.env.local` file, name `ABLY_API_KEY` and paste the api key there.

   ```
   ABLY_API_KEY=VpWfCA.FPUUDw:*******************************************
   ```

6. In the `shared` folder create a file called `AblyController.ts` with the following code:
   _src/shared/AblyController.ts_

   ```ts
   import ably from "ably"
   import { BackendMethod } from "remult"
   import {
     AblySubscriptionClient,
     AblySubscriptionServer
   } from "remult/live-query/ably"

   const ablyServer = () =>
     new ably.Realtime.Promise(process.env["ABLY_API_KEY"]!)

   export function getAblySubscriptionServer() {
     return new AblySubscriptionServer(ablyServer())
   }

   export function getAblySubscriptionClient() {
     return new AblySubscriptionClient(
       new ably.Realtime.Promise({
         authCallback: async (data, callback) => {
           try {
             callback(null, await AblyController.getAblySubscriptionToken())
           } catch (err) {
             callback(err, null)
           }
         }
       })
     )
   }

   export class AblyController {
     @BackendMethod({ allowed: true })
     static async getAblySubscriptionToken() {
       return ablyServer().auth.createTokenRequest({
         capability: {
           "*": ["subscribe"]
         }
       })
     }
   }
   ```

   - The `getAblySubscriptionServer` function will be used on the `server`
   - The `getAblySubscriptionClient` function will be used on the front end, and will call the `getAblySubscriptionToken` to get a valid token for the current user.
     You can restrict the user's access by adjust the `capabilities` option sent to the `createThenRequest`

7) Adjust the `[...remult].ts` file
   //TODO - implement entity based live query storage
   //TODO - chase down the set all completed issue - that doesn't seem to update the state correctly without the fetch tasks

   ```ts{2-5,8}
   //...
   import {
     AblyController,
     getAblySubscriptionServer
   } from "../../shared/AblyController"

   export default remultNext({
     subscriptionServer: getAblySubscriptionServer(),
     controllers: [TasksController, AblyController],
     entities: [Task],
     getUser: getUserFromNextAuth,
     dataProvider: createPostgresConnection()
   })
   ```

8) Set the `subscriptionClient` on the frontend - we'll ad a new useEffect for it (since in most cases it'll be elsewhere in the code)
   ```tsx
   import { getAblySubscriptionClient } from "../shared/AblyController"
   //...
   useEffect(() => {
     remult.apiClient.subscriptionClient = getAblySubscriptionClient()
   }, [])
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
