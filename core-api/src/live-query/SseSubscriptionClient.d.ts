import { SubscriptionClient, SubscriptionClientConnection } from "./SubscriptionClient";
export declare class SseSubscriptionClient implements SubscriptionClient {
    openConnection(onReconnect: VoidFunction): Promise<SubscriptionClientConnection>;
}
