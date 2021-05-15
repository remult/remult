import { itAsync, Done, fitAsync } from './testHelper.spec';
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { ServerContext } from '../context';
import { SqlDatabase } from '../data-providers/sql-database';


import { ObjectColumn } from '../columns/object-column';

import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { NumberColumn } from '../column';

describe("test object column",  () => {
    var wsql = new WebSqlDataProvider("test");
    let db = new SqlDatabase(wsql);
    let context = new ServerContext();
    context.setDataProvider(db);
    // async function deleteAll() {
    //     let e = context.for_old(ObjectColumnTest).create();
    //     await wsql.dropTable(e);
    //     await wsql.createTable(e);
    // }
    //  itAsync("test basics with wsql", async () => {
    //     await deleteAll();
    //     var x = context.for_old(ObjectColumnTest).create();
    //     x.id.value = 1;
    //     x.col.value = {
    //         firstName: 'noam',
    //         lastName: 'honig'
    //     }
    //     await x.save();
    //     x = await context.for_old(ObjectColumnTest).findFirst();
    //     expect(x.col.value.firstName).toBe('noam');
    //     x = await context.for_old(ObjectColumnTest).findFirst(x=>x.col.contains("yael"));
    //     expect(x).toBeUndefined();
    //     x = await context.for_old(ObjectColumnTest).findFirst(x=>x.col.contains("noam"));
    //     expect(x.id.value).toBe(1);

    // });
    //  itAsync("test basics with json", async () => {

    //     var mem = new InMemoryDataProvider();
    //     var c = new ServerContext(mem);

    //     var x = c.for_old(ObjectColumnTest).create();
    //     x.id.value = 1;
    //     x.col.value = {
    //         firstName: 'noam',
    //         lastName: 'honig'
    //     }
    //     await x.save();
    //     x = await context.for_old(ObjectColumnTest).findFirst();
    //     expect(x.col.value.firstName).toBe('noam');
    //     expect(mem.rows[x.defs.name][0].col).toEqual({
    //         firstName:'noam',
    //         lastName:'honig'
    //     });
    // });


});

// class ObjectColumnTest extends Entity {
//     id = new NumberColumn();
//     col = new ObjectColumn<person>();
//     constructor() {
//         super({
//             name: 'objectColumnTest'
//         })
//     }
// }

interface person {
    firstName: string;
    lastName: string;
}