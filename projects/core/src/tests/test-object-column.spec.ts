import { itAsync, Done, fitAsync } from './testHelper.spec';
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { ServerContext } from '../context';
import { SqlDatabase } from '../data-providers/sql-database';




import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { Column, Entity, EntityBase } from '../remult3';
import { JsonValueLoader, StoreAsStringValueConverter } from '../columns/loaders';


describe("test object column", () => {
    var wsql = new WebSqlDataProvider("test");
    let db = new SqlDatabase(wsql);
    let context = new ServerContext();
    context.setDataProvider(db);
    async function deleteAll() {
        let e = context.for(ObjectColumnTest).defs;
        await wsql.dropTable(e);
        await wsql.createTable(e);
    }
    itAsync("test basics with wsql", async () => {
        await deleteAll();
        var x = context.for(ObjectColumnTest).create();
        x.id = 1;
        x.col = {
            firstName: 'noam',
            lastName: 'honig'
        }
        await x.save();
        x = await context.for(ObjectColumnTest).findFirst();
        expect(x.col.firstName).toBe('noam');
        x = await context.for(ObjectColumnTest).findFirst(x => x.col.contains("yael"));
        expect(x).toBeUndefined();
        x = await context.for(ObjectColumnTest).findFirst(x => x.col.contains("noam"));
        expect(x.id).toBe(1);

    });
    itAsync("test basics with json", async () => {

        var mem = new InMemoryDataProvider();
        var c = new ServerContext(mem);

        var x = c.for(ObjectColumnTest).create();
        x.id = 1;
        x.col = {
            firstName: 'noam',
            lastName: 'honig'
        }
        await x.save();
        x = await context.for(ObjectColumnTest).findFirst();
        expect(x.col.firstName).toBe('noam');
        expect(mem.rows[x._.repository.defs.key][0].col).toEqual({
            firstName: 'noam',
            lastName: 'honig'
        });
    });


});

@Entity({ key: 'objectColumnTest' })
class ObjectColumnTest extends EntityBase {
    @Column()
    id: number;
    @Column({
        valueConverter: () => new JsonValueLoader()
    })
    col: person;
}

interface person {
    firstName: string;
    lastName: string;
}