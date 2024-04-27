import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDialog } from './dialog-context.tsx'
import { Button } from '../ui/button.tsx'

export default function useQuestion() {
  const dialog = useDialog()
  return ({ title, description }: { title: string; description: string }) =>
    dialog(
      (resolve) => (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
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
        </DialogContent>
      ),
      false,
    )
}
