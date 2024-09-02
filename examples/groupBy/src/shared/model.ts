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
  name = ''
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
      name: 'John Doe',
      city: 'London',
      country: 'uk',
      salary: 5000,
      numberOfKids: 3,
      department: departments[0],
    },
    {
      id: '2',
      name: 'Jane Smith',
      city: 'London',
      country: 'uk',
      salary: 7000,
      numberOfKids: 2,
      department: departments[1],
    },
    {
      id: '3',
      name: 'Alice Johnson',
      city: 'Manchester',
      country: 'uk',
      salary: 3000,
      numberOfKids: 5,
      department: departments[0],
      status: Status.terminated,
    },
    {
      id: '4',
      name: 'Bob Brown',
      city: 'Manchester',
      country: 'uk',
      salary: 9000,
      numberOfKids: 1,
      department: departments[1],
    },
    {
      id: '5',
      name: 'Charlie Davis',
      city: 'Paris',
      country: 'france',
      salary: 4000,
      numberOfKids: 4,
      department: departments[1],
      status: Status.terminated,
    },
    {
      id: '6',
      name: 'Diana Evans',
      city: 'Paris',
      country: 'france',
      salary: 8000,
      numberOfKids: 6,
      department: departments[0],
    },
    {
      id: '7',
      name: 'Edward Harris',
      city: 'Berlin',
      country: 'germany',
      salary: 2000,
      numberOfKids: 7,
      department: departments[0],
    },
    {
      id: '8',
      name: 'Fiona Clark',
      city: 'Berlin',
      country: 'germany',
      salary: 6000,
      numberOfKids: 9,
      department: departments[1],
      status: Status.terminated,
    },
    {
      id: '9',
      name: 'George Lewis',
      city: 'Hamburg',
      country: 'germany',
      salary: 1000,
      numberOfKids: 8,
      department: departments[1],
    },
    {
      id: '10',
      name: 'Hannah Walker',
      city: 'Munich',
      country: 'germany',
      salary: 5000,
      numberOfKids: 2,
      department: departments[0],
      status: Status.terminated,
    },
    {
      id: '11',
      name: 'Ian Young',
      city: 'Rome',
      country: 'italy',
      salary: 3000,
      numberOfKids: 4,
      department: departments[1],
    },
    {
      id: '12',
      name: 'Jackie King',
      city: 'Rome',
      country: 'italy',
      salary: 7000,
      numberOfKids: 1,
      department: departments[1],
    },
    {
      id: '13',
      name: 'Kevin Wright',
      city: 'Milan',
      country: 'italy',
      salary: 4000,
      numberOfKids: 3,
      department: departments[1],
    },
    {
      id: '14',
      name: 'Laura Scott',
      city: 'Naples',
      country: 'italy',
      salary: 8000,
      numberOfKids: 5,
      department: departments[1],
    },
    {
      id: '15',
      name: 'Michael Green',
      city: 'Madrid',
      country: 'spain',
      salary: 2000,
      numberOfKids: 6,
      department: departments[1],
    },
    {
      id: '16',
      name: 'Nina Adams',
      city: 'Barcelona',
      country: 'spain',
      salary: 6000,
      numberOfKids: 7,
      department: departments[1],
    },
  ])
}
