import { Component, OnInit } from '@angular/core';
import { DateColumn, BoolColumn, Context, iterateConfig, ServerFunction, SqlDatabase, ServerProgress, NumberColumn, EntityClass, Entity } from '@remult/core';
import { StringColumn } from '@remult/core';
import { DataAreaSettings } from '@remult/angular';
import { Products } from '../products-test/products';


@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {

  constructor(private context: Context) { }

  newTask = this.context.for(tasks).create();
  async ngOnInit() {
this.loadTasks();

  }
  cb1:any;
  cb2:any;
  cb3:any;
  tasks: tasks[] = [];
  async save() {
    await this.newTask.save();
    this.newTask = this.context.for(tasks).create();
  }
  async loadTasks() {
    this.tasks = await this.context.for(tasks).find({where:t=>t.completed.isDifferentFrom(true)});
  }

}

@EntityClass
class tasks extends Entity {

  name = new StringColumn();
  completed = new BoolColumn();
  constructor() {
    super({
      name: 'tasks',
      allowApiCRUD: true,
      saving:()=>{
        console.log(this.completed.rawValue);
      }
    })
  }
}