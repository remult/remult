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


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.route('/').get((req, res) => {
  let c = new Categories();
  return c.source.find().then(x => res.json(x.map(y => y.__toPojo())));
});

console.log('working 13');

app.listen(port);
