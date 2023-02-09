import { FindOptions, remult as defaultRemult, Repository, RestDataProviderHttpProvider, UrlBuilder } from '../../index';
import { RestDataProvider, RestEntityDataProvider } from '../data-providers/rest-data-provider';
import { LiveQueryChangeInfo, RepositoryImplementation } from '../remult3';
import { buildRestDataProvider } from "../buildRestDataProvider";
import { LiveQuerySubscriber, SubscriptionClient, SubscribeResult, SubscriptionClientConnection, liveQueryKeepAliveRoute, Unsubscribe, SubscriptionListener } from './SubscriptionChannel';
import type { ApiClient } from '../../index';
/* @internal*/
export class LiveQueryClient {
    wrapMessageHandling(handleMessage) {
        var x = this.apiProvider().wrapMessageHandling;
        if (x)
            x(handleMessage);
        else
            handleMessage();
    };
    private queries = new Map<string, LiveQuerySubscriber<any>>();
    private channels = new Map<string, MessageChannel<any>>();
    constructor(private apiProvider: () => ApiClient) { }
    runPromise(p: Promise<any>) {
        return p;
    }
    close() {
        this.queries.clear();
        this.channels.clear();
        this.closeIfNoListeners();
    }
    subscribeChannel<T>(key: string, onResult: SubscriptionListener<T>): Unsubscribe {
        let onUnsubscribe: VoidFunction = () => { };
        this.openIfNoOpened().then(() => {
            let q = this.channels.get(key);
            if (!q) {
                this.channels.set(key, q = new MessageChannel());
                this.client.then(c => {
                    try {
                        q.unsubscribe = c.subscribe(key, value => this.wrapMessageHandling(() => q.handle(value)), err => {
                            onResult.error(err);
                        })
                    } catch (err: any) {
                        onResult.error(err);
                        throw err;
                    }
                }
                );
            }

            q.listeners.push(onResult);
            onUnsubscribe = () => {
                q.listeners.splice(q.listeners.indexOf(onResult), 1);
                if (q.listeners.length == 0) {
                    this.channels.delete(key);
                    q.unsubscribe()
                }
                this.closeIfNoListeners();
            };
        }).catch(err=>onResult.error(err));
        return () => {
            onUnsubscribe();
            onUnsubscribe = () => { };
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

    //TODO - consider the time that may pass from the get request to the subscribe to the channel, in some cases this could mean, a call to server to get token and a call to the external provider - it may be some time - maybe we should do another handshake message once the subscription succeeds and not set the known ids until that handshake is made

    subscribe<entityType>(
        repo: Repository<entityType>,
        options: FindOptions<entityType>,
        listener: SubscriptionListener<LiveQueryChangeInfo<entityType>>
    ) {


        let onUnsubscribe: VoidFunction = () => { };
        this.runPromise((repo as RepositoryImplementation<entityType>).buildEntityDataProviderFindOptions(options)
            .then(opts => {
                const { createKey, subscribe } = new RestDataProvider(this.apiProvider).getEntityDataProvider(repo.metadata).buildFindRequest(opts);
                const eventTypeKey = createKey();
                let q = this.queries.get(eventTypeKey);
                if (!q) {
                    this.queries.set(eventTypeKey, q = new LiveQuerySubscriber(repo, { entityKey: repo.metadata.key, orderBy: options.orderBy }));
                    q.subscribeCode = () => {
                        if (q.unsubscribe) {
                            q.unsubscribe();
                            //TODO 1- consider race scenario where unsubscribe is called before subscribe
                            q.unsubscribe = () => { };
                        }
                        this.runPromise(subscribe()
                            .then(r => {
                                if (q.listeners.length === 0) {
                                    r.unsubscribe();
                                    return;
                                }
                                this.runPromise(q.setAllItems(r.result));
                                q.queryChannel = r.queryChannel;
                                let unsubscribeToChannel = this.subscribeChannel(r.queryChannel, {
                                    next: (value: any) => this.runPromise(q.handle(value)),
                                    complete: () => { },
                                    error: er => {
                                        q.listeners.forEach(l => l.error(er))
                                    }
                                });
                                q.unsubscribe = () => {
                                    q.unsubscribe = () => { }
                                    unsubscribeToChannel();
                                    this.runPromise(r.unsubscribe());
                                }
                            })
                            .catch(err => {
                                listener.error(err)
                            }))
                    };
                    q.subscribeCode();
                }
                else {
                    q.sendDefaultState(listener.next);

                }
                q.listeners.push(listener);
                onUnsubscribe = () => {
                    q.listeners.splice(q.listeners.indexOf(listener), 1);
                    listener.complete();
                    if (q.listeners.length == 0) {
                        this.queries.delete(eventTypeKey);
                        q.unsubscribe();
                    }
                    this.closeIfNoListeners();
                };
            })
            .catch(err => {
                listener.error(err);
            }));

        return () => {
            onUnsubscribe();
        };

    }
    client: Promise<SubscriptionClientConnection>;
    interval: any;
    private openIfNoOpened() {
        if (!this.client) {
            this.interval = setInterval(async () => {
                const ids = [];
                for (const q of this.queries.values()) {
                    ids.push(q.queryChannel);
                }
                if (ids.length > 0) {
                    let p = this.apiProvider();
                    let { actionInfo } = await import('../server-action');
                    const invalidIds = await this.runPromise(await actionInfo.runActionWithoutBlockingUI(() => buildRestDataProvider(p.httpClient).post(p.url + '/' + liveQueryKeepAliveRoute, ids)));
                    for (const id of invalidIds) {
                        for (const q of this.queries.values()) {
                            if (q.queryChannel === id)
                                q.subscribeCode();
                        }
                    }
                }
            }, 30000);

            return this.runPromise(this.client =
                this.apiProvider().subscriptionClient.openConnection(() => {
                    for (const q of this.queries.values()) {
                        q.subscribeCode();
                    }
                }));
        }

        return this.client;
    }

}

class MessageChannel<T> {
    id: string;
    unsubscribe: VoidFunction = () => { };
    async handle(message: T) {
        for (const l of this.listeners) {
            l.next(message);
        }
    }

    listeners: SubscriptionListener<T>[] = [];
    constructor() { }

}