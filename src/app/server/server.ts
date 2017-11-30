import { InMemoryDataProvider } from './../../utils/inMemoryDatabase';
import { Categories } from '../models';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';


let app = express();
let port = 3000;
let a: any = JSON.parse(fs.readFileSync('./appData/categories.json').toString());
let b: any[] = a as any[];
let mem = new InMemoryDataProvider();
mem.rows = b;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.route('/').get((req, res) => {
  let c = new Categories();
  c.setSource(mem);
  return c.source.find().then(x => res.json(x.map(y => y.__toPojo())));
  /*c.id.value = 1;
  c.categoryName.value = 'noam';
  res.json(c.__toPojo());
  res.end();*/

});
console.log('working');

app.listen(port);
