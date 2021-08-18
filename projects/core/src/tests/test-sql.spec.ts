import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { Context } from '../context';
import { SqlDatabase } from '../data-providers/sql-database';
import { Categories } from './remult-3-entities';


describe("test sql database", () => {
    let db = new SqlDatabase(new WebSqlDataProvider("test"));
    let context = new Context();
    context.setDataProvider(db);
    async function deleteAll() {
        for (const c of await context.for(Categories).find()) {
            await c._.delete();
        }
    }
    it("test basics", async () => {
        await deleteAll();
        expect(await context.for(Categories).count()).toBe(0);
        let c = context.for(Categories).create();
        c.id = 1;
        c.categoryName = "noam";
        await c._.save();
        expect(await context.for(Categories).count()).toBe(1);
        let cats = await context.for(Categories).find();
        expect(cats.length).toBe(1);
        expect(cats[0].id).toBe(1);
        expect(cats[0].categoryName).toBe("noam");
    });


});