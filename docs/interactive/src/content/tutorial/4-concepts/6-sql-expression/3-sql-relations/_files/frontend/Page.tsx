import usePromise from 'react-use-promise'
import { repo } from 'remult'
import { Order } from '../shared/Order'
import { Customer } from '../shared/Customer'

export function Page() {
  const [orders] = usePromise(
    () =>
      repo(Order).find({
        orderBy: {
          customerCity: 'asc',
        },
      }),
    [],
  )
  const [customers] = usePromise(() => repo(Customer).find({}), [])
  return (
    <div>
      <h1>Orders</h1>
      <main>
        {orders?.map((order) => (
          <div key={order.id}>
            Order {order.id}, Customer from {order.customerCity} has spent{' '}
            {order.amount}$
          </div>
        ))}
      </main>
      <h1>Customers</h1>
      <main>
        {customers?.map((customer) => (
          <div key={customer.id}>
            Customer {customer.name} from {customer.city} has placed{' '}
            {customer.orderCount} orders, {customer.bigOrderCount} of which are
            over 50$, with a total amount of {customer.totalAmount}$
          </div>
        ))}
      </main>
    </div>
  )
}
