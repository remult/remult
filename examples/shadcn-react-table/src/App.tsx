import { Toaster } from 'sonner'
import TasksTable from './components/task-table/tasks-table.tsx'
import { TooltipProvider } from './components/ui/tooltip.tsx'

function App() {
  return (
    <div className="flex space-x-2 p-4">
      <TooltipProvider>
        <TasksTable />
      </TooltipProvider>
      <Toaster />
    </div>
  )
}

export default App
