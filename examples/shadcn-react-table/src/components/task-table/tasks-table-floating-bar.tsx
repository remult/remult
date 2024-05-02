import * as React from 'react'

import {
  ArrowUpIcon,
  CheckCircledIcon,
  Cross2Icon,
  TrashIcon,
} from '@radix-ui/react-icons'
import { SelectTrigger } from '@radix-ui/react-select'
import { type Table } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Task } from '../../model/task.ts'
import { getValueList, repo } from 'remult'
import { toast } from 'sonner'
import { getErrorMessage } from '../../lib/utils.ts'
import { DeleteTasksDialog } from './delete-task-dialog.tsx'

interface TasksTableFloatingBarProps {
  table: Table<Task>
  reloadData: () => void
}

export function TasksTableFloatingBar({
  table,
  reloadData,
}: TasksTableFloatingBarProps) {
  const rows = table.getFilteredSelectedRowModel().rows
  const [showDeleteTaskDialog, setShowDeleteTaskDialog] = React.useState(false)

  const [isPending, startTransition] = React.useTransition()
  function updateTasks(set: Partial<Task>) {
    startTransition(() => {
      toast.promise(
        repo(Task)
          .updateMany({
            where: {
              id: rows.map((row) => row.original.id),
            },
            set,
          })
          .then(reloadData),
        {
          loading: 'Updating...',
          success: 'Tasks updated',
          error: (err) => getErrorMessage(err),
        },
      )
    })
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 w-full px-4">
      <div className="w-full overflow-x-auto">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-md border bg-card p-2 shadow-2xl">
          <div className="flex h-7 items-center rounded-md border border-dashed pl-2.5 pr-1">
            <span className="whitespace-nowrap text-xs">
              {rows.length} selected
            </span>
            <Separator orientation="vertical" className="ml-2 mr-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 hover:border"
                  onClick={() => table.toggleAllRowsSelected(false)}
                >
                  <Cross2Icon
                    className="size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="flex items-center border bg-accent font-semibold text-foreground dark:bg-zinc-900">
                <p className="mr-2">Clear selection</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Separator orientation="vertical" className="hidden h-5 sm:block" />
          <div className="flex items-center gap-1.5">
            <Select
              onValueChange={(status: Task['status']) =>
                updateTasks({ status })
              }
            >
              <Tooltip>
                <SelectTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="size-7 border data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
                      disabled={isPending}
                    >
                      <CheckCircledIcon className="size-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                </SelectTrigger>
                <TooltipContent className=" border bg-accent font-semibold text-foreground dark:bg-zinc-900">
                  <p>Update status</p>
                </TooltipContent>
              </Tooltip>
              <SelectContent align="center">
                <SelectGroup>
                  {getValueList(repo(Task).fields.status).map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                      className="capitalize"
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              onValueChange={(priority: Task['priority']) =>
                updateTasks({ priority })
              }
            >
              <Tooltip>
                <SelectTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="size-7 border data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
                      disabled={isPending}
                    >
                      <ArrowUpIcon className="size-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                </SelectTrigger>
                <TooltipContent className=" border bg-accent font-semibold text-foreground dark:bg-zinc-900">
                  <p>Update priority</p>
                </TooltipContent>
              </Tooltip>
              <SelectContent align="center">
                <SelectGroup>
                  {getValueList(repo(Task).fields.priority).map((priority) => (
                    <SelectItem
                      key={priority}
                      value={priority}
                      className="capitalize"
                    >
                      {priority}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Tooltip>
              <DeleteTasksDialog
                open={showDeleteTaskDialog}
                onOpenChange={setShowDeleteTaskDialog}
                numberOfTasks={1}
                deleteTasks={() =>
                  repo(Task)
                    .deleteMany({
                      where: {
                        id: rows.map((row) => row.original.id),
                      },
                    })
                    .then(reloadData)
                    .then(() => table.toggleAllRowsSelected(false))
                }
                showTrigger={false}
              />
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-7 border"
                  onClick={() => {
                    setShowDeleteTaskDialog(true)
                  }}
                  disabled={isPending}
                >
                  <TrashIcon className="size-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className=" border bg-accent font-semibold text-foreground dark:bg-zinc-900">
                <p>Delete tasks</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  )
}
