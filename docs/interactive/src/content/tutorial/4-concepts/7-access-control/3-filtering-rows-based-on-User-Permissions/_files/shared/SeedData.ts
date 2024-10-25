import { repo } from 'remult'
import { Task } from './Task'

export async function SeedData() {
  const taskRepo = repo(Task)
  if ((await taskRepo.count({ ownerId: { $not: '' } })) == 0) {
    await taskRepo.deleteMany({ where: { id: { $not: [] } } })
    await taskRepo.insert([
      { title: 'Clean car', ownerId: 'Jane' },
      { title: 'Cook dinner', completed: true, ownerId: 'Alex' },
      { title: 'Read a book', ownerId: 'Jane' },
      { title: 'Do laundry', ownerId: 'Alex' },
      { title: 'Buy groceries', completed: true, ownerId: 'Jane' },
      { title: 'Walk the dog', ownerId: 'Alex' },
    ])
  }
}
