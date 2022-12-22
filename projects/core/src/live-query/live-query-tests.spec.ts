
import { queryConfig, Remult } from "../context";
import { DataApi, DataApiRequest } from "../data-api";
import { InMemoryDataProvider } from "../data-providers/in-memory-database";
import { Entity, Fields, FindOptions, getEntityRef } from "../remult3";
import { actionInfo } from "../server-action";
import { createMockHttpDataProvider } from "../tests/testHelper.spec";
import { liveQueryMessage } from "./LiveQuerySubscriber";
import { LiveQueryClient } from "./LiveQueryClient";
import { LiveQueryPublisher, LiveQueryStorage, LiveQueryStorageInMemoryImplementation } from "./LiveQueryPublisher";
import { findOptionsFromJson, findOptionsToJson } from "../data-providers/rest-data-provider";

const joc = jasmine.objectContaining;

@Entity("event-test", { allowApiCrud: true })
export class eventTestEntity {
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
    const messages: liveQueryMessage[] = [];
    serverRemult.subServer = {
        subscriptionServer: {
            publishMessage: (c, m: any) => messages.push(...m),
        }, liveQueryStorage: new LiveQueryStorageInMemoryImplementation()
    };
    const qm = new LiveQueryPublisher(() => (serverRemult.subServer), async (_, _1, c) => c(clientRepo));
    let p = new PromiseResolver(qm);

    serverRemult.liveQueryPublisher = qm;
    serverRemult.subServer.liveQueryStorage.store({
        entityKey: clientRepo.metadata.key,
        findOptionsJson: {},
        requestJson: {},
        lastIds: items.map(x => x.id),
        id: "xxx"
    })
    expect(messages.length).toBe(0);
    return { serverRepo, messages, flush: () => p.flush() };
}

const clientId1 = "clientId1";
describe("Live Query", () => {
    beforeEach(() => { actionInfo.runningOnServer = true });
    afterEach(() => { actionInfo.runningOnServer = false })
    it("test that data is sent with correct remult user", async () => {

        const { serverRepo, messages, flush } = await setup1();
        const row = await serverRepo.findId(1);
        row.title += '1';
        await serverRepo.save(row);
        await flush();
        expect(messages).toEqual([joc({
            type: 'replace',
            data: joc({
                oldId: 1,
                item: joc({ selectUser: clientId1 })
            })
        })])
    });
    it("test that id change is supported", async () => {
        const { serverRepo, messages, flush } = await setup1();
        const row = await serverRepo.findId(1);
        row.id = 99;
        await serverRepo.save(row);
        await flush();
        expect(messages).toEqual([joc({
            type: 'replace',
            data: joc({
                oldId: 1,
                item: joc({
                    id: 99,
                    selectUser: clientId1
                })
            })
        })
        ])
    });
    it("new row is reported", async () => {
        const { serverRepo, messages, flush } = await setup1();
        const row = await serverRepo.insert([{ id: 9, title: 'david' }]);
        await flush();
        expect(messages).toEqual([joc({
            type: 'add',
            data: joc({
                item: joc({
                    id: 9,
                    selectUser: clientId1
                })
            })
        })
        ])
    });
    it("removed row is reported", async () => {
        const { serverRepo, messages, flush } = await setup1();
        await serverRepo.delete((await serverRepo.findFirst({ id: 1 })));
        await flush();
        expect(messages).toEqual([joc({
            type: 'remove',
            data: { id: 1 }
        })])
    });
});

class PromiseResolver {
    private promises: any[] = [];
    constructor(...who: { runPromise: (p: any) => void }[]) {
        for (const w of who) {
            w.runPromise = p => {
                this.promises.push(p);
                return p;
            };
        }
    }
    async flush() {
        while (this.promises.length > 0) {

            let p = this.promises;
            this.promises = [];
            await Promise.all(p);
        }
    }

}


