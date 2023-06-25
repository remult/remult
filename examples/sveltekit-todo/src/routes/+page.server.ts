import { remult, type FindOptions } from "remult"
import { Task } from "../shared/task"

export const load = async ({ url }) => {
  // last 3 messages by default
  const options: FindOptions<Task> = {
    orderBy: { id: "desc" },
    limit: parseInt(url.searchParams.get("limit") || "3"),
  }
  const tasks = await remult.repo(Task).find(options)

  // Maybe something better to do here? (if return task, we get non-POJOs error)
  return { tasks: JSON.parse(JSON.stringify(tasks)) as Task[], options }
}
