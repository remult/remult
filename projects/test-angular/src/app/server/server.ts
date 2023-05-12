import { CustomModuleLoader } from './CustomModuleLoader';
let moduleLoader = new CustomModuleLoader('/dist/test-angular');
import express, { application } from "express";
import { remultExpress } from '../../../../core/remult-express'
import { Task } from "../products-test/products.component";
import { remult } from '../../../../core';
import { oneMore } from './oneMore';

const app = express()
export const api = remultExpress({ entities: [Task] })
app.use(api)

app.get('/c', async (req, res) => {
    res.json(await oneMore(req, async () => remult.repo(Task).count()));
})
app.get('/b', api.withRemult, async (req, res) => res.json(await remult.repo(Task).count()))

app.use(api.withRemult)

app.get('/a', async (req, res) => res.json(await remult.repo(Task).count()))


app.listen(3002);


