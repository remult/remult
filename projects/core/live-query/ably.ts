import type * as Ably from 'ably';
import { ServerEventDispatcher } from '../src/live-query/LiveQueryPublisher';
import { LiveQueryProvider, PubSubClient } from '../src/live-query/LiveQuerySubscriber';


export class AblyLiveQueryProvider implements LiveQueryProvider {
  constructor(private ably: Ably.Types.RealtimePromise) { }
  async openStreamAndReturnCloseFunction(onReconnect: VoidFunction): Promise<PubSubClient> {
    return {
      disconnect: () => {
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

export class AblyServerEventDispatcher implements ServerEventDispatcher {
  constructor(private ably: Ably.Types.RealtimePromise) { }
  async anyoneListensToChannel(channel: string): Promise<boolean> {
    console.log((await (await this.ably.channels.get(channel).presence.history()).current()).items)
    
    return true;
    return (await this.ably.channels.get(channel).presence.get()).length > 0;
  }
  sendChannelMessage<T>(channel: string, message: T): void {
    this.ably.channels.get(channel).publish({ data: message });
  }
}
