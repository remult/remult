import { Component, OnInit } from '@angular/core';
import {  Context, iterateConfig, ServerFunction, SqlDatabase, ServerProgress,   } from '@remult/core';

import { DataAreaSettings } from '@remult/angular';
import { Products } from '../products-test/products';
import { Column, Entity, EntityBase } from '../../../projects/core/src/remult3';


@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent {
  title = 'angular-sample';
  constructor(private context: Context) {
  }
  newTask = this.context.for(Tasks).create();
  async createNewTask() {
    await this.newTask._.save();
    this.newTask = this.context.for(Tasks).create();
    this.loadTasks();
  }
  hideCompleted: boolean;

  tasks: Tasks[];
  async loadTasks() {
    this.tasks = await this.context.for(Tasks).find({
      where: task => this.hideCompleted ? task.completed.isDifferentFrom(true) : undefined,
      orderBy: task => task.completed
    });
  }
  ngOnInit() {
    this.loadTasks();
  }
  async deleteTask(task: Tasks) {
    await task._.delete();
    this.loadTasks();
  }
  async setAll(completed: boolean) {
    await TestComponent.setAll(completed);
    this.loadTasks();
  }
  @ServerFunction({ allowed: true })
  static async setAll(completed: boolean, context?: Context) {
    for await (const task of context.for(Tasks).iterate()) {
      task.completed = completed;
      await task._.save();
    }
  }

}

@Entity<Tasks>({
  name: 'tasks',
  allowApiCRUD: true,
  saving:t=>{
    t.context.user.id
  }
})
class Tasks extends EntityBase {
  @Column<Tasks, string>({
    validate: (col, row) => {
      if (col.value.length < 3)
        col.error = "is too short";
      if (row.title.length < 3)
        row._.columns.title.error = "is too short";
    },

  })
  title = '';
  @Column()
  completed :boolean;
  constructor(private context: Context) {
    super();
  }
}
