import '../app.module';

import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, PostgresSchemaBuilder } from '@remult/server-postgres';
import * as passwordHash from 'password-hash';

import '../app.module';


import { Users } from '../users/users';
import { SqlDatabase } from '@remult/core';
import { ConnectionOptions } from 'tls';


export async function serverInit() {

    config();
    let ssl: boolean | ConnectionOptions = {
        rejectUnauthorized: false
    };
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
    Users.passwordHelper = {
        generateHash: p => passwordHash.generate(p),
        verify: (p, h) => passwordHash.verify(p, h)
    }
    let result = new SqlDatabase(new PostgresDataProvider(pool));
    await new PostgresSchemaBuilder(result).verifyStructureOfAllEntities();
    return result;

}
