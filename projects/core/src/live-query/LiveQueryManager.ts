import { v4 as uuid } from 'uuid';
import { Remult, UserInfo } from '../..';
import { Repository, EntityRef, FindOptions, getEntityRef } from '../remult3';
import { LiveQueryProvider } from '../data-api';
import { liveQueryMessage, SubscribeToQueryArgs } from './LiveQuery';


export class LiveQueryManager implements LiveQueryProvider {



  constructor(private dispatcher: ServerEventDispatcher) {

  }

  subscribe(repo: Repository<any>, clientId: string, findOptions: FindOptions<any>): string {
    let client = this.clients.find(c => c.clientId === clientId);
    if (!client) {
      this.clients.push(client = { clientId: clientId, queries: [] });
    }
    const id = uuid();
    client.queries.push({
      id,
      findOptions: findOptions,
      repo
    });
    return id;
  }

  clients: clientInfo[] = [];

  sendMessage(key: string, message: liveQueryMessage) {
    for (const c of this.clients) {
      for (const q of c.queries) {
        if (q.repo.metadata.key === key) {
          this.dispatcher.sendQueryMessage({ clientId: c.clientId, queryId: q.id, message });
        }
      }
    }
  }
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

  saved(ref: EntityRef<any>) {
    const isNew = ref.isNew();
    const origId = isNew ? ref.getId() : ref.getOriginalId();
    for (const c of this.clients) {
      for (const q of c.queries) {
        if (q.repo.metadata.key === ref.metadata.key) {
          this.runPromise(q.repo.findFirst(ref.metadata.idMetadata.getIdFilter(ref.getId())).then(
            currentRow => {
              if (currentRow) {
                const sendMessage = (message: liveQueryMessage) => {
                  this.dispatcher.sendQueryMessage({ clientId: c.clientId, queryId: q.id, message });
                }
                if (isNew)
                  sendMessage({
                    type: "add",
                    data: { item: q.repo.getEntityRef(currentRow).toApiJson() }
                  });

                else
                  sendMessage({
                    type: "replace",
                    data: {
                      oldId: origId,
                      item: q.repo.getEntityRef(currentRow).toApiJson()
                    }
                  });
              }
            }));
        }
      }
    }
  }
  deleted(ref: EntityRef<any>) {
    if (!this.hasListeners(ref))
      return;
    this.sendMessage(ref.metadata.key, {
      type: "remove",
      data: { id: ref.getId() }
    });
  }
}

export interface clientInfo {
  clientId: string,
  queries: ({
    id: string,
    repo: Repository<any>,
    findOptions: FindOptions<any>
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