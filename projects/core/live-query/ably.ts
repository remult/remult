import type * as Ably from 'ably';
import type { MessagePublisher } from '../src/live-query/LiveQueryPublisher';
import type { SubClient, SubClientConnection } from '../src/live-query/LiveQuerySubscriber';


export class AblyLiveQueryProvider implements SubClient {
  constructor(private ably: Ably.Types.RealtimePromise) { }
  async openConnection(onReconnect: VoidFunction): Promise<SubClientConnection> {
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

export class AblyServerEventDispatcher implements MessagePublisher {
  constructor(private ably: Ably.Types.RealtimePromise) { }
  sendChannelMessage<T>(channel: string, message: T): void {
    this.ably.channels.get(channel).publish({ data: message });
  }
}
