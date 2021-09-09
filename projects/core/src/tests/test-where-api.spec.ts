import { Done } from './testHelper.spec';
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { Remult } from '../context';
import { SqlDatabase } from '../data-providers/sql-database';
import { Categories, CategoriesForTesting } from './remult-3-entities';
import { createData, insertFourRows, testAllDbs } from './RowProvider.spec';
import { ComparisonFilterFactory, ContainsFilterFactory, Entity, EntityBase, Field, FilterFactories, FindOptions, Repository } from '../remult3';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import {  customUrlToken, Filter } from '../filter/filter-interfaces';
import { RestDataProvider } from '../data-providers/rest-data-provider';
import { DataApi } from '../data-api';
import { TestDataApiResponse } from './basicRowFunctionality.spec';
import { ArrayEntityDataProvider } from '../data-providers/array-entity-data-provider';
import { ClassType } from '../../classType';
import { CustomSqlFilterBuilder } from '../filter/filter-consumer-bridge-to-sql-request';


describe("test where stuff", () => {

    let repo: Repository<CategoriesForTesting>;
    beforeAll(async done => {
        [repo] = await insertFourRows();
        done();
    });

    it("test basics", async () => {
        let fo: FindOptions<CategoriesForTesting> = {
            where: x => x.id.isGreaterOrEqualTo(2)
        };
        expect(await repo.count(y => [y.id.isLessOrEqualTo(3), Filter.fromEntityFilter(y, fo.where)])).toBe(2);
        expect(await repo.count(async y => [y.id.isLessOrEqualTo(3), await Filter.fromEntityFilter(y, fo.where)])).toBe(2);
        expect(await repo.count(y => Filter.fromEntityFilter(y, fo.where, y => y.id.isLessOrEqualTo(3)))).toBe(2);
        expect(await repo.count(y => [y.id.isLessOrEqualTo(3), Filter.fromEntityFilter(y, fo.where)])).toBe(2);
    });
    it("test basics_2", async () => {
        let fo: FindOptions<CategoriesForTesting> = {
            where: x => x.id.isGreaterOrEqualTo(2)
        };
        expect(await repo.count(y => [y.id.isLessOrEqualTo(3), Filter.fromEntityFilter(y, fo.where), undefined])).toBe(2);
    });
    it("test basics_2_2", async () => {
        let fo: FindOptions<CategoriesForTesting> = {
            where: x => x.id.isGreaterOrEqualTo(2)
        };
        expect(await repo.count(async y => y.id.isLessOrEqualTo(3).and(await Filter.fromEntityFilter(y, fo.where)))).toBe(2);
    });
    it("test basics_2_3", async () => {
        let fo: FindOptions<CategoriesForTesting> = {
            where: x => x.id.isGreaterOrEqualTo(2)
        };
        expect(await repo.count(async y => y.id.isLessOrEqualTo(3).and(await Filter.fromEntityFilter(y, fo.where)))).toBe(2);
    });
    it("test basics_2_1", async () => {
        let fo: FindOptions<CategoriesForTesting> = {
            where: x => Promise.resolve(x.id.isGreaterOrEqualTo(2))
        };
        expect(await repo.count(y => [y.id.isLessOrEqualTo(3), Filter.fromEntityFilter(y, fo.where), undefined])).toBe(2);
    });
    it("test basics_3", async () => {
        let fo: FindOptions<CategoriesForTesting> = {
            where: x => x.id.isGreaterOrEqualTo(2)
        };
        expect(await repo.count(y => [y.id.isLessOrEqualTo(3), Filter.fromEntityFilter(y, fo.where)])).toBe(2);
    });


});



