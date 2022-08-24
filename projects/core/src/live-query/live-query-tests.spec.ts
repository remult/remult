
import { Remult } from "../context";
import { InMemoryDataProvider } from "../data-providers/in-memory-database";
import { Entity, EntityBase, Fields } from "../remult3";
import { actionInfo } from "../server-action";
import { createData } from "../tests/createData";
import { LiveQueryManager, ServerEventMessage } from "./LiveQueryManager";

const joc = jasmine.objectContaining;

@Entity("event-test", { allowApiCrud: true })
export class eventTestEntity extends EntityBase {
    @Fields.integer()
    id = 0;
    @Fields.string()
    title: string;
    @Fields.string((o, remult) => o.serverExpression = () => remult.user.name)
    selectUser = '';
}


async function setup1() {
    const mem = new InMemoryDataProvider()
    const serverRemult = new Remult(mem);
    serverRemult.setUser({ id: 'server', name: 'server', roles: [] });
    const serverRepo = serverRemult.repo(eventTestEntity);
    await serverRepo.insert([
        { id: 1, title: 'noam' },
        { id: 2, title: 'yael' },
        { id: 3, title: 'yoni' },
        { id: 4, title: 'maayan' },
        { id: 5, title: 'itamar' },
        { id: 6, title: 'ofri' }
    ]);
    const remult = new Remult(mem);
    remult.setUser({ id: clientId1, name: clientId1, roles: [] });
    const clientRepo = remult.repo(eventTestEntity);
    const messages: ServerEventMessage[] = [];
    const qm = new LiveQueryManager({ send: m => messages.push(m) });
    const promises: Promise<any>[] = [];
    qm.runPromise = x => promises.push(x);
    serverRemult._changeListener = qm;
    const queryId = qm.subscribe(clientRepo, clientId1, {});
    expect(messages.length).toBe(0);
    return { serverRepo, serverRemult, remult, clientRepo, messages, qm, queryId, flush: () => Promise.all(promises) };
}

const clientId1 = "clientId1";
fdescribe("Live Query", () => {
    beforeEach(() => { actionInfo.runningOnServer = true });
    afterEach(() => { actionInfo.runningOnServer = false })
    it("test that data is sent with correct remult user", async () => {

        const { serverRepo, messages, flush } = await setup1();
        const row = await serverRepo.findId(1);
        row.title += '1';
        await row.save();
        await flush();
        expect(messages).toEqual([joc({
            message: joc({
                type: 'replace',
                data: joc({
                    oldId: 1,
                    item: joc({ selectUser: clientId1 })
                })
            })
        })])
    });
    it("test that id change is supported", async () => {
        const { serverRepo, messages, flush } = await setup1();
        const row = await serverRepo.findId(1);
        row.id = 99;
        await row.save();
        await flush();
        expect(messages).toEqual([joc({
            message: joc({
                type: 'replace',
                data: joc({
                    oldId: 1,
                    item: joc({
                        id: 99,
                        selectUser: clientId1
                    })
                })
            })
        })])
    });
    it("new row is reported", async () => {
        const { serverRepo, messages, flush } = await setup1();
        const row = await serverRepo.insert([{ id: 9, title: 'david' }]);
        await flush();
        expect(messages).toEqual([joc({
            message: joc({
                type: 'add',
                data: joc({
                    item: joc({
                        id: 9,
                        selectUser: clientId1
                    })
                })
            })
        })])
    });
    it("removed row is reported", async () => {
        const { serverRepo, messages, flush } = await setup1();
        await (await serverRepo.findFirst({ id: 1 })).delete();
        await flush();
        expect(messages).toEqual([joc({
            message: joc({
                type: 'remove',
                data: { id: 1 }
            })
        })])
    });
});


