import { LiveQueryProvider, MessageHandler, PubSubClient } from "./LiveQuerySubscriber";
export declare class EventSourceLiveQueryProvider implements LiveQueryProvider {
    private wrapMessage?;
    constructor(wrapMessage?: (what: () => void) => void);
    openStreamAndReturnCloseFunction(onMessage: MessageHandler, onReconnect: VoidFunction): Promise<PubSubClient>;
}
