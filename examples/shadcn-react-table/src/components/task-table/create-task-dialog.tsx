import * as React from 'react'
import { PlusIcon } from '@radix-ui/react-icons'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { Task } from '../../model/task.ts'
import { repo, type ErrorInfo } from 'remult'
import { TaskForm } from './task-form.tsx'

export function CreateTaskDialog({
  onAdd,
}: {
  onAdd: (newTask: Task) => void
}) {
  const [open, setOpen] = React.useState(false)

  function onSubmit(input: Task, onSuccess: VoidFunction) {
    toast.promise(repo(Task).insert(input).then(onAdd), {
      loading: 'Creating task...',
      success: () => {
        onSuccess()
        setOpen(false)
        return 'Task created'
      },
      error: (error: ErrorInfo) => {
        setOpen(false)
        return error.message
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon className="mr-2 size-4" aria-hidden="true" />
          New task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new task.
          </DialogDescription>
        </DialogHeader>
        <TaskForm onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  )
}