describe("custom filter", () => {
    it("test that it works", async () => {
        let c = new Remult().repo(entityForCustomFilter, new InMemoryDataProvider());
        for (let id = 0; id < 5; id++) {
            await c.create({ id }).save();
        }
        expect(await (c.count(e => entityForCustomFilter.filter({ oneAndThree: true }))))
            .toBe(2);
    });
    it("test that it works", async () => {
        let c = new Remult().repo(entityForCustomFilter, new InMemoryDataProvider());
        for (let id = 0; id < 5; id++) {
            await c.create({ id }).save();
        }
        expect(await (c.count(e => entityForCustomFilter.oneAndThree()))).toBe(2);
        expect((await (c.findFirst(e => entityForCustomFilter.testNumericValue(2)))).id).toBe(2);
        expect((await (c.findFirst(e => entityForCustomFilter.testObjectValue({ val: 2 })))).id).toBe(2);

    });
    it("test that it works with sql", async () => {
        let w = new WebSqlDataProvider("testWithFilter");

        let c = new Remult().repo(entityForCustomFilter, new SqlDatabase(w));
        await w.dropTable(c.metadata);
        for (let id = 0; id < 5; id++) {
            await c.create({ id }).save();
        }
        expect(await (c.count(e => SqlDatabase.customFilter(async x => x.sql = await e.id.metadata.getDbName() + ' in (' + x.addParameterAndReturnSqlToken(1) + "," + x.addParameterAndReturnSqlToken(3, c.metadata.fields.id) + ")"))))
            .toBe(2);
        expect(await (c.count(e => entityForCustomFilter.filter({ dbOneOrThree: true })))).toBe(2);
    });
    it("test that it works with arrayFilter", async () => {


        let c = new Remult().repo(entityForCustomFilter, new InMemoryDataProvider());
        for (let id = 0; id < 5; id++) {
            await c.create({ id }).save();
        }
        expect(await (c.count(e => ArrayEntityDataProvider.customFilter(x => x.id == 1 || x.id == 3))))
            .toBe(2);
        expect(await (c.count(e => entityForCustomFilter.filter({ dbOneOrThree: true })))).toBe(2);

    });
    it("test or and promise in translate", async () => {
        let c = new Remult().repo(entityForCustomFilter, new InMemoryDataProvider());
        for (let id = 0; id < 5; id++) {
            await c.create({ id }).save();
        }
        expect(await (c.count(e => e.id.isEqualTo(4).or(entityForCustomFilter.filter({ dbOneOrThree: true }))))).toBe(3);
    });
    it("test sent in api", async () => {
        let ok = new Done();
        let z = new RestDataProvider("", {
            delete: undefined,
            get: async (url) => {
                ok.ok();
                expect(url).toBe('/entityForCustomFilter?__action=count&_%24custom=%7B%22filter%22%3A%7B%22oneAndThree%22%3Atrue%7D%7D');
                return { count: 0 }

            },
            post: undefined,
            put: undefined
        });
        let c = new Remult();
        c.setDataProvider(z);
        await c.repo(entityForCustomFilter).count(e => entityForCustomFilter.filter({ oneAndThree: true }));
        ok.test();
    });
    it("test sent in api", async () => {
        let ok = new Done();
        let z = new RestDataProvider("", {
            delete: undefined,
            post: async (url, data) => {
                ok.ok();
                expect(data).toEqual({
                    "_$custom": [{
                        "filter":
                        {
                            "oneAndThree": true
                        }
                    },
                    {
                        "filter": {
                            "two": true
                        }
                    }
                    ]
                }
                );
                return { count: 0 }

            },
            get: undefined,
            put: undefined
        });
        let c = new Remult();
        c.setDataProvider(z);
        await c.repo(entityForCustomFilter).count(e => entityForCustomFilter.filter({ oneAndThree: true }).and(entityForCustomFilter.filter({ two: true })));
        ok.test();
    });
    it("test that api reads custom correctly", async () => {
        let remult = new Remult();
        remult.setDataProvider(new InMemoryDataProvider());
        let c = remult.repo(entityForCustomFilter);
        for (let id = 0; id < 5; id++) {
            await c.create({ id }).save();
        }
        var api = new DataApi(c, remult);
        let t = new TestDataApiResponse();
        let d = new Done();
        t.success = data => {
            expect(data.count).toBe(2);
            d.ok();
        };
        await api.count(t, {
            get: x => {
                if (x == customUrlToken)
                    return "{\"filter\":{\"oneAndThree\":true}}";
                return undefined;
            }
        });
        d.test();
    });
    it("test that api reads custom correctly 2", async () => {
        let remult = new Remult();
        remult.setDataProvider(new InMemoryDataProvider());
        let c = remult.repo(entityForCustomFilter);
        for (let id = 0; id < 5; id++) {
            await c.create({ id }).save();
        }
        var api = new DataApi(c, remult);
        let t = new TestDataApiResponse();
        let d = new Done();
        t.success = data => {
            expect(data.count).toBe(2);
            d.ok();
        };
        await api.count(t, {
            get: x => {
                if (x == customUrlToken)
                    return;
                return undefined;
            }
        }, {
            "_$custom": {
                "filter":
                {
                    "oneAndThree": true
                }
            }
        });
        d.test();
    });
    it("test that api reads custom correctly 3", async () => {
        let remult = new Remult();
        remult.setDataProvider(new InMemoryDataProvider());
        let c = remult.repo(entityForCustomFilter);
        for (let id = 0; id < 5; id++) {
            await c.create({ id }).save();
        }
        var api = new DataApi(c, remult);
        let t = new TestDataApiResponse();
        let d = new Done();
        t.success = data => {
            expect(data.count).toBe(0);
            d.ok();
        };
        await api.count(t, {
            get: x => {
                if (x == customUrlToken)
                    return;
                return undefined;
            }
        }, {
            "_$custom": [{
                "filter":
                {
                    "oneAndThree": true
                }
            },
            {
                "filter":
                {
                    "two": true
                }
            }
            ]
        });
        d.test();
    });
    it("test that api reads custom correctly and translates to db", async () => {
        let remult = new Remult();
        remult.setDataProvider(new InMemoryDataProvider());
        let c = remult.repo(entityForCustomFilter);
        for (let id = 0; id < 5; id++) {
            await c.create({ id }).save();
        }
        var api = new DataApi(c, remult);
        let t = new TestDataApiResponse();
        let d = new Done();
        t.success = data => {
            expect(data.count).toBe(2);
            d.ok();
        };
        await api.count(t, {
            get: x => {
                if (x == customUrlToken)
                    return "{\"filter\":{\"dbOneOrThree\":true}}";
                return undefined;
            }
        });
        d.test();
    });

});


