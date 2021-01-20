import 'reflect-metadata';



import { Context, ServerContext, Allowed, DataProviderFactoryBuilder, allEntities, ControllerOptions, classHelpers, ClassHelper, MethodHelper, setControllerSettings } from './context';




import { DataApiRequest, DataApiResponse } from './data-api';
import { RestDataProviderHttpProvider, RestDataProviderHttpProviderUsingFetch } from './data-providers/rest-data-provider';
import { SqlDatabase } from './data-providers/sql-database';
import { Column, getColumnsFromObject } from './column';
import { Entity, __getValidationError } from './entity';
import { packedRowInfo } from './__EntityValueProvider';
import { Filter, AndFilter } from './filter/filter-interfaces';



interface inArgs {
    args: any[];
}
interface result {
    data: any;
}
export abstract class Action<inParam, outParam>{
    constructor(private serverUrl: string, private actionUrl?: string, addRequestHeader?: (add: ((name: string, value: string) => void)) => void) {
        if (!addRequestHeader)
            addRequestHeader = () => { };
        if (!actionUrl) {
            this.actionUrl = this.constructor.name;
            if (this.actionUrl.endsWith('Action'))
                this.actionUrl = this.actionUrl.substring(0, this.actionUrl.length - 6);
        }
    }
    static provider: RestDataProviderHttpProvider = new RestDataProviderHttpProviderUsingFetch();
    run(pIn: inParam): Promise<outParam> {

        return Action.provider.post(Context.apiBaseUrl + '/' + this.actionUrl, pIn);


    }
    protected abstract execute(info: inParam, req: DataApiRequest): Promise<outParam>;

    __register(reg: (url: string, what: ((data: any, req: DataApiRequest, res: DataApiResponse) => void)) => void) {
        reg(this.actionUrl, async (d, req, res) => {

            try {
                var r = await this.execute(d, req);
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
        super('', name)
    }
    dataProvider: DataProviderFactoryBuilder;
    protected async execute(info: inArgs, req: DataApiRequest): Promise<result> {
        let result = { data: {} };
        let context = new ServerContext();
        context.setReq(req);
        info.args = info.args.map(x => isCustomUndefined(x) ? undefined : x)
        let ds = this.dataProvider(context);
        await ds.transaction(async ds => {
            context.setDataProvider(ds);
            if (!context.isAllowed(this.options.allowed))
                throw 'not allowed';
            if (this.types)
                for (let i = 0; i < this.types.length; i++) {
                    if (info.args.length < i) {
                        info.args.push(undefined);
                    }
                    if (this.types[i] == Context || this.types[i] == ServerContext) {

                        info.args[i] = context;
                    } else if (this.types[i] == SqlDatabase && ds) {
                        info.args[i] = ds;
                    }
                }
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
}
export const actionInfo = {
    allActions: [] as any[],
    runningOnServer: false,
    runActionWithoutBlockingUI: (what: () => Promise<any>): Promise<any> => { return what() }
}

export function ServerFunction(options: ServerFunctionOptions) {
    return (target: any, key: string, descriptor: any) => {

        var originalMethod = descriptor.value;
        var types: any[] = Reflect.getMetadata("design:paramtypes", target, key);
        // if types are undefind - you've forgot to set: "emitDecoratorMetadata":true

        let serverAction = new myServerAction(key, types, options, args => originalMethod.apply(undefined, args));



        descriptor.value = async function (...args: any[]) {
            if (!actionInfo.runningOnServer) {
                for (const type of [Context, ServerContext, SqlDatabase]) {
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
            __register(reg: (url: string, what: ((data: any, req: DataApiRequest, res: DataApiResponse) => void)) => void) {

                let c = new ServerContext();
                for (const constructor of mh.classes.keys()) {
                    let controllerOptions = mh.classes.get(constructor);


                    if (!controllerOptions.key) {
                        controllerOptions.key = c.for(constructor).create().defs.name + "_methods";
                    }


                    reg(controllerOptions.key + '/' + key, async (d: serverMethodInArgs, req, res) => {
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
                                    r = {
                                        result: await originalMethod.apply(y, d.args),
                                        rowInfo: y.__entityData.getPackedRowInfo()
                                    };
                                }
                                else {
                                    let y = new constructor(context, ds);
                                    unpackColumns(y, d.columns);
                                    await validateObject(y);
                                    r = {
                                        result: await originalMethod.apply(y, d.args),
                                        columns: packColumns(y)
                                    };
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
                    let options = mh.classes.get(self.constructor);
                    if (!options.key) {
                        options.key = self.defs.name + "_methods";
                    }
                    try {

                        let r = await (new class extends Action<serverMethodInArgs, serverMethodOutArgs>{
                            async execute(a, b): Promise<serverMethodOutArgs> {
                                throw ('should get here');
                            }
                        }('', options.key + "/" + key).run({
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
                        validateObject(self);
                        let r = await (new class extends Action<serverMethodInArgs, serverMethodOutArgs>{
                            async execute(a, b): Promise<serverMethodOutArgs> {
                                throw ('should get here');
                            }
                        }('', mh.classes.get(this.constructor).key + "/" + key).run({
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