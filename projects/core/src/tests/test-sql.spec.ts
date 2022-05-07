import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { Remult } from '../context';
import { SqlDatabase } from '../data-providers/sql-database';
import { Categories } from './remult-3-entities';
import { Entity, Fields, Repository } from '../remult3';


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

    it("test transactions", async () => {
        await deleteAll();
        let sql = new WebSqlDataProvider("test")
        const prev = SqlDatabase.LogToConsole;
        SqlDatabase.LogToConsole = true;
        try {
            let db: SqlDatabase = new SqlDatabase({
                createCommand: () => sql.createCommand(),
                entityIsUsedForTheFirstTime: (e) => sql.entityIsUsedForTheFirstTime(e),
                getLimitSqlSyntax: (a, b) => sql.getLimitSqlSyntax(a, b),
                transaction: what => what(sql)
            });

            await db.transaction(async dp => {
                const repo = new Remult(dp).repo(Categories);
                expect(await repo.count({ categoryName: 'a' })).toBe(0);
                let ok = false;
                try {
                    await dp.transaction(async () => { });
                    ok = true;
                }
                catch {

                }
                expect(ok).toBe(false);
            });
        } finally {
            SqlDatabase.LogToConsole = false;
        }

    });
    it("query after transaction should fail", async () => {
        await deleteAll();
        let sql = new WebSqlDataProvider("test")
        let db: SqlDatabase = new SqlDatabase({
            createCommand: () => sql.createCommand(),
            entityIsUsedForTheFirstTime: (e) => sql.entityIsUsedForTheFirstTime(e),
            getLimitSqlSyntax: (a, b) => sql.getLimitSqlSyntax(a, b),
            transaction: what => what(sql)
        });
        let repo: Repository<Categories>;
        await db.transaction(async dp => {
            repo = new Remult(dp).repo(Categories);

        });
        let ok = false;
        try {
            await repo.count({ categoryName: 'a' })
            ok = true;
        } catch { }
        expect(ok).toBe(false);
    });
    it("test column error", async () => {
        await deleteAll();
        await remult.repo(Categories).insert([{ categoryName: 'a', id: 1 }]);
        try {

            await remult.repo(testErrorInFromDb).find();
        }
        catch (err) {
            expect(err.message).toContain("categoryName");
        }

    })
});

@Entity("Categories")
class testErrorInFromDb {
    @Fields.integer({ dbName: 'CategoryID' })
    id = 0;
    @Fields.string({
        valueConverter: {
            fromDb: x => { throw 'error' }
        }
    })
    categoryName = '';

}