import { LiveQueryProvider, PubSubClient } from "./LiveQuerySubscriber";
export declare class EventSourceLiveQueryProvider implements LiveQueryProvider {
    static wrapMessageHandling: (handleMessage: any) => any;
    openStreamAndReturnCloseFunction(onReconnect: VoidFunction): Promise<PubSubClient>;
}
