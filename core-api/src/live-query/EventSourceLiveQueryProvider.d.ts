import { LiveQueryProvider, MessageHandler } from "./LiveQuery";
export declare class EventSourceLiveQueryProvider implements LiveQueryProvider {
    private wrapMessage?;
    constructor(wrapMessage?: (what: () => void) => void);
    openStreamAndReturnCloseFunction(clientId: string, onMessage: MessageHandler): Promise<VoidFunction>;
}
