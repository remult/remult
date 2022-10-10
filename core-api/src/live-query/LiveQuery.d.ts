import { EntityOrderBy, FindOptions, Repository, RestDataProviderHttpProvider } from '../../index';
export interface LiveQueryProvider {
    openStreamAndReturnCloseFunction(clientId: string, onMessage: MessageHandler): VoidFunction;
}
export declare type MessageHandler = (message: {
    data: string;
    event: string;
}) => void;
export declare class LiveQueryClient {
    lqp: LiveQueryProvider;
    private provider?;
    clientId: any;
    private queries;
    constructor(lqp: LiveQueryProvider, provider?: RestDataProviderHttpProvider);
    runPromise(p: Promise<any>): void;
    subscribe<entityType>(repo: Repository<entityType>, options: FindOptions<entityType>, onResult: (items: entityType[]) => void): () => void;
    closeListener: VoidFunction;
    private openListener;
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
