import 'reflect-metadata';

import { SupportsTransaction } from "../core/data-interfaces";
import { Action } from '../core/data-providers/restDataProvider';
import { Context, ServerContext, Allowed, DataProviderFactoryBuilder } from './Context';

import { BusyService } from '../angular-components/wait/busy-service';
import { ActualSQLServerDataProvider } from '../core/data-providers/SQLDatabaseShared';
import { DirectSQL, SQLConnectionProvider, SupportsDirectSql } from '../core/SQLCommand';
import { DataApiRequest } from '../server/DataApi';


interface inArgs {
    args: any[];
}
interface result {
    data: any;
}
export class ActualDirectSQL extends DirectSQL {

    execute(sql: string) {
        let c = this.dp.createCommand();
        return c.query(sql);
    }
    constructor(private dp: SQLConnectionProvider) {
        super();
        this.dp = ActualSQLServerDataProvider.decorateSqlConnectionProvider(dp);
        let y = 1 + 1;
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
        await (<SupportsTransaction>ds).transaction(async ds => {
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
                    } else if (this.types[i] == DirectSQL && ds) {
                        info.args[i] = (<SupportsDirectSql><any>ds).getDirectSql();
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
