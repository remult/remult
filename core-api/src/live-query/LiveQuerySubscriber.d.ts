import { EntityOrderBy, FindOptions, Remult, Repository, RestDataProviderHttpProvider } from '../../index';
import { Allowed } from '../context';
import { ServerEventDispatcher } from './LiveQueryPublisher';
export declare const streamUrl = "stream1";
export interface PubSubClient {
    subscribe(channel: string): VoidFunction;
    disconnect(): void;
}
export interface LiveQueryProvider {
    openStreamAndReturnCloseFunction(onMessage: MessageHandler, onReconnect: VoidFunction): Promise<PubSubClient>;
}
export declare type MessageHandler = (message: {
    data: any;
    channel: string;
}) => void;
export declare class LiveQueryClient {
    lqp: LiveQueryProvider;
    private provider?;
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
    id: string;
}
export interface ServerEventChannelSubscribeDTO {
    clientId: string;
    channel: string;
    remove: boolean;
}
export declare class AMessageChannel<messageType> {
    private subscribedAllowed;
    userCanSubscribe(channel: string, remult: Remult): boolean;
    private key;
    constructor(key: (string | ((remult: Remult) => string)), subscribedAllowed: Allowed);
    send(what: messageType, remult?: Remult): void;
    subscribe(client: LiveQueryClient, onValue: (value: messageType) => void, remult?: Remult): void;
    dispatcher: ServerEventDispatcher;
}
