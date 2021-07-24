import { fitAsync, itAsync } from './testHelper.spec';
import { ServerContext } from '../context';

import { InMemoryDataProvider } from '../data-providers/in-memory-database';

import { SqlDatabase } from '../data-providers/sql-database';
import { WebSqlDataProvider } from '../data-providers/web-sql-data-provider';
import { Field, Entity, EntityBase, IntegerField } from '../remult3';

describe("test sql database expressions", () => {
    let web = new WebSqlDataProvider("test");
    let db = new SqlDatabase(web);
    let context = new ServerContext();
    context.setDataProvider(db);
    async function deleteAll() {
        await web.dropTable(context.for(testSqlExpression).metadata);
        await web.dropTable(context.for(expressionEntity).metadata);

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
    itAsync("test undefined behaves as a column", async () => {
        await deleteAll();
        let x = context.for(expressionEntity);
        expect((await x.metadata.fields.col.getDbName())).toBe('col');
        expect((await x.create({ col: 'abc', id: 1 }).save()).col).toBe('abc');
        //expect(x.metadata.fields.col.dbReadOnly).toBe(false);
        let c = new ServerContext(db);
        expressionEntity.yes = true;
        x = c.for(expressionEntity);
        expect(await x.metadata.fields.col.getDbName()).toBe("'1+1'");
        expect((await x.create({ col: 'abc', id: 2 }).save()).col).toBe('1+1');
        //expect(x.metadata.fields.col.dbReadOnly).toBe(true);
    });
    itAsync("test asyync dbname", async () => {
        let z = await context.for(testServerExpression1).metadata.getDbName();
        expect(z).toBe('testServerExpression1');
    });

});
@Entity({ key: 'expressionEntity' })
class expressionEntity extends EntityBase {
    @IntegerField()
    id: number;
    static yes: boolean;
    @Field({
        sqlExpression: async () => expressionEntity.yes ? "'1+1'" : undefined
    })
    col: string;
}




@Entity({ key: 'testSqlExpression' })
class testSqlExpression extends EntityBase {
    @Field()
    code: number;
    @Field<testSqlExpression>(
        {
            sqlExpression: async (x) => {
                return await x.fields.code.getDbName() + ' * 5';
            }
        }
    )
    testExpression: number;

}

@Entity({
    key: 'testServerExpression1', dbName: async () => new Promise(res => setTimeout(() => {
        res('testServerExpression1');
    }, 30))
})
class testServerExpression1 extends EntityBase {

    @Field()
    code: number;

}