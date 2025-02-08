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

  const titleField = taskRepo.fields.title
  const priorityField = taskRepo.fields.priority

  return (
    <div>
      <div>
        <label>
          {titleField.caption}:
          <input
            value={state.title}
            onChange={(e) => setState({ ...state, title: e.target.value })}
          />
          <div style={{ color: 'red' }}>{error?.modelState?.title}</div>
        </label>

        <label>
          {priorityField.caption}:
          <input
            value={state.priority}
            onChange={(e) =>
              setState({ ...state, priority: e.target.value as any })
            }
          />
          <div style={{ color: 'red' }}>{error?.modelState?.priority}</div>
        </label>
      </div>
      <button onClick={save}>Save</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}
