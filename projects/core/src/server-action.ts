import 'reflect-metadata';
import { Remult, AllowedForInstance, Allowed, allEntities, ControllerOptions, classHelpers, ClassHelper, setControllerSettings, doTransaction } from './context';
import { buildRestDataProvider } from "./buildRestDataProvider";
import { DataApiResponse } from './data-api';
import { SqlDatabase } from './data-providers/sql-database';
import { packedRowInfo } from './__EntityValueProvider';
import { DataProvider, RestDataProviderHttpProvider } from './data-interfaces';
import { getEntityRef, rowHelperImplementation, getFields, decorateColumnSettings, getEntitySettings, getControllerRef, EntityFilter, controllerRefImpl, RepositoryImplementation, $fieldOptionsMember, columnsOfType, getFieldLoaderSaver, Repository, packEntity, unpackEntity, isTransferEntityAsIdField, Field, InferredType, InferMemberType } from './remult3';
import { FieldOptions } from './column-interfaces';
import { createClass } from './remult3/DecoratorReplacer';
import { InferIdType } from 'mongodb';


import { remult, RemultProxy } from './remult-proxy';





interface inArgs {
    args: any[];
}
interface result {
    data: any;
}
export abstract class Action<inParam, outParam> implements ActionInterface {
    constructor(private actionUrl: string, private queue: boolean, private allowed: AllowedForInstance<any>) {

    }
    static apiUrlForJobStatus = 'jobStatusInQueue';
    async run(pIn: inParam, baseUrl?: string, http?: RestDataProviderHttpProvider): Promise<outParam> {
        if (baseUrl === undefined)
            baseUrl = remult.apiClient.url;
        if (!http)
            http = buildRestDataProvider(remult.apiClient.httpClient);

        let r = await http.post(baseUrl + '/' + this.actionUrl, pIn);
        let p: jobWasQueuedResult = r;
        if (p && p.queuedJobId) {
            let progress = actionInfo.startBusyWithProgress();
            try {
                let runningJob: queuedJobInfoResponse;
                await actionInfo.runActionWithoutBlockingUI(async () => {
                    while (!runningJob || !runningJob.done) {
                        if (runningJob)
                            await new Promise(res => setTimeout(() => {
                                res(undefined);
                            }, 200));
                        runningJob = await http.post(baseUrl + '/' + Action.apiUrlForJobStatus, { queuedJobId: r.queuedJobId });
                        if (runningJob.progress) {
                            progress.progress(runningJob.progress);
                        }
                    }
                });
                if (runningJob.error)
                    throw runningJob.error;
                progress.progress(1);
                return runningJob.result;

            }
            finally {
                progress.close();
            }
        }
        else
            return r;



    }
    doWork: (args: any[], self: any, baseUrl?: string, http?: RestDataProviderHttpProvider) => Promise<any>;
    protected abstract execute(info: inParam, req: Remult, res: DataApiResponse): Promise<outParam>;

    __register(reg: (url: string, queue: boolean, allowed: AllowedForInstance<any>, what: ((data: any, req: Remult, res: DataApiResponse) => void)) => void) {
        reg(this.actionUrl, this.queue, this.allowed, async (d, req, res) => {

            try {
                var r = await this.execute(d, req, res);
                res.success(r);
            }
            catch (err) {
                if (err.isForbiddenError)// got a problem in next with instance of ForbiddenError  - so replaced it with this bool
                    res.forbidden();
                else
                    res.error(err);
            }

        });
    }
}
export class ForbiddenError extends Error {
    constructor() {
        super("Forbidden");
    }
    isForbiddenError:true = true;
}




export class myServerAction extends Action<inArgs, result>
{
    constructor(name: string, private types: any[], private options: BackendMethodOptions<any>, private originalMethod: (args: any[]) => any) {
        super(name, options.queue, options.allowed)
    }

    protected async execute(info: inArgs, remult: Remult, res: DataApiResponse): Promise<result> {
        let result = { data: {} };
        let ds = remult.dataProvider;
        await doTransaction(remult, async () => {
            info.args = await prepareReceivedArgs(this.types, info.args, remult, ds, res);
            if (!remult.isAllowedForInstance(info.args ? info.args[0] : undefined, this.options.allowed))
                throw new ForbiddenError();
            try {
                result.data = await this.originalMethod(info.args);

            }

            catch (err) {
                throw err
            }
        });
        return result;
    }



}
export interface BackendMethodOptions<type> {
    /**Determines when this `BackendMethod` can execute, see: [Allowed](https://remult.dev/docs/allowed.html)  */
    allowed: AllowedForInstance<type>;
    /** EXPERIMENTAL: Determines if this method should be queued for later execution */
    queue?: boolean;
    /** EXPERIMENTAL: Determines if the user should be blocked while this `BackendMethod` is running*/
    blockUser?: boolean;
    paramTypes?: any[];
    returnType?: any;
}

