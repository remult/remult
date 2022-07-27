import * as express from "express";
import { remultServer } from "../../../../core/remult-middleware";
import { Task } from "./Task";

const app = express();
app.use(express.json());
const api = remultServer({ entities: [Task] });
app.use(api);
app.get('/api/test', async (req, res) => {
    const remult = await api.getRemult(req);
    res.json({ result: await remult.repo(Task).count() })
})
const port = 3005;
app.listen(port, () => console.log("mw " + port));