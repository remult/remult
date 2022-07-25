import { queuedJobInfoResponse } from '../src/server-action';
import { DataProvider } from '../src/data-interfaces';
import { DataApi, DataApiRequest, DataApiResponse } from '../src/data-api';
import { AllowedForInstance, Remult, UserInfo } from '../src/context';
import { ClassType } from '../classType';
import { Repository } from '../src/remult3';
import { IdEntity } from '../src/id-entity';
export declare type RemultMiddlewareOptions = {
    /** Sets a database connection for Remult.
     *
     * @see [Connecting to a Database](https://remult.dev/docs/databases.html).
    */
    dataProvider?: DataProvider | Promise<DataProvider> | (() => Promise<DataProvider | undefined>);
    disableAutoApi?: boolean;
    queueStorage?: QueueStorage;
    initRequest?: (remult: Remult, origReq: GenericRequest) => Promise<void>;
    initApi?: (remult: Remult) => void | Promise<void>;
    logApiEndPoints?: boolean;
    defaultGetLimit?: number;
    entities?: ClassType<any>[];
    controllers?: ClassType<any>[];
    rootPath?: string;
};
export declare function buildRemultServer(app: GenericRouter, options: RemultMiddlewareOptions): RemultServer;
export declare type GenericRequestHandler = (req: GenericRequest, res: GenericResponse, next: VoidFunction) => void;
export interface RemultExpressBridge extends GenericRequestHandler, RemultServer {
}
export interface RemultServer {
    getRemult(req: GenericRequest): Promise<Remult>;
    openApiDoc(options: {
        title: string;
    }): any;
    addArea(rootUrl: string): void;
}
export declare type GenericRouter = {
    route(path: string): SpecificRoute;
};
export declare type SpecificRoute = {
    get(handler: GenericRequestHandler): SpecificRoute;
    put(handler: GenericRequestHandler): SpecificRoute;
    post(handler: GenericRequestHandler): SpecificRoute;
    delete(handler: GenericRequestHandler): SpecificRoute;
};
export interface GenericRequest {
    url?: string;
    method?: any;
    body?: any;
    query?: any;
    params?: any;
    user?: UserInfo;
    auth?: UserInfo;
}
export interface GenericResponse {
    json(data: any): any;
    status?(statusCode: number): GenericResponse;
    setStatus?(statusCode: number): GenericResponse;
    end(): any;
}
declare class ExpressBridge {
    private app;
    queue: inProcessQueueHandler;
    initRequest: (remult: Remult, origReq: GenericRequest) => Promise<void>;
    dataProvider: DataProvider | Promise<DataProvider>;
    openApiDoc(options: {
        title: string;
        version?: string;
    }): any;
    backendMethodsOpenApi: {
        path: string;
        allowed: AllowedForInstance<any>;
        tag: string;
    }[];
    constructor(app: GenericRouter, queue: inProcessQueueHandler, initRequest: (remult: Remult, origReq: GenericRequest) => Promise<void>, dataProvider: DataProvider | Promise<DataProvider>);
    logApiEndPoints: boolean;
    private firstArea;
    addArea(rootUrl: string): SiteArea;
    getRemult(req?: GenericRequest): Promise<Remult>;
}
export declare class SiteArea {
    private bridge;
    private app;
    private rootUrl;
    private logApiEndpoints;
    constructor(bridge: ExpressBridge, app: GenericRouter, rootUrl: string, logApiEndpoints: boolean);
    add(key: string, dataApiFactory: ((req: Remult) => DataApi)): void;
    process(what: (remult: Remult, myReq: DataApiRequest, myRes: DataApiResponse, origReq: GenericRequest) => Promise<void>): (req: GenericRequest, res: GenericResponse) => Promise<void>;
    getRemult(req: GenericRequest): Promise<Remult>;
    initQueue(): void;
    addAction(action: {
        __register: (reg: (url: string, queue: boolean, allowed: AllowedForInstance<any>, what: ((data: any, req: Remult, res: DataApiResponse) => void)) => void) => void;
    }): void;
}
export declare class ExpressRequestBridgeToDataApiRequest implements DataApiRequest {
    private r;
    get(key: string): any;
    constructor(r: GenericRequest);
}
declare class inProcessQueueHandler {
    private storage;
    constructor(storage: QueueStorage);
    submitJob(url: string, req: Remult, body: any): Promise<string>;
    mapQueuedAction(url: string, what: (data: any, r: Remult, res: ApiActionResponse) => void): void;
    actions: Map<string, (data: any, r: Remult, res: ApiActionResponse) => void>;
    getJobInfo(queuedJobId: string): Promise<queuedJobInfo>;
}
export interface queuedJobInfo {
    info: queuedJobInfoResponse;
    userId: string;
    setErrorResult(error: any): void;
    setResult(result: any): void;
    setProgress(progress: number): void;
}
export interface ApiActionResponse {
    error(error: any): void;
    success(result: any): void;
    progress(progress: number): void;
}
export interface QueueStorage {
    createJob(url: string, userId: string): Promise<string>;
    getJobInfo(queuedJobId: string): Promise<queuedJobInfo>;
}
export declare class EntityQueueStorage implements QueueStorage {
    private repo;
    constructor(repo: Repository<JobsInQueueEntity>);
    sync: Promise<any>;
    doSync<T>(what: () => Promise<T>): Promise<any>;
    getJobInfo(queuedJobId: string): Promise<queuedJobInfo>;
    createJob(url: string, userId: string): Promise<string>;
}
export declare class JobsInQueueEntity extends IdEntity {
    userId: string;
    url: string;
    submitTime: Date;
    doneTime: Date;
    result: string;
    done: boolean;
    error: boolean;
    progress: number;
}
export {};
