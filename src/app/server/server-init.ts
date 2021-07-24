import '../app.module';

import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, PostgresSchemaBuilder } from 'remult/postgres';
import * as passwordHash from 'password-hash';


import {  Context,  EntityOptions,  SqlDatabase } from 'remult';
import { ClassType } from '../../../projects/core/classType';









export async function serverInit() {

    config();
    let ssl = true;
    if (process.env.DISABLE_POSTGRES_SSL)
        ssl = false;

    if (process.env.logSqls) {
        SqlDatabase.LogToConsole = true;
    }

    if (!process.env.DATABASE_URL) {
        console.log("No DATABASE_URL environment variable found, if you are developing locally, please add a '.env' with DATABASE_URL='postgres://*USERNAME*:*PASSWORD*@*HOST*:*PORT*/*DATABASE*'");
    }
    let dbUrl = process.env.DATABASE_URL;
    const pool = new Pool({
        connectionString: dbUrl,
        ssl: ssl
    });
    var r = new SqlDatabase(new PostgresDataProvider(pool));
    await new PostgresSchemaBuilder(r).verifyStructureOfAllEntities();

    return r;

}
function stam() {
    return (target, key, z) => target;
}

function Entity(settings: EntityOptions, stam: any) {
    return (target) => target;
}
function Entity2(types: any[], func: (...args: any[]) => Partial<EntityOptions<Products>>) {
    return target => target
}

function Entity3<T>(a: any, b: any) {

}
@Entity({
    key: 'asdf'

},
    class {
        constructor(

            private context: Context) {
            let p: Products;
            p.a;
        }
    })


class Base<T>{
    constructor(settings: Partial<EntityOptions<T>>) {

    }
}

class zz extends Base<Products>{
    z: string;
    constructor() {
        let a = '';

        super({

        })
    }
}

var zzz: Partial<EntityOptions<Products>> = {
    fixedFilter: p => p.a.isEqualTo("")

}
var zzzz: (settings: Partial<EntityOptions<Products>>) => void;
if (false)
    zzzz({
        fixedFilter: p => p.a.isEqualTo("")
    })

var x = {
    context: Context
}
export type kuku<Type> = {
    [Properties in keyof Type]: Type[Properties] extends ClassType<infer Z> ? Z : never
}
function entity7<Args>(type: Args, doSomething: (z: kuku<Args>, send: (to: Partial<EntityOptions>) => void) => void) {
    return a => a;
}
function entity8<Args>(type: Args, doSomething: (z: kuku<Args>) => Partial<EntityOptions>) {
    return a => a;
}

entity7({ context: Context }, (x, y) => {
    y({ key: x.context.user.name });
});





@Entity2(
    [Context], (c: Context) => ({
        fixedFilter: p => p.a.isEqualTo(""),
        allowApiCrudDDD: false
    })
)
@entity7({ context: Context }, (x, y) => y({ apiDataFilter: p => p.a.isEqualTo(x.context.user.id) }))
class Products {
    a: string;
    private b: string;
    constructor(
        @stam()
        private z: string
    ) { }
}