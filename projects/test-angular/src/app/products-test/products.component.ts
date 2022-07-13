import { AfterViewInit, ChangeDetectionStrategy, Component, ComponentFactoryResolver, Input, NgZone, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Remult, Field, Entity, EntityBase, BackendMethod, getFields, IdEntity, isBackend, Fields, Controller, Filter, FieldRef } from 'remult';

import { CustomDataComponent, DataAreaSettings, DataControlSettings, getEntityValueList, GridSettings, InputField } from '@remult/angular/interfaces';

import { DialogConfig } from '../../../../angular';
import { RemultAngularPluginsService } from '../../../../angular/src/angular/RemultAngularPluginsService';
import axios, { Axios } from 'axios';



@Controller("blabla")

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
  //,changeDetection: ChangeDetectionStrategy.OnPush
})
@DialogConfig({
  height: '1500px'
})
export class ProductsComponent implements OnInit {
  constructor(private remult: Remult, private zone: NgZone) {

  }
  stopA: VoidFunction;
  stopB: VoidFunction;
  toggleA() {
    if (this.stopA) {
      this.stopA();
      this.stopA = undefined;
    }
    else
      this.stopA = this.listener.listen("a",
        (x) => this.zone.run(() => this.messages = [x, ...this.messages.splice(0, 19)])
      );

  }
  toggleB() {
    if (this.stopB) {
      this.stopB();
      this.stopB = undefined;
    }
    else
      this.stopB = this.listener.listen("b",
        (x) => this.zone.run(() => this.messages = [x, ...this.messages.splice(0, 19)])
      );

  }
  grid = new GridSettings(this.remult.repo(Task), {
    allowCrud: true, gridButtons: [{
      name: 'reload',
      click: () => {
        this.grid.reloadData();
      }
    }]
  });
  messages: string[] = [];
  listener = new ListenManager('api/stream');
  async ngOnInit() {
    if (false)
      listenToServerEvents('api/stream', {
        onMessage: data => console.log(data)
      })

  }
  async click() {

  }

}



export const helper = {
  onSaving: () => { }
}

@Entity("tasks", {
  allowApiCrud: true, saving: () => helper.onSaving()
})
export class Task extends IdEntity {

  @Fields.string()
  title = '';
  @Fields.boolean()
  completed = false;
}

type listener = (message: string) => void;
class ListenManager {
  constructor(private url: string, private jwtToken?: string) { }
  private eventTypes = new Map<string, listener[]>();
  private ctrl = new AbortController();
  listen(eventType: string, onMessage: listener) {
    let listeners = this.eventTypes.get(eventType);
    if (!listeners) {
      this.eventTypes.set(eventType, listeners = []);
    }
    listeners.push(onMessage);
    this.refreshListener();
    return () => {
      listeners.splice(listeners.indexOf(onMessage), 1);
      if (listeners.length == 0) {
        this.eventTypes.delete(eventType);
      }
      this.refreshListener();
    }

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
      }
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



import { fetchEventSource } from '@microsoft/fetch-event-source';
import { TypeScriptEmitter } from '@angular/compiler';


export function listenToServerEvents(url: string, args: { onMessage: (data: any, eventType: string) => void, jwtToken?: string }) {
  const ctrl = new AbortController();

  fetchEventSource(url, {
    headers: args.jwtToken ? {
      "Authorization": "Bearer " + args.jwtToken
    } : {
      "Content-Type": "application/json"
    },
    onmessage: message => {
      if (message.event !== 'keep-alive') {
        args.onMessage(JSON.parse(message.data), message.event);
      }
    },
    signal: ctrl.signal,
  });
  return () => ctrl.abort();
}




