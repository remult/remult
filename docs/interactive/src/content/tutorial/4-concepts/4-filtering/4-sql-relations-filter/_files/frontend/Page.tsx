import usePromise from 'react-use-promise'
import { repo } from 'remult'
import { Order } from '../shared/Order'

export function Page() {
  // Fetch orders using the custom filter and an additional amount condition
  const [data] = usePromise(
    () =>
      repo(Order).find({
        where: {
          $and: [
            Order.fromCity({ city: 'New York' }), // Apply custom filter
            { amount: { $gt: 5 } }, // Additional condition for amount
          ],
        },
        include: {
          customer: true, // Include customer details in the result
        },
      }),
    [],
  )

  return (
    <div>
      <h1>Orders</h1>
      <main>
        {data?.map((order, i) => (
          <div key={order.id}>
            {order.id}. {order.customer?.name} ({order.customer?.city}) -
            amount: {order.amount}
          </div>
        ))}
      </main>
    </div>
  )
}
