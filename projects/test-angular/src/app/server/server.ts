import { CustomModuleLoader } from './CustomModuleLoader';
import { writeToLog } from '../../../../core/myLog'
let moduleLoader = new CustomModuleLoader('/dist/test-angular');
import express from 'express';
import * as swaggerUi from 'swagger-ui-express';
import cors from 'cors';

import * as fs from 'fs';
//import '../app.module';
import { serverInit } from './server-init';
import { remultGraphql } from 'remult/graphql';
import { createKnexDataProvider } from 'remult/remult-knex';

import { createPostgresConnection, preparePostgresQueueStorage } from 'remult/postgres';

import compression from 'compression';
import forceHttps from 'express-force-https';
import jwt from 'express-jwt';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';


import { remultExpress } from '../../../../core/remult-express';


import { AppComponent } from '../app.component';
import { AsyncLocalStorage } from 'async_hooks';


import { Task } from '../products-test/products.component';
import { remultNext } from '../../../../core/remult-next'
import { DataProviderLiveQueryStorage } from '../../../../core/live-query/data-provider-live-query-storage'


import type * as Ably from 'ably';
import { Rest } from "ably/promises";
import { SubscriptionServer } from '../../../../core';


class AblySubscriptionServer implements SubscriptionServer {
    constructor(private ably: Ably.Types.RestPromise) { }
    async publishMessage<T>(channel: string, message: T) {
        console.log(
            new Date().toISOString() + ": " + channel + "\n" + JSON.stringify(message, undefined, 4)
        )
        await this.ably.channels.get(channel).publish({ data: message });
    }
}


const getDatabase = async () => {
    return createPostgresConnection({
        connectionString: process.env['DATABASE_URL']
    })
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



    app.use(compression({}));

    if (process.env.DISABLE_HTTPS != "true")
        app.use(forceHttps);

    writeToLog("asb");


    app.use(express.json());



    if (true) {
        const rNext = remultNext({
            entities: [Task],
            dataProvider: getDatabase(),// async () => await createPostgresConnection(),
            liveQueryStorage: new DataProviderLiveQueryStorage(getDatabase()),
            subscriptionServer: new AblySubscriptionServer(
                new Rest(process.env["ABLY_API_KEY"]!)
            ),
            initRequest: async (req, options) => {
                return
                const x = options.remult.subscriptionServer;

                options.remult.subscriptionServer = {
                    publishMessage: async (c, m) => {
                        console.log(c + "\n" + JSON.stringify(m, undefined, 2))
                        x.publishMessage(c, m);
                    },
                    //@ts-ignore
                    openHttpServerStream: (...args) => x.openHttpServerStream(...args),
                    //@ts-ignore
                    subscribeToChannel: (...args) => x.subscribeToChannel(...args)
                }

            }
        })
        app.use(async (req, res, next) => {
            if (req.path === '/api/getAblyToken') {
                const token = await new Rest(
                    process.env["ABLY_API_KEY"]!
                ).auth.createTokenRequest({
                    capability: {
                        "*": ["subscribe"],
                    },
                });
                res.status(200).json(token);
                return;
            }
            //@ts-ignore
            const r = await rNext(req, res)
            console.log("REQUEST DONE!!!!");
            if (!r)
                next();
        })
    }
    else {
        const rExpress = remultExpress({
            entities: [Task],
            dataProvider: getDatabase(),// async () => await createPostgresConnection(),
        })
        app.use(rExpress)
    }

    //app.use(remultApi);

    app.use('/*', async (req, res) => {
        const index = 'dist/my-project/index.html';
        if (fs.existsSync(index)) {
            res.send(fs.readFileSync(index).toString());
        }
        else {
            res.status(404).json('No Result ' + req.path);
        }
    });

    let port = process.env.PORT || 3001;
    app.listen(port);
});
