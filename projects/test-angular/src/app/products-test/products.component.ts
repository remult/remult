import { Component, NgZone, OnInit } from '@angular/core';
import { Remult, Entity, IdEntity, Fields, Controller } from 'remult';

import { GridSettings } from '@remult/angular/interfaces';

import { DialogConfig } from '../../../../angular';

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
      this.stopA = this.listener.listen("tasks",
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
    await this.remult.repo(Task).count();
    this.tasks = new Observable((subscribe) => {
      this.listener.listen("tasks", async (message: liveQueryMessage) => {

        let tasks: Task[] = [];
        switch (message.type) {
          case "all":
            for (const t of message.data) {
              tasks.push(await this.remult.repo(Task).fromJson(t))
            }
            this.zone.run(() => subscribe.next(tasks));
            break;
          case "replace": {
            const item = await this.remult.repo(Task).fromJson(message.data.item);
            tasks = tasks.map(x => x.id === message.data.oldId ? item : x);
            this.zone.run(() => subscribe.next(tasks));
            break;
          }
          case "add":
            {
              const item = await this.remult.repo(Task).fromJson(message.data);
              tasks.push(item);
              this.zone.run(() => subscribe.next(tasks));
              break;
            }
          case "remove":
            tasks = tasks.filter(x => x.id !== message.data.id);
            this.zone.run(() => subscribe.next(tasks));
            break;
        };
      })
    });
    this.tasks.subscribe(x => console.table(x.map(({ id, title, completed }) => ({ title, completed }))));
  }
  tasks: Observable<Task[]>;
}


export const helper = {
  onSaved: (t: Task) => { },
  onDeleted: (t: Task) => { },
}

@Entity<Task>("tasks", {
  allowApiCrud: true,
  saved: item => {
    helper.onSaved(item);
  },
  deleted: item => {
    helper.onDeleted(item)
  }
})
export class Task extends IdEntity {

  @Fields.string()
  title = '';
  @Fields.boolean()
  completed = false;
}


import { ListenManager } from './ListenManager';
import { Observable } from 'rxjs';


export declare type liveQueryMessage = {
  type: "all",
  data: any[]
} | {
  type: "add"
  data: any
} | {
  type: 'replace',
  data: {
    oldId: any,
    item: any
  }
} |
{
  type: "remove",
  data: { id: any }
}