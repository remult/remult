import { FindOptions, remult as defaultRemult, Repository, RestDataProviderHttpProvider, UrlBuilder } from '../../index';
import { RestEntityDataProvider } from '../data-providers/rest-data-provider';
import { RepositoryImplementation } from '../remult3';
import { buildRestDataProvider } from "../buildRestDataProvider";
import { LiveQuerySubscriber, MessageChannel, SubClient, SubscribeResult, SubClientConnection, liveQueryKeepAliveRoute, Unsubscribe } from './LiveQuerySubscriber';

export class LiveQueryClient {
    wrapMessageHandling = handleMessage => handleMessage();
    private queries = new Map<string, LiveQuerySubscriber<any>>();
    private channels = new Map<string, MessageChannel<any>>();
    constructor(public lqp: SubClient, private provider?: RestDataProviderHttpProvider) { }
    runPromise(p: Promise<any>) {
        return p;
    }
    close() {
        this.queries.clear();
        this.channels.clear();
        this.closeIfNoListeners();
    }
    subscribeChannel<T>(key: string, onResult: (item: T) => void): Unsubscribe {

        let onUnsubscribe: VoidFunction = () => { };
        this.openIfNoOpened().then(() => {
            let q = this.channels.get(key);
            if (!q) {
                this.channels.set(key, q = new MessageChannel());
                this.client.then(c => q.unsubscribe = c.subscribe(key, value => this.wrapMessageHandling(() => q.handle(value)))
                );
            }

            q.listeners.push(onResult);
            onUnsubscribe = () => {
                q.listeners.splice(q.listeners.indexOf(onResult), 1);
                if (q.listeners.length == 0) {
                    this.channels.delete(key);
                }
                this.closeIfNoListeners();
            };
        });

        return () => {
            onUnsubscribe();
        };

    }
    timeoutToCloseWhenNotClosed = 1000;
    private closeIfNoListeners() {
        this.runPromise(new Promise((res) => {
            setTimeout(() => {
                if (this.client)
                    if (this.queries.size === 0 && this.channels.size === 0) {
                        this.runPromise(this.client.then(x => x.close()));
                        this.client = undefined;
                        clearInterval(this.interval);
                        this.interval = undefined;
                    }
                res({});
            }, this.timeoutToCloseWhenNotClosed);
        }));
    }

    //TODO 1 - consider the time that may pass from the get request to the subscribe to the channel, in some cases this could mean, a call to server to get token and a call to the external provider - it may be some time
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
                // TODO Noam- refactor into RestEntityDataProvider
                const { url, filterObject } = new RestEntityDataProvider(() => defaultRemult.apiClient.url + '/' + repo.metadata.key, () => this.provider!, repo.metadata)
                    .buildFindRequest(opts);

                const eventTypeKey = JSON.stringify({ url, filterObject });
                let q = this.queries.get(eventTypeKey);
                if (!q) {
                    this.queries.set(eventTypeKey, q = new LiveQuerySubscriber(repo, { entityKey: repo.metadata.key, orderBy: options.orderBy }));
                    url.add("__action", 'liveQuery');
                    q.subscribeCode = () => {
                        if (q.unsubscribe) {
                            q.unsubscribe();
                            //TODO - consider race scenario where unsubscribe is called before subscribe
                            q.unsubscribe = () => { };
                        }
                        const thenResult = (r: SubscribeResult) => {
                            this.client.then(c => {
                                //TODO Noam - refactor to sue SubscribeChannel
                                let unsubscribeToChannel = c.subscribe(r.queryChannel, (value: any) => this.wrapMessageHandling(() => this.runPromise(q.handle(value))));
                                q.unsubscribe = () => {
                                    unsubscribeToChannel();
                                    const url = new UrlBuilder(defaultRemult.apiClient.url + '/' + repo.metadata.key);
                                    url.add("__action", "endLiveQuery");
                                    this.runPromise(this.provider.post(url.url, {
                                        id: q.queryChannel
                                    }));
                                }
                            }
                            );
                            this.runPromise(q.setAllItems(r.result));
                            q.queryChannel = r.queryChannel;
                        };
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
                    }
                    this.closeIfNoListeners();
                };
            })));

        return () => {
            alive = false;
            onUnsubscribe();
        };

    }
    client: Promise<SubClientConnection>;
    interval: any;

    private openIfNoOpened() {
        if (!this.provider) {
            this.provider = buildRestDataProvider(defaultRemult.apiClient.httpClient);
        }
        if (!this.client) {
            this.interval = setInterval(async () => {
                const ids = [];
                for (const q of this.queries.values()) {
                    ids.push(q.queryChannel);
                }
                if (ids.length > 0) {
                    const invalidIds = await this.runPromise(this.provider.post(defaultRemult.apiClient.url + liveQueryKeepAliveRoute, ids));
                    for (const id of invalidIds) {
                        for (const q of this.queries.values()) {
                            if (q.queryChannel === id)
                                q.subscribeCode();

                        }
                    }
                }
            }, 30000);

            return this.runPromise(this.client =
                this.lqp.openConnection(() => {
                    for (const q of this.queries.values()) {
                        q.subscribeCode();
                    }
                }));
        }

        return this.client;
    }

}
