import { v4 as uuid } from 'uuid';
import { Remult, UserInfo } from '../..';
import { Repository, EntityRef, FindOptions, getEntityRef } from '../remult3';
import { LiveQueryProvider } from '../data-api';
import { liveQueryMessage, SubscribeToQueryArgs } from './LiveQuery';


export class LiveQueryPublisher implements LiveQueryProvider {



  constructor(private dispatcher: ServerEventDispatcher) {

  }

  subscribe(repo: Repository<any>, clientId: string, findOptions: FindOptions<any>, remult: Remult, ids: any[]): string {
    let client = this.clients.find(c => c.clientId === clientId);
    if (!client) {
      this.clients.push(client = { clientId: clientId, queries: [] });
    }
    const id = uuid();
    console.log({ ids });
    client.queries.push({
      id,
      findOptions: findOptions,
      repo,
      ids
    });
    return id;
  }

  clients: clientInfo[] = [];


  hasListeners(ref: EntityRef<any>) {
    for (const c of this.clients) {
      for (const q of c.queries) {
        if (q.repo.metadata.key === ref.metadata.key)
          return true;
      }
    }
    return false;
  }

  runPromise(p: Promise<any>) {

  }
  //TODO - reconsider usage of zone
  saved(ref: EntityRef<any>) {
    const isNew = ref.isNew();
    const origId = isNew ? ref.getId() : ref.getOriginalId();
    for (const c of this.clients) {
      for (const q of c.queries) {
        if (q.repo.metadata.key === ref.metadata.key) {
          this.runPromise(q.repo.find(q.findOptions).then(
            currentItems => {
              const currentIds = currentItems.map(x => q.repo.getEntityRef(x).getId());
              const sendMessage = (message: liveQueryMessage) => {
                console.log({ message: message.type });
                this.dispatcher.sendQueryMessage({ clientId: c.clientId, queryId: q.id, message });
              }
              console.log({ ids: q.ids, currentIds });

              for (const id of q.ids.filter(y => !currentIds.includes(y))) {
                if (id != origId || !currentIds.includes(ref.getId()))
                  sendMessage({
                    type: "remove",
                    data: {
                      id: id
                    }
                  })
              }
              for (const item of currentItems) {
                const itemRef = q.repo.getEntityRef(item);
                if (itemRef.getId() == ref.getId() && q.ids.includes(origId)) {
                  sendMessage({
                    type: "replace",
                    data: {
                      oldId: origId,
                      item: itemRef.toApiJson()
                    }
                  });
                }
                else if (!q.ids.includes(itemRef.getId())) {
                  sendMessage({
                    type: "add",
                    data: { item: itemRef.toApiJson() }
                  });
                }
              }
              q.ids = currentIds;
            }));
        }
      }
    }
  }
  deleted(ref: EntityRef<any>) {
    const id = ref.getOriginalId();
    for (const c of this.clients) {
      for (const q of c.queries) {
        if (q.repo.metadata.key === ref.metadata.key) {
          if (q.ids.includes(id)) {
            this.dispatcher.sendQueryMessage({
              clientId: c.clientId, queryId: q.id, message: {
                type: "remove",
                data: {
                  id: id
                }
              }
            });
          }
        }
      }
    }
  }
}

export interface clientInfo {
  clientId: string,
  queries: ({
    id: string,
    repo: Repository<any>,
    findOptions: FindOptions<any>,
    ids: any[]
  })[]
}
export interface ServerEventDispatcher {
  sendQueryMessage(message: ServerEventMessage): void;
  sendChannelMessage<T>(channel: string, message: any): void;
}
export interface ServerEventMessage {
  clientId: string,
  queryId: string,
  message: liveQueryMessage
}