describe("Live Query Client", () => {
    it("registers once", async () => {
        let open = 0;
        let get = 0;
        let sendMessage = x => { };
        const lqc = new LiveQueryClient(() => ({
            subscriptionClient: {
                async openConnection(onMessage) {
                    open++;
                    return {
                        close() {
                            open--;
                        },
                        subscribe(channel, onMessage) {
                            sendMessage = x => onMessage([x]);
                            return () => {

                            }
                        },
                    }
                },
            },
            httpClient: {
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
                put: () => undefined,
                post: async () => { },
                delete: () => undefined
            }
        }));
        lqc.timeoutToCloseWhenNotClosed = 10;
        let p = new PromiseResolver(lqc);
        const serverRemult = new Remult(new InMemoryDataProvider());
        serverRemult.liveQuerySubscriber = lqc;
        const serverRepo = serverRemult.repo(eventTestEntity);
        let closeSub1: VoidFunction;
        let closeSub2: VoidFunction;
        let result1: eventTestEntity[];
        let result2: eventTestEntity[];
        closeSub1 = serverRepo.query().subscribe(reducer => {
            result1 = reducer(result1);
        });
        closeSub2 = serverRepo.query().subscribe(reducer => {
            result2 = reducer(result2);
        });
        await p.flush();
        expect(open).toBe(1);
        expect(get).toBe(1);
        expect(result1[0].title).toBe("noam");
        expect(result2[0].title).toBe("noam");
        sendMessage({

            type: "replace",
            data: {
                oldId: 1,
                item: {
                    id: 1,
                    title: 'noam1'
                }
            }
        } as liveQueryMessage
        );
        await p.flush();
        expect(result1[0].title).toBe("noam1");
        expect(result2[0].title).toBe("noam1");
        closeSub1();
        await p.flush();
        sendMessage({

            type: "replace",
            data: {
                oldId: 1,
                item: {
                    id: 1,
                    title: 'noam2'
                }
            }
        } as liveQueryMessage
        );
        await p.flush();
        expect(result1[0].title).toBe("noam1");
        expect(result2[0].title).toBe("noam2");
        closeSub2();
        await p.flush();
        expect(open).toBe(0);
        get = 0;
        closeSub1 = lqc.subscribe(serverRepo, {}, reducer => {
            result1 = reducer(result1);
        });
        await p.flush();
        expect(open).toBe(1);
        expect(get).toBe(1);
        closeSub1();
        await p.flush();
        expect(open).toBe(0);
    })
});

