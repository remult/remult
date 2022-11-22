import { Remult } from './context';
import { Repository } from './remult3';
import { ErrorInfo } from './data-interfaces';
export declare class DataApi<T = any> {
    private repository;
    private remult;
    constructor(repository: Repository<T>, remult: Remult);
    httpGet(res: DataApiResponse, req: DataApiRequest): Promise<void>;
    httpPost(res: DataApiResponse, req: DataApiRequest, body: any): Promise<void>;
    static defaultGetLimit: number;
    get(response: DataApiResponse, id: any): Promise<void>;
    count(response: DataApiResponse, request: DataApiRequest, filterBody?: any): Promise<void>;
    getArray(response: DataApiResponse, request: DataApiRequest, filterBody?: any): Promise<void>;
    private buildWhere;
    private doOnId;
    put(response: DataApiResponse, id: any, body: any): Promise<void>;
    delete(response: DataApiResponse, id: any): Promise<void>;
    post(response: DataApiResponse, body: any): Promise<void>;
}
export interface DataApiResponse {
    success(data: any): void;
    deleted(): void;
    created(data: any): void;
    notFound(): void;
    error(data: ErrorInfo): void;
    forbidden(): void;
    progress(progress: number): void;
}
export interface DataApiRequest {
    get(key: string): any;
}
export declare function determineSort(sortUrlParm: string, dirUrlParam: string): any;
export declare function serializeError(data: ErrorInfo): ErrorInfo<any>;
