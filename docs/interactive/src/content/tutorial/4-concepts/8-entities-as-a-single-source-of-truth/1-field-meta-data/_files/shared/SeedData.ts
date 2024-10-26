import { repo } from 'remult'
import { Task } from './Task'

export async function seedData() {
  const taskRepo = repo(Task)
  if ((await taskRepo.count({ priority: { $not: '' } })) == 0) {
    await taskRepo.deleteMany({ where: { id: { $not: [] } } })
    await taskRepo.insert([
      { title: 'Clean car', priority: 'low' },
      { title: 'Cook dinner', completed: true, priority: 'low' },
      { title: 'Read a book', priority: 'low' },
      { title: 'Do laundry', priority: 'low' },
      { title: 'Buy groceries', completed: true, priority: 'low' },
      { title: 'Walk the dog', priority: 'low' },
    ])
  }
}
