import { repo } from 'remult'
import { Customer } from './Customer'

export async function seedData() {
  const cRepo = repo(Customer)
  const [c1, c2, c3] = await cRepo.insert([
    { id: 1, name: 'Fay, Ebert and Sporer', city: 'London' },
    { id: 2, name: 'Abshire Inc', city: 'New York' },
    { id: 3, name: 'Larkin - Fadel', city: 'London' },
  ])

  await cRepo.relations(c1).orders.insert([
    { id: 1, amount: 10 },
    { id: 2, amount: 15 },
  ])

  await cRepo.relations(c2).orders.insert([
    { id: 3, amount: 40 },
    { id: 4, amount: 5 },
    { id: 5, amount: 7 },
  ])

  await cRepo.relations(c3).orders.insert([
    { id: 6, customer: c3, amount: 90 },
    { id: 7, customer: c3, amount: 3 },
  ])
}
