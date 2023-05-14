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
  ngOnInit() {
    this.test();
  }
  i = 0;
  countRemult = {};
  async test() {
    let z = 0
    while (z++ < 100) {
      this.i++;
      //await remult.repo(Task).find()

      // await new Promise(resolve => {
      //   let unsub = () => { };
      //   unsub = remult.repo(Task).liveQuery({
      //     limit: this.i
      //   }).subscribe(x => {
      //     unsub();
      //     resolve({});
      //   })

      // })

      // let s = await new SubscriptionChannel("x" + this.i).subscribe(() => { })
      // s();

      await Task.test()

    }
    this.getRemultCount()

  }
  async getRemultCount() {
    this.countRemult = await this.http.get('/api/remultCount').toPromise()
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
  @BackendMethod({ allowed: true, queue: true })
  static async test(p?: ProgressListener) {

    for (let index = 0; index < 2; index++) {
      await new Promise(resolve => {
        setTimeout(() => {
          resolve({})
        }, 100);
      })
      p.progress(index / 2)

    }
  }
}







