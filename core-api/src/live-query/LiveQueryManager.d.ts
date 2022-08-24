import { Remult } from '../..';
import { Repository, EntityRef, FindOptions } from '../remult3';
import { LiveQueryProvider } from '../data-api';
import { liveQueryMessage } from './LiveQuery';
import { clientInfo, ServerEventsController } from '../../server/expressBridge';
export declare class LiveQueryManager implements LiveQueryProvider {
    subscribe(repo: Repository<any>, clientId: string, options: FindOptions<any>, remult: Remult): string;
    clients: clientInfo[];
    server: ServerEventsController;
    sendMessage(key: string, m: liveQueryMessage): void;
    hasListeners(ref: EntityRef<any>): boolean;
    saved(ref: EntityRef<any>): void;
    deleted(ref: EntityRef<any>): void;
}
