import { FindOptions, Repository, RestDataProviderHttpProvider } from '../../index';
import { SubClientConnection, Unsubscribe } from './LiveQuerySubscriber';
import type { ApiClient } from '../../index';
export declare class LiveQueryClient {
    private apiProvider;
    wrapMessageHandling(handleMessage: any): void;
    private queries;
    private channels;
    constructor(apiProvider: () => ApiClient);
    runPromise(p: Promise<any>): Promise<any>;
    close(): void;
    subscribeChannel<T>(key: string, onResult: (item: T) => void): Unsubscribe;
    timeoutToCloseWhenNotClosed: number;
    private closeIfNoListeners;
    subscribe<entityType>(repo: Repository<entityType>, options: FindOptions<entityType>, onResult: (reducer: (prevState: entityType[]) => entityType[]) => void): () => void;
    client: Promise<SubClientConnection>;
    interval: any;
    get provider(): RestDataProviderHttpProvider | import("../data-providers/rest-data-provider").RestDataProviderHttpProviderUsingFetch;
    private openIfNoOpened;
}
