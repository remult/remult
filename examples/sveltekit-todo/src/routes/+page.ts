import { remult, type FindOptions } from 'remult'
import { Task } from '../shared/task'

export const load = async ({ url }) => {
  // last 3 messages by default
  const options: FindOptions<Task> = {
    orderBy: { id: 'desc' },
    limit: parseInt(url.searchParams.get('limit') || '3'),
  }
  const tasks = await remult.repo(Task).find(options)

  return { tasks: remult.repo(Task).toJson(tasks), options }
}