export const actionInfo = {
    allActions: [] as any[],
    runningOnServer: false,
    runActionWithoutBlockingUI: (what: () => Promise<any>): Promise<any> => { return what() },
    startBusyWithProgress: () => ({
        progress: (percent: number) => { },
        close: () => { }
    })
}


export const serverActionField = Symbol('serverActionField');





interface serverMethodInArgs {
    args: any[],
    fields?: any,
    rowInfo?: packedRowInfo

}
interface serverMethodOutArgs {
    result: any,
    fields?: any,
    rowInfo?: packedRowInfo
}








const classOptions = new Map<any, ControllerOptions>();
export function Controller(key: string) {
    return function (target) {
        let r = target;
        classOptions.set(r, { key });
        setControllerSettings(target, { key });



        return target;
    };
}

export const paramDecorator = new Map<any, {
    methodName: string,
    paramIndex: number,
    decorator: any;
}[]>();

/** Indicates that the decorated methods runs on the backend. See: [Backend Methods](https://remult.dev/docs/backendMethods.html) */
export function BackendMethod<type = any>(options: BackendMethodOptions<type>) {
    return (target: any, key: string, descriptor: any) => {
        if (target.prototype !== undefined) {
            var originalMethod = descriptor.value;

            var types: any[] = getBackendMethodTypes<type>(target, key, options);
            // if types are undefined - you've forgot to set: "emitDecoratorMetadata":true

            let serverAction = new myServerAction(key, types, options, async args => prepareArgsToSend([options.returnType], [await originalMethod.apply(undefined, args)])[0]);
            serverAction.doWork = async (args, self, url, http) => {
                args = prepareArgsToSend(types, args);
                let result: any;
                if (options.blockUser === false) {
                    result = await actionInfo.runActionWithoutBlockingUI(async () => (await serverAction.run({ args }, url, http)).data);
                }
                else
                    result = (await serverAction.run({ args }, url, http)).data;
                return (await prepareReceivedArgs([options.returnType], [result]))[0];
            }



            descriptor.value = async function (...args: any[]) {
                if (!actionInfo.runningOnServer) {
                    return await serverAction.doWork(args, undefined);
                }
                else
                    return (await originalMethod.apply(undefined, args));
            }
            registerAction(target, descriptor);
            descriptor.value[serverActionField] = serverAction;


            return descriptor;
        }


        var types: any[] = Reflect.getMetadata("design:paramtypes", target, key);
        if (options.paramTypes)
            types = options.paramTypes;
        let x = classHelpers.get(target.constructor);
        if (!x) {
            x = new ClassHelper();
            classHelpers.set(target.constructor, x);
        }
        var originalMethod = descriptor.value;
        let serverAction: ActionInterface = {
            __register(reg: (url: string, queue: boolean, allowed: AllowedForInstance<any>, what: ((data: any, req: Remult, res: DataApiResponse) => void)) => void) {

                let c = new Remult();
                for (const constructor of x.classes.keys()) {
                    let controllerOptions = x.classes.get(constructor);


                    if (!controllerOptions.key) {
                        controllerOptions.key = c.repo(constructor).metadata.key;
                    }


                    reg(controllerOptions.key + '/' + key, options ? options.queue : false, options.allowed, async (d: serverMethodInArgs, req, res) => {

                        d.args = d.args.map(x => isCustomUndefined(x) ? undefined : x);
                        let allowed = options.allowed;


                        try {
                            let remult = req;


                            let r: serverMethodOutArgs;
                            await doTransaction(remult, async () => {
                                d.args = await prepareReceivedArgs(types, d.args, remult, remult.dataProvider, res);
                                if (allEntities.includes(constructor)) {
                                    let repo = remult.repo(constructor);
                                    let y: any;

                                    y = await unpackEntity(d.rowInfo, repo);
                                    if (!remult.isAllowedForInstance(y, allowed))
                                        throw new ForbiddenError();
                                    let defs = getEntityRef(y) as rowHelperImplementation<any>;
                                    await defs.__validateEntity();
                                    try {
                                        r = {
                                            result: await originalMethod.apply(y, d.args),
                                            rowInfo: {
                                                data: await defs.toApiJson(),
                                                isNewRow: defs.isNew(),
                                                wasChanged: defs.wasChanged(),
                                                id: defs.getOriginalId()
                                            }
                                        };
                                    } catch (err) {
                                        throw defs.catchSaveErrors(err);
                                    }
                                }
                                else {
                                    let y = new constructor(remult, remult.dataProvider);
                                    let controllerRef = getControllerRef(y, remult) as controllerRefImpl;
                                    await controllerRef._updateEntityBasedOnApi(d.fields);
                                    if (!remult.isAllowedForInstance(y, allowed))
                                        throw new ForbiddenError();

                                    await controllerRef.__validateEntity();
                                    try {
                                        r = {
                                            result: await originalMethod.apply(y, d.args),
                                            fields: await controllerRef.toApiJson()
                                        };
                                    } catch (err) {
                                        throw controllerRef.catchSaveErrors(err);
                                    }
                                }

                            });
                            res.success(r);
                        }
                        catch (err) {
                            if (err.isForbiddenError) // got a problem in next with instance of ForbiddenError  - so replaced it with this bool
                                res.forbidden();

                            else
                                res.error(err);
                        }
                    });
                }
            },
            doWork: async function (args: any[], self: any, baseUrl?: string, http?: RestDataProviderHttpProvider): Promise<any> {
                args = prepareArgsToSend(types, args);

                if (allEntities.includes(target.constructor)) {
                    let defs = getEntityRef(self) as rowHelperImplementation<any>;
                    await defs.__validateEntity();
                    let classOptions = x.classes.get(self.constructor);
                    if (!classOptions.key) {
                        classOptions.key = defs.repository.metadata.key + "_methods";
                    }
                    try {

                        let r = await (new class extends Action<serverMethodInArgs, serverMethodOutArgs>{
                            protected execute: (info: serverMethodInArgs, req: Remult, res: DataApiResponse) => Promise<serverMethodOutArgs>;
                        }(classOptions.key + "/" + key, options ? options.queue : false, options.allowed).run({
                            args,
                            rowInfo: await packEntity(defs)

                        }, baseUrl, http));
                        await defs._updateEntityBasedOnApi(r.rowInfo.data);
                        return r.result;
                    }
                    catch (err) {
                        throw defs.catchSaveErrors(err);
                    }
                }

                else {
                    let defs = getControllerRef(self, undefined) as controllerRefImpl;
                    try {
                        await defs.__validateEntity();
                        let r = await (new class extends Action<serverMethodInArgs, serverMethodOutArgs>{
                            protected execute: (info: serverMethodInArgs, req: Remult, res: DataApiResponse) => Promise<serverMethodOutArgs>;
                        }(x.classes.get(self.constructor).key + "/" + key, options ? options.queue : false, options.allowed).run({
                            args,
                            fields: await defs.toApiJson()
                        }, baseUrl, http));
                        await defs._updateEntityBasedOnApi(r.fields);
                        return r.result;
                    }
                    catch (e) {
                        throw defs.catchSaveErrors(e);
                    }
                }
            }
        };

        descriptor.value = async function (...args: any[]) {
            if (!actionInfo.runningOnServer) {
                let self = this;
                return serverAction.doWork(args, self);
            }
            else
                return (await originalMethod.apply(this, args));
        }
        registerAction(target.constructor, descriptor);
        descriptor.value[serverActionField] = serverAction;


        return descriptor;
    }
}







