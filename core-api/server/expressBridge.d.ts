import { queuedJobInfoResponse } from '../src/server-action';
import { DataProvider } from '../src/data-interfaces';
import { Remult, UserInfo } from '../src/context';
import { ClassType } from '../classType';
import { Repository } from '../src/remult3';
import { IdEntity } from '../src/id-entity';
import { LiveQueryStorage, SubscriptionServer } from '../src/live-query/SubscriptionServer';
export interface RemultServerOptions<RequestType> {
    /**Entities to use for the api */
    entities?: ClassType<any>[];
    /**Controller to use for the api */
    controllers?: ClassType<any>[];
    /** Will be called to get the current user based on the current request */
    getUser?: (request: RequestType) => Promise<UserInfo | undefined>;
    /** Will be called for each request and can be used for configuration */
    initRequest?: (request: RequestType, options: InitRequestOptions) => Promise<void>;
    /** Will be called once the server is loaded and the data provider is ready */
    initApi?: (remult: Remult) => void | Promise<void>;
    /** Data Provider to use for the api.
     *
     * @see [Connecting to a Database](https://remult.dev/docs/databases.html).
    */
    dataProvider?: DataProvider | Promise<DataProvider> | (() => Promise<DataProvider | undefined>);
    /** Will create tables and columns in supporting databases. default: true
     *
     * @description
     * when set to true, it'll create entities that do not exist, and add columns that are missing.
    */
    ensureSchema?: boolean;
    /** The path to use for the api, default:/api
     *
     * @description
     * If you want to use a different api path adjust this field
    */
    rootPath?: string;
    /** The default limit to use for find requests that did not specify a limit */
    defaultGetLimit?: number;
    /** When set to true (default) it'll console log each api endpoint that is created */
    logApiEndPoints?: boolean;
    /** A subscription server to use for live query and message channels */
    subscriptionServer?: SubscriptionServer;
    /** A storage to use to store live queries, relevant mostly for serverless scenarios or larger scales */
    liveQueryStorage?: LiveQueryStorage;
    /** Used to store the context relevant info for re running a live query */
    contextSerializer?: {
        serialize(remult: Remult): Promise<any>;
        deserialize(json: any, remult: Remult): Promise<void>;
    };
    /** Storage to use for backend methods that use queue */
    queueStorage?: QueueStorage;
}
export interface InitRequestOptions {
    liveQueryStorage: LiveQueryStorage;
    readonly remult: Remult;
}
export declare function createRemultServerCore<RequestType>(options: RemultServerOptions<RequestType>, serverCoreOptions: ServerCoreOptions<RequestType>): RemultServer<RequestType>;
export declare type GenericRequestHandler = (req: GenericRequest, res: GenericResponse, next: VoidFunction) => void;
export interface ServerHandleResponse {
    data?: any;
    statusCode: number;
}
export interface RemultServer<RequestType> {
    getRemult(req: RequestType): Promise<Remult>;
    openApiDoc(options: {
        title: string;
        version?: string;
    }): any;
    registerRouter(r: GenericRouter): void;
    handle(req: RequestType, gRes?: GenericResponse): Promise<ServerHandleResponse | undefined>;
    withRemult(req: RequestType, res: GenericResponse, next: VoidFunction): any;
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
export declare class RemultAsyncLocalStorage {
    private readonly remultObjectStorage;
    static enable(): void;
    static disable(): void;
    constructor(remultObjectStorage: import('async_hooks').AsyncLocalStorage<Remult>);
    run(remult: Remult, callback: VoidFunction): void;
    getRemult(): Remult;
    static instance: RemultAsyncLocalStorage;
}
export interface queuedJobInfo {
    info: queuedJobInfoResponse;
    userId: string;
    setErrorResult(error: any): void;
    setResult(result: any): void;
    setProgress(progress: number): void;
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
export interface ServerCoreOptions<RequestType> {
    buildGenericRequest(req: RequestType): GenericRequest;
}
