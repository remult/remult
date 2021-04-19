//import { CustomModuleLoader } from '../../../../../../repos/radweb/src/app/server/CustomModuleLoader';
//let moduleLoader = new CustomModuleLoader('/dist-server/repos/radweb/projects/');
import * as express from 'express';
import { initExpress } from '@remult/core/server';
import * as fs from 'fs';
import { SqlDatabase } from '@remult/core';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { PostgresDataProvider, verifyStructureOfAllEntities } from '@remult/server-postgres';
//@ts-ignore
import * as forceHttps from 'express-force-https';
import * as jwt from 'jsonwebtoken';
import * as compression from 'compression';
import * as passwordHash from 'password-hash';
import '../app/app.module';
import { PasswordColumn } from '../app/users/users';

config(); //loads the configuration from the .env file
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DEV_MODE ? false : { rejectUnauthorized: false }// use ssl in production but not in development. the `rejectUnauthorized: false`  is required for deployment to heroku etc...
});
let database = new SqlDatabase(new PostgresDataProvider(pool));
verifyStructureOfAllEntities(database); //This method can be run in the install phase on the server.

PasswordColumn.passwordHelper = {
    generateHash: p => passwordHash.generate(p),
    verify: (p, h) => passwordHash.verify(p, h)
}

let app = express();
app.use(compression());
if (!process.env.DEV_MODE)
    app.use(forceHttps); 
initExpress(app, database, { 
    tokenProvider: {
        createToken: userInfo => jwt.sign(userInfo, <string> process.env.TOKEN_SIGN_KEY ),
        verifyToken: token => jwt.verify(token, <string> process.env.TOKEN_SIGN_KEY)
    }
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