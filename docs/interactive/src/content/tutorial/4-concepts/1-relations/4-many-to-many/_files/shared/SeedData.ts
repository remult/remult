import { repo } from 'remult'
import { Customer } from './Customer'
import { Product } from './Product'
import { Order } from './Order'

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
  const products = await repo(Product).insert([
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Banana' },
    { id: 3, name: 'Orange' },
    { id: 4, name: 'Grapes' },
    { id: 5, name: 'Pineapple' },
    { id: 6, name: 'Mango' },
    { id: 7, name: 'Strawberry' },
    { id: 8, name: 'Blueberry' },
  ])
  for (const order of await repo(Order).find()) {
    await repo(Order)
      .relations(order)
      .products.insert(
        [0, 2, 4]
          .map((i) => products[(order.id + i) % products.length])
          .map((product) => ({
            product,
          })),
      )
  }
}
