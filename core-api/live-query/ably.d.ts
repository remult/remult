import type * as Ably from 'ably';
import type { ServerEventDispatcher } from '../src/live-query/LiveQueryPublisher';
import type { LiveQueryProvider, PubSubClient } from '../src/live-query/LiveQuerySubscriber';
export declare class AblyLiveQueryProvider implements LiveQueryProvider {
    private ably;
    constructor(ably: Ably.Types.RealtimePromise);
    openStreamAndReturnCloseFunction(onReconnect: VoidFunction): Promise<PubSubClient>;
}
export declare class AblyServerEventDispatcher implements ServerEventDispatcher {
    private ably;
    constructor(ably: Ably.Types.RealtimePromise);
    sendChannelMessage<T>(channel: string, message: T): void;
}
