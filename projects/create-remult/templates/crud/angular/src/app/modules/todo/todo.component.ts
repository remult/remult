import { Component, type OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { Task } from "../../../demo/todo/Task.js";
import { repo } from "remult";
import { TileComponent } from "../tile/tile.component";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-todo",
  standalone: true,
  imports: [FormsModule, TileComponent, CommonModule],
  styles: [":host { display: contents; }"],
  templateUrl: "./todo.component.html",
})
export class TodoComponent implements OnInit {
  tasks: Task[] = [];
  hideCompleted = false;
  ngOnInit() {
    this.loadTasks();
  }
  toggleHideCompleted() {
    this.hideCompleted = !this.hideCompleted;
    this.loadTasks();
  }
  async loadTasks() {
    this.tasks = await repo(Task).find({
      where: {
        completed: this.hideCompleted ? false : undefined,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
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
