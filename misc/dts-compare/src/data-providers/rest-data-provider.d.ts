import type { DataProvider, EntityDataProvider, EntityDataProviderFindOptions, RestDataProviderHttpProvider } from '../data-interfaces';
import { UrlBuilder } from '../../urlBuilder';
import type { ApiClient } from '../context';
import { Filter } from '../filter/filter-interfaces';
import type { EntityMetadata } from '../remult3/remult3';
export declare class RestDataProvider implements DataProvider {
    private apiProvider;
    constructor(apiProvider: () => ApiClient);
    getEntityDataProvider(entity: EntityMetadata): RestEntityDataProvider;
    transaction(action: (dataProvider: DataProvider) => Promise<void>): Promise<void>;
    isProxy: boolean;
}
export declare class RestEntityDataProvider implements EntityDataProvider {
    private url;
    private http;
    private entity;
    constructor(url: () => string, http: () => RestDataProviderHttpProvider, entity: EntityMetadata);
    translateFromJson(row: any): {};
    translateToJson(row: any): {};
    count(where: Filter): Promise<number>;
    find(options?: EntityDataProviderFindOptions): Promise<Array<any>>;
    update(id: any, data: any): Promise<any>;
    delete(id: any): Promise<void>;
    insert(data: any): Promise<any>;
}
export declare class RestDataProviderHttpProviderUsingFetch implements RestDataProviderHttpProvider {
    private fetch?;
    constructor(fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>);
    get(url: string): Promise<any>;
    put(url: string, data: any): Promise<any>;
    delete(url: string): Promise<any>;
    post(url: string, data: any): Promise<any>;
    myFetch(url: string, options?: {
        method?: string;
        body?: string;
    }): Promise<any>;
}
export declare function addFilterToUrlAndReturnTrueIfSuccessful(filter: any, url: UrlBuilder): boolean;
export declare const liveQueryAction = "liveQuery-";
