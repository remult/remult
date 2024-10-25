import { repo } from 'remult'
import { Task } from './Task'
import { TimeEntry } from './TimeEntry'

export async function SeedData() {
  const taskRepo = repo(Task)
  const timeEntryRepo = repo(TimeEntry)

  if (
    (await taskRepo.count({ ownerId: { $not: '' } })) == 0 ||
    (await timeEntryRepo.count()) == 0
  ) {
    await taskRepo.deleteMany({ where: { id: { $not: [] } } })
    await timeEntryRepo.deleteMany({ where: { id: { $not: [] } } })

    const tasks = await taskRepo.insert([
      { title: 'Clean car', ownerId: 'Jane' },
      { title: 'Cook dinner', completed: true, ownerId: 'Alex' },
      { title: 'Read a book', ownerId: 'Jane' },
      { title: 'Do laundry', ownerId: 'Alex' },
      { title: 'Buy groceries', completed: true, ownerId: 'Jane' },
      { title: 'Walk the dog', ownerId: 'Alex' },
    ])

    await timeEntryRepo.insert([
      {
        taskId: tasks[0].id,
        startTime: new Date('2024-03-18T10:00:00'),
        endTime: new Date('2024-03-18T11:30:00'),
      },
      {
        taskId: tasks[0].id,
        startTime: new Date('2024-03-19T14:00:00'),
        endTime: new Date('2024-03-19T15:00:00'),
      },
      {
        taskId: tasks[1].id,
        startTime: new Date('2024-03-18T17:00:00'),
        endTime: new Date('2024-03-18T18:30:00'),
      },
      {
        taskId: tasks[1].id,
        startTime: new Date('2024-03-19T16:30:00'),
        endTime: new Date('2024-03-19T18:00:00'),
      },
      {
        taskId: tasks[2].id,
        startTime: new Date('2024-03-17T20:00:00'),
        endTime: new Date('2024-03-17T21:00:00'),
      },
      {
        taskId: tasks[2].id,
        startTime: new Date('2024-03-18T21:00:00'),
        endTime: new Date('2024-03-18T22:30:00'),
      },
      {
        taskId: tasks[2].id,
        startTime: new Date('2024-03-19T19:00:00'),
        endTime: new Date('2024-03-19T20:00:00'),
      },
      {
        taskId: tasks[3].id,
        startTime: new Date('2024-03-18T09:00:00'),
        endTime: new Date('2024-03-18T11:00:00'),
      },
      {
        taskId: tasks[3].id,
        startTime: new Date('2024-03-19T10:00:00'),
        endTime: new Date('2024-03-19T12:00:00'),
      },
      {
        taskId: tasks[4].id,
        startTime: new Date('2024-03-17T15:00:00'),
        endTime: new Date('2024-03-17T16:30:00'),
      },
      {
        taskId: tasks[4].id,
        startTime: new Date('2024-03-19T11:00:00'),
        endTime: new Date('2024-03-19T12:30:00'),
      },
      {
        taskId: tasks[5].id,
        startTime: new Date('2024-03-18T07:00:00'),
        endTime: new Date('2024-03-18T08:00:00'),
      },
      {
        taskId: tasks[5].id,
        startTime: new Date('2024-03-18T17:00:00'),
        endTime: new Date('2024-03-18T18:00:00'),
      },
      {
        taskId: tasks[5].id,
        startTime: new Date('2024-03-19T07:30:00'),
        endTime: new Date('2024-03-19T08:30:00'),
      },
    ])
  }
}
