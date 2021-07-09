import 'reflect-metadata';



import { Context, AllowedForInstance, ServerContext, Allowed, DataProviderFactoryBuilder, allEntities, ControllerOptions, classHelpers, ClassHelper, MethodHelper, setControllerSettings } from './context';




import { DataApiRequest, DataApiResponse } from './data-api';

import { SqlDatabase } from './data-providers/sql-database';


import { packedRowInfo } from './__EntityValueProvider';
import { Filter, AndFilter } from './filter/filter-interfaces';
import { DataProvider, RestDataProviderHttpProvider } from './data-interfaces';
import { getEntityRef, rowHelperImplementation, getFields, decorateColumnSettings, getEntitySettings, getControllerRef } from './remult3';
import { FieldOptions } from './column-interfaces';



interface inArgs {
    args: any[];
}
interface result {
    data: any;

}
export abstract class Action<inParam, outParam>{
    constructor(private actionUrl: string, private queue: boolean) {

    }
    static apiUrlForJobStatus = 'jobStatusInQueue';
    static provider: RestDataProviderHttpProvider;
    async run(pIn: inParam): Promise<outParam> {

        let r = await Action.provider.post(Context.apiBaseUrl + '/' + this.actionUrl, pIn);
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
                        runningJob = await Action.provider.post(Context.apiBaseUrl + '/' + Action.apiUrlForJobStatus, { queuedJobId: r.queuedJobId });
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
    protected abstract execute(info: inParam, req: ServerContext, res: DataApiResponse): Promise<outParam>;

    __register(reg: (url: string, queue: boolean, what: ((data: any, req: ServerContext, res: DataApiResponse) => void)) => void) {
        reg(this.actionUrl, this.queue, async (d, req, res) => {

            try {
                var r = await this.execute(d, req, res);
                res.success(r);
            }
            catch (err) {
                res.error(err);
            }

        });
    }
}


export class myServerAction extends Action<inArgs, result>
{
    constructor(name: string, private types: any[], private options: BackendMethodOptions<any>, private originalMethod: (args: any[]) => any) {
        super(name, options.queue)
    }

