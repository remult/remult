import { Orders, Customers, Shippers, Products, Order_details } from './../models';
import { DataApi, DataApiResponse, DataApiError } from './../../utils/server/DataApi';
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
app.use(function (req, res, next) {
  
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Origin", req.header('origin'));
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  
  next();
});

var eb = new ExpressBridge(app, '/dataApi');
eb.add(new Categories());
eb.add(new Order_details());
eb.add(new Orders());
eb.add(new Customers());
eb.add(new Products());
eb.add(new Shippers());


console.log('working 13');

app.listen(port);
