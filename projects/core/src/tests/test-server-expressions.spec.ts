import { fitAsync, itAsync } from './testHelper.spec';
import { Context, ServerContext } from '../context';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { Field, Entity, EntityBase } from '../remult3';



describe("test server expression value", () => {
    itAsync("test basics create", async () => {

        let c = new ServerContext(new InMemoryDataProvider());
        testServerExpression.testVal = 1;
        testServerExpression.testVal2 = 11;
        let r = c.for(testServerExpression).create();
        r.code = 5;
        await r._.save();
        expect(r.test).toBe(1);
        expect(r.testPromise).toBe(11);
        expect(testServerExpression.testVal).toBe(2);
        expect(testServerExpression.testVal2).toBe(12);
    });
    itAsync("test basics find", async () => {
        let c = new ServerContext(new InMemoryDataProvider());
        testServerExpression.testVal = 1;
        testServerExpression.testVal2 = 11;
        let r = c.for(testServerExpression).create();
        r.code = 5;
        await r._.save();
        testServerExpression.testVal = 1;
        testServerExpression.testVal2 = 11;
        r = (await c.for(testServerExpression).find({}))[0];
        expect(r.test).toBe(1);
        expect(r.testPromise).toBe(11);
        expect(testServerExpression.testVal).toBe(2);
        expect(testServerExpression.testVal2).toBe(12);
    });
    itAsync("test doesnt calc on client", async () => {
        let c = new Context();
        c.setDataProvider(new InMemoryDataProvider());

        testServerExpression.testVal = 1;
        testServerExpression.testVal2 = 11;
        let r = c.for(testServerExpression).create();
        r.code = 5;
        await r._.save();
        expect(r.test).toBe(undefined);
        expect(r.testPromise).toBe(undefined);
        expect(testServerExpression.testVal).toBe(1);
        expect(testServerExpression.testVal2).toBe(11);
    });
    itAsync("test basics find doesnt calc on client", async () => {
        let c = new Context();
        c.setDataProvider(new InMemoryDataProvider());

        let r = c.for(testServerExpression).create();
        r.code = 5;
        await r._.save();
        testServerExpression.testVal = 1;
        testServerExpression.testVal2 = 11;
        r = (await c.for(testServerExpression).find({}))[0];
        expect(r.test).toBe(undefined);
        expect(r.testPromise).toBe(undefined);
        expect(testServerExpression.testVal).toBe(1);
        expect(testServerExpression.testVal2).toBe(11);
    });
  



});

@Entity({ key: 'testServerExpression' })
class testServerExpression extends EntityBase {
    static testVal = 1;
    static testVal2 = 10;
    @Field()
    code: number;
    @Field({ serverExpression: () => testServerExpression.testVal++ })
    test: number;
    @Field({ serverExpression: () => Promise.resolve(testServerExpression.testVal2++) })
    testPromise: number;
}
