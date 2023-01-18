import { SubscriptionClient, SubscriptionClientConnection } from "./SubscriptionChannel";
export declare class SseSubscriptionClient implements SubscriptionClient {
    openConnection(onReconnect: VoidFunction): Promise<SubscriptionClientConnection>;
}
