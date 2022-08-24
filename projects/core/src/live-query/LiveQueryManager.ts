import { v4 as uuid } from 'uuid';
import { Remult } from '../..';
import { Repository, EntityRef, FindOptions } from '../remult3';
import { LiveQueryProvider } from '../data-api';
import { liveQueryMessage } from './LiveQuery';
import { clientInfo, ServerEventsController } from '../../server/expressBridge';

export class LiveQueryManager implements LiveQueryProvider {
  subscribe(repo: Repository<any>, clientId: string, options: FindOptions<any>, remult: Remult): string {
    let client = this.clients.find(c => c.clientId === clientId);
    if (!client) {
      this.clients.push(client = { clientId: clientId, queries: [], user: remult.user });
    }
    const id = uuid();
    client.queries.push({
      id,
      entityKey: repo.metadata.key,
      orderBy: {}
    });
    return id;
  }






  clients: clientInfo[] = [];

  server = new ServerEventsController();
  sendMessage(key: string, m: liveQueryMessage) {
    for (const c of this.clients) {
      for (const q of c.queries) {
        if (q.entityKey === key) {
          for (const sc of this.server.connections) {
            if (sc.clientId === c.clientId) {
              sc.write(undefined, m, q.id);
            }
          }
        }
      }
    }
  }
  hasListeners(ref: EntityRef<any>) {
    for (const c of this.clients) {
      for (const q of c.queries) {
        if (q.entityKey === ref.metadata.key)
          return true;
      }
    }
    return false;
  }
  saved(ref: EntityRef<any>) {
    if (!this.hasListeners(ref))
      return;
    if (ref.isNew())
      this.sendMessage(ref.metadata.key, {
        type: "add",
        data: { item: ref.toApiJson() }
      });

    else
      this.sendMessage(ref.metadata.key, {
        type: "replace",
        data: {
          oldId: ref.getId(),
          item: ref.toApiJson()
        }
      });

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
