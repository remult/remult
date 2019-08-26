import { CustomModuleLoader } from './CustomModuleLoader';
let moduleLoader = new CustomModuleLoader();

import { DataApi, Entity, NumberColumn, DateTimeColumn, EntityClass } from 'radweb';
import { Pool } from 'pg';
import { Orders, Customers, Shippers, Products, Order_details } from './../models';
import { environment } from './../../environments/environment';
import { Categories } from '../models';
import * as express from 'express';
import { JsonFileDataProvider, ExpressBridge, ActualSQLServerDataProvider } from 'radweb-server';

import { PostgrestSchemaBuilder, PostgresDataProvider } from 'radweb-server-postgres';
import '../app.module';
var p = new Pool({
    database: 'postgres', user: 'postgres', password: 'MASTERKEY', host: 'localhost'
});



let app = express();
let port = 3001;



//environment.dataSource = new JsonFileDataProvider('./appData');
//let sqlServer = new SQLServerDataProvider('sa', 'MASTERKEY', '127.0.0.1', 'northwind', 'sqlexpress');
//environment.dataSource = sqlServer;
environment.dataSource = new PostgresDataProvider(p);
ActualSQLServerDataProvider.LogToConsole = true;
new PostgrestSchemaBuilder(p).verifyStructureOfAllEntities();
let eb = new ExpressBridge(app, environment.dataSource,true);




app.listen(port);

@EntityClass
class testEntity extends Entity<number>{
    id = new NumberColumn();
    datet = new DateTimeColumn();
    constructor() {
        super( 'testdt');
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
