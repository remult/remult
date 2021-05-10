import '../app.module';

import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, PostgresSchemaBuilder } from '@remult/server-postgres';
import * as passwordHash from 'password-hash';

import '../app.module';
import { SqlDatabase } from '@remult/core';
import { Column, Entity, entityInfo, columnsOfType } from '../../../projects/core/src/remult3';







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
    if (false)
        console.log({
            bp: b.prototype,
            columnsA: columnsOfType.get(a.prototype),
            columnsB: columnsOfType.get(b.prototype),

        })
    let c = new child();
    console.log(c instanceof entityBase);


    return r;

}

class entityBase {

}
@Entity({name:'x'})
class child extends entityBase {

}

@Entity({ name: 'a' })
class a {
    @Column()
    a: string;
    @Column()
    a1: string;
}
@Entity({ name: 'b' })
class b extends a {
    @Column()
    b: string;
}