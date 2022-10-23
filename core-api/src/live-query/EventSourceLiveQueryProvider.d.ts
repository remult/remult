import { LiveQueryProvider, MessageHandler } from "./LiveQuerySubscriber";
export declare class EventSourceLiveQueryProvider implements LiveQueryProvider {
    private wrapMessage?;
    constructor(wrapMessage?: (what: () => void) => void);
    openStreamAndReturnCloseFunction(clientId: string, onMessage: MessageHandler): Promise<VoidFunction>;
}
