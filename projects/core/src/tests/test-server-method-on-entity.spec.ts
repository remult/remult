import { ActionTestConfig } from './testHelper.spec';
import { Remult, isBackend } from '../context';
import { actionInfo, BackendMethod } from '../server-action';
import { Field, Entity, EntityBase, getFields, getEntityRef } from '../remult3';
import { InMemoryDataProvider } from '../data-providers/in-memory-database';
import { DataApi } from '../data-api';
import { TestDataApiResponse } from './basicRowFunctionality.spec';
import { set } from '../../set';

@Entity('testServerMethodOnEntity')
class testServerMethodOnEntity extends EntityBase {
    constructor(private remult: Remult) {
        super();
    }
    @Field<testServerMethodOnEntity, string>({
        validate: (y, x) => {
            if (y.a == "errorc") {
                x.error = "error on client";
            }
            else if (y.a == "error on server" && isBackend()) {
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
            onServer: isBackend(),
            result
        }
    }
    @BackendMethod({ allowed: true })
    async doItAgain() {
        expect(await this.remult.repo(testServerMethodOnEntity).count()).toBe(0);
        await this._.save();
        expect(await this.remult.repo(testServerMethodOnEntity).count()).toBe(1);
        return (await this.remult.repo(testServerMethodOnEntity).findFirst()).a
    }


}

@Entity<testBoolCreate123>('testBoolCreate123', (o, c) => set(o, {
    allowApiCrud: true,
    saving: async t => {
        if (isBackend() && t._.isNew()) {

            await c.repo(testBoolCreate123).count();
            await new Promise((res, rej) => setTimeout(() => {
                res({})
            }, 20));
            t.ok123 = true;
        }

    }
}))
class testBoolCreate123 extends EntityBase {
    @Field()
    id: number;
    @Field({})
    ok123: Boolean = false;
    @BackendMethod({ allowed: true })
    async testIt() {
        await this._.save();
    }
}
describe("test Server method in entity", () => {
    let c = new Remult();
    it("test server method on Entity", async () => {
        let x = c.repo(testServerMethodOnEntity).create();
        x.a = 'Noam';
        let r = await x.doIt1();
        expect(r.onServer).toBe(true);
        expect(r.result).toBe('hello Noam');
        expect(x.a).toBe("yael");
    });
    it("test server method on Entity", async () => {
        let x = c.repo(testServerMethodOnEntity).create();
        x.a = 'Noam';
        expect(await x.doItAgain()).toBe("Noam");

    });
    it("test validation method", async () => {
        let x = c.repo(testServerMethodOnEntity).create();
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
    it("test validation on server", async () => {
        let x = c.repo(testServerMethodOnEntity).create();
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
    it("saves correctly to db", async () => {

        actionInfo.runningOnServer = true;
        let remult = new Remult();
        remult.setDataProvider(new InMemoryDataProvider());
        let r = remult.repo(testBoolCreate123);
        let dataApi = new DataApi(r, remult);
        let t = new TestDataApiResponse();
        t.created = x => {
            expect(x.ok123).toBe(true);
        }

        await dataApi.post(t, { id: 1, ok123: false })
        t.success = x => {
            expect(x.ok123).toBe(false);
        }
        await dataApi.put(t, 1, { ok123: false })
        actionInfo.runningOnServer = false;



    });
});


@Entity('a')
class a extends EntityBase {
    @Field()
    id: number;
}
@Entity('b')
class b extends EntityBase {
    @Field()
    id: number;
    @Field()
    a: a;
}
@Entity('c')
class c extends EntityBase {
    @Field()
    id: number;
    @Field()
    b: b;
    @BackendMethod({ allowed: true })
    async doIt() {
        expect(this.b.id).toBe(11);
        expect(this.b.a.id).toBe(1);
        this.b = await this.remult.repo(b).findId(12);
        expect(this.b.id).toBe(12);
        expect(this.b.a.id).toBe(2);
        await this.save();
        return this.b.a.id;
    }
    @BackendMethod({ allowed: true })
    async doIt2() {
        expect(this.b.id).toBe(12);
        expect(this.b.a.id).toBe(2);
        await this.save();
        return this.b.a.id;
    }
    constructor(private remult: Remult) {
        super();
    }
}


describe("complex entity relations on server entity and backend method", () => {
    beforeEach(() => {
        ActionTestConfig.db.rows = [];
    });
    it("fix it", async () => {
        let remult = new Remult();
        remult.setDataProvider(ActionTestConfig.db);
        let a1 = await remult.repo(a).create({ id: 1 }).save();
        let a2 = await remult.repo(a).create({ id: 2 }).save();
        let b1 = await remult.repo(b).create({ id: 11, a: a1 }).save();
        let b2 = await remult.repo(b).create({ id: 12, a: a2 }).save();
        let c1 = await remult.repo(c).create({ id: 21, b: b1 }).save();
        remult = new Remult();//clear the cache;
        remult.setDataProvider(ActionTestConfig.db);

        let r = await c1.doIt();
        expect(r).toBe(2);
        expect(c1.b.id).toBe(12);
        expect(c1.b.a.id).toBe(2);
    });
    it("fix it new row", async () => {
        let remult = new Remult();
        remult.setDataProvider(ActionTestConfig.db);
        let a1 = await remult.repo(a).create({ id: 1 }).save();
        let a2 = await remult.repo(a).create({ id: 2 }).save();
        let b1 = await remult.repo(b).create({ id: 11, a: a1 }).save();
        let b2 = await remult.repo(b).create({ id: 12, a: a2 }).save();

        remult = new Remult();//clear the cache;
        remult.setDataProvider(ActionTestConfig.db);
        let c1 = await remult.repo(c).create({ id: 21, b: b1 })
        let r = await c1.doIt();
        expect(r).toBe(2);
        expect(c1.b.id).toBe(12);
        expect(c1.b.a.id).toBe(2);
    });
    it("fix it change value", async () => {
        let remult = new Remult();
        remult.setDataProvider(ActionTestConfig.db);
        let a1 = await remult.repo(a).create({ id: 1 }).save();
        let a2 = await remult.repo(a).create({ id: 2 }).save();
        let b1 = await remult.repo(b).create({ id: 11, a: a1 }).save();
        let b2 = await remult.repo(b).create({ id: 12, a: a2 }).save();
        let c1 = await remult.repo(c).create({ id: 21, b: b1 }).save();
        remult = new Remult();//clear the cache;
        remult.setDataProvider(ActionTestConfig.db);
        c1 = await remult.repo(c).findId(21);
        c1.b = b2;
        let r = await c1.doIt2();
        expect(r).toBe(2);
        expect(c1.b.id).toBe(12);
        expect(c1.b.a.id).toBe(2);
    });

});

