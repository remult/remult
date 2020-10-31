import 'reflect-metadata';



import { Context, ServerContext, Allowed, DataProviderFactoryBuilder } from './context';

import { BusyService } from './angular/wait/busy-service';


import { DataApiRequest, DataApiResponse } from './data-api';
import { RestDataProviderHttpProvider, RestDataProviderHttpProviderUsingFetch } from './data-providers/rest-data-provider';
import { SqlDatabase } from './data-providers/sql-database';
import { Column } from './column';


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
    runningOnServer: false
}

export function ServerFunction(options: ServerFunctionOptions) {
    return (target: any, key: string, descriptor: any) => {

        var originalMethod = descriptor.value;
        var types = Reflect.getMetadata("design:paramtypes", target, key);
        // if types are undefind - you've forgot to set: "emitDecoratorMetadata":true

        let serverAction = new myServerAction(key, types, options, args => originalMethod.apply(undefined, args));



        descriptor.value = async function (...args: any[]) {
            if (!actionInfo.runningOnServer) {
                if (options.blockUser === false) {
                    return await BusyService.singleInstance.donotWait(async () => (await serverAction.run({ args })).data);
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
    args: any[], columns: any
}
interface serverMethodOutArgs {
    result: any,
    columns: any
}

export interface ControllerOptions {
    key: string,
    allowed: Allowed

}

function packColumns(self: any) {
    let columns = self.columns;
    if (!columns)
        columns = controllerColumns(self);
    let packedColumns = {};
    for (const c of columns) {
        packedColumns[c.defs.key] = c.rawValue;
    }
    return packedColumns;
}
function unpackColumns(self: any, data: any) {
    let columns = self.columns;
    if (!columns)
        columns = controllerColumns(self);
    for (const c of columns) {
        c.rawValue = data[c.defs.key];
    }
}

const classHelpers = new Map<any, ClassHelper>();
const methodHelpers = new Map<any, MethodHelper>();
const classOptions = new Map<any,ControllerOptions>();
export function ServerController(options: ControllerOptions) {
    return function (target) {
        let r = target;
        classOptions.set(r,options);

        while (true) {
            let helper = classHelpers.get(r);
            if (helper) {
                for (const m of helper.methods) {
                    m.classes.set(target, options);
                }
            }
            let p = Object.getPrototypeOf(r.prototype);
            if (p == null)
                break;
            r = p.constructor;
        }


        return target;
    };
}


export function ServerMethod() {
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
        var types = Reflect.getMetadata("design:paramtypes", target, key);
        // if types are undefined - you've forgot to set: "emitDecoratorMetadata":true

        let serverAction = {
            dataProvider: undefined as DataProviderFactoryBuilder,
            __register(reg: (url: string, what: ((data: any, req: DataApiRequest, res: DataApiResponse) => void)) => void) {

                let c = new ServerContext();
                for (const constructor of mh.classes.keys()) {
                    let options = mh.classes.get(constructor);
                    let y = new constructor(c);
                    reg(options.key + '/' + key, async (d: serverMethodInArgs, req, res) => {

                        try {
                            let context = new ServerContext();
                            context.setReq(req);
                            let ds = serverAction.dataProvider(context);
                            let r: serverMethodOutArgs;
                            await ds.transaction(async ds => {
                                context.setDataProvider(ds);
                                let y = new constructor(context, ds);
                                unpackColumns(y, d.columns);
                                if (!context.isAllowed(options.allowed))
                                    throw 'not allowed';
                                r = {
                                    result: await originalMethod.apply(y, d.args),
                                    columns: packColumns(y)
                                };
                            })
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


                let r = await (new class extends Action<serverMethodInArgs, serverMethodOutArgs>{
                    async execute(a, b): Promise<serverMethodOutArgs> {
                        throw ('should get here');
                    }
                }('', mh.classes.get(this.constructor).key + "/" + key).run({ args, columns: packColumns(self) }));
                unpackColumns(self, r.columns);
                return r.result;
            }
            else
                return (await originalMethod.apply(this, args));
        }
        actionInfo.allActions.push(descriptor.value);
        descriptor.value[serverActionField] = serverAction;


        return descriptor;
    }
}
class ClassHelper {
    methods: MethodHelper[] = [];
}
class MethodHelper {
    classes = new Map<any, ControllerOptions>();
}
export function controllerColumns(controller: any) {
    let __columns: Column[] = controller.__columns;;
    if (!__columns) {

        __columns = [];
        controller.__columns = __columns;
        for (const key in controller) {
            if (Object.prototype.hasOwnProperty.call(controller, key)) {
                const element = controller[key];
                if (element instanceof Column) {
                    if (!element.defs.key)
                        element.defs.key = key;
                    __columns.push(element);
                }

            }
        }
    }
    return __columns;
}
export function controllerAllowed(controller: any, context: Context) {
    let x = classOptions.get(controller.constructor);
    if (x)
        return context.isAllowed(x.allowed);
    return undefined;
}