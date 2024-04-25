import { repo } from 'remult'
import {
  DataTable,
  buildFilterColumns,
  useRemultReactTable,
} from './components/data-table/data-table.tsx'
import { Task } from './model/task.ts'
import { useMemo } from 'react'
import { Badge } from './components/ui/badge.tsx'

function App() {
  const table = useRemultReactTable(repo(Task), {
    columns: {
      build: ({ build }) => [
        ...build('code'),
        {
          ...build('title')[0],
          cell: ({ row }) => (
            <div className="flex space-x-2">
              {<Badge variant="outline">{row.original.label}</Badge>}
              <span className="max-w-[31.25rem] truncate font-medium">
                {row.getValue('title')}
              </span>
            </div>
          ),
        },
        ...build('status', 'label', 'priority', 'createdAt'),
      ],
    },
  })
  const filterFields = useMemo(
    () =>
      buildFilterColumns(repo(Task), 'title', 'status', 'label', 'priority'),
    []
  )

  return (
    <div className="flex space-x-2 p-4">
      <DataTable table={table} filterFields={filterFields} />
    </div>
  )
}

export default App
