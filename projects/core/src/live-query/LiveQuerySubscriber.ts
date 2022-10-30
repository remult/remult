import { EntityOrderBy, FindOptions, remult as defaultRemult, Remult, Repository, RestDataProviderHttpProvider, Sort, UrlBuilder } from '../../index';
import { RestEntityDataProvider } from '../data-providers/rest-data-provider';
import { RepositoryImplementation } from '../remult3';
import { Allowed, buildRestDataProvider } from '../context';
import { ServerEventDispatcher } from './LiveQueryPublisher';
import { getId } from '../remult3/getId';

export const streamUrl = 'stream';
class LiveQuerySubscriber<entityType> {
    id: string;
    subscribeCode: () => void;
    unsubscribe: VoidFunction = () => { };
    async setAllItems(result: any[]) {
        const items = await Promise.all(result.map(item => this.repo.fromJson(item)));
        this.forListeners(listener => {
            listener(x => {
                return items;
            });
        });
    }


    forListeners(what: (listener: (((reducer: (prevState: entityType[]) => entityType[]) => void))) => void) {
        for (const l of this.listeners) {
            what(l)
        }
    }

    async handle(messages: liveQueryMessage[]) {
        for (const m of messages) {
            switch (m.type) {
                case "add":
                case "replace":
                    m.data.item = await this.repo.fromJson(m.data.item);
                    break;
                case "all":
                    this.setAllItems(m.data);
            }

        }

        this.forListeners(listener => {
            listener(items => {
                if (!items)
                    items = [];
                let needSort = false;
                for (const message of messages) {
                    switch (message.type) {
                        case "all":
                            this.setAllItems(message.data);
                            break;
                        case "replace": {
                            items = items.map(x => getId(this.repo.metadata, x) === message.data.oldId ? message.data.item : x)
                            needSort = true;
                            break;
                        }
                        case "add":
                            items = items.filter(x => getId(this.repo.metadata, x) !== getId(this.repo.metadata, message.data.item));
                            items.push(message.data.item);
                            needSort = true;
                            break;
                        case "remove":
                            items = items.filter(x => getId(this.repo.metadata, x) !== message.data.id);
                            break;
                    };
                }
                if (needSort) {
                    if (this.query.orderBy) {
                        const o = Sort.translateOrderByToSort(this.repo.metadata, this.query.orderBy);
                        items.sort((a: any, b: any) => o.compare(a, b));
                    }
                }
                return items;
            });
        });
    }

    defaultQueryState: entityType[] = [];
    listeners: (((reducer: (prevState: entityType[]) => entityType[]) => void))[] = [];
    constructor(private repo: Repository<entityType>, private query: SubscribeToQueryArgs<entityType>) { }

}

export interface PubSubClient {
    subscribe(channel: string, handler: (value: any) => void): VoidFunction;
    disconnect(): void;
}

export interface LiveQueryProvider {
    openStreamAndReturnCloseFunction(onReconnect: VoidFunction): Promise<PubSubClient>;

}


class MessageChannel<T> {
    id: string;
    unsubscribe: VoidFunction = () => { };
    async handle(message: T) {
        for (const l of this.listeners) {
            l(message);
        }
    }

    listeners: ((items: T) => void)[] = [];
    constructor() { }

}
export class LiveQueryClient {
    wrapMessageHandling = handleMessage => handleMessage();
    private queries = new Map<string, LiveQuerySubscriber<any>>();
    private channels = new Map<string, MessageChannel<any>>();
    constructor(public lqp: LiveQueryProvider, private provider?: RestDataProviderHttpProvider) { }
    runPromise(p: Promise<any>) {
        return p;
    }
    close() {
        this.queries.clear();
        this.channels.clear();
        this.closeIfNoListeners();
    }
    subscribeChannel<T>(key: string, onResult: (item: T) => void) {

        let onUnsubscribe: VoidFunction = () => { };
        this.openIfNoOpened().then(() => {
            let q = this.channels.get(key);
            if (!q) {
                this.channels.set(key, q = new MessageChannel());
                this.client.then(c =>
                    q.unsubscribe = c.subscribe(key, value => this.wrapMessageHandling(() => q.handle(value)))
                );
            }

            q.listeners.push(onResult);
            onUnsubscribe = () => {
                q.listeners.splice(q.listeners.indexOf(onResult), 1);
                if (q.listeners.length == 0) {
                    this.channels.delete(key);
                }
                this.closeIfNoListeners();
            }
        });

        return () => {
            onUnsubscribe();
        }

    }

