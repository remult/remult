import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '../ui/button.tsx'
import { useDialog } from './dialog-context.tsx'

export default function useQuestion() {
  const dialog = useDialog()
  return (question: string) =>
    dialog(
      (resolve) => (
        <div>
          <DialogHeader>
            <DialogTitle>Question</DialogTitle>
            <DialogDescription>{question}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0">
            <DialogClose asChild>
              <Button variant="outline">no</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="destructive" onClick={() => resolve(true)}>
                Yes
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      ),
      false,
    )
}
