import { EntityOrderBy, Remult, Repository } from '../../index';
export declare const streamUrl = "stream";
export declare class LiveQuerySubscriber<entityType> {
    private repo;
    private query;
    queryChannel: string;
    subscribeCode: () => void;
    unsubscribe: VoidFunction;
    setAllItems(result: any[]): Promise<void>;
    forListeners(what: (listener: (((reducer: (prevState: entityType[]) => entityType[]) => void))) => void): void;
    handle(messages: liveQueryMessage[]): Promise<void>;
    defaultQueryState: entityType[];
    listeners: (((reducer: (prevState: entityType[]) => entityType[]) => void))[];
    constructor(repo: Repository<entityType>, query: SubscribeToQueryArgs<entityType>);
}
export declare type Unsubscribe = VoidFunction;
export interface SubClientConnection {
    subscribe(channel: string, onMessage: (message: any) => void): Unsubscribe;
    close(): void;
}
export interface SubClient {
    openConnection(onReconnect: VoidFunction): Promise<SubClientConnection>;
}
export declare class MessageChannel<T> {
    id: string;
    unsubscribe: VoidFunction;
    handle(message: T): Promise<void>;
    listeners: ((items: T) => void)[];
    constructor();
}
export declare type listener = (message: any) => void;
export declare const liveQueryKeepAliveRoute = "/_liveQueryKeepAlive";
export interface SubscribeToQueryArgs<entityType = any> {
    entityKey: string;
    orderBy?: EntityOrderBy<entityType>;
}
export declare type liveQueryMessage = {
    type: "all";
    data: any[];
} | {
    type: "add";
    data: any;
} | {
    type: 'replace';
    data: {
        oldId: any;
        item: any;
    };
} | {
    type: "remove";
    data: {
        id: any;
    };
};
export interface SubscribeResult {
    result: [];
    queryChannel: string;
}
export interface ServerEventChannelSubscribeDTO {
    clientId: string;
    channel: string;
}
export declare class AMessageChannel<messageType> {
    channelKey: string;
    constructor(channelKey: string);
    send(what: messageType, remult?: Remult): void;
    subscribe(onValue: (value: messageType) => void, remult?: Remult): VoidFunction;
}
