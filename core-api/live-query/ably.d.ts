import type * as Ably from 'ably';
import type { SubscriptionServer } from '../src/live-query/SubscriptionServer';
import type { SubscriptionClient, SubscriptionClientConnection } from '../src/live-query/SubscriptionClient';
export declare class AblySubscriptionClient implements SubscriptionClient {
    private ably;
    constructor(ably: Ably.Types.RealtimePromise);
    openConnection(onReconnect: VoidFunction): Promise<SubscriptionClientConnection>;
}
export declare class AblySubscriptionServer implements SubscriptionServer {
    private ably;
    constructor(ably: Ably.Types.RealtimePromise);
    publishMessage<T>(channel: string, message: T): void;
}
