import * as express from 'express';
import { createRemultServer, RemultServer, RemultServerImplementation, RemultServerOptions } from './server/expressBridge';
import { Remult } from './src/context';
import { AMessageChannel, ServerEventChannelSubscribeDTO, streamUrl } from './src/live-query/LiveQuerySubscriber';
import { LiveQueryPublisher, ServerEventDispatcher } from './src/live-query/LiveQueryPublisher';
import { v4 as uuid } from 'uuid';

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
    server.liveQueryManager = new LiveQueryPublisher(httpServerEvents);


    const streamPath = options.rootPath! + '/' + streamUrl
    app.get(streamPath, (req, res) => {
        httpServerEvents.openHttpServerStream(req, res);
    });
    app.post(streamPath, (r, res, next) => server.withRemult(r, res, next), (req, res) => {
        httpServerEvents.subscribeToChannel(req.body)
        res.json("ok");
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
    subscribeToChannel({ channel, remove, clientId }: ServerEventChannelSubscribeDTO) {
        this.connections.forEach(c => {
            if (c.connectionId === clientId) {
                c.channels[channel] = !remove;
            }
        });
    }
    consoleInfo() {
        console.info(this.connections.map(x => ({
            client: x.connectionId,
            channels: x.channels
        })));
    }

    connections: clientConnection[] = [];
    constructor(channels: AMessageChannel<any>[]) {
        if (channels) {
            for (const c of channels) {
                c.dispatcher = this;
            }
        }


    }

    sendChannelMessage<T>(channel: string, message: any) {
        const data = JSON.stringify({ channel, data: message });

        for (const sc of this.connections) {
            if (sc.channels[channel]) {
                sc.write(data);
            }
        }
    }


    openHttpServerStream(req: import('express').Request, res: import('express').Response) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        const cc = new clientConnection(res);
        //const lastEventId = req.headers['last-event-id'];

        this.connections.push(cc);

        req.on("close", () => {
            cc.close();
            this.connections = this.connections.filter(s => s !== cc);
        });
        return cc;
    }
}
class clientConnection {
    channels: Record<string, boolean> = {};
    close() {
        this.closed = true;
    }
    closed = false;
    write(eventData: string, eventType = "message"): void {
        let event = "event:" + eventType;
        // if (id != undefined)
        //     event += "\nid:" + id;
        this.response.write(event + "\ndata:" + eventData + "\n\n");
        let r = this.response as any as { flush(): void };
        if (r.flush)
            r.flush();
    }
    connectionId = uuid();
    constructor(
        public response: import('express').Response
    ) {
        this.write(this.connectionId, "connectionId");
        this.sendLiveMessage();
    }
    sendLiveMessage() {
        if (this.closed)
            return;
        this.write("", "keep-alive");
        setTimeout(() => {
            this.sendLiveMessage();
        }, 45000);
    }
}