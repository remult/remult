import usePromise from 'react-use-promise'
import { repo } from 'remult'
import { Employee } from '../shared/model'

export function Todo() {
  const [result, error] = usePromise(() => {
    return repo(Employee).find({
      where: {
        salary: {
          $gt: 2000,
        },
      },
    })
  }, [])
  return (
    <div>
      <h1>Aggregate</h1>
      <main>
        <div>
          <ul>
            {result?.map((x) => (
              <li>
                {x.name} ({x.salary})
              </li>
            ))}
          </ul>
        </div>

        {error && <div>Error: {error.message}</div>}
      </main>
    </div>
  )
}
