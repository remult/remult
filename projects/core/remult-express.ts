import * as express from 'express';
import { createRemultServer, RemultServer, RemultServerImplementation, RemultServerOptions } from './server/expressBridge';
import { streamUrl } from './src/live-query/LiveQuery';
import { LiveQueryManager, ServerEventDispatcher, ServerEventMessage } from './src/live-query/LiveQueryManager';

export function remultExpress(options?:
    RemultServerOptions<express.Request> & {
        bodyParser?: boolean;
        bodySizeLimit?: string;
    }): express.RequestHandler & RemultServer & { sec: ServerEventsController } {
    let app = express.Router();

    if (!options) {
        options = {};
    }
    if (options.bodySizeLimit === undefined) {
        options.bodySizeLimit = '10mb';
    }
    if (options?.bodyParser !== false) {
        app.use(express.json({ limit: options.bodySizeLimit }));
        app.use(express.urlencoded({ extended: true, limit: options.bodySizeLimit }));
    }

    const server = createRemultServer(options) as RemultServerImplementation;
    server.registerRouter(app);
    let httpServerEvents = new ServerEventsController();
    server.liveQueryManager = new LiveQueryManager(httpServerEvents);
    app.get('/api/' + streamUrl, (req, res) => {
        httpServerEvents.subscribe(req, res)
    });
    return Object.assign(app, {
        getRemult: (req) => server.getRemult(req),
        openApiDoc: (options: { title: string }) => server.openApiDoc(options),
        registerRouter: x => server.registerRouter(x),
        withRemult: (...args) => server.withRemult(...args)
    } as RemultServer,{
        sec: httpServerEvents
    });

}
export class ServerEventsController implements ServerEventDispatcher {
    connections: clientConnection[] = [];
    constructor(private messageHistoryLength = 1000) { }
    send({ message, clientId, queryId }: ServerEventMessage): void {
        for (const sc of this.connections) {
            if (sc.clientId === clientId) {
                sc.write(undefined, message, queryId);
            }
        }
    }


    subscribe(req: import('express').Request, res: import('express').Response) {
        res.writeHead(200, {
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

}
class clientConnection {
    close() {
        //console.log("close connection");
        this.closed = true;
    }
    closed = false;
    write(id: number, message: any, eventType: string): void {
        this.response.write("event:" + eventType + "\nid:" + id + "\ndata:" + JSON.stringify(message) + "\n\n");
        let r = this.response as any as { flush(): void };
        if (r.flush)
            r.flush();
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


let i = 0;

