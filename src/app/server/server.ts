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
app.route('/:id').get((req, res) => {
  let c = new Categories();
  return c.source.find({ where: c.id.isEqualTo(req.params.id) }).then(
    x => res.json(x.map(y => y.__toPojo())[0]));
}).put(async (req, res) => {

  let c = new Categories();
  c = (await c.source.find({ where: c.id.isEqualTo(req.params.id) }))[0];
  c.id.value = req.body.id
  c.categoryName.value = req.body.categoryName;
  c.description.value = req.body.description;
  await c.save();
  res.json(c.__toPojo());
}).post(async (req, res) => {

  let c = new Categories();
  c.id.value = req.body.id
  c.categoryName.value = req.body.categoryName;
  c.description.value = req.body.description;
  await c.save();
  res.json(c.__toPojo());
}).delete(async (req, res) => {

  let c = new Categories();
  c = (await c.source.find({ where: c.id.isEqualTo(req.params.id) }))[0];
  await c.delete();
  res.end();
});

console.log('working 13');

app.listen(port);
