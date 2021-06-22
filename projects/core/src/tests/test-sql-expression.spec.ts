import { fitAsync, itAsync } from './testHelper.spec';
import { ServerContext } from '../context';

import { InMemoryDataProvider } from '../data-providers/in-memory-database';

import { SqlDatabase } from '../data-providers/sql-database';
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { Field, Entity, EntityBase } from '../remult3';

describe("test sql database", () => {
    let db = new SqlDatabase(new WebSqlDataProvider("test"));
    let context = new ServerContext();
    context.setDataProvider(db);
    async function deleteAll() {
        for (const c of await context.for(testSqlExpression).find()) {
            await c._.delete();
        }
    }
    itAsync("test basics", async () => {
        await deleteAll();
        let x = context.for(testSqlExpression).create();
        x.code = 3;
        await x._.save();
        expect(x.code).toBe(3);
        expect(x.testExpression).toBe(15, "after save");
        expect(x._.fields.testExpression.originalValue).toBe(15, "after save");
        x = await context.for(testSqlExpression).findFirst();

        expect(x.testExpression).toBe(15);
    });
    it("test undefined behaves as a column", () => {
        let x = context.for(expressionEntity);
        expect(x.metadata.fields.col.dbName).toBe('col');
        expect(x.metadata.fields.col.dbReadOnly).toBe(false);
        let c=  new ServerContext();
        expressionEntity.yes= true;
         x = context.for(expressionEntity);
        expect(x.metadata.fields.col.dbName).toBe('name');
        expect(x.metadata.fields.col.dbReadOnly).toBe(true);
    });

});
@Entity({ key: 'expressionEntity' })
class expressionEntity extends EntityBase {
    static yes: boolean;
    @Field({
        sqlExpression: () => expressionEntity.yes ? 'name' : undefined
    })
    col: string;
}




@Entity({ key: 'testSqlExpression' })
class testSqlExpression extends EntityBase {
    @Field()
    code: number;
    @Field<testSqlExpression>(
        {
            sqlExpression: (x) => {
                return x.fields.code.dbName + ' * 5';
            }
        }
    )
    testExpression: number;

}