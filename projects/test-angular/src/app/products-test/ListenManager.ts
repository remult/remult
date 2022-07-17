import { fetchEventSource } from '@microsoft/fetch-event-source';
import { EntityOrderBy } from '../../../../core';


export class ListenManager {
  constructor(private url: string, private jwtToken?: string) { }
  private eventTypes = new Map<string, listener[]>();
  private ctrl = new AbortController();
  listen(eventType: EventType, onMessage: listener) {
    const eventTypeKey = JSON.stringify(eventType);
    let listeners = this.eventTypes.get(eventTypeKey);
    if (!listeners) {
      this.eventTypes.set(eventTypeKey, listeners = []);
    }
    listeners.push(onMessage);
    this.refreshListener();
    return () => {
      listeners.splice(listeners.indexOf(onMessage), 1);
      if (listeners.length == 0) {
        this.eventTypes.delete(eventTypeKey);
      }
      this.refreshListener();
    };

  }
  lastId = 0;
  refreshListener() {
    const prevCtrl = this.ctrl;
    this.ctrl = new AbortController();
    const types = [...this.eventTypes.keys()];
    if (types.length == 0) {
      prevCtrl.abort();
    }
    else {
      const typesString = JSON.stringify(types);
      const headers = {
        "event-types": typesString
      };
      if (this.jwtToken) {
        headers["Authorization"] = "Bearer " + this.jwtToken;
      }
      fetchEventSource(this.url, {
        headers,
        method: "post",
        onmessage: message => {
          const mid = +message.id;
          if (mid <= this.lastId && this.lastId - mid < 10)
            return;
          this.lastId = mid;
          console.log(message.data);
          if (message.event !== 'keep-alive') {
            const z = this.eventTypes.get(message.event);
            if (z) {
              for (const handler of z) {
                handler(JSON.parse(message.data));
              }
            }
          }
        },
        onopen: async () => {
          prevCtrl.abort();
        },
        signal: this.ctrl.signal,
      });
      return () => this.ctrl.abort();
    }
  }
}
export type listener = (message: any) => void;

export declare type EventType<entityType = any> = {
  type: "normal"
} | {
  type: "query",
  entityKey: string,
  orderBy?: EntityOrderBy<entityType>
}