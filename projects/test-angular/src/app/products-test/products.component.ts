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

  }


}



export const helper = {
  onSaving: () => { }
}

@Entity("tasks", {
  allowApiCrud: true, saving: () => {
    helper.onSaving();
  }
})
export class Task extends IdEntity {

  @Fields.string()
  title = '';
  @Fields.boolean()
  completed = false;
}


import { ListenManager } from './ListenManager';


