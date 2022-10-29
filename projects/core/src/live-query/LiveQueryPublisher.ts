import { v4 as uuid } from 'uuid';
import { Remult } from '../..';
import { itemChange, LiveQueryPublisherInterface } from '../context';
import { Repository, EntityRef, FindOptions } from '../remult3';

import { liveQueryMessage } from './LiveQuerySubscriber';


export class LiveQueryPublisher implements LiveQueryPublisherInterface {

  constructor(public dispatcher: ServerEventDispatcher) { }
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

  // TODO - aggregate transaction outside of it.
  // TODO - site as decorator pattern

  runPromise(p: Promise<any>) {

  }

  itemChanged(entityKey: string, changes: itemChange[]) {
    for (const q of this.queries) {
      if (q.repo.metadata.key === entityKey) {
        for (const change of changes) {

          if (change.deleted) {
            if (q.ids.includes(change.id)) {
              this.dispatcher.sendChannelMessage(q.id, [{
                type: "remove",
                data: {
                  id: change.id
                }
              }]);
              q.ids = q.ids.filter(y => y != change.id);
            }
          }
          else
            this.runPromise(q.repo.find(q.findOptions).then(
              currentItems => {
                const currentIds = currentItems.map(x => q.repo.getEntityRef(x).getId());
                const sendMessage = (message: liveQueryMessage) => {
                  this.dispatcher.sendChannelMessage(q.id, [message]);
                }


                for (const id of q.ids.filter(y => !currentIds.includes(y))) {
                  if (id != change.oldId || !currentIds.includes(change.id))
                    sendMessage({
                      type: "remove",
                      data: {
                        id: id
                      }
                    })
                }
                for (const item of currentItems) {
                  const itemRef = q.repo.getEntityRef(item);
                  if (itemRef.getId() == change.id && q.ids.includes(change.oldId)) {
                    sendMessage({
                      type: "replace",
                      data: {
                        oldId: change.oldId,
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
}


export interface ServerEventDispatcher {
  sendChannelMessage<T>(channel: string, message: T): void;
}
// TODO - ABYL
// TODO - PUBNUB
// TODO - find set all bug