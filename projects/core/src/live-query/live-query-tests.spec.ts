
import { Remult } from "../context";
import { InMemoryDataProvider } from "../data-providers/in-memory-database";
import { Entity, EntityBase, Fields } from "../remult3";
import { actionInfo } from "../server-action";
import { createData } from "../tests/createData";
import { LiveQueryClient, liveQueryMessage, MessageHandler } from "./LiveQuery";
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
    serverRemult.user = ({ id: 'server', name: 'server', roles: [] });
    const serverRepo = serverRemult.repo(eventTestEntity);
    const items = [
        { id: 1, title: 'noam' },
        { id: 2, title: 'yael' },
        { id: 3, title: 'yoni' },
        { id: 4, title: 'maayan' },
        { id: 5, title: 'itamar' },
        { id: 6, title: 'ofri' }
    ];
    await serverRepo.insert(items);
    const remult = new Remult(mem);
    remult.user = ({ id: clientId1, name: clientId1, roles: [] });
    const clientRepo = remult.repo(eventTestEntity);
    const messages: ServerEventMessage[] = [];
    const qm = new LiveQueryManager({ sendQueryMessage: m => messages.push(m), sendChannelMessage: undefined });
    let p = new PromiseResolver(qm);

    serverRemult._changeListener = qm;
    const queryId = qm.subscribe(clientRepo, clientId1, {}, remult, items.map(x => x.id));
    expect(messages.length).toBe(0);
    return { serverRepo, serverRemult, remult, clientRepo, messages, qm, queryId, flush: () => p.flush() };
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

class PromiseResolver {
    private promises: any[] = [];
    constructor(who: { runPromise: (p: any) => void }) {
        who.runPromise = p => this.promises.push(p);
    }
    async flush() {
        while (this.promises.length > 0) {

            let p = this.promises;
            this.promises = [];
            await Promise.all(p);
        }
    }

}


fdescribe("Live Query Client", () => {
    it("registers once", async () => {
        let open = 0;
        let get = 0;
        let sendMessage: MessageHandler;
        const lqc = new LiveQueryClient({
            openStreamAndReturnCloseFunction(clientId, onMessage) {
                open++;
                sendMessage = onMessage;
                return () => {
                    open--;
                }
            },
        }, {
            get: async (url) => {
                get++;
                return {
                    id: '1',
                    result: [{
                        id: 1,
                        title: 'noam'
                    }]
                }
            },
            put: undefined,
            post: undefined,
            delete: undefined
        });
        let p = new PromiseResolver(lqc);
        const serverRemult = new Remult(new InMemoryDataProvider());
        const serverRepo = serverRemult.repo(eventTestEntity);
        let closeSub1: VoidFunction;
        let closeSub2: VoidFunction;
        let result1: eventTestEntity[];
        let result2: eventTestEntity[];
        closeSub1 = lqc.subscribe(serverRepo, {}, result => {
            result1 = result;
        });
        closeSub2 = lqc.subscribe(serverRepo, {}, result => {
            result2 = result;
        });
        await p.flush();
        expect(open).toBe(1);
        expect(get).toBe(1);
        expect(result1[0].title).toBe("noam");
        expect(result2[0].title).toBe("noam");
        sendMessage({
            event: '1',
            data: JSON.stringify({
                type: "replace",
                data: {
                    oldId: 1,
                    item: {
                        id: 1,
                        title: 'noam1'
                    }
                }
            } as liveQueryMessage)
        });
        await p.flush();
        expect(result1[0].title).toBe("noam1");
        expect(result2[0].title).toBe("noam1");
        closeSub1();
        await p.flush();
        sendMessage({
            event: '1',
            data: JSON.stringify({
                type: "replace",
                data: {
                    oldId: 1,
                    item: {
                        id: 1,
                        title: 'noam2'
                    }
                }
            } as liveQueryMessage)
        });
        await p.flush();
        expect(result1[0].title).toBe("noam1");
        expect(result2[0].title).toBe("noam2");
        closeSub2();
        await p.flush();
        expect(open).toBe(0);
        get = 0;
        closeSub1 = lqc.subscribe(serverRepo, {}, result => {
            result1 = result;
        });
        await p.flush();
        expect(open).toBe(1);
        expect(get).toBe(1);
        closeSub1();
        expect(open).toBe(0);
    })
});