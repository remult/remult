import { Remult } from '../../index';
export declare const streamUrl = "stream";
export interface SubscriptionListener<type> {
    next(message: type): void;
    error(err: any): void;
    complete(): void;
}
export declare type Unsubscribe = VoidFunction;
export interface SubscriptionClientConnection {
    subscribe(channel: string, onMessage: (message: any) => void, onError: (err: any) => void): Promise<Unsubscribe>;
    close(): void;
}
export interface SubscriptionClient {
    openConnection(onReconnect: VoidFunction): Promise<SubscriptionClientConnection>;
}
export declare const liveQueryKeepAliveRoute = "_liveQueryKeepAlive";
export declare type LiveQueryChange = {
    type: 'all';
    data: any[];
} | {
    type: 'add';
    data: any;
} | {
    type: 'replace';
    data: {
        oldId: any;
        item: any;
    };
} | {
    type: 'remove';
    data: {
        id: any;
    };
};
export declare class SubscriptionChannel<messageType> {
    channelKey: string;
    constructor(channelKey: string);
    publish(message: messageType, remult?: Remult): void;
    subscribe(next: (message: messageType) => void, remult?: Remult): Promise<Unsubscribe>;
    subscribe(listener: Partial<SubscriptionListener<messageType>>): Promise<Unsubscribe>;
}
