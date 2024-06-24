import useQuestion from './components/dialog/useQuestion.tsx'
import TasksTable from './components/task-table/tasks-table.tsx'
import { Button } from './components/ui/button.tsx'

function App() {
  return (
    <div className="flex space-x-2 p-4 flex-col">
      <div></div>
      <TasksTable />
    </div>
  )
}

export default App
