import { EntityOrderBy, FindOptions, Repository } from '../../index';
export interface LiveQueryProvider {
    openStreamAndReturnCloseFunction(clientId: string, onMessage: MessageHandler): VoidFunction;
}
export declare type MessageHandler = (message: {
    data: string;
    event: string;
}) => void;
export declare class LiveQueryClient {
    lqp: LiveQueryProvider;
    clientId: any;
    private queries;
    constructor(lqp: LiveQueryProvider);
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
