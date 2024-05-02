// src/shared/TasksController.ts

import { Allow, BackendMethod, remult } from "remult"
import { Task } from "../models/task"

export class TasksController {
  @BackendMethod({ allowed: Allow.authenticated })
  static async findAll() {
    const taskRepo = remult.repo(Task)
    return await taskRepo.find();
  }
  @BackendMethod({ allowed: Allow.authenticated })
  static async insertTask(task : { title: string}) {
    return await remult.repo(Task).insert(task);
  }
  @BackendMethod({ allowed: Allow.authenticated })
  static async saveTask(task : Task) {
    return await remult.repo(Task).save(task);
  }
  @BackendMethod({ allowed: Allow.authenticated })
  static async deleteTask(task : Task) {
    return await remult.repo(Task).delete(task);
  }
  @BackendMethod({ allowed: Allow.authenticated })
  static async setAllCompleted(completed: boolean) {
    for (const task of await remult.repo(Task).find()) {
      await remult.repo(Task).save({ ...task, completed });
    }
  }
}