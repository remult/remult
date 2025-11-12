# SubscriptionChannel
The `SubscriptionChannel` class is used to send messages from the backend to the frontend,
using the same mechanism used by live queries.


#### example:
```ts
// Defined in code that is shared between the frontend and the backend
export const notif = new SubscriptionChannel<{ coolInfo: string }>("notif");

// Backend: Publishing a message
notif.publish({ coolInfo: "Message coming from the backend" });

// Frontend: Subscribing to messages
notif.subscribe((message) => {
    console.log(`Something exciting happened: ${message.coolInfo}`);
});

// Note: If you want to publish from the frontend, use a BackendMethod for that.
```
 ---

 ### Use cases:

 #### A user _(Paul)_ wants to notify everyone _(Eric & Simona)_
 ```ts
 // shared code between the frontend and the backend
 export const notif = new SubscriptionChannel<{ from: UserInfo, msg: string }>("notif");

 // Frontend, Paul can call a BackendMethod to send his message
 NotificationContoller.send("Hello everyone!")

 // Backend
 export class NotificationContoller {
   @BackendMethod({ allowed: true })
   static async send(message: string) {
     notif.publish({ from: remult.user, msg: message });
   }
 }

 // Frontend: Eric & Simona can subscribe to messages
 notif.subscribe((message) => {
   if (message.from === remult.user) return;
   console.log(`Message from ${message.from.name}: ${message.msg}`);
 });
 ```

 #### A complexe chart that needs to be updated on multiple changes
 ```ts
 // shared code between the frontend and the backend
 export const chart = new SubscriptionChannel<{ kind: "pie" | "bar" | "line", data: number[] }>("chart");

 // Entity
 @Entity<Task>("tasks", {
   saved: async (e) => {
     if (e.completed) chart.publish({ kind: "pie", data: [1, 2, 3] });
   }
 })
 export class Task { ... }

 // Frontend: in the chart component, we can subscribe to messages
 chart.subscribe((message) => {
   console.log(`Chart updated: ${message.kind}`, message.data);
 });
 ```
## constructor
Constructs a new `SubscriptionChannel` instance.

Arguments:
* **channelKey** - The key that identifies the channel.
## channelKey
The key that identifies the channel.
## publish
Publishes a message to the channel. This method should only be used on the backend.

Arguments:
* **message** - The message to be published.
* **remult** - An optional instance of Remult to use for publishing the message.
## subscribe
Subscribes to messages from the channel. This method should only be used on the frontend.


#### returns:
A promise that resolves to a function that can be used to unsubscribe from the channel.

Arguments:
* **next** - A function that will be called with each message received.
* **remult** - An optional instance of Remult to use for the subscription.
