import usePromise from 'react-use-promise'
import { repo } from 'remult'
import { Order } from '../shared/Order'
import { useState } from 'react'

export function Page() {
  const [year, setYear] = useState(2022)
  const [data] = usePromise(
    () =>
      repo(Order).find({
        where: {
          status: ['created', 'confirmed', 'pending', 'blocked', 'delayed'],
          orderDate: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1),
          },
        },
      }),
    [year],
  )
  return (
    <div>
      <h1>Active Orders for Year</h1>
      <main>
        <div>
          <input
            type="number"
            min="2020"
            max="2023"
            value={year}
            onChange={(e) => setYear(e.target.valueAsNumber)}
          />
        </div>
        {data?.map((order, i) => (
          <div key={order.id}>
            {order.id}. {order.orderDate.toLocaleDateString()} - amount:{' '}
            {order.amount} ({order.status})
          </div>
        ))}
      </main>
    </div>
  )
}
