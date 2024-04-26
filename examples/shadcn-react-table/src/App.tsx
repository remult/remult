import { Toaster } from 'sonner'
import TasksTable from './components/task-table/tasks-table.tsx'

function App() {
  return (
    <div className="flex space-x-2 p-4">
      <TasksTable />
      <Toaster />
    </div>
  )
}

export default App
