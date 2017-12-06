import { DataApi, DataApiResponse, DataApiError } from './../../utils/DataApi';
import { SQLServerDataProvider } from '../../utils/server/SQLServerDataProvider';
import { environment } from './../../environments/environment';
import { JsonFileDataProvider } from './../../utils/server/JsonFileDataProvider';
import { InMemoryDataProvider } from './../../utils/inMemoryDatabase';

import { Categories } from '../models';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';

let app = express();
let port = 3000;
environment.dataSource = new JsonFileDataProvider('./appData');
//environment.dataSource = new SQLServerDataProvider('sa', 'MASTERKEY', '127.0.0.1', 'northwind', 'sqlexpress');

let c = new Categories();
let api = new DataApi(c);

class ExpressResponseBridgeToDataApiResponse implements DataApiResponse {
  constructor(private r: express.Response) {

  }

  public success(data: any): void {
    this.r.json(data);
  }

  public notFound(): void {
    this.r.sendStatus(404);
  }

  public error(data: DataApiError): void {
    this.r.status(500).json(data);
  }
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.route('/').get((req, res) => {
  let rb = new ExpressResponseBridgeToDataApiResponse(res);
  let c = new Categories();
  return c.source.find().then(x => res.json(x.map(y => y.__toPojo())));
});
app.route('/:id').get((req, res) => {
  api.get(new ExpressResponseBridgeToDataApiResponse(res), req.params.id);
}).put(async (req, res) => {
  api.put(new ExpressResponseBridgeToDataApiResponse(res), req.params.id, req.body);
}).post(async (req, res) => {
  api.post(new ExpressResponseBridgeToDataApiResponse(res), req.body);
}).delete(async (req, res) => {
  api.delete(new ExpressResponseBridgeToDataApiResponse(res), req.params.id);
});

console.log('working 13');

app.listen(port);
