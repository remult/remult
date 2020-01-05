import { itAsync, Done } from './testHelper.spec';
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { ServerContext } from '../context';
import { SqlDatabase } from '../data-providers/SqlDatabase';
import { Categories } from './testModel/models';
import { JsonDataProvider } from '../data-providers/json-data-provider';


describe("test sql database", async () => {
    let db = new JsonDataProvider(localStorage);
    let context = new ServerContext();
    context.setDataProvider(db);
    async function deleteAll() {
        for (const c of await context.for(Categories).find()) {
            await c.delete();
        }
    }
    await itAsync("test basics", async () => {
        await deleteAll();
        expect(await context.for(Categories).count()).toBe(0);
        let promisis = [];
        for (let index = 1; index < 4; index++) {
            let c = context.for(Categories).create();
            c.id.value = index;
            c.categoryName.value = "noam"+index;
            promisis.push(c.save());
        }
        await Promise.all(promisis);
        expect(await context.for(Categories).count()).toBe(3);
        let cats = await context.for(Categories).find();
        expect(cats.length).toBe(3);
        expect(cats[0].id.value).toBe(1);
        expect(cats[0].categoryName.value).toBe("noam1");
    });


});