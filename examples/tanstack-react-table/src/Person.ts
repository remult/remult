import { faker } from '@faker-js/faker'
import { Entity, Fields, InMemoryDataProvider, remult, repo } from 'remult'

export const statusOptions = ['relationship', 'complicated', 'single']
type Status = (typeof statusOptions)[number]

@Entity('people')
export class Person {
  @Fields.id()
  id = ''
  @Fields.string()
  firstName = ''
  @Fields.string()
  lastName = ''
  @Fields.integer()
  age = 0
  @Fields.integer()
  visits = 0
  @Fields.integer()
  progress = 0
  @Fields.literal(() => statusOptions)
  status: Status = 'single'
}

// setup remult locally in the browser with test data - this is not needed in a real app
remult.dataProvider = new InMemoryDataProvider()
if (!(await repo(Person).count())) {
  for (let index = 0; index < 1000; index++) {
    await repo(Person).insert({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      age: faker.number.int(40),
      visits: faker.number.int(1000),
      progress: faker.number.int(100),
      status: faker.helpers.shuffle(statusOptions)[0]!,
    })
  }
}