describe("test live query full cycle", () => {
    beforeEach(() => {
        queryConfig.defaultPageSize = 100;
    });
    afterEach(() => {
        queryConfig.defaultPageSize = 2;
    });
    function setup2() {
        const mem = new InMemoryDataProvider();
        const remult = new Remult(mem);
        const repo = remult.repo(eventTestEntity);
        const remult2 = new Remult(mem);
        const repo2 = remult2.repo(eventTestEntity);

        const mh: ((channel: string, message: liveQueryMessage) => void)[] = [];
        let messageCount = 0;
        const storage = new LiveQueryStorageInMemoryImplementation();
        remult.subServer = {
            liveQueryStorage: storage,
            subscriptionServer: {
                publishMessage<liveQueryMessage>(channel, message) {
                    mh.forEach(x => x(channel, message))
                }
            }
        }
        const qm = new LiveQueryPublisher(() => (remult.subServer), async (_, _1, c) => c(repo));
        remult.liveQueryPublisher = qm;
        var dataApi = new DataApi(repo, remult);
        const clientStatus = {
            connected: true,
            reconnect: () => { }
        }
        const buildLqc = () => {
            return new LiveQueryClient(() => ({
                subscriptionClient: {
                    async openConnection(onReconnect) {
                        clientStatus.connected = true;
                        clientStatus.reconnect = () => {
                            onReconnect();
                            clientStatus.connected = true;
                        };
                        const channels: string[] = [];


                        return {
                            close() {

                            },
                            subscribe(channel, onMessage) {
                                channels.push(channel);
                                mh.push((c, message) => {
                                    if (clientStatus.connected)
                                        if (channels.includes(c) && c == channel) {
                                            messageCount++;
                                            onMessage(
                                                message
                                            );
                                        }
                                });

                                return () => {
                                    channels.splice(channels.indexOf(channel), 1);
                                }
                            },
                        };
                    },
                }, httpClient: createMockHttpDataProvider(dataApi)
            }));
        };
        const lqc1 = buildLqc();
        const lqc2 = buildLqc();

        var pm = new PromiseResolver(lqc1, lqc2, qm);
        remult.liveQuerySubscriber = lqc1;
        remult2.liveQuerySubscriber = lqc2;
        remult.liveQueryPublisher = qm;
        remult2.liveQueryPublisher = qm;
        return { repo, pm, repo2, messageCount: () => messageCount, clientStatus, qm: storage, testApi: () => createMockHttpDataProvider(dataApi) };
    }
    it("integration test 1", async () => {
        var { repo, pm, repo2 } = setup2();
        let result1: eventTestEntity[] = [];
        repo.query().subscribe(reducer => result1 = reducer(result1));
        await pm.flush();
        expect(result1.length).toBe(0);
        await repo.insert({ id: 1, title: "noam" });
        await repo2.insert({ id: 2, title: "yael" });
        await pm.flush();
        expect(result1.length).toBe(2);
        result1[0] = { ...result1[0], title: 'noam1' };
        await repo2.save({ ...result1[1], title: 'yael2' });
        await pm.flush();
        expect(result1.length).toBe(2);
        expect(result1[0].title).toBe('noam1');
        expect(result1[1].title).toBe('yael2');
        await repo.save(result1[0]);
    });
    it("test delete works", async () => {
        var { repo, pm, repo2 } = setup2();
        let result1: eventTestEntity[] = [];
        repo.query().subscribe(reducer => result1 = reducer(result1));
        await pm.flush();
        await repo.insert({ id: 1, title: "noam" });
        await repo2.insert({ id: 2, title: "yael" });
        await pm.flush();
        await repo.delete(result1[1]);
        await pm.flush();
        expect(result1.length).toBe(1);
    });
    it("test add works if item already in array", async () => {
        var { repo, pm, repo2 } = setup2();
        let result1: eventTestEntity[] = [];
        repo.query().subscribe(reducer => result1 = reducer(result1));
        await pm.flush();
        result1 = [await repo.insert({ id: 1, title: "noam" })];
        await pm.flush();
        expect(result1.length).toBe(1);
    });
    it("test unsubscribe works", async () => {
        var { repo, pm, messageCount, qm } = setup2();
        let result1: eventTestEntity[] = [];
        const unsubscribe = repo.query().subscribe(reducer => result1 = reducer(result1));
        await pm.flush();
        await repo.insert({ id: 1, title: "noam" });
        await pm.flush();
        expect(result1.length).toBe(1);
        expect(messageCount()).toBe(1);
        expect(qm.queries.length).toBe(1);
        unsubscribe();
        await pm.flush();
        await repo.insert({ id: 2, title: 'noam' });
        await pm.flush();
        expect(qm.queries.length).toBe(0);
        expect(messageCount()).toBe(1);
    });
    it("test disconnect and reconnect scenario", async () => {
        var { repo, pm, clientStatus } = setup2();
        let result1: eventTestEntity[] = [];
        repo.query().subscribe(reducer => result1 = reducer(result1));
        await pm.flush();
        await repo.insert({ id: 1, title: "noam" });
        await pm.flush();
        expect(result1.length).toBe(1);
        clientStatus.connected = false;
        await repo.insert({ id: 2, title: "yael" });
        await pm.flush();
        expect(result1.length).toBe(1);
        clientStatus.reconnect();
        expect(clientStatus.connected).toBe(true);
        await pm.flush();
        expect(result1.length).toBe(2);
    });
    it("expect pure json object, from live query", async () => {
        var { testApi, repo } = setup2();
        await repo.insert({ title: 'a' })
        const r = await testApi().get('/api/tasks?__action=liveQuery');
        expect(getEntityRef(r.result[0], false)).toBe(undefined);

    })
    it("test 2 subscriptions work", async () => {
        var { repo, pm } = setup2();
        await repo.insert({ title: 'a' })
        await repo.insert({ title: 'b' })
        let arr1 = [];
        let arr2 = [];
        const u1 = repo.query().subscribe(y => arr1 = y(arr1));
        await pm.flush();
        const u2 = repo.query().subscribe(y => arr2 = y(arr2));
        await pm.flush();
        expect(arr1.length).toBe(arr2.length);

    })
    it("test subscription leak", async () => {
        var { repo, pm } = setup2();
        await repo.insert({ title: 'a1', id: 1 })
        await repo.insert({ title: 'a2', id: 2 })
        await repo.insert({ title: 'b1', id: 3 })
        await repo.insert({ title: 'b2', id: 4 })

        let arr1 = [];
        let arr2 = [];
        const u1 = repo.query({ where: { title: { $contains: "a" } } }).subscribe(y => arr1 = y(arr1));
        await pm.flush();
        const u2 = repo.query({ where: { title: { $contains: "b" } } }).subscribe(y => arr2 = y(arr2));
        await pm.flush();
        await repo.insert({ title: 'a3', id: 5 })
        await pm.flush();
        expect(arr1.length).toBe(3);
        expect(arr2.length).toBe(2);

    })
});
it("Serialize Find Options", async () => {
    const r = new Remult().repo(eventTestEntity);
    const findOptions: FindOptions<eventTestEntity> = {
        limit: 3,
        page: 2,
        where: {
            $and: [{
                title: 'noam'
            }]
        },
        orderBy: {
            title: "desc"
        }
    };

    const z = findOptionsToJson(findOptions, r.metadata);
    const res = findOptionsFromJson(z, r.metadata);
    expect(res).toEqual(findOptions);

});
it("Serialize Find Options1", async () => {
    const r = new Remult().repo(eventTestEntity);
    const findOptions: FindOptions<eventTestEntity> = {
        where: {
            $and: [{
                title: 'noam'
            }]
        },
        orderBy: {
            title: "desc"
        }
    };

    const z = findOptionsToJson(findOptions, r.metadata);
    const res = findOptionsFromJson(z, r.metadata);
    expect(res).toEqual(findOptions);

});