const customUndefined = {
    _isUndefined: true
}


function getBackendMethodTypes<type = any>(target: any, key: string, options: BackendMethodOptions<type>) {
    var types: any[] = Reflect.getMetadata("design:paramtypes", target, key);
    if (options.paramTypes)
        types = options.paramTypes;
    const paramDecorators = paramDecorator.get(target);
    if (paramDecorators) {
        for (const d of paramDecorators) {
            if (d.methodName === key) {
                if (types === undefined) {
                    types = [];
                }
                while (types.length <= d.paramIndex) {
                    types.push(undefined);
                }
                types[d.paramIndex] = d.decorator;
            }
        }
    }
    return types;
}

function registerAction(target: any, descriptor: any) {
    (target[classBackendMethodsArray] || (target[classBackendMethodsArray] = [])).push(descriptor.value);
    actionInfo.allActions.push(descriptor.value);
}

function isCustomUndefined(x: any) {
    return x && x._isUndefined;
}

export interface jobWasQueuedResult {
    queuedJobId?: string
}
export interface queuedJobInfoResponse {
    done: boolean;
    result?: any;
    error?: any;
    progress?: number;
}
export class ProgressListener {
    constructor(private res: DataApiResponse) { }
    progress(progress: number) {
        this.res.progress(progress);
    }
}
export function prepareArgsToSend(types: any[], args: any[]) {

    if (types) {
        const remult = RemultProxy.defaultRemult;
        for (let index = 0; index < types.length; index++) {
            const paramType = types[index];
            for (const type of [Remult, SqlDatabase]) {
                if (args[index] instanceof type)
                    args[index] = undefined;
                else if (paramType == type) {
                    args[index] = undefined;
                }
            }
            if (args[index] != undefined) {
                let x = getMemberFieldOptions(paramType, remult);
                let eo = getEntitySettings(x.valueType, false);
                args[index] = getFieldLoaderSaver(x, remult, false).toJson(args[index]);
                if (eo != null && isTransferEntityAsIdField(x)) {
                    let rh = getEntityRef(args[index]);
                    args[index] = rh.getId();
                }
            }
        }
    }
    return args.map(x => x !== undefined ? x : customUndefined);

}
export async function prepareReceivedArgs(types: any[], args: any[], remult?: Remult, ds?: DataProvider, res?: DataApiResponse) {
    for (let index = 0; index < args.length; index++) {
        const element = args[index];
        if (isCustomUndefined(element))
            args[index] = undefined;
    }
    if (!remult)
        remult = RemultProxy.defaultRemult;

    if (types)
        for (let i = 0; i < types.length; i++) {
            if (args.length < i) {
                args.push(undefined);
            }
            if (types[i] == Remult || types[i] == Remult) {

                args[i] = remult;
            } else if (types[i] == SqlDatabase && ds) {
                args[i] = ds;
            } else if (types[i] == ProgressListener) {
                args[i] = new ProgressListener(res);
            }
            else {
                let x: FieldOptions = getMemberFieldOptions(types[i], remult);
                let eo = getEntitySettings(x.valueType, false);
                args[i] = await getFieldLoaderSaver(x, remult, false).fromJson(args[i]);
                if (eo != null && isTransferEntityAsIdField(x)) {
                    if (!(args[i] === null || args[i] === undefined))
                        args[i] = await remult.repo(x.valueType).findId(args[i]);
                }
            }
        }
    return args;
}

