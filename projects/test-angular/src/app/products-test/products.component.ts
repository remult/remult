import { Component, NgZone, OnInit } from '@angular/core';
import { Remult, Entity, IdEntity, Fields, Controller, InMemoryDataProvider, Sort } from 'remult';

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
    //  else
    // this.stopA = this.listener.listen("tasks",
    //   (x) => this.zone.run(() => this.messages = [x, ...this.messages.splice(0, 19)])
    // );

  }
  toggleB() {
    if (this.stopB) {
      this.stopB();
      this.stopB = undefined;
    }
    //  else
    // this.stopB = this.listener.listen("b",
    //   (x) => this.zone.run(() => this.messages = [x, ...this.messages.splice(0, 19)])
    // );

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

    const query: EventType<Task> = {
      type: "query",
      entityKey: "tasks",
      orderBy: {
        completed: "asc"
      }
    }

    this.tasks = new Observable((subscribe) => {
      let tasks: Task[] = [];

      this.listener.listen(query, async (message: liveQueryMessage) => {

        switch (message.type) {
          case "all":
            tasks = [];
            for (const t of message.data) {
              tasks.push(await this.remult.repo(Task).fromJson(t))
            }
            this.zone.run(() => subscribe.next(tasks));
            break;
          case "replace": {
            const item = await this.remult.repo(Task).fromJson(message.data.item);
            tasks = tasks.map(x => x.id === message.data.oldId ? item : x);

            if (query.orderBy) {
              const o = Sort.translateOrderByToSort(this.remult.repo(Task).metadata, query.orderBy);
              tasks.sort((a: any, b: any) => o.compare(a, b));
            }
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
    //this.tasks.subscribe(x => console.table(x.map(({ id, title, completed }) => ({ title, completed }))));
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


import { EventType, ListenManager } from './ListenManager';
import { Observable } from 'rxjs';
import { TmplAstRecursiveVisitor } from '@angular/compiler';


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
} | {
  type: "remove",
  data: { id: any }
}

