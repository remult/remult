import { CustomModuleLoader } from './CustomModuleLoader';

let moduleLoader = new CustomModuleLoader('/dist/test-angular');
import * as express from 'express';
import * as swaggerUi from 'swagger-ui-express';
import * as cors from 'cors';
import * as Knex from 'knex';

import * as fs from 'fs';
//import '../app.module';
import { serverInit } from './server-init';
import { remultGraphql } from 'remult/graphql';
import { createKnexDataProvider } from 'remult/remult-knex';

import { createPostgresConnection, preparePostgresQueueStorage } from 'remult/postgres';

import * as compression from 'compression';
import * as forceHttps from 'express-force-https';
import * as jwt from 'express-jwt';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import { remultExpress } from '../../../../core/remult-express';


import { controllerWithInstance, controllerWithStaic, stam } from '../products-test/products.component';

import { AppComponent } from '../app.component';
import { Task } from './Task';
import { createRemultServer } from '../../../../core/server';
import { remult } from '../../../../core/src/remult-proxy';
import { APP_ID } from '@angular/core';
import { AsyncLocalStorage } from 'async_hooks';
import axios from 'axios';
import { buildRestDataProvider } from '../../../../core/src/context';
import { Action, BackendMethodCaller, serverActionField } from '../../../../core/src/server-action';






const getDatabase = async () => {

    const result = await createKnexDataProvider({
        client: 'mssql',
        connection: {
            server: '127.0.0.1',
            database: 'test2',
            user: 'sa',
            password: 'MASTERKEY',
            options: {
                enableArithAbort: true,
                encrypt: false,
                instanceName: 'sqlexpress'
            }
        }
    });
    return result;
}

const st = new AsyncLocalStorage();

const d = new Date(2020, 1, 2, 3, 4, 5, 6);
serverInit().then(async (dataSource) => {




    let app = express();
    app.use(jwt({ secret: process.env.TOKEN_SIGN_KEY, credentialsRequired: false, algorithms: ['HS256'] }));
    app.use(cors());
    app.use(compression());
    if (process.env.DISABLE_HTTPS != "true")
        app.use(forceHttps);



    let remultApi = remultExpress({
        entities: [stam, Task],
        controllers: [controllerWithInstance, controllerWithStaic, AppComponent],
        // dataProvider: createPostgresConnection(),
        queueStorage: await preparePostgresQueueStorage(dataSource),
        logApiEndPoints: true,
        initRequest: async () => {

        },
        initApi: async remultParam => {
            //SqlDatabase.LogToConsole = true;

            const caller = new BackendMethodCaller('http://localhost:3001/api',axios);
            caller.call(stam.staticBackendMethod)().then(x => console.log("ok", x)).catch(err => console.error(err))
            
            

            //p.post('http://localhost:3001/api/staticBackendMethod', { args: [] }).then(x => console.log("ok", x)).catch(err => console.error(err));


        }
    });

    app.use(express.json());
    app.use(remultApi);





    app.use('/api/docs', swaggerUi.serve,
        swaggerUi.setup(remultApi.openApiDoc({ title: 'remult-angular-todo' })));


    app.use(express.static('dist/my-project'));
    let g = remultGraphql(remultApi);
    app.use('/api/graphql', graphqlHTTP({
        schema: buildSchema(g.schema),
        rootValue: g.rootValue,
        graphiql: true,
    }));


    app.use('/*', async (req, res) => {
        const index = 'dist/my-project/index.html';
        if (fs.existsSync(index)) {
            res.send(fs.readFileSync(index).toString());
        }
        else {
            console.log({
                body: req.body,
                path: req.path,
                x: req.originalUrl,
                method: req.method
            });
            res.send('No Result ' + req.path);
        }
    });



    let port = process.env.PORT || 3001;
    app.listen(port);
});