    private closeIfNoListeners() {
        setTimeout(() => {
            if (this.client)
                if (this.queries.size === 0 && this.channels.size === 0) {
                    this.runPromise(this.client.then(x => x.disconnect()));
                    this.client = undefined;
                }
        }, 1000);
    }

    //TODO - consider the time that may pass from the get request to the subscribe to the channel, in some cases this could mean, a call to server to get token and a call to the external provider - it may be some time
    subscribe<entityType>(
        repo: Repository<entityType>,
        options: FindOptions<entityType>,
        onResult: (reducer: (prevState: entityType[]) => entityType[]) => void) {

        let alive = true;
        let onUnsubscribe: VoidFunction = () => { };
        this.runPromise(this.openIfNoOpened().then(() => (repo as RepositoryImplementation<entityType>).buildEntityDataProviderFindOptions(options)
            .then(opts => {
                if (!alive)
                    return;

                const { url, filterObject } = new RestEntityDataProvider(() => defaultRemult.apiClient.url + '/' + repo.metadata.key, () => this.provider!, repo.metadata)
                    .buildFindRequest(opts);

                const eventTypeKey = JSON.stringify({ url, filterObject });
                let q = this.queries.get(eventTypeKey);
                if (!q) {
                    this.queries.set(eventTypeKey, q = new LiveQuerySubscriber(repo, { entityKey: repo.metadata.key, orderBy: options.orderBy }));
                    url.add("__action", 'liveQuery');
                    q.subscribeCode = () => {
                        const thenResult = (r: SubscribeResult) => {
                            this.client.then(c =>
                                q.unsubscribe = c.subscribe(r.queryChannel, (value: any) => this.wrapMessageHandling(() => this.runPromise(q.handle(value))))
                            );
                            this.runPromise(q.setAllItems(r.result));
                            q.id = r.queryChannel;

                        }
                        if (filterObject) {
                            this.runPromise(this.provider.post(url.url, filterObject).then(thenResult));
                        }
                        else
                            this.runPromise(this.provider.get(url.url).then(thenResult));
                    };
                    q.subscribeCode();
                }
                else {
                    onResult(x => [...q.defaultQueryState]);
                }
                q.listeners.push(onResult);
                onUnsubscribe = () => {
                    q.listeners.splice(q.listeners.indexOf(onResult), 1);
                    if (q.listeners.length == 0) {
                        this.queries.delete(eventTypeKey);
                        q.unsubscribe();
                        const url = new UrlBuilder(defaultRemult.apiClient.url + '/' + repo.metadata.key);
                        url.add("__action", "endLiveQuery");
                        this.provider.post(url.url, {
                            id: q.id
                        })
                    }
                    this.closeIfNoListeners();
                }
            })));

        return () => {
            alive = false;
            onUnsubscribe();
        }

    }
    client: Promise<PubSubClient>;

    private openIfNoOpened() {
        if (!this.provider) {
            this.provider = buildRestDataProvider(defaultRemult.apiClient.httpClient);
        }
        if (!this.client)
            return this.runPromise(this.client =
                this.lqp.openStreamAndReturnCloseFunction(() => {
                    for (const q of this.queries.values()) {
                        q.subscribeCode();
                    }
                }));

        return this.client;
    }

}
export type listener = (message: any) => void;



export interface SubscribeToQueryArgs<entityType = any> {
    entityKey: string,
    orderBy?: EntityOrderBy<entityType>
}
export declare type liveQueryMessage = {
    type: "all",
    data: any[]
} | {
    type: "add"
    data: any
} | {
    type: 'replace',
    data: {
        oldId: any,
        item: any
    }
} | {
    type: "remove",
    data: { id: any }
}

export interface SubscribeResult {
    result: [],
    queryChannel: string
}


export interface ServerEventChannelSubscribeDTO {
    clientId: string,
    channel: string
}


export class AMessageChannel<messageType> {


    constructor(public channelKey: string) {


    }
    send(what: messageType, remult?: Remult) {
        remult = remult || defaultRemult;
        remult.liveQueryPublisher.sendChannelMessage(this.channelKey, what);
    }
    subscribe(onValue: (value: messageType) => void, remult?: Remult) {
        remult = remult || defaultRemult;
        remult.liveQuerySubscriber.subscribeChannel(this.channelKey, onValue);
    }
}




//TODO2 - consider moving the queued job mechanism into this.