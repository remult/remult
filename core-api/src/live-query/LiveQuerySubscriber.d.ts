import { EntityOrderBy, Remult, Repository } from '../../index';
import { LiveQuerySubscribeResult } from '../remult3';
export declare const streamUrl = "stream";
export declare class LiveQuerySubscriber<entityType> {
    private repo;
    private query;
    sendDefaultState(onResult: (reducer: (prevState: entityType[]) => entityType[]) => void): void;
    queryChannel: string;
    subscribeCode: () => void;
    unsubscribe: VoidFunction;
    setAllItems(result: any[]): Promise<void>;
    private allItemsMessage;
    forListeners(what: (listener: (((reducer: (prevState: entityType[]) => entityType[]) => void))) => void, changes: liveQueryMessage[]): void;
    private createReducerType;
    handle(messages: liveQueryMessage[]): Promise<void>;
    defaultQueryState: entityType[];
    listeners: (((reducer: LiveQuerySubscribeResult<entityType>) => void))[];
    constructor(repo: Repository<entityType>, query: SubscribeToQueryArgs<entityType>);
}
export declare type Unsubscribe = VoidFunction;
export interface SubscriptionClientConnection {
    subscribe(channel: string, onMessage: (message: any) => void): Unsubscribe;
    close(): void;
}
export interface SubscriptionClient {
    openConnection(onReconnect: VoidFunction): Promise<SubscriptionClientConnection>;
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
