import { Remult } from '../..';
import { Repository, EntityRef, FindOptions } from '../remult3';
import { LiveQueryProvider } from '../data-api';
export declare class LiveQueryPublisher implements LiveQueryProvider {
    private dispatcher;
    constructor(dispatcher: ServerEventDispatcher);
    subscribe(repo: Repository<any>, findOptions: FindOptions<any>, remult: Remult, ids: any[]): string;
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
