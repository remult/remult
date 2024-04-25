import { repo } from 'remult'
import { faker } from '@faker-js/faker'
import { Task, labelOptions, priorityOptions, statusOptions } from './task.ts'

export async function seed() {
  console.log('Seeding data...')
  for (let index = 0; index < 1000; index++) {
    try {
      await repo(Task).insert({
        code: `TASK-${faker.number.int({ min: 1000, max: 9999 }).toString()}`,
        title: faker.hacker
          .phrase()
          .replace(/^./, (letter) => letter.toUpperCase()),
        status: faker.helpers.arrayElement(statusOptions),
        label: faker.helpers.arrayElement(labelOptions),
        priority: faker.helpers.arrayElement(priorityOptions),
        createdAt: faker.date.past(),
      })
    } catch {}
  }
  console.log('Data seeded.')
}
