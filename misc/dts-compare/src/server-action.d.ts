import 'reflect-metadata';
import { Remult, AllowedForInstance } from './context';
import { DataApiResponse } from './data-api';
import { DataProvider, RestDataProviderHttpProvider } from './data-interfaces';
interface inArgs {
    args: any[];
}
interface result {
    data: any;
}
export declare abstract class Action<inParam, outParam> implements ActionInterface {
    private actionUrl;
    private queue;
    private allowed;
    constructor(actionUrl: string, queue: boolean, allowed: AllowedForInstance<any>);
    static apiUrlForJobStatus: string;
    run(pIn: inParam, baseUrl?: string, http?: RestDataProviderHttpProvider): Promise<outParam>;
    doWork: (args: any[], self: any, baseUrl?: string, http?: RestDataProviderHttpProvider) => Promise<any>;
    protected abstract execute(info: inParam, req: Remult, res: DataApiResponse): Promise<outParam>;
    __register(reg: (url: string, queue: boolean, allowed: AllowedForInstance<any>, what: ((data: any, req: Remult, res: DataApiResponse) => void)) => void): void;
}
export declare class ForbiddenError extends Error {
    constructor();
    isForbiddenError: true;
}
export declare class myServerAction extends Action<inArgs, result> {
    private types;
    private options;
    private originalMethod;
    constructor(name: string, types: any[], options: BackendMethodOptions<any>, originalMethod: (args: any[]) => any);
    protected execute(info: inArgs, remult: Remult, res: DataApiResponse): Promise<result>;
}
export interface BackendMethodOptions<type> {
    /**Determines when this `BackendMethod` can execute, see: [Allowed](https://remult.dev/docs/allowed.html)  */
    allowed: AllowedForInstance<type>;
    /** Used to determine the route for the BackendMethod.
     * @example
     * {allowed:true, apiPrefix:'someFolder/'}
     */
    apiPrefix?: string;
    /** EXPERIMENTAL: Determines if this method should be queued for later execution */
    queue?: boolean;
    /** EXPERIMENTAL: Determines if the user should be blocked while this `BackendMethod` is running*/
    blockUser?: boolean;
    paramTypes?: any[];
}
export declare const actionInfo: {
    allActions: any[];
    runningOnServer: boolean;
    runActionWithoutBlockingUI: <T>(what: () => Promise<T>) => Promise<T>;
    startBusyWithProgress: () => {
        progress: (percent: number) => void;
        close: () => void;
    };
};
export declare const serverActionField: unique symbol;
export declare function Controller(key: string): (target: any, context?: any) => any;
/** Indicates that the decorated methods runs on the backend. See: [Backend Methods](https://remult.dev/docs/backendMethods.html) */
export declare function BackendMethod<type = any>(options: BackendMethodOptions<type>): (target: any, context: any, descriptor?: any) => any;
export interface jobWasQueuedResult {
    queuedJobId?: string;
}
export interface queuedJobInfoResponse {
    done: boolean;
    result?: any;
    error?: any;
    progress?: number;
}
export declare class ProgressListener {
    private res;
    constructor(res: DataApiResponse);
    progress(progress: number): void;
}
export declare function prepareArgsToSend(types: any[], args: any[]): any[];
export declare function prepareReceivedArgs(types: any[], args: any[], remult: Remult, ds: DataProvider, res: DataApiResponse): Promise<any[]>;
export declare const classBackendMethodsArray: unique symbol;
export interface ActionInterface {
    doWork: (args: any[], self: any, baseUrl?: string, http?: RestDataProviderHttpProvider) => Promise<any>;
    __register(reg: (url: string, queue: boolean, allowed: AllowedForInstance<any>, what: ((data: any, req: Remult, res: DataApiResponse) => void)) => void): any;
}
export {};
