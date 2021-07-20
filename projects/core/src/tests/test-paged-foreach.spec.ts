

import { createData, } from './RowProvider.spec';
import { fitAsync, itAsync } from './testHelper.spec';
import { Context, iterateConfig } from '../context';
import { Entity, EntityBase, Field, EntityOrderBy, RepositoryImplementation, EntityWhere } from '../remult3';
import { Categories } from './remult-3-entities';
import { FieldMetadata } from '../column-interfaces';
import { Sort } from '../sort';
import { CompoundIdField } from '../column';
import { Filter } from '../filter/filter-interfaces';


describe("test paged foreach ", () => {
    iterateConfig.pageSize = 2;

    itAsync("basic foreach with where", async () => {
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
    itAsync("basic foreach with where 2", async () => {
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
    itAsync("basic foreach with order by", async () => {
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

    itAsync("basic foreach with order by desc", async () => {
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
    itAsync("iterate", async () => {
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
    itAsync("test toArray", async () => {
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
    itAsync("test make sort unique", async () => {
        let context = new Context();
        let e = context.for(Categories) as RepositoryImplementation<Categories>;
        function test(orderBy: EntityOrderBy<Categories>, ...sort: FieldMetadata[]) {
            let s = Sort.createUniqueSort(e.metadata, orderBy);
            expect(s.Segments.map(x => x.field)).toEqual(sort);
        }
        test(x => x.id, e.metadata.fields.id);
        test(x => x.categoryName, e.metadata.fields.categoryName, e.metadata.fields.id);
    });

    itAsync("unique sort and  compound id", async () => {
        let context = new Context();

        let eDefs = context.for(theTable).metadata;
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
    itAsync("create rows after filter compound id", async () => {
        let context = new Context();


        let eDefs = context.for(theTable) as RepositoryImplementation<theTable>;
        let e = eDefs.create();
        e.a = 'a';
        e.b = 'b';
        e.c = 'c';
        async function test(orderBy: EntityOrderBy<theTable>, expectedWhere: EntityWhere<theTable>) {
            expect(JSON.stringify(await Filter.packWhere(eDefs.metadata, eDefs.createAfterFilter(orderBy, e)))).toEqual(
                JSON.stringify(await Filter.packWhere(eDefs.metadata, expectedWhere)));
        }
        test(x => x.a, x => x.a.isGreaterThan('a'));
        test(x => [x.a.descending()], x => x.a.isLessThan('a'));
        test(x => [x.a, x.b], x => x.a.isGreaterThan('a').or(x.a.isEqualTo('a').and(x.b.isGreaterThan('b'))));

    });
    itAsync("create rows after filter, values are frozen when filter is created", async () => {
        let context = new Context();


        let eDefs = context.for(theTable) as RepositoryImplementation<theTable>;
        let e = eDefs.create();
        e.a = 'a';
        e.b = 'b';
        e.c = 'c';

        let f = eDefs.createAfterFilter(x => [x.a, x.b], e);
        e.a = '1';
        e.b = '2';
        expect(JSON.stringify(await Filter.packWhere(eDefs.metadata, f))).toEqual(
            JSON.stringify(await Filter.packWhere<theTable>(eDefs.metadata, x => x.a.isGreaterThan('a').or(x.a.isEqualTo('a').and(x.b.isGreaterThan('b'))))));

    });
    itAsync("serialize filter with or", async () => {
        let context = new Context();
        let eDefs = context.for(theTable) as RepositoryImplementation<theTable>;
        let e = eDefs.create();

        async function  test(expectedWhere: EntityWhere<theTable>, expected: any) {
            expect(JSON.stringify(await Filter.packWhere(eDefs.metadata, expectedWhere))).toEqual(
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
})

@Entity<theTable>({
    key: '',
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