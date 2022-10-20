import { Remult } from '../context';
import { LiveQueryClient, streamUrl } from './LiveQuery';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { remult } from '../remult-proxy';


export class EventSourceLiveQuery extends LiveQueryClient {
    constructor(private wrapMessage?: (what: () => void) => void) {
        super(new EventSourceLiveQueryProvider(wrapMessage));

    }
}

class EventSourceLiveQueryProvider {
    constructor(private wrapMessage?: (what: () => void) => void,
        private url: string = undefined,
        private jwtToken?: string) {
        if (!this.wrapMessage)
            this.wrapMessage = x => x();
        if (!this.url) {
            this.url = remult.apiClient.url + '/' + streamUrl;
        }
    }
    lastId = 0;
    openStreamAndReturnCloseFunction(clientId: string, onMessage: (message: { data: string, event: string }) => void): VoidFunction {


        const ctrl = new AbortController();

        const headers = {
            "client-id": clientId
        };
        if (this.jwtToken) {
            headers["Authorization"] = "Bearer " + this.jwtToken;
        }
        fetchEventSource(this.url, {
            headers,
            onmessage: message => {
                const mid = +message.id;
                if (mid <= this.lastId && this.lastId - mid < 10)
                    return;
                this.lastId = mid;
                console.log(message.data);
                if (message.event !== 'keep-alive') {
                    this.wrapMessage(() => onMessage(message));

                }
            },
            onopen: async () => {

            },
            signal: ctrl.signal,
        });
        return () => ctrl.abort();


    }
}