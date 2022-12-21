import { v4 as uuid } from 'uuid';
import { itemChange, LiveQueryPublisherInterface } from '../context';
import { findOptionsFromJson, findOptionsToJson } from '../data-providers/rest-data-provider';
import { Repository, FindOptions } from '../remult3';

import { liveQueryMessage } from './LiveQuerySubscriber';



interface StoredQuery {
  id: string,
  findOptionsJson: any,
  lastIds: any[],
  requestJson: any,
  entityKey: string
}




export class LiveQueryStorageInMemoryImplementation implements LiveQueryStorage {
  debugFileSaver = (x: any) => { };
  debug() {
    this.debugFileSaver(this.queries);
  }
  async keepAliveAndReturnUnknownIds(ids: string[]): Promise<string[]> {
    const result = [];
    for (const id of ids) {
      let q = this.queries.find(q => q.id === id);
      if (q) {
        q.lastUsed = new Date().toISOString()
      } else
        result.push(id);
    }
    this.debug();
    return result;
  }

  queries: (StoredQuery & { lastUsed: string })[] = [];

  constructor() {

  }
  store(query: StoredQuery) {
    this.queries.push({ ...query, lastUsed: new Date().toISOString() });
    this.debug();
  }
  remove(id: any) {
    this.queries = this.queries.filter(q => q.id !== id);
    this.debug();
  }
  async provideListeners(entityKey: string, handle: (args: {
    query: StoredQuery,
    setLastIds(ids: any[]): Promise<void>
  }) => Promise<void>) {
    let d = new Date();
    d.setMinutes(d.getMinutes() - 5);
    this.queries = this.queries.filter(x => x.lastUsed > d.toISOString());
    for (const q of this.queries) {
      if (q.entityKey === entityKey) {
        await handle({
          query: q,
          setLastIds: async ids => { q.lastIds = ids },
        })
      }
    }
    this.debug();
  }
}


export class LiveQueryPublisher implements LiveQueryPublisherInterface {

  constructor(public dispatcher: ServerEventDispatcher, public storage: LiveQueryStorage, public performWithRequest: (serializedRequest: any, entityKey: string, what: (repo: Repository<any>) => Promise<void>) => Promise<void>) { }
  stopLiveQuery(id: any): void {
    this.storage.remove(id);
  }
  sendChannelMessage<messageType>(channel: string, message: messageType) {
    this.dispatcher.sendChannelMessage(channel, message);
  }

  defineLiveQueryChannel(serializeRequest: () => any, entityKey: string, findOptions: FindOptions<any>, ids: any[], userId: string, repo: Repository<any>): string {
    const id = `users:${userId}:queries:${uuid()}`;
    this.storage.store(
      {
        requestJson: serializeRequest(),
        entityKey,
        id,
        findOptionsJson: findOptionsToJson(findOptions, repo.metadata),
        lastIds: ids
      }
    );
    return id;
  }




  runPromise(p: Promise<any>) {

  }
  debugFileSaver = (x: any) => { };
  itemChanged(entityKey: string, changes: itemChange[]) {
    //TODO - optimize so that the user will get their messages first. Based on user id
    this.runPromise(this.storage.provideListeners(entityKey,
      async ({ query, setLastIds }) => {
        await this.performWithRequest(query.requestJson, entityKey, async repo => {
          const messages = [];
          const currentItems = await repo.find(findOptionsFromJson(query.findOptionsJson, repo.metadata));
          const currentIds = currentItems.map(x => repo.getEntityRef(x).getId());
          for (const id of query.lastIds.filter(y => !currentIds.includes(y))) {
            let c = changes.find(c => c.oldId == id)
            if (c === undefined || id != c.oldId || !currentIds.includes(c.id))
              messages.push({
                type: "remove",
                data: {
                  id: id
                }
              })
          }
          for (const item of currentItems) {
            const itemRef = repo.getEntityRef(item);
            let c = changes.find(c => c.id == itemRef.getId())
            if (c !== undefined && query.lastIds.includes(c.oldId)) {
              messages.push({
                type: "replace",
                data: {
                  oldId: c.oldId,
                  item: itemRef.toApiJson()
                }
              });
            }
            else if (!query.lastIds.includes(itemRef.getId())) {
              messages.push({
                type: "add",
                data: { item: itemRef.toApiJson() }
              });
            }
          }
          this.debugFileSaver({
            query: query.id,
            currentIds,
            changes,
            lastIds: query.lastIds,
            messages
          });
          await setLastIds(currentIds);
          this.dispatcher.sendChannelMessage(query.id, messages);
        })

      }));
  }
}

export interface ServerEventDispatcher {
  sendChannelMessage<T>(channel: string, message: T): void;
}
// TODO2 - PUBNUB
export interface LiveQueryStorage {
  keepAliveAndReturnUnknownIds(ids: string[]): Promise<string[]>
  store(query: StoredQuery): void
  remove(id: any): void
  provideListeners(entityKey: string, handle: (args: {
    query: StoredQuery,
    setLastIds(ids: any[]): Promise<void>
  }) => Promise<void>): Promise<void>

}
