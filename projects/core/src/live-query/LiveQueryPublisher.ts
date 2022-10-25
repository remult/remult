import { v4 as uuid } from 'uuid';
import { Remult, UserInfo } from '../..';
import { Repository, EntityRef, FindOptions, getEntityRef } from '../remult3';
import { LiveQueryProvider } from '../data-api';
import { ServerEventChannelSubscribeDTO, liveQueryMessage, SubscribeToQueryArgs } from './LiveQuerySubscriber';


export class LiveQueryPublisher implements LiveQueryProvider {
  
  constructor(private dispatcher: ServerEventDispatcher) { }

  subscribe(repo: Repository<any>,  findOptions: FindOptions<any>, remult: Remult, ids: any[]): string {
    const id = uuid();
    this.queries.push({
      id,
      findOptions: findOptions,
      repo,
      ids
    });
    return id;
  }

  queries: ({
    id: string,
    repo: Repository<any>,
    findOptions: FindOptions<any>,
    ids: any[]
  })[] = [];



  runPromise(p: Promise<any>) {

  }
  //TODO - reconsider usage of zone
  saved(ref: EntityRef<any>) {
    const isNew = ref.isNew();
    const origId = isNew ? ref.getId() : ref.getOriginalId();
    for (const q of this.queries) {
      if (q.repo.metadata.key === ref.metadata.key) {
        this.runPromise(q.repo.find(q.findOptions).then(
          currentItems => {
            const currentIds = currentItems.map(x => q.repo.getEntityRef(x).getId());
            const sendMessage = (message: liveQueryMessage) => {
              this.dispatcher.sendChannelMessage(q.id, message);
            }


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
  deleted(ref: EntityRef<any>) {
    const id = ref.getOriginalId();
    for (const q of this.queries) {
      if (q.repo.metadata.key === ref.metadata.key) {
        if (q.ids.includes(id)) {
          this.dispatcher.sendChannelMessage(q.id, {
            type: "remove",
            data: {
              id: id
            }
          }
          );
          q.ids = q.ids.filter(y => y != id);
        }
      }
    }
  }
}


export interface ServerEventDispatcher {
  sendChannelMessage<T>(channel: string, message: T): void;
}
