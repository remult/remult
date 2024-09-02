import {
  Entity,
  Field,
  Fields,
  Relations,
  repo,
  ValueListFieldType,
} from 'remult'

@Entity('employees', {
  allowApiCrud: true,
})
export class Employee {
  @Fields.integer()
  id = ''
  @Fields.string()
  city = ''
  @Fields.string()
  country = ''
  @Fields.number()
  salary = 0
  @Fields.number()
  numberOfKids = 0
  @Field(() => Status)
  status = Status.employed
  @Relations.toOne(() => Department)
  department?: Department
}
@Entity('Category', {
  allowApiCrud: true,
})
export class Department {
  @Fields.number()
  id = 0
  @Fields.string()
  name = ''
}

export const entities = [Employee, Department]

@ValueListFieldType()
class Status {
  static employed = new Status('employed', 'Employed')
  static terminated = new Status('terminated', 'Terminated')
  constructor(
    public id: string,
    public caption: string,
  ) {}
}

export async function seed() {
  if ((await repo(Employee).count()) > 0) return //only seed if the database is empty
  const departments = await await repo(Department).insert([
    { id: 1, name: 'Sales' },
    { id: 2, name: 'Development' },
  ])
  await repo(Employee).insert([
    {
      id: '1',
      city: 'London',
      country: 'uk',
      salary: 5000,
      numberOfKids: 3,
      department: departments[0],
    },
    {
      id: '2',
      city: 'London',
      country: 'uk',
      salary: 7000,
      numberOfKids: 2,
      department: departments[1],
    },
    {
      id: '3',
      city: 'Manchester',
      country: 'uk',
      salary: 3000,
      numberOfKids: 5,
      department: departments[0],
    },
    {
      id: '4',
      city: 'Manchester',
      country: 'uk',
      salary: 9000,
      numberOfKids: 1,
      department: departments[1],
    },
    {
      id: '5',
      city: 'Paris',
      country: 'france',
      salary: 4000,
      numberOfKids: 4,
      department: departments[1],
    },
    {
      id: '6',
      city: 'Paris',
      country: 'france',
      salary: 8000,
      numberOfKids: 6,
      department: departments[1],
    },
    {
      id: '7',
      city: 'Berlin',
      country: 'germany',
      salary: 2000,
      numberOfKids: 7,
      department: departments[1],
    },
    {
      id: '8',
      city: 'Berlin',
      country: 'germany',
      salary: 6000,
      numberOfKids: 9,
      department: departments[1],
    },
    {
      id: '9',
      city: 'Hamburg',
      country: 'germany',
      salary: 1000,
      numberOfKids: 8,
      department: departments[1],
    },
    {
      id: '10',
      city: 'Munich',
      country: 'germany',
      salary: 5000,
      numberOfKids: 2,
      department: departments[1],
    },
    {
      id: '11',
      city: 'Rome',
      country: 'italy',
      salary: 3000,
      numberOfKids: 4,
      department: departments[1],
    },
    {
      id: '12',
      city: 'Rome',
      country: 'italy',
      salary: 7000,
      numberOfKids: 1,
      department: departments[1],
    },
    {
      id: '13',
      city: 'Milan',
      country: 'italy',
      salary: 4000,
      numberOfKids: 3,
      department: departments[1],
    },
    {
      id: '14',
      city: 'Naples',
      country: 'italy',
      salary: 8000,
      numberOfKids: 5,
      department: departments[1],
    },
    {
      id: '15',
      city: 'Madrid',
      country: 'spain',
      salary: 2000,
      numberOfKids: 6,
      department: departments[1],
    },
    {
      id: '16',
      city: 'Barcelona',
      country: 'spain',
      salary: 6000,
      numberOfKids: 7,
      department: departments[1],
    },
  ])
}
