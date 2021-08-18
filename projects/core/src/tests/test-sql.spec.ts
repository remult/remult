import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { Remult } from '../context';
import { SqlDatabase } from '../data-providers/sql-database';
import { Categories } from './remult-3-entities';


describe("test sql database", () => {
    let db = new SqlDatabase(new WebSqlDataProvider("test"));
    let remult = new Remult();
    remult.setDataProvider(db);
    async function deleteAll() {
        for (const c of await remult.repo(Categories).find()) {
            await c._.delete();
        }
    }
    it("test basics", async () => {
        await deleteAll();
        expect(await remult.repo(Categories).count()).toBe(0);
        let c = remult.repo(Categories).create();
        c.id = 1;
        c.categoryName = "noam";
        await c._.save();
        expect(await remult.repo(Categories).count()).toBe(1);
        let cats = await remult.repo(Categories).find();
        expect(cats.length).toBe(1);
        expect(cats[0].id).toBe(1);
        expect(cats[0].categoryName).toBe("noam");
    });


});