import { itAsync, Done, fitAsync } from './testHelper.spec';
import { Context } from '../context';
import { ServerMethod } from '../server-action';
import { Column, Entity, EntityBase, getControllerDefs, getEntityOf } from '../remult3';

@Entity({ key: 'testServerMethodOnEntity' })
class testServerMethodOnEntity extends EntityBase {
    constructor(private context: Context) {
        super();
    }
    @Column<testServerMethodOnEntity, string>({
        validate: (y, x) => {
            if (y.a == "errorc") {
                x.error = "error on client";
            }
            else if (y.a == "error on server" && y.context.onServer) {
                x.error = "error on server";
            }
        }
    })

    a: string;
    @ServerMethod({ allowed: true })
    async doIt1() {
        let result = 'hello ' + this.a;
        this.a = 'yael';
        return {
            onServer: this.context.onServer,
            result
        }
    }
    @ServerMethod({ allowed: true })
    async doItAgain() {
        expect(await this.context.for(testServerMethodOnEntity).count()).toBe(0);
        await this._.save();
        expect(await this.context.for(testServerMethodOnEntity).count()).toBe(1);
        return (await this.context.for(testServerMethodOnEntity).findFirst()).a
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
            expect(getEntityOf(x).columns.a.error).toBe("error on client");
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
            expect(getEntityOf(x).columns.a.error).toBe("error on server");
        }
        expect(happened).toBe(false);


    });
});