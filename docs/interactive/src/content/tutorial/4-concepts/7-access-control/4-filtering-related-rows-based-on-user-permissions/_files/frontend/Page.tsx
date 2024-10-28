import usePromise from 'react-use-promise'
import { repo } from 'remult'
import { TimeEntry } from '../shared/TimeEntry'

export function Page() {
  const [data, error] = usePromise(
    () =>
      repo(TimeEntry).find({
        include: {
          task: true,
        },
        orderBy: {
          startTime: 'desc',
        },
      }),
    [],
  )
  return (
    <div>
      <h1>Time Entries</h1>
      <main>
        {data?.map((entry) => (
          <div key={entry.id}>
            {entry.task?.title} ({entry.task?.ownerId}){' '}
            {entry.startTime.toLocaleDateString()} (
            {(entry.endTime.valueOf() - entry.startTime.valueOf()) / 1000 / 60}{' '}
            minutes)
          </div>
        ))}
        {error && (
          <div>
            <strong style={{ color: 'red' }}>Error: {error.message}</strong>
          </div>
        )}
      </main>
    </div>
  )
}
