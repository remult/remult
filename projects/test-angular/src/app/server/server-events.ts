
import { BackendMethod, EntityRef, Remult, UserInfo } from '../../../../core';
import { liveQueryMessage, SubscribeToQueryArgs } from '../products-test/ListenManager';
import { Task } from '../products-test/products.component';

class clientConnection {
    close() {
        //console.log("close connection");
        this.closed = true;
    }
    closed = false;
    write(id: number, message: any, eventType: string): void {
        this.response.write("event:" + eventType + "\nid:" + id + "\ndata:" + JSON.stringify(message) + "\n\n");
    }

    constructor(
        public response: import('express').Response,
        public clientId: string
    ) {
        //console.log("open connection");
        this.sendLiveMessage();
    }
    sendLiveMessage() {
        setTimeout(() => {
            if (this.closed)
                return;
            this.response.write("event:keep-alive\ndata:\n\n");
            this.sendLiveMessage();
        }, 45000);
    }
}

export class ServerEventsController {
    connections: clientConnection[] = [];
    constructor(private messageHistoryLength = 1000) { }

    subscribe(req: import('express').Request, res: import('express').Response) {
        res.writeHead(200, {
            "Access-Control-Allow-Origin": req.header('origin') ? req.header('origin') : '',
            "Access-Control-Allow-Credentials": "true",
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        const cc = new clientConnection(res, req.headers["client-id"] as string);
        const lastEventId = req.headers['last-event-id'];
        if (lastEventId) {
            this.messages.filter(x => x.id > +lastEventId).forEach(m => cc.write(m.id, m.message, m.eventType));
        }
        this.connections.push(cc);

        req.on("close", () => {
            cc.close();
            this.connections = this.connections.filter(s => s !== cc);
        });
        return cc;
    }

    messages: { id: number, message: any, eventType: string }[] = [];
    SendMessage(message: any, eventType = '') {
        let z = this;
        let id = i++;
        z.messages.push({ id, message: message, eventType });
        while (z.messages.length > z.messageHistoryLength)
            z.messages.shift();
        //console.log({ sendingTo: z.connections.length })
        z.connections.forEach(y => y.write(id, message, eventType));
    }

    @BackendMethod({ allowed: true })
    static async subscribeToQuery(clientId: string, to: SubscribeToQueryArgs, remult?: Remult) {
        return queryManager.subscribeToQuery(clientId, to, remult!);
    }
}
let i = 0;

interface clientInfo {
    clientId: string,
    user: UserInfo,
    queries: SubscribeToQueryArgs[]
}

class LiveQueryManager {

    clients: clientInfo[] = [];
    async subscribeToQuery(clientId: string, to: SubscribeToQueryArgs, remult: Remult) {
        let client = this.clients.find(c => c.clientId === clientId);
        if (!client) {
            this.clients.push(client = { clientId: clientId, queries: [], user: remult.user })
        }
        try {
            if (to.entityKey === "tasks") {
                const r = await remult!.repo(Task).find({ orderBy: to.orderBy });
                return r.map(x => x._.toApiJson());
            }
        }
        finally {
            client.queries.push(to);
        }
    }
    server: ServerEventsController;
    sendMessage(key: string, m: liveQueryMessage) {
        for (const c of this.clients) {
            for (const q of c.queries) {
                if (q.entityKey === key) {
                    for (const sc of this.server.connections) {
                        if (sc.clientId === c.clientId) {
                            sc.write(undefined, m, JSON.stringify(q));
                        }
                    }
                }
            }
        }
    }
    hasListeners(ref: EntityRef<any>) {
        for (const c of this.clients) {
            for (const q of c.queries) {
                if (q.entityKey === ref.metadata.key)
                    return true;
            }
        }
        return false;
    }
    saved(ref: EntityRef<any>) {
        if (!this.hasListeners(ref))
            return;
        if (ref.isNew())
            this.sendMessage(ref.metadata.key, {
                type: "add",
                data: { item: ref.toApiJson() }
            })
        else
            this.sendMessage(ref.metadata.key, {
                type: "replace",
                data: {
                    oldId: ref.getId(),// to be fixed to support change of id
                    item: ref.toApiJson()
                }
            })

    }
    deleted(ref: EntityRef<any>) {
        if (!this.hasListeners(ref))
            return;
        this.sendMessage(ref.metadata.key, {
            type: "remove",
            data: { id: ref.getId() }
        })

    }
}
export const queryManager = new LiveQueryManager();