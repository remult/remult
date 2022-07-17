import { CustomModuleLoader } from './CustomModuleLoader';
let moduleLoader = new CustomModuleLoader('/dist/test-angular');
import * as express from 'express';
import * as swaggerUi from 'swagger-ui-express';
import * as cors from 'cors';

import * as fs from 'fs';
//import '../app.module';
import { serverInit } from './server-init';
import { remultGraphql } from 'remult/graphql';
import { preparePostgresQueueStorage } from 'remult/postgres';

import * as compression from 'compression';
import * as forceHttps from 'express-force-https';
import * as jwt from 'express-jwt';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import { remultExpress } from '../../../../core/server/expressBridge';


import { AppComponent } from '../app.component';
import { ServerEventsController } from './server-events';
import { helper, liveQueryMessage, Task } from '../products-test/products.component';
import { EventType } from '../products-test/ListenManager';



const d = new Date(2020, 1, 2, 3, 4, 5, 6);
serverInit().then(async (dataSource) => {

    let app = express();
    app.use(jwt({ secret: process.env.TOKEN_SIGN_KEY, credentialsRequired: false, algorithms: ['HS256'] }));
    app.use(cors());
    const serverEvents = new ServerEventsController();

    const sendTaskMessage = (m: liveQueryMessage) => serverEvents.SendMessage(m, "tasks");

    helper.onSaved = item => {
        if (item.isNew())
            sendTaskMessage({
                type: "add",
                data: item._.toApiJson()
            })
        else
            sendTaskMessage({
                type: "replace",
                data: {
                    oldId: item.$.id.originalValue,
                    item: item._.toApiJson()
                }
            })
    }
    helper.onDeleted = item => {
        sendTaskMessage({
            type: "remove",
            data: { id: item.id }
        })
    }



    app.post('/api/stream', (req, res) => {
        const types = JSON.parse(req.headers["event-types"] as string);


        const r = serverEvents.subscribe(req, res,
            (message, messageType) => {
                for (const t of types) {
                    const type: EventType = JSON.parse(t);
                    if (type.type == "query")
                        if (type.entityKey == messageType) {
                            r.write(undefined, message, t);
                            return false;
                        }
                }
                return types.includes(messageType);
            }  //return true to send the message - use this arrow function to filter the messages based on the user or other rules
        );
        for (const t of types) {
            const type: EventType = JSON.parse(t);
            if (type.type == "query")
                if (type.entityKey === "tasks")
                    remultApi.getRemult(req).then(async (remult) => {
                        remult.repo(Task).find({
                            orderBy:type.orderBy
                        }).then(tasks => {
                            let m: liveQueryMessage = {
                                type: 'all',
                                data: tasks.map(t => t._.toApiJson())
                            }
                            r.write(undefined, m, t)
                        });
                    });
        }



    });

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

/* event work
[] replace when id changed
[] id that is not the id field
*/