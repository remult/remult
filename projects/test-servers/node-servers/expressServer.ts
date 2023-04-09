import  express from "express";
import { remultExpress } from "../../core/remult-express";
import { remult } from "../../core/src/remult-proxy";
import { Task } from "../shared/Task";

const app = express();
const api = remultExpress({ entities: [Task] });
app.use(api);
app.get('/api/test',api.withRemult, async (req, res) => {
    res.json({ result: await remult.repo(Task).count() })
})
const port = 3004;
app.listen(port, () => console.log("express " + port));