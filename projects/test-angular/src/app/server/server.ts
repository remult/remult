import { CustomModuleLoader } from './CustomModuleLoader';
let moduleLoader = new CustomModuleLoader('/dist/test-angular');
import express, { application } from "express";
import { remultExpress } from '../../../../core/remult-express'
import { Category, Task, TasksController, TasksControllerDecorated } from "../products-test/products.component";
import { JsonDataProvider, Remult, remult } from '../../../../core';
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
app.use((req, res, next) => {
    //@ts-ignore
    req.session = "noam"
    next()
})
export const api = remultExpress({
    entities: [Task, Category],
    controllers: [TasksController, TasksControllerDecorated],
    queueStorage: new EntityQueueStorage(r.repo(JobsInQueueEntity)),
    //@ts-ignore
    getUser: ({ session }) => {
        console.log(session)
        return undefined;
    }
})
app.use(api)


const openApiDocument = api.openApiDoc({ title: 'remult-react-todo' })
fs.writeFileSync('/temp/test.json', JSON.stringify(openApiDocument, undefined, 2))
app.get('/api/openApi.json', (req, res) => res.json(openApiDocument));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
const { typeDefs, rootValue, resolvers } = remultGraphql(api);

app.use('/api/graphql', graphqlHTTP({
    schema: buildSchema(typeDefs),
    rootValue,
    graphiql: true,
}));

const yoga = createYoga({
    graphqlEndpoint: '/api/yogaGraphql',
    schema: (createSchema({
        typeDefs,
        resolvers
    }))
})
app.get('/test', (req, res) => {
    let z = rootValue;
    res.send("t")
})
app.use(yoga.graphqlEndpoint, yoga)





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
