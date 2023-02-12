import type * as Ably from 'ably';
import type { SubscriptionServer } from '../src/live-query/SubscriptionServer';
import type { SubscriptionClient, SubscriptionClientConnection } from '../src/live-query/SubscriptionChannel';


export class AblySubscriptionClient implements SubscriptionClient {
  constructor(private ably: Ably.Types.RealtimePromise) { }
  async openConnection(onReconnect: VoidFunction): Promise<SubscriptionClientConnection> {
    return {
      close: () => {
        this.ably.connection.close()
      },
      subscribe: async (channel, handler) => {
        let myHandler = (y: Ably.Types.Message) => handler(y.data);
        await this.ably.channels.get(channel).subscribe(y => myHandler(y));
        return () => {
          myHandler = () => { }
          this.ably.channels.get(channel).unsubscribe()
        };
      }
    }
  }
}

export class AblySubscriptionServer implements SubscriptionServer {
  constructor(private ably: Ably.Types.RealtimePromise) { }
  publishMessage<T>(channel: string, message: T): void {
    this.ably.channels.get(channel).publish({ data: message });
  }
}
