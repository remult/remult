import {  Done } from './testHelper.spec';
import { Context } from '../context';

import { JsonDataProvider } from '../data-providers/json-data-provider';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';

import { IdEntity } from '../id-entity';

import { DataApi } from '../data-api';
import { TestDataApiResponse } from './basicRowFunctionality.spec';
import { Categories as newCategories } from './remult-3-entities';
import { Field, Entity, EntityBase, IntegerField } from '../remult3';


@Entity({ key: 'entityWithAutoId', dbAutoIncrementId: true })
class entityWithAutoId extends EntityBase {
    @IntegerField()
    id: number;
    @Field()
    name: string;
}


describe("test json database", () => {
    let db = new JsonDataProvider(localStorage);
    let context = new Context();
    context.setDataProvider(db);
    async function deleteAll() {
        for (const c of await context.for(newCategories).find()) {
            await c._.delete();
        }
    }
    it("test auto increment",async () => {
        let context = new Context();
        context.setDataProvider(new InMemoryDataProvider());
        let p = await context.for(entityWithAutoId).create({name:'a'}).save();
        expect(p.id).toBe(1);
        p = await context.for(entityWithAutoId).create({name:'b'}).save();
        expect(p.id).toBe(2);

    });

    it("test basics", async () => {
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
    it("test tasks", async () => {
        let storage = '';
        let db = new JsonDataProvider({
            getItem: () => storage,
            setItem: (x, y) => storage = y
        });
        let cont = new Context();
        cont.setDataProvider(db);
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
        var api = new DataApi(c, cont);
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
            }
        });
        d.test();
    });
});
