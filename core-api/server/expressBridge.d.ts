import { queuedJobInfoResponse } from '../src/server-action';
import { DataProvider } from '../src/data-interfaces';
import { DataApiRequest } from '../src/data-api';
import { Remult, UserInfo } from '../src/context';
import { ClassType } from '../classType';
import { Repository } from '../src/remult3';
import { IdEntity } from '../src/id-entity';
export declare type RemultServerOptions = {
    /** Sets a database connection for Remult.
     *
     * @see [Connecting to a Database](https://remult.dev/docs/databases.html).
    */
    dataProvider?: DataProvider | Promise<DataProvider> | (() => Promise<DataProvider | undefined>);
    queueStorage?: QueueStorage;
    initRequest?: (remult: Remult, origReq: GenericRequest) => Promise<void>;
    getUser?: (request: GenericRequest) => Promise<UserInfo>;
    initApi?: (remult: Remult) => void | Promise<void>;
    logApiEndPoints?: boolean;
    defaultGetLimit?: number;
    entities?: ClassType<any>[];
    controllers?: ClassType<any>[];
    rootPath?: string;
};
export declare function buildRemultServer(options: RemultServerOptions): RemultServer;
export declare type GenericRequestHandler = (req: GenericRequest, res: GenericResponse, next: VoidFunction) => void;
export interface ServerHandleResponse {
    data?: any;
    statusCode: number;
}
export interface RemultServer {
    getRemult(req: GenericRequest): Promise<Remult>;
    openApiDoc(options: {
        title: string;
    }): any;
    registerRouter(r: GenericRouter): void;
    handle(req: GenericRequest, gRes?: GenericResponse): Promise<ServerHandleResponse | undefined>;
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
}
export interface GenericResponse {
    json(data: any): any;
    status?(statusCode: number): GenericResponse;
    setStatus?(statusCode: number): GenericResponse;
    end(): any;
}
export declare class ExpressRequestBridgeToDataApiRequest implements DataApiRequest {
    private r;
    get(key: string): any;
    constructor(r: GenericRequest);
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
