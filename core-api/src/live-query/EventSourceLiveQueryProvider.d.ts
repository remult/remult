import { SubscriptionClient, SubscriptionClientConnection } from "./LiveQuerySubscriber";
export declare class EventSourceSubClient implements SubscriptionClient {
    openConnection(onReconnect: VoidFunction): Promise<SubscriptionClientConnection>;
}
