import { Allow, BackendMethod, remult } from "remult"
import { Task } from "./task"

export class TasksController {
  @BackendMethod({ allowed: Allow.authenticated })
  static async setAllCompleted(ids: number[], completed: boolean) {
    const taskRepo = remult.repo(Task)
    const orIds = ids.map(id => { return { id: id } })

    for (const task of await taskRepo.find({ where: { $or: orIds } })) {
      await taskRepo.save({ ...task, completed })
    }
  }
}
