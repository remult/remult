class clientConnection {
    close() {
        //console.log("close connection");
        this.closed = true;
    }
    closed = false;
    write(id: number, message: any, eventType: string): void {
        if (this.messageFilter(message, eventType))
            this.response.write("event:" + eventType + "\nid:" + id + "\ndata:" + JSON.stringify(message) + "\n\n");
    }

    constructor(
        public response: import('express').Response, private messageFilter: (data: any, eventType: string) => boolean) {
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

    subscribe(req: import('express').Request, res: import('express').Response, messageFilter: (data: any, eventType: string) => boolean = () => true) {
        res.writeHead(200, {
            "Access-Control-Allow-Origin": req.header('origin') ? req.header('origin') : '',
            "Access-Control-Allow-Credentials": "true",
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        const cc = new clientConnection(res, messageFilter);
        const lastEventId = req.headers['last-event-id'];
        if (lastEventId) {
            this.messages.filter(x => x.id > +lastEventId).forEach(m => cc.write(m.id, m.message, m.eventType));
        }
        this.connections.push(cc);

        req.on("close", () => {
            cc.close();
            this.connections = this.connections.filter(s => s !== cc);
        });
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
let i = 0;
