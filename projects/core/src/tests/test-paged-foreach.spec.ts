

import { createData } from './RowProvider.spec';
import { itAsync } from './testHelper.spec';

import { Categories } from './testModel/models';

import { iterateConfig } from '../context';


describe("test paged foreach ", async () => {
    iterateConfig.pageSize = 2;

    itAsync("basic foreach with where", async () => {
        let c = await createData(async insert => {
            insert(1, 'noam');
            insert(2, 'yael');
            insert(3, 'yoni');
            insert(4, 'shay');
            insert(5, 'ido');
        }, Categories);
        let i = 0;
        for await (const x of c.iterate(x => x.categoryName.isGreaterOrEqualTo("n"))) {
            expect(x.id.value).toBe([1, 2, 3, 4][i++]);
        }
        expect(i).toBe(4);
    });
    itAsync("basic foreach with where 2", async () => {
        let c = await createData(async insert => {
            insert(1, 'noam');
            insert(2, 'yael');
            insert(3, 'yoni');
            insert(4, 'shay');
            insert(5, 'ido');
        }, Categories);
        let i = 0;
        for await (const x of c.iterate({ where: x => x.categoryName.isGreaterOrEqualTo("n") })) {
            expect(x.id.value).toBe([1, 2, 3, 4][i++]);
        }
        expect(i).toBe(4);
    });
    itAsync("basic foreach with order by", async () => {
        let c = await createData(async insert => {
            insert(1, 'noam');
            insert(2, 'yael');
            insert(3, 'yoni');
            insert(4, 'shay');
            insert(5, 'ido');
        }, Categories);
        let i = 0;
        for await (const x of c.iterate({
            orderBy: x => x.categoryName
        })) {
            expect(x.id.value).toBe([5, 1, 4, 2, 3][i++])
        }
        expect(i).toBe(5);

        expect(( await c.iterate({
            orderBy: x => x.categoryName
        }).first()).id.value).toBe(5);

    });

    itAsync("basic foreach with order by desc", async () => {
        let c = await createData(async insert => {
            insert(1, 'noam');
            insert(2, 'yael');
            insert(3, 'yoni');
            insert(4, 'shay');
            insert(5, 'ido');
        }, Categories);
        let i = 0;
        for await (const x of c.iterate({
            orderBy: x => [{ column: x.categoryName, descending: true }]
        })) {
            expect(x.id.value).toBe([3, 2, 4, 1, 5][i++])
        }

        expect(i).toBe(5);
    });
    itAsync("iterate", async () => {
        let c = await createData(async insert => {
            insert(1, 'noam');
            insert(2, 'yael');
            insert(3, 'yoni');
            insert(4, 'shay');
            insert(5, 'ido');
        }, Categories);
        var i = 0;
        for await (const x of c.iterate()) {
            expect(x.id.value).toBe(++i);
        }

        expect(i).toBe(5);
    });
    itAsync("test toArray", async () => {
        let c = await createData(async insert => {
            insert(1, 'noam');
            insert(2, 'yael');
            insert(3, 'yoni');
            insert(4, 'shay');
            insert(5, 'ido');
        }, Categories);
        var i = 0;


        for (const x of await c.iterate().toArray()) {
            expect(x.id.value).toBe(++i);
        }
        expect(i).toBe(5);
    });
})

