

import { createData, } from './RowProvider.spec';
import { Remult, queryConfig } from '../context';
import { Entity, EntityBase, Field, EntityOrderBy, RepositoryImplementation, EntityFilter } from '../remult3';
import { Categories } from './remult-3-entities';
import { FieldMetadata } from '../column-interfaces';
import { Sort } from '../sort';
import { CompoundIdField } from '../column';
import { entityFilterToJson, Filter } from '../filter/filter-interfaces';
import { testAllDataProviders, testInMemoryDb, testRestDb, testSql } from './testHelper.spec';
import { SqlDatabase } from '../..';


describe("test paged foreach ", () => {
    queryConfig.defaultPageSize = 2;

    it("basic foreach with where", async () => {
        let [c] = await createData(async insert => {
            await insert(1, 'noam');
            await insert(2, 'yael');
            await insert(3, 'yoni');
            await insert(4, 'shay');
            await insert(5, 'ido');
        });
        let i = 0;
        for await (const x of c.query({ where: { categoryName: { $gte: "n" } } })) {
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
        for await (const x of c.query({
            where: { categoryName: { ">=": "n" } }
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
        for await (const x of c.query({
            orderBy: { categoryName: "asc" }
        })) {
            expect(x.id).toBe([5, 1, 4, 2, 3][i++])
        }
        expect(i).toBe(5);

        expect((await c.findFirst({}, {
            orderBy: { categoryName: "asc" }
        })).id).toBe(5);

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
        for await (const x of c.query({
            orderBy: { categoryName: "desc" }
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
        for await (const x of c.query()) {
            expect(x.id).toBe(++i);
        }

        expect(i).toBe(5);
    });
    it("paginate", async () => {
        let [c] = await createData(async insert => {
            await insert(1, 'noam');
            await insert(2, 'yael');
            await insert(3, 'yoni');
            await insert(4, 'shay');
            await insert(5, 'ido');
        });
        let p = await c.query().paginate();
        expect(p.items.length).toBe(2);
        expect(await p.count()).toBe(5);
        expect(p.items.map(x => x.id)).toEqual([1, 2]);
        expect(p.hasNextPage).toBe(true);
        p = await p.nextPage();
        expect(p.items.map(x => x.id)).toEqual([3, 4]);
        expect(p.hasNextPage).toBe(true);
        p = await p.nextPage();
        expect(p.items.map(x => x.id)).toEqual([5]);
        expect(p.hasNextPage).toBe(false);
    });
    it("paginate on boundries", async () => {
        let [c] = await createData(async insert => {
            await insert(1, 'noam');
            await insert(2, 'yael');
            await insert(3, 'yoni');
            await insert(4, 'shay');
        });
        let p = await c.query().paginate();
        expect(p.items.length).toBe(2);
        expect(await p.count()).toBe(4);
        expect(p.items.map(x => x.id)).toEqual([1, 2]);
        expect(p.hasNextPage).toBe(true);
        p = await p.nextPage();
        expect(p.items.map(x => x.id)).toEqual([3, 4]);
        expect(p.hasNextPage).toBe(true);
        p = await p.nextPage();
        expect(p.items.map(x => x.id)).toEqual([]);
        expect(p.hasNextPage).toBe(false);
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


        for (const x of await c.query({ pageSize: 10 }).getArray()) {
            expect(x.id).toBe(++i);
        }
        expect(i).toBe(5);
    });
    it("test make sort unique", async () => {
        let remult = new Remult();
        let e = remult.repo(Categories) as RepositoryImplementation<Categories>;
        function test(orderBy: EntityOrderBy<Categories>, ...sort: FieldMetadata[]) {
            let s = Sort.createUniqueEntityOrderBy(e.metadata, orderBy);
            let expected = {};
            for (const c of sort) {
                expected[c.key] = "asc";
            }
            expect(s).toEqual(expected);
        }
        test({ id: "asc" }, e.metadata.fields.id);
        test({ categoryName: "asc" }, e.metadata.fields.categoryName, e.metadata.fields.id);
    });

    it("unique sort and  compound id", async () => {
        let remult = new Remult();

        let eDefs = remult.repo(theTable).metadata;
        let e = eDefs.fields;

        function test(orderBy: EntityOrderBy<theTable>, ...sort: FieldMetadata[]) {
            let s = Sort.createUniqueEntityOrderBy(eDefs, orderBy);
            let expected = {};
            for (const c of sort) {
                expected[c.key] = "asc";
            }
            expect(s).toEqual(expected);
        }
        test({ b: "asc", c: "asc" }, e.b, e.c, e.a);
        test({ a: "asc", b: "asc" }, e.a, e.b);
        test({ a: "asc" }, e.a, e.b);
        test({ b: "asc" }, e.b, e.a);
        test({ c: "asc" }, e.c, e.a, e.b);
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
        test({ a: "asc" }, { a: { $gt: 'a' } });
        test({ a: "desc" }, { a: { $lt: 'a' } });
        test({ a: "asc", b: "asc" }, {
            $or: [
                { a: { $gt: 'a' } },
                { a: 'a', b: { $gt: 'b' } }
            ]
        });

    });
    it("create rows after filter, values are frozen when filter is created", async () => {
        let remult = new Remult();


        let eDefs = remult.repo(theTable) as RepositoryImplementation<theTable>;
        let e = eDefs.create();
        e.a = 'a';
        e.b = 'b';
        e.c = 'c';

        let f = await eDefs.createAfterFilter({ a: "asc", b: "asc" }, e);
        e.a = '1';
        e.b = '2';
        expect(JSON.stringify(await entityFilterToJson(eDefs.metadata, f))).toEqual(
            JSON.stringify(await entityFilterToJson<theTable>(eDefs.metadata, {
                $or: [
                    { a: { $gt: 'a' } },
                    { a: 'a', b: { $gt: 'b' } }]
            })));

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
            {
                $or: [
                    {
                        a: 'a',
                        b: { $gt: 'b' }
                    },
                    {
                        a: { $gt: 'a' }
                    }
                ]
            },
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
            {
                a: 'a',
                b: { $gt: 'b' }
            },
            {
                a: 'a',
                b_gt: 'b'
            });
        await test(
            {
                $or: [
                    { a: 'a' },
                    { b: { $gt: 'b' } }]
            },
            {
                OR: [
                    { a: 'a' },
                    { b_gt: 'b' }]
            });




    });
    it("test paging with complex object", () => testAllDataProviders(async ({ remult }) => {


        let c1 = await remult.repo(c).create({ id: 1, name: 'c1' }).save();
        let c2 = await remult.repo(c).create({ id: 2, name: 'c2' }).save();
        let c3 = await remult.repo(c).create({ id: 3, name: 'c3' }).save();

        await remult.repo(p).create({ id: 1, name: 'p1', c: c1 }).save();
        await remult.repo(p).create({ id: 2, name: 'p2', c: c2 }).save();
        await remult.repo(p).create({ id: 3, name: 'p3', c: c3 }).save();
        await remult.repo(p).create({ id: 4, name: 'p4', c: c3 }).save();
        await remult.repo(p).create({ id: 5, name: 'p5', c: c3 }).save();
        let i = 0;
        for await (const x of remult.repo(p).query({
            orderBy: { c: "asc", id: "asc" }
        })) {
            i++;
        }
        expect(i).toBe(5);
    }))
    it("test paging with complex object_2", () => testAllDataProviders(async ({ remult }) => {

        let c1 = await remult.repo(c).create({ id: 1, name: 'c1' }).save();

        await remult.repo(p).create({ id: 1, name: 'p1', c: c1 }).save();
        expect((await remult.repo(p).findFirst({ c: c1 })).id).toBe(1);
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