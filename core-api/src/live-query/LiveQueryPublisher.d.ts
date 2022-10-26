import { Remult } from '../..';
import { LiveQueryPublisherInterface } from '../context';
import { Repository, EntityRef, FindOptions } from '../remult3';
export declare class LiveQueryPublisher implements LiveQueryPublisherInterface {
    private dispatcher;
    constructor(dispatcher: ServerEventDispatcher);
    defineLiveQueryChannel(repo: Repository<any>, findOptions: FindOptions<any>, remult: Remult, ids: any[]): string;
    queries: ({
        id: string;
        repo: Repository<any>;
        findOptions: FindOptions<any>;
        ids: any[];
    })[];
    runPromise(p: Promise<any>): void;
    saved(ref: EntityRef<any>): void;
    deleted(ref: EntityRef<any>): void;
}
export interface ServerEventDispatcher {
    sendChannelMessage<T>(channel: string, message: T): void;
}
