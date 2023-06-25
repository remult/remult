import { CustomModuleLoader } from './CustomModuleLoader';
let moduleLoader = new CustomModuleLoader('/dist/test-angular');
import express, { application } from "express";
import { remultExpress } from '../../../../core/remult-express'
import { Category, Task, TasksController, TasksControllerDecorated } from "../products-test/products.component";
import { Entity, Fields, JsonDataProvider, Remult, SqlDatabase, describeClass, remult } from '../../../../core';
import { JsonFileDataProvider } from '../../../../core/server';
import { JobsInQueueEntity } from '../../../../core/server/expressBridge';
import { EntityQueueStorage } from '../../../../core/server/expressBridge';
import { remultGraphql } from '../../../../core/graphql'
import swaggerUi from 'swagger-ui-express';
import { buildSchema } from 'graphql';
import { graphqlHTTP } from 'express-graphql';

import { createSchema, createYoga } from 'graphql-yoga'
import fs from 'fs'
import { MongoClient } from "mongodb"
import { MongoDataProvider } from '../../../../core/remult-mongo';
import { createPostgresDataProvider } from '../../../../core/postgres';
import { config } from 'dotenv'
config()







var r = new Remult();
r.dataProvider = new JsonFileDataProvider('./db');


const app = express()

export const api = remultExpress({
    entities: [Task, Category],
    controllers: [TasksController, TasksControllerDecorated],
    queueStorage: new EntityQueueStorage(r.repo(JobsInQueueEntity)),
    //@ts-ignore
    getUser: ({ session }) => {
        return undefined;
    },
    dataProvider: createPostgresDataProvider(),
    initApi: async () => {
        const e = class {

            a = 0;
            items: string[] = []
        }
        describeClass(e, Entity("testJsonFieldType2", { allowApiCrud: true }), {
            a: Fields.number(),
            items: Fields.json()
        })
        await remult.repo(e).insert({a:3,items:["a","b"]})

        console.log(await remult.repo(e).findId(3))

        const db = SqlDatabase.getDb(remult);
        //db.execute("insert into testJsonFieldType2 ()")
    }
})
app.use(api)


const openApiDocument = api.openApiDoc({ title: 'remult-react-todo' })
fs.writeFileSync('/temp/test.json', JSON.stringify(openApiDocument, undefined, 2))
app.get('/api/openApi.json', (req, res) => res.json(openApiDocument));


app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
const { typeDefs, rootValue, resolvers } = remultGraphql({
    entities: [Category, Task]
});

// app.use('/api/graphql', api.withRemult, graphqlHTTP({
//     schema: buildSchema(typeDefs),
//     rootValue,
//     graphiql: true,
// }));

fs.writeFileSync('/temp/gql.txt', typeDefs);

const yoga = createYoga({
    graphqlEndpoint: '/api/graphql',
    schema: (createSchema({
        typeDefs,
        resolvers
    }))
})
app.get('/test', (req, res) => {
    let z = rootValue;
    res.send("t")
})
app.use(yoga.graphqlEndpoint, api.withRemult, yoga)





// app.get('/api/remultCount', api.withRemult, (req, res) => {
//     console.log("god here")
//     heapdump.writeSnapshot('./test.heapsnapshot');

//     getHeapFromFile('./test.heapsnapshot').then(heapGraph => {
//         let remultCount = 0;
//         let testMemCount = 0;
//         heapGraph.nodes.forEach(node => {
//             if (node.name == ('Remult')) {
//                 remultCount++;
//             }
//             if (node.name === "TestMem123") {
//                 testMemCount++;
//             }
//         }
//         );
//         res.json({
//             remultCount,
//             testMemCount,
//             openQueries: (remult.liveQueryStorage as any).queries.length,
//             sse: (remult.subscriptionServer as any).connections.length
//         })
//     })
// })


app.listen(3001);
