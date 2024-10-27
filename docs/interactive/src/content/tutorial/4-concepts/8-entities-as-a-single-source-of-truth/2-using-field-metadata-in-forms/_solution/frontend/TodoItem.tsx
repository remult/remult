import { repo, ErrorInfo, getValueList } from 'remult'
import { Task } from '../shared/Task.js'
import { useState } from 'react'

const taskRepo = repo(Task)
export function TodoItem({ task }: { task: Task }) {
  const [state, setState] = useState(task)
  const [error, setError] = useState<ErrorInfo<Task>>()
  async function save() {
    try {
      setError(undefined)
      await taskRepo.save(state)
    } catch (error: any) {
      setError(error)
    }
  }
  function reset() {
    setError(undefined)
    setState(task)
  }
  const fields = [taskRepo.fields.title, taskRepo.fields.priority]
  return (
    <div>
      <div>
        {fields.map((field) => {
          const options = getValueList(field)
          return (
            <label>
              {field.caption}:
              {options ? (
                <select
                  value={state[field.key] as any}
                  onChange={(e) =>
                    setState({ ...state, [field.key]: e.target.value })
                  }
                >
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={state[field.key] as any}
                  onChange={(e) =>
                    setState({ ...state, [field.key]: e.target.value })
                  }
                />
              )}
              <div style={{ color: 'red' }}>
                {error?.modelState?.[field.key]}
              </div>
            </label>
          )
        })}
      </div>
      <>
        <button onClick={save}>Save</button>
        <button onClick={reset}>Reset</button>
      </>
    </div>
  )
}
