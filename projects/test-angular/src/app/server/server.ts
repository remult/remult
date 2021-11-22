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
import { stam } from '../products-test/products.component';
import { EntityBase, Filter } from '../../../../core';
import { DataApi } from '../../../../core/src/data-api';
import { remultExpress } from '../../../../core/server/expressBridge';



const getDatabase = () => {
    if (1 + 1 == 3)
        return undefined;
    return createPostgresConnection({
        configuration: {
            user: "postgres",
            password: "MASTERKEY",
            host: "localhost",
            database: "postgres"
        }
    })
}


const d = new Date(2020, 1, 2, 3, 4, 5, 6);
serverInit().then(async (dataSource) => {

    let app = express();
    app.use(jwt({ secret: process.env.TOKEN_SIGN_KEY, credentialsRequired: false, algorithms: ['HS256'] }));
    app.use(cors());
    app.use(compression());
    if (process.env.DISABLE_HTTPS != "true")
        app.use(forceHttps);



    let remultApi = remultExpress({
        dataProvider: getDatabase(),
        queueStorage: await preparePostgresQueueStorage(dataSource),
        defaultGetLimit: 5
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


class a extends EntityBase {
    title: string;
}
class b {
    title: string;
    $: string;
}

function findNoam<entityType>(): {
    count(): Promise<number>;
    isFirst: boolean;
    isLast: boolean;
    next(rows: number): Promise<entityType[]>;
    previous(rows: number): Promise<entityType[]>;

    [Symbol.asyncIterator](): {
        next: () => Promise<IteratorResult<entityType, entityType>>;
    };
} {
    return undefined;
}

async function myCode() {
    for (const task of await findNoam<a>().next(100)) {

    }
    for await (const task of findNoam<a>()) {

    }
    let manyOfa = findNoam<a>();
}
function find<entityType>(options?: {
    page: number,
    limit: number
}): Promise<findResponse<entityType>> {
    return undefined;

}

//find many
interface findResponse<entityType> {
    items: entityType[]
    count(): Promise<number>, //tbd
    hasNextPage: boolean,
    hasPreviousPage: boolean,
    nextPage(): Promise<findResponse<entityType>>,
    previousPage(): Promise<findResponse<entityType[]>>,
    forEach(what: (item: entityType) => Promise<any>): Promise<number>;//why number
    map<T>(how: (item: entityType, index: number) => Promise<T>): Promise<T[]>;
    [Symbol.asyncIterator](): {
        next: () => Promise<IteratorResult<entityType, entityType>>;
    };
}

[].map((a, b, c) => { })

// async function yoniFinction() {
//     const { items, count, isLast } = (await find<a>());

// }
// function gateWayFind(): {
//     items: entityType[],
//     count?: number,
//     nextToken,
//     backToken

// } {

// }

/*
our api get - or our api data provider, will return an array when stupid - or an object when not - and we'll wrap it.

*/