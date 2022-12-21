import { FindOptions, Repository } from "./remult3";
import { LiveQueryPublisher } from "./live-query/LiveQueryPublisher";
import { itemChange } from "./context";
export declare class transactionLiveQueryPublisher implements LiveQueryPublisher {
    private orig;
    constructor(orig: LiveQueryPublisher);
    runPromise(p: Promise<any>): void;
    debugFileSaver: (x: any) => void;
    stopLiveQuery(id: any): void;
    transactionItems: Map<string, itemChange[]>;
    itemChanged(entityKey: string, changes: itemChange[]): void;
    flush(): void;
    sendChannelMessage<messageType>(channel: string, message: messageType): void;
    defineLiveQueryChannel(serializeRequest: () => any, entityKey: string, options: FindOptions<any>, ids: any[], userId: string, repo: Repository<any>): string;
}
