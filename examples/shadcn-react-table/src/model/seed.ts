import { getValueList, repo, type DataProvider } from 'remult'
import { faker } from '@faker-js/faker'
import { Task } from './task.ts'

export async function seed(dataProvider?: DataProvider) {
  const taskRepo = repo(Task, dataProvider)
  console.log('Seeding data...')
  for (let index = 0; index < 1000; index++) {
    try {
      await taskRepo.insert({
        code: `TASK-${(1000 + index).toString()}`,
        title: faker.hacker
          .phrase()
          .replace(/^./, (letter) => letter.toUpperCase()),
        status: faker.helpers.arrayElement(
          getValueList(taskRepo.fields.status),
        ),
        label: faker.helpers.arrayElement(getValueList(taskRepo.fields.label)),
        priority: faker.helpers.arrayElement(
          getValueList(taskRepo.fields.priority),
        ),
        createdAt: faker.date.past(),
      })
    } catch {}
  }
  console.log('Data seeded.')
}
