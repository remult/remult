import type * as Ably from '../../node_modules/ably';
import type { SubscriptionClient, SubscriptionClientConnection } from './src/live-query/SubscriptionChannel';
import type { SubscriptionServer } from './src/live-query/SubscriptionServer';
export declare class AblySubscriptionClient implements SubscriptionClient {
    private ably;
    constructor(ably: Ably.Types.RealtimePromise);
    openConnection(onReconnect: VoidFunction): Promise<SubscriptionClientConnection>;
}
export declare class AblySubscriptionServer implements SubscriptionServer {
    private ably;
    constructor(ably: Ably.Types.RestPromise);
    publishMessage<T>(channel: string, message: T): Promise<void>;
}
