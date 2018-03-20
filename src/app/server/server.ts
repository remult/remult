import { Orders, Customers, Shippers, Products, Order_details } from './../models';
import { DataApi, DataApiResponse, DataApiError } from './../../utils/server/DataApi';
import { SQLServerDataProvider } from '../../utils/server/SQLServerDataProvider';
import { environment } from './../../environments/environment';
import { JsonFileDataProvider } from './../../utils/server/JsonFileDataProvider';
import { InMemoryDataProvider } from './../../utils/inMemoryDatabase';
import { Sort } from './../../utils/utils';

import { Categories } from '../models';
import * as express from 'express';
import * as fs from 'fs';
import { ExpressBridge } from './../../utils/server/expressBridge';



let app = express();
let port = 3001;



environment.dataSource = new JsonFileDataProvider('./appData');
let sqlServer = new SQLServerDataProvider('sa', 'MASTERKEY', '127.0.0.1', 'northwind', 'sqlexpress');
environment.dataSource = sqlServer;



var eb = new ExpressBridge(app);
let dataApi = eb.addArea('/dataApi');
dataApi.addSqlDevHelpers(sqlServer);
dataApi.add(r => new DataApi(new Categories(), {
    allowUpdate: true,
    onSavingRow: async c => {
        if (c.description.value.length < 5) {
            c.description.error = 'Description too short ';
        }
        if (c.isNew())
            c.id.value = await c.source.max(c.id) + 1;
    },
}));
dataApi.add(new Order_details());
dataApi.add(new Orders());
dataApi.add(new Customers());
dataApi.add(new Products());
dataApi.add(new Shippers());


app.listen(port);
