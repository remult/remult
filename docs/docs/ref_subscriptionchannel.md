# SubscriptionChannel
The `SubscriptionChannel` class is used to send messages from the backend to the frontend,
using the same mechanism used by live queries.


#### example:
```ts
// Defined in code that is shared between the frontend and the backend
const statusChange = new SubscriptionChannel<{ oldStatus: number, newStatus: number }>("statusChange");

// Backend: Publishing a message
statusChange.publish({ oldStatus: 1, newStatus: 2 });

// Frontend: Subscribing to messages
statusChange.subscribe((message) => {
    console.log(`Status changed from ${message.oldStatus} to ${message.newStatus}`);
});

// Note: If you want to publish from the frontend, use a BackendMethod for that.
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
