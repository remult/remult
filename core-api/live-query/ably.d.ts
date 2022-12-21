import type * as Ably from 'ably';
import type { MessagePublisher } from '../src/live-query/LiveQueryPublisher';
import type { SubClient, SubClientConnection } from '../src/live-query/LiveQuerySubscriber';
export declare class AblyLiveQueryProvider implements SubClient {
    private ably;
    constructor(ably: Ably.Types.RealtimePromise);
    openConnection(onReconnect: VoidFunction): Promise<SubClientConnection>;
}
export declare class AblyServerEventDispatcher implements MessagePublisher {
    private ably;
    constructor(ably: Ably.Types.RealtimePromise);
    sendChannelMessage<T>(channel: string, message: T): void;
}
