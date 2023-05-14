import { CustomModuleLoader } from './CustomModuleLoader';
let moduleLoader = new CustomModuleLoader('/dist/test-angular');
import express, { application } from "express";
import { remultExpress } from '../../../../core/remult-express'
import { Task } from "../products-test/products.component";
import { JsonDataProvider, Remult, remult } from '../../../../core';
import { oneMore } from './oneMore';
import { getHeapFromFile } from '@memlab/heap-analysis';
import * as heapdump from 'heapdump'
import { preparePostgresQueueStorage } from '../../../../core/postgres'
import { JsonFileDataProvider } from '../../../../core/server';
import { JobsInQueueEntity } from '../../../../core/server/expressBridge';
import { EntityQueueStorage } from '../../../../core/server/expressBridge';

var r = new Remult();
r.dataProvider = new JsonFileDataProvider('./db');

const app = express()
export const api = remultExpress({
    entities: [Task],
    queueStorage: new EntityQueueStorage(r.repo(JobsInQueueEntity))
})
app.use(api)

app.get('/c', async (req, res) => {
    res.json(await oneMore(req, async () => remult.repo(Task).count()));
})
app.get('/b', api.withRemult, async (req, res) => res.json(await remult.repo(Task).count()))



app.get('/a', api.withRemult, async (req, res) => res.json({ what: (remult.subscriptionServer as any).connections.length }))

app.get('/api/remultCount', api.withRemult, (req, res) => {
    console.log("god here")
    heapdump.writeSnapshot('./test.heapsnapshot');

    getHeapFromFile('./test.heapsnapshot').then(heapGraph => {
        let remultCount = 0;
        let testMemCount = 0;
        heapGraph.nodes.forEach(node => {
            if (node.name == ('Remult')) {
                remultCount++;
            }
            if (node.name === "TestMem123") {
                testMemCount++;
            }
        }
        );
        res.json({
            remultCount,
            testMemCount,
            openQueries: (remult.liveQueryStorage as any).queries.length,
            sse: (remult.subscriptionServer as any).connections.length
        })
    })
})


app.listen(3001);
