import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { remult } from 'remult';
import { Task } from '../../shared/Task';
import { TasksController } from '../../shared/TasksController';

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.css',
})
export class TodoComponent implements OnInit, OnDestroy {
  taskRepo = remult.repo(Task);
  tasks: Task[] = [];
  unsubscribe = () => {};
  ngOnInit() {
    this.unsubscribe = this.taskRepo
      .liveQuery({
        limit: 20,
        orderBy: { createdAt: 'asc' },
        //where: { completed: true }
      })
      .subscribe((info) => (this.tasks = info.applyChanges(this.tasks)));
  }
  ngOnDestroy() {
    this.unsubscribe();
  }
  newTaskTitle = '';
  async addTask() {
    try {
      const newTask = await this.taskRepo.insert({ title: this.newTaskTitle });
      this.newTaskTitle = '';
    } catch (error: any) {
      alert(error.message);
    }
  }
  async saveTask(task: Task) {
    try {
      await this.taskRepo.save(task);
    } catch (error: any) {
      alert(error.message);
    }
  }
  async deleteTask(task: Task) {
    await this.taskRepo.delete(task);
  }
  async setAllCompleted(completed: boolean) {
    await TasksController.setAllCompleted(completed);
  }
}
