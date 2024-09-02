import usePromise from 'react-use-promise'
import { repo } from 'remult'
import { Employee } from '../shared/model'

export function Todo() {
  const [result, error] = usePromise(() => {
    return repo(Employee).groupBy({
      group: ['country', 'city'],
      sum: ['salary'],
      where: {
        salary: {
          $gt: 2000,
        },
      },
    })
  }, [])
  return (
    <div>
      <h1>Group By</h1>
      <main>
        <div>
          <ul>
            {result?.map((x) => (
              <li>
                {x.country} - {x.city} ({x.$count} - {x.salary.sum}:)
              </li>
            ))}
          </ul>
        </div>

        {error && <div>Error: {error.message}</div>}
      </main>
    </div>
  )
}