export const classBackendMethodsArray = Symbol('classBackendMethodsArray');


export interface ActionInterface {
    doWork: (args: any[], self: any, baseUrl?: string, http?: RestDataProviderHttpProvider) => Promise<any>;
    __register(reg: (url: string, queue: boolean, allowed: AllowedForInstance<any>, what: ((data: any, req: Remult, res: DataApiResponse) => void)) => void);
}

function getMemberFieldOptions(type: any, remult: Remult) {
    let x: FieldOptions = { valueType: type };
    let paramType = type;
    if (typeof paramType === "object") {
        const c = createClass(paramType);
        paramType = Field(() => c);
    }
    if (typeof paramType === "function")
        if (paramType[$fieldOptionsMember] !== undefined) {
            x = paramType[$fieldOptionsMember](remult);
        }
        else if (!paramType.prototype) {
            x = { valueType: paramType() };
        }
    x = decorateColumnSettings(x, remult);
    return x;
}


class dynamicBackendMethods {

}
export type inferredMethod<inArgs, returnType> = (args: InferMemberType<inArgs>) => Promise<InferMemberType<returnType>>;

export type CreateBackendMethodOptions<inArgs, returnType> = {
    inputType?: inArgs;
    returnType?: returnType;
    key?: string;
    implementation?: inferredMethod<inArgs, returnType>;
} & BackendMethodOptions<InferMemberType<inArgs>>;

export type BackendMethodType<inArg, returnType> = (inferredMethod<inArg, returnType>) & {
    implementation: inferredMethod<inArg, returnType>
}

export function createBackendMethod<inArg, returnType>(arg: CreateBackendMethodOptions<inArg, returnType>):
    BackendMethodType<inArg, returnType> {

    const descriptor = {
        value: (...args) => arg.implementation(args[0])
    };
    BackendMethod({ ...arg, paramTypes: [arg.inputType] })(dynamicBackendMethods, arg.key, descriptor);
    const r = x => descriptor.value(x);

    Object.defineProperty(r, "implementation", {
        get: () => arg.implementation,
        set: x => arg.implementation = x
    });
    //@ts-ignore
    return r;
}


