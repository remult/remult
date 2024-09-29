import { Component, type OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { Task } from "../../../demo/todo/Task.js";
import { repo } from "remult";

@Component({
  selector: "app-todo",
  standalone: true,
  imports: [FormsModule],

  templateUrl: "./todo.component.html",
})
export class TodoComponent implements OnInit {
  tasks: Task[] = [];
  page = 1;
  ngOnInit() {
    this.loadTasks();
  }
  async loadTasks() {
    this.tasks = await repo(Task).find({
      page: this.page,
      limit: 5,
    });
  }
  setPage(delta: number) {
    this.page += delta;
    this.loadTasks();
  }
  newTaskTitle = "";
  async addTask() {
    try {
      const newTask = await repo(Task).insert({ title: this.newTaskTitle });
      this.tasks.push(newTask);
      this.newTaskTitle = "";
    } catch (error: any) {
      alert(error.message);
    }
  }
  async saveTask(task: Task) {
    try {
      await repo(Task).save(task);
    } catch (error: any) {
      alert(error.message);
    }
  }
  async deleteTask(task: Task) {
    await repo(Task).delete(task);
    this.tasks = this.tasks.filter((t) => t !== task);
  }
}
