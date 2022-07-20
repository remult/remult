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

import { preparePostgresQueueStorage } from 'remult/postgres';

import * as compression from 'compression';
import * as forceHttps from 'express-force-https';
import * as jwt from 'express-jwt';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import { remultExpress } from '../../../../core/remult-express';
import { remultMiddleware } from '../../../../core/remult-middleware';

import { controllerWithInstance, controllerWithStaic, stam } from '../products-test/products.component';

import { AppComponent } from '../app.component';
import { Entity, Fields } from '../../../../core/src/remult3';
import { Validators } from '../../../../core/src/validators';
import { BackendMethod } from '../../../../core/src/server-action';






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


const d = new Date(2020, 1, 2, 3, 4, 5, 6);
serverInit().then(async (dataSource) => {

    let app = express();
    app.use(jwt({ secret: process.env.TOKEN_SIGN_KEY, credentialsRequired: false, algorithms: ['HS256'] }));
    app.use(cors());
    app.use(compression());
    if (process.env.DISABLE_HTTPS != "true")
        app.use(forceHttps);

    const mw = remultMiddleware({
        entities: [stam, Task],
        controllers: [controllerWithInstance, controllerWithStaic, AppComponent]
    })

    let remultApi = remultExpress({
        entities: [stam,Task],
        controllers: [controllerWithInstance, controllerWithStaic, AppComponent],
        // dataProvider:async ()=>await  createPostgresConnection(),
        queueStorage: await preparePostgresQueueStorage(dataSource),
        logApiEndPoints: true,
        initApi: async remult => {
            //SqlDatabase.LogToConsole = true;
            await remult.repo(stam).findFirst();
        }
    });

    app.use(express.json());
    app.use(remultApi);
    app.use('/api/docs', swaggerUi.serve,
        swaggerUi.setup(remultApi.openApiDoc({ title: 'remult-angular-todo' })));

    app.use(express.static('dist/my-project'));
    app.get('/api/noam', async (req, res) => {
        let c = await remultApi.getRemult(req);
        res.send('hello ' + JSON.stringify(c.user));
    });

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
                method:req.method
            });
            res.send('No Result ' + req.path);
        }
    });




    let port = process.env.PORT || 3001;
    app.listen(port);
});



@Entity("tasks", {
    allowApiCrud: true
})
export class Task {
    @Fields.uuid()
    id!: string;

    @Fields.string({
        validate: Validators.required
    })
    title = '';

    @Fields.boolean()
    completed = false;
    @BackendMethod({ allowed: false })
    static testForbidden() {

    }
}
