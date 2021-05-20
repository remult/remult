import '../app.module';

import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, PostgresSchemaBuilder } from '@remult/core/postgres';
import * as passwordHash from 'password-hash';


import { ServerController, SqlDatabase } from '@remult/core';
import { Column, Entity, entityInfo, columnsOfType, getControllerDefs } from '../../../projects/core/src/remult3';








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
    
    return r;

}
let classTarget, columnTarget;


function classDecorator() {
    return target => classTarget = target;
}
function columnDecorator() {
    return (target, key) => {
        columnTarget = target.constructor;
    }
}

class baseClass {
    constructor() {

    }
}
@classDecorator()
class myClass extends baseClass {
    @columnDecorator()
    a: string;
}
