import usePromise from 'react-use-promise'
import { repo } from 'remult'
import { Order } from '../shared/Order'

export function Page() {
  const [data] = usePromise(
    () =>
      repo(Order).find({
        include: {
          customer: true,
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
            {order.id}. {order?.customer?.name || 'undefined'} - amount:{' '}
            {order.amount}
          </div>
        ))}
      </main>
    </div>
  )
}
