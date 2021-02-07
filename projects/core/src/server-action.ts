import 'reflect-metadata';



import { Context, ServerContext, Allowed, DataProviderFactoryBuilder, allEntities, ControllerOptions, classHelpers, ClassHelper, MethodHelper, setControllerSettings } from './context';




import { DataApiRequest, DataApiResponse } from './data-api';
import { RestDataProviderHttpProvider, RestDataProviderHttpProviderUsingFetch } from './data-providers/rest-data-provider';
import { SqlDatabase } from './data-providers/sql-database';
import { Column, getColumnsFromObject } from './column';
import { AddModelStateToError, Entity, __getValidationError } from './entity';
import { packedRowInfo } from './__EntityValueProvider';
import { Filter, AndFilter } from './filter/filter-interfaces';
import { isString } from 'util';
import { DataProvider } from './data-interfaces';



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
    static provider: RestDataProviderHttpProvider = new RestDataProviderHttpProviderUsingFetch();
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
    protected abstract execute(info: inParam, req: DataApiRequest, res: DataApiResponse): Promise<outParam>;

    __register(reg: (url: string, queue: boolean, what: ((data: any, req: DataApiRequest, res: DataApiResponse) => void)) => void) {
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
    constructor(name: string, private types: any[], private options: ServerFunctionOptions, private originalMethod: (args: any[]) => any) {
        super(name, options.queue)
    }
    dataProvider: DataProviderFactoryBuilder;
    protected async execute(info: inArgs, req: DataApiRequest, res: DataApiResponse): Promise<result> {
        let result = { data: {} };
        let context = new ServerContext();
        context.setReq(req);

        let ds = this.dataProvider(context);
        await ds.transaction(async ds => {
            context.setDataProvider(ds);
            if (!context.isAllowed(this.options.allowed))
                throw 'not allowed';

            prepareArgs(this.types, info.args, context, ds, res);
            try {
                result.data = await this.originalMethod(info.args);

            }

            catch (err) {
                console.error(err);
                throw err
            }
        });
        return result;
    }



}
export interface ServerFunctionOptions {
    allowed: Allowed;
    blockUser?: boolean;
    queue?: boolean;
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

export function ServerFunction(options: ServerFunctionOptions) {
    return (target: any, key: string, descriptor: any) => {

        var originalMethod = descriptor.value;
        var types: any[] = Reflect.getMetadata("design:paramtypes", target, key);
        // if types are undefined - you've forgot to set: "emitDecoratorMetadata":true

        let serverAction = new myServerAction(key, types, options, args => originalMethod.apply(undefined, args));



        descriptor.value = async function (...args: any[]) {
            if (!actionInfo.runningOnServer) {
                for (const type of [Context, ServerContext, SqlDatabase]) {
                    if (!types) {
                        console.error("missing types, please add 'emitDecoratorMetadata:true' to the tsconfig file ")
                    }
                    let ctxIndex = types.indexOf(type);
                    if (ctxIndex > -1 && args.length > ctxIndex) {
                        args[ctxIndex] = undefined;
                    }
                }

                args = args.map(x => x !== undefined ? x : customUndefined);
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
}
export const serverActionField = Symbol('serverActionField');





interface serverMethodInArgs {
    args: any[],
    columns?: any,
    rowInfo?: packedRowInfo

}
interface serverMethodOutArgs {
    result: any,
    columns?: any,
    rowInfo?: packedRowInfo
}



function packColumns(self: any) {
    let columns = self.columns;
    if (!columns)
        columns = getColumnsFromObject(self);
    let packedColumns = {};
    for (const c of columns) {
        packedColumns[c.defs.key] = c.rawValue;
    }
    return packedColumns;
}
function unpackColumns(self: any, data: any) {
    let columns = self.columns;
    if (!columns)
        columns = getColumnsFromObject(self);
    for (const c of columns) {
        c.rawValue = data[c.defs.key];
    }
}



const methodHelpers = new Map<any, MethodHelper>();
const classOptions = new Map<any, ControllerOptions>();
export function ServerController(options: ControllerOptions) {
    return function (target) {
        let r = target;
        classOptions.set(r, options);
        setControllerSettings(target, options);



        return target;
    };
}


export function ServerMethod(options?: ServerFunctionOptions) {
    return (target: any, key: string, descriptor: any) => {

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
            dataProvider: undefined as DataProviderFactoryBuilder,
            __register(reg: (url: string, queue: boolean, what: ((data: any, req: DataApiRequest, res: DataApiResponse) => void)) => void) {

                let c = new ServerContext();
                for (const constructor of mh.classes.keys()) {
                    let controllerOptions = mh.classes.get(constructor);


                    if (!controllerOptions.key) {
                        controllerOptions.key = c.for(constructor).create().defs.name + "_methods";
                    }


                    reg(controllerOptions.key + '/' + key, options ? options.queue : false, async (d: serverMethodInArgs, req, res) => {

                        d.args = d.args.map(x => isCustomUndefined(x) ? undefined : x);
                        let allowed: Allowed = controllerOptions.allowed;
                        if (options && options.allowed !== undefined)
                            allowed = options.allowed;

                        try {
                            let context = new ServerContext();
                            context.setReq(req);
                            let ds = serverAction.dataProvider(context);
                            if (!context.isAllowed(allowed))
                                throw 'not allowed';
                            let r: serverMethodOutArgs;
                            await ds.transaction(async ds => {
                                context.setDataProvider(ds);
                                prepareArgs(types, d.args, context, ds, res);
                                if (allEntities.includes(constructor)) {

                                    let y: Entity;
                                    if (d.rowInfo.isNewRow) {
                                        y = context.for(constructor)._updateEntityBasedOnApi(context.for(constructor).create(), d.rowInfo.data);
                                    }
                                    else {
                                        let rows = await context.for(constructor).find({
                                            where: x => {
                                                let where: Filter = x.columns.idColumn.isEqualTo(d.rowInfo.id);
                                                if (this.options && this.options.get && this.options.get.where)
                                                    where = new AndFilter(where, this.options.get.where(x));
                                                return where;
                                            }
                                        });
                                        if (rows.length != 1)
                                            throw new Error("not found or too many matches");
                                        y = rows[0];
                                        context.for(constructor)._updateEntityBasedOnApi(y, d.rowInfo.data);
                                    }

                                    await y.__validateEntity();
                                    try {
                                        r = {
                                            result: await originalMethod.apply(y, d.args),
                                            rowInfo: y.__entityData.getPackedRowInfo()
                                        };
                                    } catch (err) {
                                        if (isString(err))
                                            err = { message: err };
                                        AddModelStateToError(err, [...y.columns]);
                                        throw err;
                                    }
                                }
                                else {
                                    let y = new constructor(context, ds);
                                    unpackColumns(y, d.columns);
                                    await validateObject(y);
                                    try {
                                        r = {
                                            result: await originalMethod.apply(y, d.args),
                                            columns: packColumns(y)
                                        };
                                    } catch (err) {
                                        if (isString(err))
                                            err = { message: err };
                                        AddModelStateToError(err, getColumnsFromObject(y));
                                        throw err;
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
                args = args.map(x => x !== undefined ? x : customUndefined);
                if (self instanceof Entity) {
                    await self.__validateEntity();
                    let classOptions = mh.classes.get(self.constructor);
                    if (!classOptions.key) {
                        classOptions.key = self.defs.name + "_methods";
                    }
                    try {

                        let r = await (new class extends Action<serverMethodInArgs, serverMethodOutArgs>{
                            async execute(a, b): Promise<serverMethodOutArgs> {
                                throw ('should get here');
                            }
                        }(classOptions.key + "/" + key, options? options.queue:false).run({
                            args,
                            rowInfo: self.__entityData.getPackedRowInfo()

                        }));
                        await self.__entityData.updateBasedOnPackedRowInfo(r.rowInfo, this);
                        return r.result;
                    }
                    catch (err) {
                        self.catchSaveErrors(err);
                        throw err;
                    }
                }

                else {
                    try {
                        await validateObject(self);
                        let r = await (new class extends Action<serverMethodInArgs, serverMethodOutArgs>{
                            async execute(a, b): Promise<serverMethodOutArgs> {
                                throw ('should get here');
                            }
                        }(mh.classes.get(this.constructor).key + "/" + key, options ? options.queue : false).run({
                            args,
                            columns: packColumns(self)
                        }));
                        unpackColumns(self, r.columns);
                        return r.result;
                    }
                    catch (e) {
                        console.error(e);
                        let s = e.ModelState;
                        if (!s && e.error)
                            s = e.error.modelState;
                        if (s) {
                            Object.keys(s).forEach(k => {
                                let c = self[k];
                                if (c instanceof Column)
                                    c.validationError = s[k];
                            });
                        }
                        throw e;
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




async function validateObject(y: any) {
    let cols = getColumnsFromObject(y);
    cols.forEach(x => x.__clearErrors());
    await Promise.all(cols.map(x => x.__performValidation()));
    if (cols.find(x => !!x.validationError)) {
        throw __getValidationError(cols);
    }
}

export function controllerAllowed(controller: any, context: Context) {
    let x = classOptions.get(controller.constructor);
    if (x)
        return context.isAllowed(x.allowed);
    return undefined;
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
export class ServerProgress {
    constructor(private res: DataApiResponse) { }
    progress(progress: number) {
        this.res.progress(progress);
    }
}
function prepareArgs(types: any[], args: any[], context: ServerContext, ds: DataProvider, res: DataApiResponse) {
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
            } else if (types[i] == ServerProgress) {
                args[i] = new ServerProgress(res);
            }
        }
}