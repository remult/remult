import { ActionInterface, queuedJobInfoResponse } from '../src/server-action';
import { DataProvider } from '../src/data-interfaces';
import { DataApi, DataApiRequest, DataApiResponse } from '../src/data-api';
import { AllowedForInstance, Remult, UserInfo } from '../src/context';
import { ClassType } from '../classType';
import { Repository } from '../src/remult3';
import { IdEntity } from '../src/id-entity';
import { ServerEventDispatcher, ServerEventMessage, LiveQueryManager } from '../src/live-query/LiveQueryManager';
export interface RemultServerOptions<RequestType extends GenericRequest> {
    /** Sets a database connection for Remult.
     *
     * @see [Connecting to a Database](https://remult.dev/docs/databases.html).
    */
    dataProvider?: DataProvider | Promise<DataProvider> | (() => Promise<DataProvider | undefined>);
    queueStorage?: QueueStorage;
    initRequest?: (remult: Remult, origReq: RequestType) => Promise<void>;
    getUser?: (request: RequestType) => Promise<UserInfo>;
    initApi?: (remult: Remult) => void | Promise<void>;
    logApiEndPoints?: boolean;
    defaultGetLimit?: number;
    entities?: ClassType<any>[];
    controllers?: ClassType<any>[];
    rootPath?: string;
}
export declare function createRemultServer<RequestType extends GenericRequest = GenericRequest>(options?: RemultServerOptions<RequestType>): RemultServer;
export declare type GenericRequestHandler = (req: GenericRequest, res: GenericResponse, next: VoidFunction) => void;
export interface ServerHandleResponse {
    data?: any;
    statusCode: number;
}
export interface RemultServer {
    getRemult(req: GenericRequest): Promise<Remult>;
    openApiDoc(options: {
        title: string;
        version?: string;
    }): any;
    registerRouter(r: GenericRouter): void;
    handle(req: GenericRequest, gRes?: GenericResponse): Promise<ServerHandleResponse | undefined>;
    withRemult(req: GenericRequest, res: GenericResponse, next: VoidFunction): any;
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
    status(statusCode: number): GenericResponse;
    end(): any;
}
export declare class RemultServerImplementation implements RemultServer {
    queue: inProcessQueueHandler;
    options: RemultServerOptions<GenericRequest>;
    dataProvider: DataProvider | Promise<DataProvider>;
    constructor(queue: inProcessQueueHandler, options: RemultServerOptions<GenericRequest>, dataProvider: DataProvider | Promise<DataProvider>);
    server: ServerEventsController;
    liveQueryManager: LiveQueryManager;
    withRemult<T>(req: GenericRequest, res: GenericResponse, next: VoidFunction): void;
    routeImpl: RouteImplementation;
    handle(req: GenericRequest, gRes?: GenericResponse): Promise<ServerHandleResponse>;
    registeredRouter: boolean;
    registerRouter(r: GenericRouter): void;
    add(key: string, dataApiFactory: ((req: Remult) => DataApi), r: GenericRouter): void;
    process(what: (remult: Remult, myReq: DataApiRequest, myRes: DataApiResponse, origReq: GenericRequest) => Promise<void>): (req: GenericRequest, res: GenericResponse) => Promise<void>;
    getRemult(req: GenericRequest): Promise<Remult>;
    hasQueue: boolean;
    addAction(action: ActionInterface, r: GenericRouter): void;
    openApiDoc(options: {
        title: string;
        version?: string;
    }): any;
    backendMethodsOpenApi: {
        path: string;
        allowed: AllowedForInstance<any>;
        tag: string;
    }[];
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
declare class RouteImplementation {
    map: Map<string, Map<string, GenericRequestHandler>>;
    route(path: string): SpecificRoute;
    handle(req: GenericRequest, gRes?: GenericResponse): Promise<ServerHandleResponse | undefined>;
    middleware(req: GenericRequest, res: GenericResponse, next: VoidFunction): void;
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
declare class clientConnection {
    response: import('express').Response;
    clientId: string;
    close(): void;
    closed: boolean;
    write(id: number, message: any, eventType: string): void;
    constructor(response: import('express').Response, clientId: string);
    sendLiveMessage(): void;
}
export declare class ServerEventsController implements ServerEventDispatcher {
    private messageHistoryLength;
    connections: clientConnection[];
    constructor(messageHistoryLength?: number);
    send({ message, clientId, queryId }: ServerEventMessage): void;
    subscribe(req: import('express').Request, res: import('express').Response): clientConnection;
    messages: {
        id: number;
        message: any;
        eventType: string;
    }[];
    SendMessage(message: any, eventType?: string): void;
}
export {};
