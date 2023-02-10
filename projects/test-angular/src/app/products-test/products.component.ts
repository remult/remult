import { Component, NgZone, OnInit } from '@angular/core';
import { Remult, Entity, IdEntity, Fields, Controller, InMemoryDataProvider, Sort, BackendMethod, remult } from 'remult';
import { GridSettings } from '@remult/angular/interfaces';
import { DialogConfig } from '../../../../angular';
import * as ably from 'ably';
import { Observable } from 'rxjs';




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
    remult.liveQuerySubscriber.wrapMessageHandling = x => zone.run(() => x());

  }


  messages: string[] = [];
  async ngOnInit() {



  }
  tasks: Observable<Task[]> = new Observable((x) => {
    let tasks: Task[] = [];
    return this.remult.repo(Task).liveQuery().subscribe(newResult => {
      tasks = newResult.items;
      x.next(tasks);
    })
  });
  save(t: Task) {
    remult.repo(Task).save(t)
  }
  setAllCompleted(completed: boolean) {
    Task.setAllCompleted(completed)
  }

  @BackendMethod({ allowed: true })
  static async getAblyToken() {
    const a = new ably.Realtime.Promise(process.env.ABLY_KEY);
    return await a.auth.createTokenRequest({
      capability: {
        [`*`]: ["subscribe"]
      }
    });
  }
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
  @BackendMethod({ allowed: true })
  static async setAllCompleted(completed: boolean) {
    const taskRepo = remult.repo(Task);
    for (const task of await taskRepo.find()) {
      await taskRepo.save({ ...task, completed })
    }
  }
}







