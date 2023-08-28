import type { SubscriptionClient, SubscriptionClientConnection } from './SubscriptionChannel';
export declare class SseSubscriptionClient implements SubscriptionClient {
    openConnection(onReconnect: VoidFunction): Promise<SubscriptionClientConnection>;
}
export declare const ConnectionNotFoundError = "client connection not found";
