import * as express from "express";
import { remultExpress } from "../../../../core/remult-express";
import { Task } from "./Task";

const app = express();
const api = remultExpress({ entities: [Task] });
app.use(api);
app.get('/api/test', async (req, res) => {
    const remult = await api.getRemult(req);
    return { result: await remult.repo(Task).count() }
})
const port = 3004;
app.listen(port, () => console.log("express " + port));