import { v4 as uuid } from 'uuid';
import { Remult } from '../..';
import { itemChange, LiveQueryPublisherInterface } from '../context';
import { Repository, EntityRef, FindOptions } from '../remult3';

import { liveQueryMessage } from './LiveQuerySubscriber';


export class LiveQueryPublisher implements LiveQueryPublisherInterface {

  constructor(public dispatcher: ServerEventDispatcher) { }
  stopLiveQuery(id: any): void {
    this.queries = this.queries.filter(q => q.id !== id);
  }
  sendChannelMessage<messageType>(channel: string, message: messageType) {
    this.dispatcher.sendChannelMessage(channel, message);
  }

  defineLiveQueryChannel(repo: Repository<any>, findOptions: FindOptions<any>, remult: Remult, ids: any[]): string {
    const id = `users:${remult.user?.id}:queries:${uuid()}`;
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

  itemChanged(entityKey: string, changes: itemChange[]) {
    for (const q of this.queries) {
      // possible optimization delete only messages that don't require running the query again
      if (q.repo.metadata.key === entityKey) {
        const messages = [];
        this.runPromise(q.repo.find(q.findOptions).then(
          currentItems => {
            const currentIds = currentItems.map(x => q.repo.getEntityRef(x).getId());
            const sendMessage = (message: liveQueryMessage) => {
              messages.push(message);
            }


            for (const id of q.ids.filter(y => !currentIds.includes(y))) {
              let c = changes.find(c => c.oldId == id)
              if (id != c.oldId || !currentIds.includes(c.id))
                sendMessage({
                  type: "remove",
                  data: {
                    id: id
                  }
                })
            }
            for (const item of currentItems) {
              const itemRef = q.repo.getEntityRef(item);
              let c = changes.find(c => c.id == itemRef.getId())
              if (c !== undefined && q.ids.includes(c.oldId)) {
                sendMessage({
                  type: "replace",
                  data: {
                    oldId: c.oldId,
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
            this.dispatcher.sendChannelMessage(q.id, messages);
          }));
      }
    }
  }
}


export interface ServerEventDispatcher {
  sendChannelMessage<T>(channel: string, message: T): void;
}
// TODO - PUBNUB
