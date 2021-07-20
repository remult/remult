import { CustomModuleLoader } from './CustomModuleLoader';
let moduleLoader = new CustomModuleLoader('/dist-server/projects');
import * as express from 'express';
import * as cors from 'cors';
import { initExpress } from 'remult/server';
import * as fs from 'fs';
//import '../app.module';
import { serverInit } from './server-init';


import { preparePostgresQueueStorage } from 'remult/postgres';

import * as compression from 'compression';
import * as forceHttps from 'express-force-https';
import * as jwt from 'express-jwt';
import { Context, Field, FieldMetadata, FieldsMetadata, Filter, Repository } from '../../../projects/core';
import { Products } from '../products-test/products';

import { isJSDocTypedefTag } from 'typescript';
import { ClassType } from 'remult/classType';
import { } from 'remult';
import { Injectable } from '@angular/core';






const d = new Date(2020, 1, 2, 3, 4, 5, 6);
serverInit().then(async (dataSource) => {

    let app = express();
    app.use(jwt({ secret: process.env.TOKEN_SIGN_KEY, credentialsRequired: false, algorithms: ['HS256'] }));
    app.use(cors());
    app.use(compression());
    if (process.env.DISABLE_HTTPS != "true")
        app.use(forceHttps);

    let s = initExpress(app, {
        //       dataProvider:dataSource,
        queueStorage: await preparePostgresQueueStorage(dataSource),

    });

    app.use(express.static('dist/my-project'));
    app.get('/api/noam', async (req, res) => {
        let c = await s.getValidContext(req);
        res.send('hello ' + JSON.stringify(c.user));
    });

    app.use('/*', async (req, res) => {
        console.log(req.path);
        const index = 'dist/my-project/index.html';
        if (fs.existsSync(index)) {
            res.send(fs.readFileSync(index).toString());
        }
        else {
            res.send('No Result' + index);
        }
    });


    let port = process.env.PORT || 3001;
    app.listen(port);
});

export interface EntityOptions<entityType = any, depsType = any> {

    id?: (entity: FieldsMetadata<entityType>) => FieldMetadata;
    dbAutoIncrementId?: boolean;
    dbName?: string | ((entity: FieldsMetadata<entityType>, context: Context) => string);
    key: string;
    saving?: (row: entityType, proceedWithoutSavingToDb: () => void) => Promise<any> | any;
    caption?: string | ((context: depsType) => string);
}


function Entity<T>(options: EntityOptions<T>, optionsType: EntityOptionsBuilder<T>) {
    return (a) => { return a }
}
function Entity4<T>(...options: (EntityOptions<T> | EntityOptionsBuilder<T>)[]) {
    return (a) => { return a }
}
class EntityOptionsBuilder<entityType>{
    constructor(options: EntityOptions) {

    }
}
function Entity2<T>(types: any[],
    setOptions: (call: (options: EntityOptions<T>) => void, a: any) => void) {
    return (a) => { return a }
}
function Entity3(types: R,
    setOptions: (call: (options: EntityOptions<T>) => void, a: any) => void) {
    return (a) => { return a }
}





// my code starts

class UberContext {
    maShebaLi: string;
}
@Injectable()
class EntityInfo extends EntityOptionsBuilder<e> {
    doSomething() {
        return '123';
    }
    constructor(context: Context) {
        super({
            key: this.doSomething(),
            dbAutoIncrementId: true
        });
    }
}
@Entity4<e>({
    key: '123',
    dbName: self =>
        'select ' + self.a.dbName + ", ",
    saving: self => self.a + self.b,
    caption: (x) => x.maShebaLi
})
// @Entity2<e>([Context], (call, context: any) => {
//     call({ dbName: '123', key: 'asdf' })
// })
// @Entity3({
//     context: Context
// }, (call, { context }) => {
//     call({
//         key: context.
//     })
// })
class e {
    a: number;
    private b: number;
}




let x: EntityOptions<e>;
x = {
    key: '123',
    kaki: '456'
}
let y: () => EntityOptions<e>;
function constructOptions<T>(options: EntityOptions<T>): EntityOptions<T> {
    return undefined;
}
y = () => ({ key: '123', kaki: '543' });
y = () => constructOptions({ key: '123', kaki: '56564' });




function builder(deps: any[],
    whatToDo: (build: (options: EntityOptions<any>) => void) => void) {

}

builder([Context], (build,context:Context) => build(key: 'asdf', klaka: 'asdf'));