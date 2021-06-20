import { itAsync, Done, fitAsync } from './testHelper.spec';
import { Context, ServerContext } from '../context';
import { BackendMethod } from '../server-action';
import { Field, Entity, EntityBase, getFields, getEntityRef } from '../remult3';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { DataApi } from '../data-api';
import { TestDataApiResponse } from './basicRowFunctionality.spec';

@Entity({ key: 'testServerMethodOnEntity' })
class testServerMethodOnEntity extends EntityBase {
    constructor(private context: Context) {
        super();
    }
    @Field<testServerMethodOnEntity, string>({
        validate: (y, x) => {
            if (y.a == "errorc") {
                x.error = "error on client";
            }
            else if (y.a == "error on server" && y.context.backend) {
                x.error = "error on server";
            }
        }
    })

    a: string;
    @BackendMethod({ allowed: true })
    async doIt1() {
        let result = 'hello ' + this.a;
        this.a = 'yael';
        return {
            onServer: this.context.backend,
            result
        }
    }
    @BackendMethod({ allowed: true })
    async doItAgain() {
        expect(await this.context.for(testServerMethodOnEntity).count()).toBe(0);
        await this._.save();
        expect(await this.context.for(testServerMethodOnEntity).count()).toBe(1);
        return (await this.context.for(testServerMethodOnEntity).findFirst()).a
    }


}

@Entity<testBoolCreate123>({
    key: 'testBoolCreate123',
    allowApiCrud: true,
    saving: async t => {
        if (t.context.backend && t._.isNew()) {

            await t.context.for(testBoolCreate123).count();
            await new Promise((res, rej) => setTimeout(() => {
                res({})
            }, 20));
            t.ok123 = true;
        }

    }
})
class testBoolCreate123 extends EntityBase {
    @Field()
    id: number;
    @Field({})
    ok123: Boolean = false;
    @BackendMethod({ allowed: true })
    async testIt() {
        
        await this._.save();

    }
    constructor(private context: Context) {
        super();
    }
}
describe("test Server method in entity", () => {
    let c = new Context();
    itAsync("test server method on Entity", async () => {
        let x = c.for(testServerMethodOnEntity).create();
        x.a = 'Noam';
        let r = await x.doIt1();
        expect(r.onServer).toBe(true);
        expect(r.result).toBe('hello Noam');
        expect(x.a).toBe("yael");
    });
    itAsync("test server method on Entity", async () => {
        let x = c.for(testServerMethodOnEntity).create();
        x.a = 'Noam';
        expect(await x.doItAgain()).toBe("Noam");

    });
    itAsync("test validation method", async () => {
        let x = c.for(testServerMethodOnEntity).create();
        x.a = 'errorc';
        let happened = false;
        try {
            let r = await x.doIt1();
            happened = true;

        }
        catch (err) {
            expect(err.modelState.a).toBe("error on client");
            expect(getEntityRef(x).fields.a.error).toBe("error on client");
        }
        expect(happened).toBe(false);


    });
    itAsync("test validation on server", async () => {
        let x = c.for(testServerMethodOnEntity).create();
        x.a = "error on server";
        let happened = false;
        try {
            let r = await x.doIt1();
            happened = true;

        }
        catch (err) {
            expect(err.modelState.a).toBe("error on server");
            expect(getEntityRef(x).fields.a.error).toBe("error on server");
        }
        expect(happened).toBe(false);


    });
    itAsync("saves correctly to db", async () => {

        let context = new ServerContext();
        context.setDataProvider(new InMemoryDataProvider());
        let r = context.for(testBoolCreate123);
        let dataApi = new DataApi(r, context);
        let t = new TestDataApiResponse();
        t.created = x => {
            expect(x.ok123).toBe(true);
        }

        await dataApi.post(t, { id: 1, ok123: false })
        t.success = x => {
            expect(x.ok123).toBe(false);
        }
        await dataApi.put(t, 1, { ok123: false })



    });
});



