import usePromise from 'react-use-promise'
import { repo } from 'remult'
import { Order } from '../shared/Order'

export function Page() {
  const [data] = usePromise(
    () =>
      repo(Order).find({
        orderBy: {
          customerCity: 'asc',
        },
      }),
    [],
  )
  return (
    <div>
      <h1>Orders</h1>
      <main>
        {data?.map((order) => (
          <div key={order.id}>
            Order {order.id}, Customer from {order.customerCity} has spent{' '}
            {order.amount}$
          </div>
        ))}
      </main>
    </div>
  )
}
