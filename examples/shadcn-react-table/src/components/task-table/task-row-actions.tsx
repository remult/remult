import { getValueList, repo } from 'remult'
import { Task } from '../../model/task.ts'
import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu.tsx'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Button } from '../ui/button.tsx'
import { toast } from 'sonner'
import { getErrorMessage } from '../../lib/utils.ts'
import { useRemultReactTableServerSidePagingSortingAndFiltering } from '../../lib/use-remult-react-table.ts'

import type { Row } from '@tanstack/react-table'
import { UpdateTaskSheet } from './update-task-sheet.tsx'
import { DeleteTasksDialog } from './delete-task-dialog.tsx'

export function TaskRowAction(
  row: Row<Task>,
  t: ReturnType<
    typeof useRemultReactTableServerSidePagingSortingAndFiltering<Task>
  >,
) {
  const [isUpdatePending, startUpdateTransition] = React.useTransition()
  const [showUpdateTaskSheet, setShowUpdateTaskSheet] = React.useState(false)
  const [showDeleteTaskDialog, setShowDeleteTaskDialog] = React.useState(false)

  return (
    <>
      <UpdateTaskSheet
        open={showUpdateTaskSheet}
        onOpenChange={setShowUpdateTaskSheet}
        task={row.original}
        onUpdate={(updatedTask) => t.replaceRow(row.original, updatedTask)}
      />
      <DeleteTasksDialog
        open={showDeleteTaskDialog}
        onOpenChange={setShowDeleteTaskDialog}
        numberOfTasks={1}
        deleteTasks={() =>
          repo(Task)
            .delete(row.original.id)
            .then(() => t.removeRow(row.original))
        }
        showTrigger={false}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Open menu"
            variant="ghost"
            className="flex size-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onSelect={() => setShowUpdateTaskSheet(true)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={row.original.label}
                onValueChange={(value) => {
                  startUpdateTransition(() => {
                    toast.promise(
                      repo(Task)
                        .update(row.original.id, {
                          label: value as Task['label'],
                        })
                        .then((newRow) => t.replaceRow(row.original, newRow)),
                      {
                        loading: 'Updating...',
                        success: 'Label updated',
                        error: (err) => getErrorMessage(err),
                      },
                    )
                  })
                }}
              >
                {getValueList(repo(Task).fields.label).map((label) => (
                  <DropdownMenuRadioItem
                    key={label}
                    value={label}
                    className="capitalize"
                    disabled={isUpdatePending}
                  >
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setShowDeleteTaskDialog(true)}>
            Delete
            <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
