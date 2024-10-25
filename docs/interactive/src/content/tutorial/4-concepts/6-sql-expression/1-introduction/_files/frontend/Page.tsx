import usePromise from 'react-use-promise'
import { repo } from 'remult'
import { Customer } from '../shared/Customer'

export function Page() {
  const [data] = usePromise(
    () =>
      repo(Customer).find({
        orderBy: {
          totalAmount: 'desc',
        },
        where: {
          totalAmount: { $gt: 50 },
        },
      }),
    [],
  )
  return (
    <div>
      <h1>Customers</h1>
      <main>
        {data?.map((customer) => (
          <div key={customer.id}>
            {customer.name} from {customer.city} has spent{' '}
            {customer.totalAmount}
          </div>
        ))}
      </main>
    </div>
  )
}
