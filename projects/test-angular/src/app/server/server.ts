import { CustomModuleLoader } from './CustomModuleLoader';
let moduleLoader = new CustomModuleLoader('/dist/test-angular');
import * as express from 'express';
import * as swaggerUi from 'swagger-ui-express';
import * as cors from 'cors';

import * as fs from 'fs';
//import '../app.module';
import { serverInit } from './server-init';
import { remultGraphql } from 'remult/graphql';


import { createPostgresConnection, preparePostgresQueueStorage } from 'remult/postgres';

import * as compression from 'compression';
import * as forceHttps from 'express-force-https';
import * as jwt from 'express-jwt';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import { remultExpress } from '../../../../core/server/expressBridge';


import { AppComponent } from '../app.component';
import { ServerEventsController } from './server-events';
import { helper, Task } from '../products-test/products.component';
import { Writable } from 'stream';



const d = new Date(2020, 1, 2, 3, 4, 5, 6);
serverInit().then(async (dataSource) => {

    let app = express();
    app.use(jwt({ secret: process.env.TOKEN_SIGN_KEY, credentialsRequired: false, algorithms: ['HS256'] }));
    app.use(cors());
    const serverEvents = new ServerEventsController();
    app.post('/api/stream', (req, res) => {
        const types = JSON.parse(req.headers["event-types"] as string);


        serverEvents.subscribe(req, res,
            (message, type) => {

                return types.includes(type);
            }  //return true to send the message - use this arrow function to filter the messages based on the user or other rules
        );

    });
    helper.onSaving = () => {
        serverEvents.SendMessage("x");
        console.log("message sent");
    }
    {
        let i = 0;
        setInterval(() => {
            serverEvents.SendMessage("a:" + i++, "a");
        }, 1000);
    }
    setTimeout(() => {
        {
            let i = 0;
            setInterval(() => {
                serverEvents.SendMessage("b:" + i++, "b");
            }, 1000);
        }
    }, 500);

    app.use(compression());
    if (process.env.DISABLE_HTTPS != "true")
        app.use(forceHttps);



    let remultApi = remultExpress({
        entities: [Task],
        controllers: [AppComponent],
        //     dataProvider: async () => await createPostgresConnection(),
        queueStorage: await preparePostgresQueueStorage(dataSource),
        logApiEndPoints: true,
        initApi: async remult => {

        }
    });

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
            res.send('No Result' + index);
        }
    });


    let port = process.env.PORT || 3001;
    app.listen(port);
});

