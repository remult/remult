import { itAsync, Done, fitAsync } from './testHelper.spec';
import { Context } from '../context';
import { ServerController, ServerFunction, ServerMethod } from '../server-action';
import { Column, getControllerDefs } from '../remult3';

@ServerController({ allowed: true, key: '1' })
class testBasics {
    constructor(private context: Context) {

    }
    static test: string;
    @Column<testBasics, string>({
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
    @ServerMethod()
    async doIt() {
        let result = 'hello ' + this.a;
        this.a = 'yael';
        return {
            onServer: this.context.onServer,
            result
        }
    }
    @ServerFunction({ allowed: true })
    static async sf(name: string, context?: Context) {
        return {
            onServer: context.onServer,
            result: 'hello ' + name
        }
    }
}
describe("test Server Controller basics", () => {
    itAsync("test server function", async () => {

        let r = await testBasics.sf("noam");
        expect(r.onServer).toBe(true);
        expect(r.result).toBe('hello noam');
    });
    itAsync("test server method", async () => {
        
        let x = new testBasics(new Context());
        x.a = 'Noam';
        let r = await x.doIt();
        expect(r.onServer).toBe(true);
        expect(r.result).toBe('hello Noam');
        expect(x.a).toBe("yael");
    });
    itAsync("test validation method", async () => {
        let x = new testBasics(new Context());
        x.a = 'errorc';
        let happened = false;
        try {
            let r = await x.doIt();
            happened = true;

        }
        catch (err) {
            expect(err.modelState.a).toBe("error on client");
            expect(getControllerDefs(x).columns.a.error).toBe("error on client");
        }
        expect(happened).toBe(false);


    });
    itAsync("test validation on server", async () => {
        let x = new testBasics(new Context());
        x.a = "error on server";
        let happened = false;
        try {
            let r = await x.doIt();
            happened = true;

        }
        catch (err) {
            expect(err.modelState.a).toBe("error on server");
            expect(getControllerDefs(x).columns.a.error).toBe("error on server");
        }
        expect(happened).toBe(false);


    });
});
