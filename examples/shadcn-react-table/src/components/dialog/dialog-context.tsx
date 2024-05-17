import {
  PropsWithChildren,
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { Dialog, DialogContent } from '../ui/dialog.tsx'

export type DialogContentRender<T> = (
  resolve: (result?: T) => void,
) => ReactNode

type ShowDialogFunction = <T>(
  render: DialogContentRender<T>,
  defaultResult?: T,
) => Promise<T | undefined>

const DialogContext = createContext<ShowDialogFunction>(undefined!)
export function useDialog() {
  return useContext(DialogContext)
}
let lastId = 0
export default function DialogProvider({ children }: PropsWithChildren) {
  const [dialogs, setDialogs] = useState<
    {
      id: number
      onClose: () => void
      render: () => ReactNode
    }[]
  >([])

  function close(id: number) {
    setDialogs((current) => current.filter((x) => x.id !== id))
  }

  function dialog<T>(render: DialogContentRender<T>, defaultResult?: T) {
    return new Promise<T | undefined>((res) => {
      const id = lastId++
      setDialogs((current) => [
        ...current,
        {
          id,
          render: () => {
            return render((value?: T) => {
              close(id)
              res(value ?? defaultResult)
            })
          },
          onClose: () => {
            close(id)
            res(defaultResult)
          },
        },
      ])
    })
  }
  return (
    <DialogContext.Provider value={dialog}>
      {children}
      {dialogs.map((item) => {
        const Item = item.render
        return (
          <MyDialog key={item.id} onClose={item.onClose!}>
            <Item />
          </MyDialog>
        )
      })}
    </DialogContext.Provider>
  )
}

export function MyDialog({
  onClose,
  children,
}: {
  onClose: VoidFunction
} & PropsWithChildren) {
  const [open, setOpen] = useState(true)

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
        setOpen(open)
      }}
    >
      <DialogContent>{children}</DialogContent>
    </Dialog>
  )
}
