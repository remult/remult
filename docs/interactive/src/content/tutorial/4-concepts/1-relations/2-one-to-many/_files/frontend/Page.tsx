import usePromise from 'react-use-promise'
import { repo } from 'remult'
import { Customer } from '../shared/Customer'

export function Page() {
  const [data] = usePromise(
    () =>
      repo(Customer).find({
        include: {
          orders: true,
        },
      }),
    [],
  )
  return (
    <div>
      {data?.map((customer) => (
        <div key={customer.id}>
          <br />
          <center>Customer: {customer.name}</center>
          <main>
            {customer.orders?.map((order) => (
              <div key={order.id}>
                {order.id}. amount: {order.amount}
              </div>
            ))}
          </main>
        </div>
      ))}
    </div>
  )
}
