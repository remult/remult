import { EntityOrderBy, FindOptions, Remult, Repository, RestDataProviderHttpProvider } from '../../index';
export declare const streamUrl = "stream";
export interface PubSubClient {
    subscribe(channel: string, handler: (value: any) => void): VoidFunction;
    disconnect(): void;
}
export interface LiveQueryProvider {
    openStreamAndReturnCloseFunction(onReconnect: VoidFunction): Promise<PubSubClient>;
}
export declare class LiveQueryClient {
    lqp: LiveQueryProvider;
    private provider?;
    wrapMessageHandling: (handleMessage: any) => any;
    private queries;
    private channels;
    constructor(lqp: LiveQueryProvider, provider?: RestDataProviderHttpProvider);
    runPromise(p: Promise<any>): Promise<any>;
    close(): void;
    subscribeChannel<T>(key: string, onResult: (item: T) => void): () => void;
    private closeIfNoListeners;
    subscribe<entityType>(repo: Repository<entityType>, options: FindOptions<entityType>, onResult: (reducer: (prevState: entityType[]) => entityType[]) => void): () => void;
    client: Promise<PubSubClient>;
    private openIfNoOpened;
}
export declare type listener = (message: any) => void;
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
    remove: boolean;
}
export declare class AMessageChannel<messageType> {
    channelKey: string;
    constructor(channelKey: string);
    send(what: messageType, remult?: Remult): void;
    subscribe(onValue: (value: messageType) => void, remult?: Remult): void;
}
