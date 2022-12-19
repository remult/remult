import { FindOptions, Repository, RestDataProviderHttpProvider } from '../../index';
import { LiveQueryProvider, PubSubClient } from './LiveQuerySubscriber';
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
    timeoutToCloseWhenNotClosed: number;
    private closeIfNoListeners;
    subscribe<entityType>(repo: Repository<entityType>, options: FindOptions<entityType>, onResult: (reducer: (prevState: entityType[]) => entityType[]) => void): () => void;
    client: Promise<PubSubClient>;
    interval: any;
    private openIfNoOpened;
}
