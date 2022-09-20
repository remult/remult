import * as express from "express";
import { remultExpress } from "../../../../core/remult-express";
import { Pool } from "pg";


const pg = new Pool({
  connectionString: "...."
})

const app = express();
app.use(remultExpress({

}))