import * as express from "express";
import { remultExpress } from "../../../../core/remult-express";
import { Task } from "./Task";

const app = express();
app.use(remultExpress({ entities: [Task] }));
const port = 3004;
app.listen(port, () => console.log("express " + port));