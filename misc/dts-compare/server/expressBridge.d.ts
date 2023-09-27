import type { ClassType } from '../classType';
import type { UserInfo } from '../src/context';
import { Remult } from '../src/context';
import type { DataProvider } from '../src/data-interfaces';
import type { LiveQueryStorage, SubscriptionServer } from '../src/live-query/SubscriptionServer';
import { IdEntity } from '../src/remult3/IdEntity';
import type { Repository } from '../src/remult3/remult3';
import type { queuedJobInfoResponse } from '../src/server-action';
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
        deserialize(json: any, options: InitRequestOptions): Promise<void>;
    };
    /** Storage to use for backend methods that use queue */
    queueStorage?: QueueStorage;
}
export interface InitRequestOptions {
    liveQueryStorage: LiveQueryStorage;
    readonly remult: Remult;
}
export declare function createRemultServerCore<RequestType>(options: RemultServerOptions<RequestType>, serverCoreOptions: ServerCoreOptions<RequestType>): RemultServer<RequestType>;
export type GenericRequestHandler = (req: GenericRequestInfo, res: GenericResponse, next: VoidFunction) => void;
export interface ServerHandleResponse {
    data?: any;
    statusCode: number;
}
export interface RemultServer<RequestType> extends RemultServerCore<RequestType> {
    withRemult(req: RequestType, res: GenericResponse, next: VoidFunction): any;
    registerRouter(r: GenericRouter): void;
    handle(req: RequestType, gRes?: GenericResponse): Promise<ServerHandleResponse | undefined>;
    withRemultPromise<T>(request: RequestType, what: () => Promise<T>): Promise<T>;
}
export interface RemultServerCore<RequestType> {
    getRemult(req: RequestType): Promise<Remult>;
    openApiDoc(options: {
        title: string;
        version?: string;
    }): any;
}
export type GenericRouter = {
    route(path: string): SpecificRoute;
};
export type SpecificRoute = {
    get(handler: GenericRequestHandler): SpecificRoute;
    put(handler: GenericRequestHandler): SpecificRoute;
    post(handler: GenericRequestHandler): SpecificRoute;
    delete(handler: GenericRequestHandler): SpecificRoute;
};
export interface GenericRequestInfo {
    url?: string;
    method?: any;
    query?: any;
    params?: any;
}
export interface GenericResponse {
    json(data: any): any;
    status(statusCode: number): GenericResponse;
    end(): any;
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
    buildGenericRequestInfo(req: RequestType): GenericRequestInfo;
    getRequestBody(req: RequestType): Promise<any>;
}
