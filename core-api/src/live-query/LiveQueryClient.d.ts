import { FindOptions, Repository, RestDataProviderHttpProvider } from '../../index';
import { SubClient, SubClientConnection, Unsubscribe } from './LiveQuerySubscriber';
export declare class LiveQueryClient {
    lqp: SubClient;
    private provider?;
    wrapMessageHandling: (handleMessage: any) => any;
    private queries;
    private channels;
    constructor(lqp: SubClient, provider?: RestDataProviderHttpProvider);
    runPromise(p: Promise<any>): Promise<any>;
    close(): void;
    subscribeChannel<T>(key: string, onResult: (item: T) => void): Unsubscribe;
    timeoutToCloseWhenNotClosed: number;
    private closeIfNoListeners;
    subscribe<entityType>(repo: Repository<entityType>, options: FindOptions<entityType>, onResult: (reducer: (prevState: entityType[]) => entityType[]) => void): () => void;
    client: Promise<SubClientConnection>;
    interval: any;
    private openIfNoOpened;
}
