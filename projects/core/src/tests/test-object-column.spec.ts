import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { Context } from '../context';
import { SqlDatabase } from '../data-providers/sql-database';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { Field, Entity, EntityBase, FieldType } from '../remult3';
import { Filter } from '../filter/filter-interfaces';
import { set } from '../../set';


describe("test object column", () => {
    var wsql = new WebSqlDataProvider("test");
    let db = new SqlDatabase(wsql);
    let context = new Context();
    context.setDataProvider(db);
    async function deleteAll() {
        let e = context.for(ObjectColumnTest).metadata;
        await wsql.dropTable(e);
        await wsql.createTable(e);
    }

    it("test basics with wsql", async () => {
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

        expect(x.phone1).toBeNull();
        expect(x.phone2).toBeNull();
        expect(x.phone3).toBeNull();
        let sqlr = (await db.execute('select phone1,phone2,phone3 from ' + (await x._.repository.metadata.getDbName()))).rows[0];
        expect(sqlr.phone1).toBe('');
        expect(sqlr.phone2).toBeNull();
        expect(sqlr.phone3).toBe('');
        set(x, {
            phone1: new Phone("123"),
            phone2: new Phone("456"),
            phone3: new Phone("789")
        });
        await x.save();
        sqlr = (await db.execute('select phone1,phone2,phone3 from ' + (await x._.repository.metadata.getDbName()))).rows[0];
        expect(sqlr.phone1).toBe('123');
        expect(sqlr.phone2).toBe('456');
        expect(sqlr.phone3).toBe('789');
        await set(x, {
            phone1: null,
            phone2: null,
            phone3: null
        }).save();



        sqlr = (await db.execute('select phone1,phone2,phone3 from ' + (await x._.repository.metadata.getDbName()))).rows[0];
        expect(sqlr.phone1).toBe('');
        expect(sqlr.phone2).toBeNull();
        expect(sqlr.phone3).toBe('');



    });

    it("test contains on custom type", async () => {
        await deleteAll();
        await context.for(ObjectColumnTest).create({
            id: 1,
            col: { firstName: 'noam', lastName: 'honig' },
            phone1: new Phone("1234")

        }).save();
        await context.for(ObjectColumnTest).create({
            id: 2,
            col: { firstName: 'noam', lastName: 'honig' },
            phone1: new Phone("5678")

        }).save();

        let r = context.for(ObjectColumnTest).metadata;
        expect(await context.for(ObjectColumnTest).count(x => x.phone1.contains("23"))).toBe(1);
        expect(await context.for(ObjectColumnTest).count(async x => Filter.unpackWhere(r, await Filter.packWhere(r, x => x.phone1.contains("23"))))).toBe(1);
    });
    it("test basics with json", async () => {

        var mem = new InMemoryDataProvider();
        var c = new Context();
        c.setDataProvider(mem);

        var x = c.for(ObjectColumnTest).create();
        x.id = 1;
        x.col = {
            firstName: 'noam',
            lastName: 'honig'
        }
        await x.save();

        x = await c.for(ObjectColumnTest).findFirst();

        expect(x.col.firstName).toBe('noam');
        expect(mem.rows[x._.repository.metadata.key][0].col).toEqual({
            firstName: 'noam',
            lastName: 'honig'
        });
    });
    it("test string[]", async () => {
        await deleteAll();
        let x = await context.for(ObjectColumnTest).create({
            id: 1,
            col: { firstName: 'noam', lastName: 'honig' }
        }).save();
        expect(x.tags).toBe(undefined);
        expect(x.tags2).toBe(null);
        x.tags = ["a", "b"];
        await x.save();
        expect(x.tags).toEqual(["a", "b"]);
        let sqlr = (await db.execute('select tags,tags2 from ' + (await x._.repository.metadata.getDbName()))).rows[0];
        expect(sqlr.tags).toBe(JSON.stringify(["a", "b"]));
        expect(sqlr.tags2).toBeNull();
    });
    //



});
class Phone {
    constructor(private phone: string) {

    }
}
@FieldType({
    valueConverter: {
        fromJson: x => x ? new Phone4(x) : null,
        toJson: x => x ? x.phone : ''
    }
})
class Phone4 {
    constructor(private phone: string) {

    }

}

@Entity({ key: 'objectColumnTest' })
class ObjectColumnTest extends EntityBase {
    @Field()
    id: number;
    @Field()
    col: person;
    @Field<Phone>({
        valueConverter: {
            fromJson: x => x ? new Phone(x) : null,
            toJson: x => x ? x.phone : ''
        }
    })
    phone1: Phone;
    @Field<Phone>({
        valueConverter: {
            fromJson: x => x ? new Phone(x) : null,
            toJson: x => x ? x.phone : null
        },
        allowNull: true
    })
    phone2: Phone
    @Field<Phone>({
        valueConverter: {
            fromJson: x => x ? new Phone(x) : null,
            toJson: x => x ? x.phone : ''
        }
    })
    phone3: Phone;
    @Field()
    phone4: Phone4
    @Field()
    tags: string[];
    @Field({ allowNull: true })
    tags2: string[];
}

interface person {
    firstName: string;
    lastName: string;
}
