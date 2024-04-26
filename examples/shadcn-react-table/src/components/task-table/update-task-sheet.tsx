import * as React from 'react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Task } from '../../model/task.ts'
import { getErrorMessage } from '../../lib/utils.ts'
import { TaskForm } from './task-form.tsx'
import { repo } from 'remult'

interface UpdateTaskSheetProps
  extends React.ComponentPropsWithRef<typeof Sheet> {
  task: Task
  onUpdate: (updatedTask: Task) => void
}

export function UpdateTaskSheet({
  task,
  onUpdate,
  onOpenChange,
  ...props
}: UpdateTaskSheetProps) {
  function onSubmit(input: Task, onSuccess: VoidFunction) {
    toast.promise(repo(Task).update(task, input).then(onUpdate), {
      loading: 'Updating task...',
      success: () => {
        onOpenChange?.(false)
        onSuccess()
        return 'Task updated'
      },
      error: (error) => {
        onOpenChange?.(false)
        return getErrorMessage(error)
      },
    })
  }

  return (
    <Sheet onOpenChange={onOpenChange} {...props}>
      <SheetContent className="flex flex-col gap-6 sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>Update task</SheetTitle>
          <SheetDescription>
            Update the task details and save the changes
          </SheetDescription>
        </SheetHeader>
        <TaskForm onSubmit={onSubmit} defaultValues={task} />
      </SheetContent>
    </Sheet>
  )
}
