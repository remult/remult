import { itemChange, LiveQueryPublisherInterface } from '../context';
import { Repository, FindOptions } from '../remult3';
export declare class LiveQueryPublisher implements LiveQueryPublisherInterface {
    dispatcher: ServerEventDispatcher;
    constructor(dispatcher: ServerEventDispatcher);
    stopLiveQuery(id: any): void;
    sendChannelMessage<messageType>(channel: string, message: messageType): void;
    defineLiveQueryChannel(repo: Repository<any>, findOptions: FindOptions<any>, ids: any[], userId: string): string;
    queries: ({
        id: string;
        repo: Repository<any>;
        findOptions: FindOptions<any>;
        ids: any[];
    })[];
    runPromise(p: Promise<any>): void;
    itemChanged(entityKey: string, changes: itemChange[]): void;
}
export interface ServerEventDispatcher {
    sendChannelMessage<T>(channel: string, message: T): void;
}
