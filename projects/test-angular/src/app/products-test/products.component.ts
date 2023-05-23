import { Component, NgZone, OnInit } from '@angular/core';
import { Remult, Entity, IdEntity, Fields, Controller, InMemoryDataProvider, Sort, BackendMethod, remult, SubscriptionChannel, ProgressListener } from 'remult';
import { GridSettings } from '@remult/angular/interfaces';
import { DialogConfig } from '../../../../angular';
import * as ably from 'ably';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';





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
export class ProductsComponent {
  constructor(private remult: Remult, private zone: NgZone, private http: HttpClient) {


  }
  async ngOnInit() {
    var t = await remult.repo(Task).findFirst();

    try {
      this.countRemult = {
        "entityInstance": await t.entityInstance(),
        "entityStatic": await Task.entityStatic(),
        "undecoratedStatic": await TasksController.undecoratedStatic(),
        "decoratedStatic": await TasksControllerDecorated.decoratedStatic(),
        "decorated": await new TasksControllerDecorated().decorated()
      }
    } catch (err) {
      this.countRemult = err;
    }

  }

  countRemult = {};



}

@Entity("tasks", {
  allowApiCrud: true
})
export class Task {
  @Fields.autoIncrement()
  id = 0
  @Fields.string<Task>()
  title = ''
  @Fields.boolean()
  completed = false
  @BackendMethod({ allowed: true, apiPrefix: 'noam' })
  static async entityStatic() {
    return "ok";
  }
  @BackendMethod({ allowed: true, apiPrefix: 'noam' })
  async entityInstance() {
    return "ok"
  }
  @Fields.string({ allowApiUpdate: false })
  apiUpdateNotAllowed = '';
  @Fields.string({ includeInApi: false })
  includeInApiFalse = '';
  @Fields.string({ serverExpression: () => '' })
  serverExpression = '';
}

export class TasksController {
  @BackendMethod({ allowed: true, apiPrefix: 'noam' })
  static async undecoratedStatic() {
    return "ok";
  }
}
@Controller("Decorated/myStuff/someMoreStuff")
export class TasksControllerDecorated {
  @BackendMethod({ allowed: true, apiPrefix: 'noam' })
  static async decoratedStatic() {
    return "ok";
  }
  @BackendMethod({ allowed: true, apiPrefix: 'noam' })
  async decorated() {
    return "ok";
  }
}