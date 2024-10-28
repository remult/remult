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
    {
      id: 1,
      amount: 150,
      orderDate: new Date('2020-01-15'),
      status: 'completed',
    },
    {
      id: 3,
      amount: 220,
      orderDate: new Date('2020-03-25'),
      status: 'completed',
    },
    {
      id: 4,
      amount: 275,
      orderDate: new Date('2020-05-20'),
      status: 'completed',
    },
    {
      id: 6,
      amount: 340,
      orderDate: new Date('2020-07-12'),
      status: 'completed',
    },
    {
      id: 7,
      amount: 450,
      orderDate: new Date('2020-09-10'),
      status: 'canceled',
    },
    {
      id: 9,
      amount: 175,
      orderDate: new Date('2020-11-08'),
      status: 'canceled',
    },
    {
      id: 10,
      amount: 180,
      orderDate: new Date('2021-02-05'),
      status: 'completed',
    },
    {
      id: 12,
      amount: 290,
      orderDate: new Date('2021-04-15'),
      status: 'completed',
    },
    {
      id: 13,
      amount: 320,
      orderDate: new Date('2021-06-15'),
      status: 'completed',
    },
    {
      id: 15,
      amount: 430,
      orderDate: new Date('2021-08-20'),
      status: 'delayed',
    },
  ])

  // Orders for Customer 2
  await cRepo.relations(c2).orders.insert([
    {
      id: 2,
      amount: 295,
      orderDate: new Date('2020-02-18'),
      status: 'completed',
    },
    {
      id: 5,
      amount: 410,
      orderDate: new Date('2020-06-25'),
      status: 'completed',
    },
    {
      id: 8,
      amount: 185,
      orderDate: new Date('2020-10-30'),
      status: 'canceled',
    },
    {
      id: 11,
      amount: 560,
      orderDate: new Date('2021-03-12'),
      status: 'completed',
    },
    {
      id: 14,
      amount: 330,
      orderDate: new Date('2021-07-28'),
      status: 'completed',
    },
    {
      id: 16,
      amount: 475,
      orderDate: new Date('2021-11-15'),
      status: 'delayed',
    },
    {
      id: 20,
      amount: 640,
      orderDate: new Date('2022-04-20'),
      status: 'completed',
    },
    {
      id: 23,
      amount: 215,
      orderDate: new Date('2022-08-05'),
      status: 'blocked',
    },
    {
      id: 26,
      amount: 495,
      orderDate: new Date('2022-12-22'),
      status: 'pending',
    },
    {
      id: 29,
      amount: 370,
      orderDate: new Date('2023-05-15'),
      status: 'created',
    },
  ])

  // Orders for Customer 3
  await cRepo.relations(c3).orders.insert([
    {
      id: 18,
      amount: 510,
      orderDate: new Date('2021-12-10'),
      status: 'completed',
    },
    {
      id: 21,
      amount: 245,
      orderDate: new Date('2022-05-05'),
      status: 'completed',
    },
    {
      id: 24,
      amount: 380,
      orderDate: new Date('2022-09-15'),
      status: 'blocked',
    },
    {
      id: 27,
      amount: 620,
      orderDate: new Date('2023-01-20'),
      status: 'confirmed',
    },
    {
      id: 28,
      amount: 690,
      orderDate: new Date('2023-04-10'),
      status: 'pending',
    },
    {
      id: 30,
      amount: 405,
      orderDate: new Date('2023-06-08'),
      status: 'created',
    },
    {
      id: 17,
      amount: 195,
      orderDate: new Date('2021-11-30'),
      status: 'delayed',
    },
    {
      id: 19,
      amount: 550,
      orderDate: new Date('2022-03-22'),
      status: 'completed',
    },
    {
      id: 22,
      amount: 280,
      orderDate: new Date('2022-07-18'),
      status: 'blocked',
    },
    {
      id: 25,
      amount: 425,
      orderDate: new Date('2022-12-05'),
      status: 'completed',
    },
  ])
}
