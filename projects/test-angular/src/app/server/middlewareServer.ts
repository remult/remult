import * as express from "express";

import { createRemultServer } from "../../../../core/server/expressBridge";
import { Task } from "./Task";

const app = express();
app.use(express.json());

const api = createRemultServer({ entities: [Task] });
app.use(async (req, res, next) => {
    await api.handle(req, res) || next()
});
app.get('/api/test', async (req, res) => {
    const remult = await api.getRemult(req);
    res.json({ result: await remult.repo(Task).count() })
})
const port = 3005;
app.listen(port, () => console.log("mw " + port));