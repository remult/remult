import { CustomModuleLoader } from './CustomModuleLoader';
let moduleLoader = new CustomModuleLoader();

import { DataApi, Entity, NumberColumn, DateTimeColumn } from 'radweb';
import { Pool } from 'pg';
import { Orders, Customers, Shippers, Products, Order_details } from './../models';
import { environment } from './../../environments/environment';
import { Categories } from '../models';
import * as express from 'express';
import { JsonFileDataProvider, ExpressBridge } from 'radweb-server';

import { PostgrestSchemaBuilder, PostgresDataProvider } from 'radweb-server-postgres';

var p = new Pool({
    database: 'postgres', user: 'postgres', password: 'MASTERKEY', host: 'localhost'
});



let app = express();
let port = 3001;
;


//environment.dataSource = new JsonFileDataProvider('./appData');
//let sqlServer = new SQLServerDataProvider('sa', 'MASTERKEY', '127.0.0.1', 'northwind', 'sqlexpress');
//environment.dataSource = sqlServer;
environment.dataSource = new PostgresDataProvider(p);



var eb = new ExpressBridge(app, environment.dataSource, true);
let dataApi = eb.addArea('/dataApi');
//dataApi.addSqlDevHelpers(sqlServer);
dataApi.add(r => new DataApi(new Categories(), {
    allowUpdate: true,
    allowInsert: true,
    allowDelete: true,
    onSavingRow: async c => {

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


class testEntity extends Entity<number>{
    id = new NumberColumn();
    datet = new DateTimeColumn();
    constructor() {
        super(() => new testEntity(), environment.dataSource, 'testdt');
        this.initColumns(this.id);
    }
}

async function test() {
    var sb = new PostgrestSchemaBuilder(p);
    await sb.CreateIfNotExist(new testEntity());

    let x = new testEntity();
    x.datet.value = new Date();
    await x.save();
    var r = await x.source.find({});
    r[0].datet.value = new Date();
    await r[0].save();


}
