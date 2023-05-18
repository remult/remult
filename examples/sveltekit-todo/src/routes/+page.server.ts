import { remult } from "remult"
import { Task } from "../shared/task"

export const load = async () => {
  const tasks = await remult.repo(Task).find()
  // Maybe something better to do here? (if return task, we get non-POJOs error)
  return { tasks: JSON.parse(JSON.stringify(tasks)) as Task[] }
}
