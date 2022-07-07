import { DataProvider, Remult, IdEntity } from '../';
import * as express from 'express';
import { Repository } from '../src/remult3';
import { queuedJobInfoResponse } from '../src/server-action';
import { DataApi, DataApiRequest, DataApiResponse } from '../src/data-api';
import { AllowedForInstance } from '../src/context';
import { ClassType } from '../classType';
export declare function remultExpress(options?: {
    /** Sets a database connection for Remult.
     *
     * @see [Connecting to a Database](https://remult.dev/docs/databases.html).
    */
    dataProvider?: DataProvider | Promise<DataProvider> | (() => Promise<DataProvider | undefined>);
    bodySizeLimit?: string;
    disableAutoApi?: boolean;
    queueStorage?: QueueStorage;
    initRequest?: (remult: Remult, origReq: express.Request) => Promise<void>;
    initApi?: (remult: Remult) => void | Promise<void>;
    logApiEndPoints?: boolean;
    defaultGetLimit?: number;
    entities?: ClassType<any>[];
    controllers?: ClassType<any>[];
    bodyParser?: boolean;
    rootPath?: string;
}): RemultExpressBridge;
export interface RemultExpressBridge extends express.RequestHandler {
    getRemult(req: express.Request): Promise<Remult>;
    openApiDoc(options: {
        title: string;
    }): any;
    addArea(rootUrl: string): any;
}
declare class ExpressBridge {
    private app;
    queue: inProcessQueueHandler;
    initRequest: (remult: Remult, origReq: express.Request) => Promise<void>;
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
    constructor(app: express.Router, queue: inProcessQueueHandler, initRequest: (remult: Remult, origReq: express.Request) => Promise<void>, dataProvider: DataProvider | Promise<DataProvider>);
    logApiEndPoints: boolean;
    private firstArea;
    addArea(rootUrl: string): SiteArea;
    getRemult(req?: express.Request): Promise<Remult>;
}
export declare class SiteArea {
    private bridge;
    private app;
    private rootUrl;
    private logApiEndpoints;
    constructor(bridge: ExpressBridge, app: express.Router, rootUrl: string, logApiEndpoints: boolean);
    add(key: string, dataApiFactory: ((req: Remult) => DataApi)): void;
    process(what: (remult: Remult, myReq: DataApiRequest, myRes: DataApiResponse, origReq: express.Request) => Promise<void>): (req: express.Request, res: express.Response) => Promise<void>;
    getRemult(req: express.Request): Promise<Remult>;
    initQueue(): void;
    addAction(action: {
        __register: (reg: (url: string, queue: boolean, allowed: AllowedForInstance<any>, what: ((data: any, req: Remult, res: DataApiResponse) => void)) => void) => void;
    }): void;
}
export declare class ExpressRequestBridgeToDataApiRequest implements DataApiRequest {
    private r;
    get(key: string): any;
    constructor(r: express.Request);
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
