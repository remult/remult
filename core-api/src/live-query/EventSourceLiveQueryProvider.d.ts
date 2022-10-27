import { LiveQueryProvider, PubSubClient } from "./LiveQuerySubscriber";
export declare class EventSourceLiveQueryProvider implements LiveQueryProvider {
    openStreamAndReturnCloseFunction(onReconnect: VoidFunction): Promise<PubSubClient>;
}
