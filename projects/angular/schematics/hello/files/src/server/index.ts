//import { CustomModuleLoader } from '../../../../../../repos/radweb/src/app/server/CustomModuleLoader';
//let moduleLoader = new CustomModuleLoader('/dist-server/repos/radweb/projects/');
import * as express from 'express';
import { initExpress } from 'remult/server';
import * as fs from 'fs';
import { DataProvider, Remult, SqlDatabase } from 'remult';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, verifyStructureOfAllEntities } from 'remult/postgres';
import * as helmet from 'helmet';
import * as jwt from 'express-jwt';
import * as compression from 'compression';

import '../app/app.module';
import { getJwtTokenSignKey } from '../app/auth.service';
async function startup() {
    config(); //loads the configuration from the .env file
    let dataProvider: DataProvider | undefined;

    // use json db for dev, and postgres for production
    if (!process.env.DEV_MODE) {//if you want to use postgres for development - change this if to be if(true)
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DEV_MODE ? false : { rejectUnauthorized: false }// use ssl in production but not in development. the `rejectUnauthorized: false`  is required for deployment to heroku etc...
        });
        let database = new SqlDatabase(new PostgresDataProvider(pool));
        var remult = new Remult();
        remult.setDataProvider(database);
        await verifyStructureOfAllEntities(database, remult);
        dataProvider = database;
    }

    let app = express();
    app.use(jwt({ secret: getJwtTokenSignKey(), credentialsRequired: false, algorithms: ['HS256'] }));
    app.use(compression());
    app.use(
        helmet({
            contentSecurityPolicy: false,
        })
    );
    initExpress(app, {
        dataProvider
    });
    app.use(express.static('dist/<%= project %>'));
    app.use('/*', async (req, res) => {
        try {
            res.send(fs.readFileSync('dist/<%= project %>/index.html').toString());
        } catch (err) {
            res.sendStatus(500);
        }
    });
    let port = process.env.PORT || 3000;
    app.listen(port);
}
startup();