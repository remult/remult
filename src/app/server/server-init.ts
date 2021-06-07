import '../app.module';

import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, PostgresSchemaBuilder } from '@remult/core/postgres';
import * as passwordHash from 'password-hash';


import { ServerContext, ServerController, SqlDatabase } from '@remult/core';









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
    console.log("123");
       await new PostgresSchemaBuilder( r).verifyStructureOfAllEntities();
       console.log("123");

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

