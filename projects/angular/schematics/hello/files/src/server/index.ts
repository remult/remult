//import { CustomModuleLoader } from '../../../../../../repos/radweb/src/app/server/CustomModuleLoader';
//let moduleLoader = new CustomModuleLoader('/dist-server/repos/radweb/projects/');
import * as express from 'express';
import { initExpress } from '@remult/core/server';
import * as fs from 'fs';
import { DataProvider, SqlDatabase } from '@remult/core';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, verifyStructureOfAllEntities } from '@remult/server-postgres';
import * as forceHttps from 'express-force-https';
import * as jwt from 'express-jwt';
import * as compression from 'compression';

import '../app/app.module';
async function startup() {
    config(); //loads the configuration from the .env file
    let dataProvider: DataProvider;

    // use json db for dev, and postgres for production
    if (!process.env.DEV_MODE) {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DEV_MODE ? false : { rejectUnauthorized: false }// use ssl in production but not in development. the `rejectUnauthorized: false`  is required for deployment to heroku etc...
        });
        let database = new SqlDatabase(new PostgresDataProvider(pool));
        await verifyStructureOfAllEntities(database); 
        dataProvider = database;
    }

    let app = express();
    app.use(jwt({ secret: process.env.TOKEN_SIGN_KEY, credentialsRequired: false, algorithms: ['HS256'] }));
    app.use(compression());
    if (!process.env.DEV_MODE)
        app.use(forceHttps);
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