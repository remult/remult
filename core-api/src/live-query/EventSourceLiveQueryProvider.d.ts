import { SubscriptionClient, SubscriptionClientConnection } from "./LiveQuerySubscriber";
export declare class SseSubscriptionClient implements SubscriptionClient {
    openConnection(onReconnect: VoidFunction): Promise<SubscriptionClientConnection>;
}
