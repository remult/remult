import '../app.module';

import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, PostgresSchemaBuilder } from '@remult/core/postgres';
import * as passwordHash from 'password-hash';


import { ServerController, SqlDatabase } from '@remult/core';
import { Column, Entity, entityInfo, columnsOfType, getControllerDefs } from '../../../projects/core/src/remult3';
import { ValueListInfo } from '../../../projects/core/src/column';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';








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
    //   await new PostgresSchemaBuilder( r).verifyStructureOfAllEntities();

    console.log({
        classTarget, columnTarget, type,
        const:type.constructor,
        prot:type.prototype,
        getPro:Object.getPrototypeOf(type),
        
    })
    console.dir(type);
    return r;

}
let classTarget, columnTarget;
let type;


function classDecorator() {
    return target => classTarget = target;
}
function columnDecorator() {
    return (target, key) => {
        columnTarget = target.constructor;
        type = Reflect.getMetadata("design:type", target, key);

    }
}

@classDecorator()
export class Language {
    static Hebrew = new Language(0, 'עברית');
    static Russian = new Language(10, 'רוסית');
    static Amharit = new Language(20, 'אמהרית');
    constructor(public id: number,
        public caption: string) {

    }

}


class myEntity {
    @columnDecorator()
    a:Language= Language.Hebrew;
}