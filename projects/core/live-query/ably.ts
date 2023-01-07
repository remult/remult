import type * as Ably from 'ably';
import type { SubscriptionServer } from '../src/live-query/SubscriptionServer';
import type { SubscriptionClient, SubscriptionClientConnection } from '../src/live-query/SubscriptionClient';


export class AblyLiveQueryProvider implements SubscriptionClient {
  constructor(private ably: Ably.Types.RealtimePromise) { }
  async openConnection(onReconnect: VoidFunction): Promise<SubscriptionClientConnection> {
    return {
      close: () => {
        this.ably.connection.close()
      },
      subscribe: (channel, handler) => {
        let myHandler = (y: Ably.Types.Message) => handler(y.data);
        this.ably.channels.get(channel).subscribe(y => myHandler(y));
        return () => { myHandler = () => { } };
      }
    }
  }
}

export class AblyServerEventDispatcher implements SubscriptionServer {
  constructor(private ably: Ably.Types.RealtimePromise) { }
  publishMessage<T>(channel: string, message: T): void {
    this.ably.channels.get(channel).publish({ data: message });
  }
}
