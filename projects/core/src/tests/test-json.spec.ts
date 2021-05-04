import { itAsync, Done, fitAsync } from './testHelper.spec';
import { ServerContext } from '../context';
import { Categories } from './testModel/models';
import { JsonDataProvider } from '../data-providers/json-data-provider';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { Entity } from '../entity';
import { IdEntity } from '../id-entity';
import { BoolColumn, NumberColumn } from '../columns/number-column';
import { StringColumn } from '../columns/string-column';
import { DataApi } from '../data-api';
import { TestDataApiResponse } from './basicRowFunctionality.spec';


describe("test json database", () => {
    let db = new JsonDataProvider(localStorage);
    let context = new ServerContext();
    context.setDataProvider(db);
    async function deleteAll() {
        for (const c of await context.for_old(Categories).find()) {
            await c.delete();
        }
    }
    itAsync("test basics", async () => {
        await deleteAll();
        expect(await context.for_old(Categories).count()).toBe(0);
        let promisis = [];
        for (let index = 1; index < 4; index++) {
            let c = context.for_old(Categories).create();
            c.id.value = index;
            c.categoryName.value = "noam" + index;
            promisis.push(c.save());
        }
        await Promise.all(promisis);
        expect(await context.for_old(Categories).count()).toBe(3);
        let cats = await context.for_old(Categories).find();
        expect(cats.length).toBe(3);
        expect(cats[0].id.value).toBe(1);
        expect(cats[0].categoryName.value).toBe("noam1");
    });
});

describe("test tasks", () => {
    itAsync("test tasks", async () => {
        let storage = '';
        let db = new JsonDataProvider({
            getItem: () => storage,
            setItem: (x, y) => storage = y
        });
        let cont = new ServerContext(db);
        let c = cont.for_old(class extends Entity {
            id = new NumberColumn();
            name = new StringColumn();
            completed = new BoolColumn();
            constructor() {
                super({
                    name: 'tasks'
                })
            }
        });
        let t = c.create();
        t.id.value = 1;
        await t.save();
        t = c.create();
        t.id.value = 2;
        t.completed.value = true;
        await t.save();
        t = c.create();
        t.id.value = 3;
        t.completed.value = true;
        await t.save();
        
        expect(await c.count(t => t.completed.isDifferentFrom(true))).toBe(1);
        expect(await c.count(t => t.completed.isEqualTo(true))).toBe(2);
        expect(await c.count(t => t.completed.isEqualTo(false))).toBe(0);
        var api = new DataApi(c);
        let tr = new TestDataApiResponse();
        let d = new Done();
        tr.success = async (data) => {
            d.ok();
            expect(data.length).toBe(1);
        }
        await api.getArray(tr, {
            get: x => {
                if (x == 'completed_ne')
                    return 'true';
                return undefined;
            }, clientIp: '', user: undefined, getHeader: x => ""
            , getBaseUrl: () => ''
        });
        d.test();



    });
});