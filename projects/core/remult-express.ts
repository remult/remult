import * as express from 'express';
import { createRemultServer, RemultServer, RemultServerImplementation, RemultServerOptions } from './server/expressBridge';
import { Remult } from './src/context';
import { AMessageChannel, ChannelSubscribe, streamUrl } from './src/live-query/LiveQuery';
import { LiveQueryManager, ServerEventDispatcher, ServerEventMessage } from './src/live-query/LiveQueryManager';
import { remult } from './src/remult-proxy';

export function remultExpress(options?:
    RemultServerOptions<express.Request> & {
        bodyParser?: boolean;
        bodySizeLimit?: string;
        messageChannels?: AMessageChannel<any>[];
    }): express.RequestHandler & RemultServer {
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
    let httpServerEvents = new ServerEventsController(options.messageChannels);
    server.liveQueryManager = new LiveQueryManager(httpServerEvents);


    const streamPath = options.rootPath! + '/' + streamUrl
    app.get(streamPath, (req, res) => {
        httpServerEvents.openHttpServerStream(req, res);
    });
    app.post(streamPath, (r, res, next) => server.withRemult(r, res, next), (req, res) => {
        httpServerEvents.subscribeToChannel(remult, req.body, res)
    });
    app.get(streamPath + '/stats', (req, res) => {
        httpServerEvents.consoleInfo();
        res.json("ok");
    });
    return Object.assign(app, {
        getRemult: (req) => server.getRemult(req),
        openApiDoc: (options: { title: string }) => server.openApiDoc(options),
        registerRouter: x => server.registerRouter(x),
        withRemult: (...args) => server.withRemult(...args)
    } as RemultServer);

}
export class ServerEventsController implements ServerEventDispatcher {
    consoleInfo() {
        console.log(this.connections.map(x => ({
            client: x.clientId,
            channels: x.channels
        })));
    }
    subscribeToChannel(remult: Remult, info: ChannelSubscribe, res: import('express').Response) {
        let ok = false;
        if (this.channels)
            for (const sc of this.connections) {
                if (sc.clientId === info.clientId) {
                    for (const c of this.channels) {
                        if (c.userCanSubscribe(info.channel, remult)) {
                            sc.channels[info.channel] = !info.remove;
                            ok = true;
                        }
                    }


                }
            }
        if (ok)
            res.json("ok");
        else
            res.status(404).json(`Channel "${info.channel}" not found`);

    }
    connections: clientConnection[] = [];
    constructor(private channels: AMessageChannel<any>[], private messageHistoryLength = 1000) {
        if (channels) {
            for (const c of channels) {
                c.dispatcher = this;
            }
        }


    }
    sendQueryMessage({ message, clientId, queryId }: ServerEventMessage): void {
        for (const sc of this.connections) {
            if (sc.clientId === clientId) {
                sc.write(undefined, message, queryId);
            }
        }

    }
    sendChannelMessage<T>(channel: string, message: any) {
        for (const sc of this.connections) {
            if (sc.channels[channel]) {
                sc.write(undefined, message, channel);
            }
        }
    }


    openHttpServerStream(req: import('express').Request, res: import('express').Response) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        const cc = new clientConnection(res, req.headers["client-id"] as string || req.query['id'] as string);
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
    channels: Record<string, boolean> = {};
    close() {
        //console.log("close connection");
        this.closed = true;
    }
    closed = false;
    write(id: number, message: any, eventType: string): void {
        let event = "event:message";
        if (id != undefined)
            event += "\nid:" + id;
        this.response.write(event + "\ndata:" + JSON.stringify({ event: eventType, data: message }) + "\n\n");
        let r = this.response as any as { flush(): void };
        if (r.flush)
            r.flush();
    }

    constructor(
        public response: import('express').Response,
        public clientId: string
    ) {
        //console.log("open connection");
        response.write("event:authenticate\ndata:" + "key" + "\n\n");
        this.sendLiveMessage();
    }
    sendLiveMessage() {
        if (this.closed)
            return;
        this.response.write("event:keep-alive\ndata:\n\n");
        let r = this.response as any as { flush(): void };
        if (r.flush)
            r.flush();
        setTimeout(() => {
            this.sendLiveMessage();
        }, 45000);
    }
}


let i = 0;

