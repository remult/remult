import { itAsync, Done, fitAsync } from './testHelper.spec';
import { ServerContext } from '../context';

import { JsonDataProvider } from '../data-providers/json-data-provider';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';

import { IdEntity } from '../id-entity';

import { DataApi } from '../data-api';
import { TestDataApiResponse } from './basicRowFunctionality.spec';
import { Categories as newCategories } from './remult-3-entities';
import { Field, Entity, EntityBase } from '../remult3';


describe("test json database", () => {
    let db = new JsonDataProvider(localStorage);
    let context = new ServerContext();
    context.setDataProvider(db);
    async function deleteAll() {
        for (const c of await context.for(newCategories).find()) {
            await c._.delete();
        }
    }
  
    itAsync("test basics", async () => {
        await deleteAll();
        expect(await context.for(newCategories).count()).toBe(0);
        let promisis = [];
        for (let index = 1; index < 4; index++) {
            let c = context.for(newCategories).create();
            c.id = index;
            c.categoryName = "noam" + index;
            promisis.push(c._.save());
        }
        await Promise.all(promisis);
        expect(await context.for(newCategories).count()).toBe(3, 'count');
        let cats = await context.for(newCategories).find();
        expect(cats.length).toBe(3);
        expect(cats[0].id).toBe(1);
        expect(cats[0].categoryName).toBe("noam1");
    });

});
@Entity({ key: 'tasks' })
class tasks extends EntityBase {
    @Field()
    id: number;
    @Field()
    name: string;
    @Field()
    completed: boolean;

}
describe("test tasks", () => {
    itAsync("test tasks", async () => {
        let storage = '';
        let db = new JsonDataProvider({
            getItem: () => storage,
            setItem: (x, y) => storage = y
        });
        let cont = new ServerContext(db);
        let c = cont.for(tasks);
        let t = c.create();
        t.id = 1;
        await t._.save();
        t = c.create();
        t.id = 2;
        t.completed = true;
        await t._.save();
        t = c.create();
        t.id = 3;
        t.completed = true;
        await t._.save();

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
