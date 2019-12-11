import 'reflect-metadata';



import { Context, ServerContext, Allowed, DataProviderFactoryBuilder } from './Context';

import { BusyService } from './angular-components/wait/busy-service';

import { SqlDatabase } from './SqlCommand';
import { DataApiRequest, DataApiResponse } from './server/DataApi';
import { RestDataProviderHttpProvider, RestDataProviderHttpProviderUsingFetch } from './data-providers/restDataProvider';


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
