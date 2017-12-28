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
let port = 3000;



environment.dataSource = new JsonFileDataProvider('./appData');
let sqlServer = new SQLServerDataProvider('sa', 'MASTERKEY', '127.0.0.1', 'northwind', 'sqlexpress');
environment.dataSource = sqlServer;



var eb = new ExpressBridge(app, '/dataApi');
eb.addSqlDevHelpers(sqlServer);
eb.add(new Categories(), {
    onSavingRow: c => {
        if ( c.description.value.length < 5) {
            c.description.error = 'Description too short ';
        }
    },
    onNewRow: async c => {
        if (c.id.value <= 0) {
            let x = await c.source.find({ orderBy: new Sort({ column: c.id, descending: true }), limit: 1 });
            if (x.length > 0)
                c.id.value = x[0].id.value;

        }
    }
});
eb.add(new Order_details());
eb.add(new Orders());
eb.add(new Customers());
eb.add(new Products());
eb.add(new Shippers());


console.log('working 13');

app.listen(port);
