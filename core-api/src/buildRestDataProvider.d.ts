import { RestDataProviderHttpProvider } from "./data-interfaces";
import { RestDataProviderHttpProviderUsingFetch } from './data-providers/rest-data-provider';
export declare function buildRestDataProvider(provider: ExternalHttpProvider | typeof fetch): RestDataProviderHttpProvider | RestDataProviderHttpProviderUsingFetch;
export declare function isExternalHttpProvider(item: any): boolean;
export declare class HttpProviderBridgeToRestDataProviderHttpProvider implements RestDataProviderHttpProvider {
    private http;
    constructor(http: ExternalHttpProvider);
    post(url: string, data: any): Promise<any>;
    delete(url: string): Promise<void>;
    put(url: string, data: any): Promise<any>;
    get(url: string): Promise<any>;
}
export declare function retry<T>(what: () => Promise<T>): Promise<T>;
export declare function toPromise<T>(p: Promise<T> | {
    toPromise(): Promise<T>;
}): Promise<any>;
export declare function processHttpException(ex: any): Promise<any>;
export interface ExternalHttpProvider {
    post(url: string, data: any): Promise<any> | {
        toPromise(): Promise<any>;
    };
    delete(url: string): Promise<void> | {
        toPromise(): Promise<void>;
    };
    put(url: string, data: any): Promise<any> | {
        toPromise(): Promise<any>;
    };
    get(url: string): Promise<any> | {
        toPromise(): Promise<any>;
    };
}
