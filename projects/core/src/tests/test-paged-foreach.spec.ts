

import { createData, } from './RowProvider.spec';
import { Remult, iterateConfig } from '../context';
import { Entity, EntityBase, Field, EntityOrderBy, RepositoryImplementation, EntityFilter } from '../remult3';
import { Categories } from './remult-3-entities';
import { FieldMetadata } from '../column-interfaces';
import { Sort } from '../sort';
import { CompoundIdField } from '../column';
import { entityFilterToJson, Filter } from '../filter/filter-interfaces';
import { testAllDataProviders, testInMemoryDb, testRestDb, testSql } from './testHelper.spec';
import { SqlDatabase } from '../..';


describe("test paged foreach ", () => {
    iterateConfig.pageSize = 2;

    it("basic foreach with where", async () => {
        let [c] = await createData(async insert => {
            await insert(1, 'noam');
            await insert(2, 'yael');
            await insert(3, 'yoni');
            await insert(4, 'shay');
            await insert(5, 'ido');
        });
        let i = 0;
        for await (const x of c.iterate(x => x.categoryName.isGreaterOrEqualTo("n"))) {
            expect(x.id).toBe([1, 2, 3, 4][i++]);
        }
        expect(i).toBe(4);
    });
    it("basic foreach with where 2", async () => {
        let [c] = await createData(async insert => {
            await insert(1, 'noam');
            await insert(2, 'yael');
            await insert(3, 'yoni');
            await insert(4, 'shay');
            await insert(5, 'ido');
        });
        let i = 0;
        for await (const x of c.iterate({
            where: x =>
                x.categoryName.isGreaterOrEqualTo("n")
        })) {
            expect(x.id).toBe([1, 2, 3, 4][i++]);
        }
        expect(i).toBe(4);
    });
    it("basic foreach with order by", async () => {
        let [c] = await createData(async insert => {
            await insert(1, 'noam');
            await insert(2, 'yael');
            await insert(3, 'yoni');
            await insert(4, 'shay');
            await insert(5, 'ido');
        });
        let i = 0;
        for await (const x of c.iterate({
            orderBy: x => x.categoryName
        })) {
            expect(x.id).toBe([5, 1, 4, 2, 3][i++])
        }
        expect(i).toBe(5);

        expect((await c.iterate({
            orderBy: x => x.categoryName
        }).first()).id).toBe(5);

    });

    it("basic foreach with order by desc", async () => {
        let [c] = await createData(async insert => {
            await insert(1, 'noam');
            await insert(2, 'yael');
            await insert(3, 'yoni');
            await insert(4, 'shay');
            await insert(5, 'ido');
        });
        let i = 0;
        for await (const x of c.iterate({
            orderBy: x => x.categoryName.descending()
        })) {
            expect(x.id).toBe([3, 2, 4, 1, 5][i++])
        }

        expect(i).toBe(5);
    });
    it("iterate", async () => {
        let [c] = await createData(async insert => {
            await insert(1, 'noam');
            await insert(2, 'yael');
            await insert(3, 'yoni');
            await insert(4, 'shay');
            await insert(5, 'ido');
        });
        var i = 0;
        for await (const x of c.iterate()) {
            expect(x.id).toBe(++i);
        }

        expect(i).toBe(5);
    });
    it("test toArray", async () => {
        let [c] = await createData(async insert => {
            await insert(1, 'noam');
            await insert(2, 'yael');
            await insert(3, 'yoni');
            await insert(4, 'shay');
            await insert(5, 'ido');
        });
        var i = 0;


        for (const x of await c.iterate().toArray()) {
            expect(x.id).toBe(++i);
        }
        expect(i).toBe(5);
    });
    it("test make sort unique", async () => {
        let remult = new Remult();
        let e = remult.repo(Categories) as RepositoryImplementation<Categories>;
        function test(orderBy: EntityOrderBy<Categories>, ...sort: FieldMetadata[]) {
            let s = Sort.createUniqueSort(e.metadata, orderBy);
            expect(s.Segments.map(x => x.field)).toEqual(sort);
        }
        test(x => x.id, e.metadata.fields.id);
        test(x => x.categoryName, e.metadata.fields.categoryName, e.metadata.fields.id);
    });

    it("unique sort and  compound id", async () => {
        let remult = new Remult();

        let eDefs = remult.repo(theTable).metadata;
        let e = eDefs.fields;

        function test(orderBy: EntityOrderBy<theTable>, ...sort: FieldMetadata[]) {
            let s = Sort.createUniqueSort(eDefs, orderBy);
            expect(s.Segments.map(x => x.field)).toEqual(sort.map(x => x));
        }
        test(x => [x.b, x.c], e.b, e.c, e.a);
        test(x => [x.a, x.b], e.a, e.b);
        test(x => x.a, e.a, e.b);
        test(x => x.b, e.b, e.a);
        test(x => x.c, e.c, e.a, e.b);
    });
    it("create rows after filter compound id", async () => {
        let remult = new Remult();


        let eDefs = remult.repo(theTable) as RepositoryImplementation<theTable>;
        let e = eDefs.create();
        e.a = 'a';
        e.b = 'b';
        e.c = 'c';
        async function test(orderBy: EntityOrderBy<theTable>, expectedWhere: EntityFilter<theTable>) {
            expect(JSON.stringify(await entityFilterToJson(eDefs.metadata, await eDefs.createAfterFilter(orderBy, e)))).toEqual(
                JSON.stringify(await entityFilterToJson(eDefs.metadata, expectedWhere)));
        }
        test(x => x.a, x => x.a.isGreaterThan('a'));
        test(x => [x.a.descending()], x => x.a.isLessThan('a'));
        test(x => [x.a, x.b], x => x.a.isGreaterThan('a').or(x.a.isEqualTo('a').and(x.b.isGreaterThan('b'))));

    });
    it("create rows after filter, values are frozen when filter is created", async () => {
        let remult = new Remult();


        let eDefs = remult.repo(theTable) as RepositoryImplementation<theTable>;
        let e = eDefs.create();
        e.a = 'a';
        e.b = 'b';
        e.c = 'c';

        let f = await eDefs.createAfterFilter(x => [x.a, x.b], e);
        e.a = '1';
        e.b = '2';
        expect(JSON.stringify(await entityFilterToJson(eDefs.metadata, f))).toEqual(
            JSON.stringify(await entityFilterToJson<theTable>(eDefs.metadata, x => x.a.isGreaterThan('a').or(x.a.isEqualTo('a').and(x.b.isGreaterThan('b'))))));

    });
    it("serialize filter with or", async () => {
        let remult = new Remult();
        let eDefs = remult.repo(theTable) as RepositoryImplementation<theTable>;
        let e = eDefs.create();

        async function test(expectedWhere: EntityFilter<theTable>, expected: any) {
            expect(JSON.stringify(await entityFilterToJson(eDefs.metadata, expectedWhere))).toEqual(
                JSON.stringify(expected));
        }
        await test(
            x => x.a.isEqualTo('a').and(x.b.isGreaterThan('b')).or(x.a.isGreaterThan('a')),
            {
                OR: [
                    {
                        a: 'a',
                        b_gt: 'b'
                    },
                    {
                        a_gt: 'a'
                    }
                ]
            });
        await test(
            x => x.a.isEqualTo('a').and(x.b.isGreaterThan('b')),
            {
                a: 'a',
                b_gt: 'b'
            });
        await test(
            x => x.a.isEqualTo('a').or(x.b.isGreaterThan('b')),
            {
                OR: [
                    { a: 'a' },
                    { b_gt: 'b' }]
            });




    });
    it("test paging with complex object", () => testAllDataProviders(async db => {
        
        let r = new Remult();
        r.setDataProvider(db);
        let c1 = await r.repo(c).create({ id: 1, name: 'c1' }).save();
        let c2 = await r.repo(c).create({ id: 2, name: 'c2' }).save();
        let c3 = await r.repo(c).create({ id: 3, name: 'c3' }).save();

        await r.repo(p).create({ id: 1, name: 'p1', c: c1 }).save();
        await r.repo(p).create({ id: 2, name: 'p2', c: c2 }).save();
        await r.repo(p).create({ id: 3, name: 'p3', c: c3 }).save();
        await r.repo(p).create({ id: 4, name: 'p4', c: c3 }).save();
        await r.repo(p).create({ id: 5, name: 'p5', c: c3 }).save();
        let i = 0;
        for await (const x of r.repo(p).iterate({
            orderBy: p => [p.c, p.id]
        })) {
            i++;
        }
        expect(i).toBe(5);
    }))
    it("test paging with complex object_2", () => testAllDataProviders(async db => {
        let r = new Remult();
        r.setDataProvider(db);
        let c1 = await r.repo(c).create({ id: 1, name: 'c1' }).save();

        await r.repo(p).create({ id: 1, name: 'p1', c: c1 }).save();
        expect((await r.repo(p).findFirst({ where: x => x.c.isEqualTo(c1) })).id).toBe(1);
    }))
})

@Entity<theTable>('', {
    id: t => new CompoundIdField(t.a, t.b)
})
class theTable extends EntityBase {
    @Field()
    a: string;
    @Field()
    b: string;
    @Field()
    c: string;
}

@Entity('c', { allowApiCrud: true })
class c extends EntityBase {
    @Field()
    id: number;
    @Field()
    name: string;
    constructor(private remult: Remult) {
        super();
    }
}
@Entity('p', { allowApiCrud: true })
class p extends EntityBase {
    @Field()
    id: number;
    @Field()
    name: string;
    @Field()
    c: c;
    constructor(private remult: Remult) {
        super();
    }
}