@Entity({
    key: 'entityForCustomFilter'
})
class entityForCustomFilter extends EntityBase {
    @Field()
    id: number;
    static filter = Filter.createCustom<entityForCustomFilter, {
        oneAndThree?: boolean,
        dbOneOrThree?: boolean,
        two?: boolean
    }>("filter", async (e, remult, c) => {
        let r: Filter[] = [];
        if (c.oneAndThree)
            r.push(e.id.isIn([1, 3]));
        if (c.two)
            r.push(e.id.isEqualTo(2));
        if (c.dbOneOrThree) {

            r.push(SqlDatabase.customFilter(async x => x.sql = await e.id.metadata.getDbName() + ' in (' + x.addParameterAndReturnSqlToken(1) + "," + x.addParameterAndReturnSqlToken(3) + ")").and(
                ArrayEntityDataProvider.customFilter(x => x.id == 1 || x.id == 3)
            ))
        }
        return r;
    });
    static oneAndThree = Filter.createCustom<entityForCustomFilter>("xOneAndThree", (e) => e.id.isIn([1, 3]));
    static testNumericValue = Filter.createCustom<entityForCustomFilter, number>("testNumericValue", (e, r, val) => e.id.isEqualTo(val));
    static testObjectValue = Filter.createCustom<entityForCustomFilter, { val: number }>("testObjectValue", (e, r, val) => e.id.isEqualTo(val.val));
}

declare type Draft<T> = WritableDraft<T>;
declare type WritableDraft<T> = {
    -readonly [K in keyof T]: Draft<T[K]>;
};
declare type SliceCaseReducers<State> = {

    [K: string]: (state: Draft<State>) => State;
};
function x<CaseReducers extends SliceCaseReducers<{ test?: WritableDraft<entityForCustomFilter>[]; }>>(what: CaseReducers) {
}
//reproduce typescript bug with recursive types
x<{
    addComment: (state: WritableDraft<{
        test?: entityForCustomFilter[];
    }>) => {
        test: WritableDraft<entityForCustomFilter>[];
    };
}>({} as any);

