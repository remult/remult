import { itAsync } from './testHelper.spec';
import { ServerContext, EntityClass } from '../context';
import { Entity } from '../entity';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { NumberColumn } from '../columns/number-column';
import { SqlDatabase } from '../data-providers/sql-database';
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';

describe("test sql database", async () => {
    let db = new SqlDatabase(new WebSqlDataProvider("test"));
    let context = new ServerContext();
    context.setDataProvider(db);
    async function deleteAll() {
        for (const c of await context.for(testSqlExpression).find()) {
            await c.delete();
        }
    }
    await itAsync("test basics", async () => {
        await deleteAll();
        let x = context.for(testSqlExpression).create();
        x.code.value = 3;
        await x.save();
        expect(x.testExpression.value).toBe(15);
        x = await context.for(testSqlExpression).findFirst();
        expect(x.testExpression.value).toBe(15);
    });


});



@EntityClass
class testSqlExpression extends Entity<number>{
    code = new NumberColumn();
    testExpression = new NumberColumn({
        sqlExpression: () => {
            return this.code.__getDbName() + ' * 5';
        }
    });
    constructor() {
        super();
    }
}