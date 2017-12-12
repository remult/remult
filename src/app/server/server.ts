import { Orders, Customers, Shippers, Products } from './../models';
import { DataApi, DataApiResponse, DataApiError } from './../../utils/DataApi';
import { SQLServerDataProvider } from '../../utils/server/SQLServerDataProvider';
import { environment } from './../../environments/environment';
import { JsonFileDataProvider } from './../../utils/server/JsonFileDataProvider';
import { InMemoryDataProvider } from './../../utils/inMemoryDatabase';

import { Categories } from '../models';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import { ExpressBridge } from './../../utils/server/expressBridge';

let app = express();
let port = 3000;
environment.dataSource = new JsonFileDataProvider('./appData');
environment.dataSource = new SQLServerDataProvider('sa', 'MASTERKEY', '127.0.0.1', 'northwind', 'sqlexpress');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var eb = new ExpressBridge(app, '/dataApi');
eb.add(new Categories());
eb.add(new Orders());
eb.add(new Customers());
eb.add(new Products());
eb.add(new Shippers());


console.log('working 13');

app.listen(port);
