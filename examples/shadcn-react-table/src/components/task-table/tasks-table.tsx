import { repo } from 'remult'
import {
  DataTable,
  buildColumns,
  buildFilterColumns,
  selectColumn,
} from '../data-table/data-table.tsx'
import { Task } from '../../model/task.ts'
import { useMemo } from 'react'
import { Badge } from '../ui/badge.tsx'
import { CreateTaskDialog } from './create-task-dialog.tsx'
import React from 'react'
import { useRemultReactTableServerSidePagingSortingAndFiltering } from '../../lib/use-remult-react-table.ts'
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { TaskRowAction } from './task-row-actions.tsx'

export const taskRepo = repo(Task)
function TasksTable() {
  const t = useRemultReactTableServerSidePagingSortingAndFiltering(taskRepo)

  const columns = React.useMemo<ColumnDef<Task>[]>(() => {
    return [
      selectColumn(),
      ...buildColumns(
        taskRepo,
        'code',
        'title',
        'status',
        'label',
        'priority',
        'createdAt',
      ).map((c) =>
        c.meta?.field === taskRepo.fields.title
          ? ({
              ...c,
              cell: ({ row }) => (
                <div className="flex space-x-2">
                  {<Badge variant="outline">{row.original.label}</Badge>}
                  <span className="max-w-[31.25rem] truncate font-medium">
                    {row.getValue(c.meta!.field!.key)}
                  </span>
                </div>
              ),
            } satisfies ColumnDef<Task>)
          : c,
      ),
      {
        id: 'actions',
        cell: function Cell({ row }) {
          return TaskRowAction(row, t)
        },
      } satisfies ColumnDef<Task>,
    ]
  }, [])

  const table = useReactTable({
    ...t.tableProps,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const filterFields = useMemo(
    () => buildFilterColumns(taskRepo, 'title', 'status', 'label', 'priority'),
    [],
  )
  return (
    <DataTable table={table} filterFields={filterFields}>
      <CreateTaskDialog onAdd={(newTask) => t.addRow(newTask)} />
    </DataTable>
  )
}

export default TasksTable
