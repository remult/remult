import * as express from "express";
import { remultMiddleware } from "../../../../core/remult-middleware";
import { Task } from "./Task";

const app = express();
app.use(express.json());
app.use(remultMiddleware({ entities: [Task] }));
const port = 3005;
app.listen(port, () => console.log("mw " + port));