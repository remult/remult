import { repo } from 'remult'
import { Customer } from './Customer'
import { Order } from './Order'

export async function seedData() {
  const [c1, c2, c3] = await repo(Customer).insert([
    { id: 1, name: 'Fay, Ebert and Sporer', city: 'London' },
    { id: 2, name: 'Abshire Inc', city: 'New York' },
    { id: 3, name: 'Larkin - Fadel', city: 'London' },
  ])

  await repo(Order).insert([
    { id: 1, customer: c1, amount: 10 },
    { id: 2, customer: c1, amount: 15 },
    { id: 3, customer: c2, amount: 40 },
    { id: 4, customer: c2, amount: 5 },
    { id: 5, customer: c2, amount: 7 },
    { id: 6, customer: c3, amount: 90 },
    { id: 7, customer: c3, amount: 3 },
  ])
}