    protected async execute(info: inArgs, context: ServerContext, res: DataApiResponse): Promise<result> {
        let result = { data: {} };
        let ds = context._dataSource;
        await ds.transaction(async ds => {
            context.setDataProvider(ds);
            if (!context.isAllowedForInstance(undefined, this.options.allowed))
                throw 'not allowed';

            info.args = await prepareReceivedArgs(this.types, info.args, context, ds, res);
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
    allowed: AllowedForInstance<type>;
    blockUser?: boolean;
    queue?: boolean;
}
var isNode=new Function("try {return this===global;}catch(e){return false;}");

export const actionInfo = {
    allActions: [] as any[],
    runningOnServer: isNode(),
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







const methodHelpers = new Map<any, MethodHelper>();
const classOptions = new Map<any, ControllerOptions>();
export function Controller(key: string) {
    return function (target) {
        let r = target;
        classOptions.set(r, { key });
        setControllerSettings(target, { key });



        return target;
    };
}


export function BackendMethod<type = any>(options: BackendMethodOptions<type>) {
    return (target: any, key: string, descriptor: any) => {
        if (target.prototype !== undefined) {
            var originalMethod = descriptor.value;

            var types: any[] = Reflect.getMetadata("design:paramtypes", target, key);
            // if types are undefined - you've forgot to set: "emitDecoratorMetadata":true

            let serverAction = new myServerAction(key, types, options, args => originalMethod.apply(undefined, args));



            descriptor.value = async function (...args: any[]) {
                if (!actionInfo.runningOnServer) {


                    args = prepareArgsToSend(types, args);
                    if (options.blockUser === false) {
                        return await actionInfo.runActionWithoutBlockingUI(async () => (await serverAction.run({ args })).data);
                    }
                    else
                        return (await serverAction.run({ args })).data;
                }
                else
                    return (await originalMethod.apply(undefined, args));
            }
            actionInfo.allActions.push(descriptor.value);
            descriptor.value[serverActionField] = serverAction;


            return descriptor;
        }


        var types: any[] = Reflect.getMetadata("design:paramtypes", target, key);
        let x = classHelpers.get(target.constructor);
        if (!x) {
            x = new ClassHelper();
            classHelpers.set(target.constructor, x);
        }
        let mh = new MethodHelper();
        methodHelpers.set(descriptor, mh);
        x.methods.push(mh);
        var originalMethod = descriptor.value;
        let serverAction = {

            __register(reg: (url: string, queue: boolean, what: ((data: any, req: ServerContext, res: DataApiResponse) => void)) => void) {

                let c = new ServerContext();
                for (const constructor of mh.classes.keys()) {
                    let controllerOptions = mh.classes.get(constructor);


                    if (!controllerOptions.key) {
                        controllerOptions.key = c.for(constructor).metadata.key + "_methods";
                    }


                    reg(controllerOptions.key + '/' + key, options ? options.queue : false, async (d: serverMethodInArgs, req, res) => {

                        d.args = d.args.map(x => isCustomUndefined(x) ? undefined : x);
                        let allowed = options.allowed;


                        try {
                            let context = req;

                            let ds = context._dataSource;

                            let r: serverMethodOutArgs;
                            await ds.transaction(async ds => {
                                context.setDataProvider(ds);
                                d.args = await prepareReceivedArgs(types, d.args, context, ds, res);
                                if (allEntities.includes(constructor)) {
                                    let repo = context.for(constructor);
                                    let y: any;

                                    if (d.rowInfo.isNewRow) {
                                        y = repo.create();
                                        let rowHelper = repo.getEntityRef(y) as rowHelperImplementation<any>;
                                        rowHelper._updateEntityBasedOnApi(d.rowInfo.data);
                                    }
                                    else {
                                        let rows = await repo.find({
                                            where: x => {
                                                let where: Filter = repo.metadata.idMetadata.getIdFilter(d.rowInfo.id);
                                                if (this.options && this.options.get && this.options.get.where)
                                                    where = new AndFilter(where, this.options.get.where(x));
                                                return where;
                                            }
                                        });
                                        if (rows.length != 1)
                                            throw new Error("not found or too many matches");
                                        y = rows[0];
                                        (repo.getEntityRef(y) as rowHelperImplementation<any>)._updateEntityBasedOnApi(d.rowInfo.data);
                                    }
                                    if (!context.isAllowedForInstance(y, allowed))
                                        throw 'not allowed';
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
                                    let y = new constructor(context, ds);
                                    let controllerRef = getControllerRef(y, context);
                                    controllerRef._updateEntityBasedOnApi(d.fields);
                                    await Promise.all([...controllerRef.fields].map(x => x.load()));
                                    if (!context.isAllowedForInstance(y, allowed))
                                        throw 'not allowed';

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
                            res.error(err);
                        }
                    });
                }
            }
        };

        descriptor.value = async function (...args: any[]) {
            if (!actionInfo.runningOnServer) {
                let self = this;
                args = prepareArgsToSend(types, args);

                if (allEntities.includes(target.constructor)) {
                    let defs = getEntityRef(self) as rowHelperImplementation<any>;
                    await defs.__validateEntity();
                    let classOptions = mh.classes.get(self.constructor);
                    if (!classOptions.key) {
                        classOptions.key = defs.repository.metadata.key + "_methods";
                    }
                    try {

                        let r = await (new class extends Action<serverMethodInArgs, serverMethodOutArgs>{
                            async execute(a, b): Promise<serverMethodOutArgs> {
                                throw ('should get here');
                            }
                        }(classOptions.key + "/" + key, options ? options.queue : false).run({
                            args,
                            rowInfo: {
                                data: await defs.toApiJson(),
                                isNewRow: defs.isNew(),
                                wasChanged: defs.wasChanged(),
                                id: defs.getOriginalId()
                            }

                        }));
                        await defs._updateEntityBasedOnApi(r.rowInfo.data);
                        return r.result;
                    }
                    catch (err) {
                        defs.catchSaveErrors(err);
                        throw err;
                    }
                }

                else {
                    let defs = getControllerRef(self, undefined);
                    try {
                        await defs.__validateEntity();
                        let r = await (new class extends Action<serverMethodInArgs, serverMethodOutArgs>{
                            async execute(a, b): Promise<serverMethodOutArgs> {
                                throw ('should get here');
                            }
                        }(mh.classes.get(this.constructor).key + "/" + key, options ? options.queue : false).run({
                            args,
                            fields: await defs.toApiJson()
                        }));
                        defs._updateEntityBasedOnApi(r.fields);
                        return r.result;
                    }
                    catch (e) {
                        throw defs.catchSaveErrors(e);
                    }
                }
            }
            else
                return (await originalMethod.apply(this, args));
        }
        actionInfo.allActions.push(descriptor.value);
        descriptor.value[serverActionField] = serverAction;


        return descriptor;
    }
}







const customUndefined = {
    _isUndefined: true
}
function isCustomUndefined(x: any) {
    return x && x._isUndefined;
}
export interface registrableAction {
    __register: (reg: (url: string, queue: boolean, what: ((data: any, req: DataApiRequest, res: DataApiResponse) => void)) => void) => void
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
        for (let index = 0; index < types.length; index++) {
            const paramType = types[index];
            for (const type of [Context, ServerContext, SqlDatabase]) {
                if (paramType instanceof type) {
                    args[index] = undefined;
                }
            }
            if (args[index] != undefined) {
                let x: FieldOptions = { dataType: paramType };
                x = decorateColumnSettings(x);
                if (x.valueConverter)
                    args[index] = x.valueConverter.toJson(args[index]);
                let eo = getEntitySettings(paramType, false);
                if (eo != null) {
                    let rh = getEntityRef(args[index]);
                    args[index] = rh.getId();
                }
            }
        }
    }
    return args.map(x => x !== undefined ? x : customUndefined);

}
export async function prepareReceivedArgs(types: any[], args: any[], context: ServerContext, ds: DataProvider, res: DataApiResponse) {
    for (let index = 0; index < args.length; index++) {
        const element = args[index];
        if (isCustomUndefined(element))
            args[index] = undefined;
    }

    if (types)
        for (let i = 0; i < types.length; i++) {
            if (args.length < i) {
                args.push(undefined);
            }
            if (types[i] == Context || types[i] == ServerContext) {

                args[i] = context;
            } else if (types[i] == SqlDatabase && ds) {
                args[i] = ds;
            } else if (types[i] == ProgressListener) {
                args[i] = new ProgressListener(res);
            } else {
                let x: FieldOptions = { dataType: types[i] };
                x = decorateColumnSettings(x);
                if (x.valueConverter)
                    args[i] = x.valueConverter.fromJson(args[i]);
                let eo = getEntitySettings(types[i], false);
                if (eo != null) {
                    args[i] = await context.for(types[i]).findId(args[i]);
                }


            }
        }
    return args;
}
