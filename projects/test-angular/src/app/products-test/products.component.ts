import { Component, NgZone, OnInit } from '@angular/core';
import { Remult, Entity, IdEntity, Fields, Controller, InMemoryDataProvider, Sort, BackendMethod, remult, SubscriptionChannel, ProgressListener, Field } from 'remult';
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

  tasks: Task[] = [];

  async ngOnInit() {
    remult.repo(Task).liveQuery({
      load: () => []
    }).subscribe(info => this.tasks = info.applyChanges(this.tasks))

  }

  countRemult = {};



}

@Entity<Category>("categories", {
  allowApiCrud: true, apiPrefilter: () => ({
    id: { $ne: "clj30u9o500000kr3956ph9ep" }
  })
})
export class Category {
  @Fields.cuid()
  id = ''
  @Fields.string()
  name = ''
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

  @Field(() => Category)
  category?: Category


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
  @BackendMethod({ allowed: true })
  static async testTrans() {
    const repo = remult.repo(Task);
    await repo.insert({ title: "before error" });
    throw new Error("RRRRR")
    await repo.insert({ title: "After Error" })
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