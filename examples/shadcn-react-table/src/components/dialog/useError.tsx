import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '../ui/button.tsx'
import { useDialog } from './dialog-context.tsx'

export function useError() {
  const dialog = useDialog()
  return ({ title, message }: { title?: string; message: string }) =>
    dialog(() => (
      <div>
        <DialogHeader>
          <DialogTitle>{title ?? 'Error'}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:space-x-0">
          <DialogClose asChild>
            <Button variant="destructive">Ok</Button>
          </DialogClose>
        </DialogFooter>
      </div>
    ))
}
