import FormGroup, { FieldConfig } from './form-group/form-group'
import { useState } from 'react'
import { useDialog } from './dialog/dialog-context'
import { Button } from './ui/button'
import {
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { EntityError } from '../lib/env-web/data-api-for'
import { useError } from './dialog/useError'

type FieldsConfigToValuesType<
  ConfigType extends Record<string, Partial<FieldConfig>>,
> = {
  [k in keyof ConfigType]: ConfigType[k]['type'] extends 'checkbox'
    ? boolean
    : ConfigType[k]['type'] extends 'number'
    ? number
    : // : ConfigType[k]['type'] extends 'date'
      // ? Date
      string
}

export function useFormDialog() {
  const dialog = useDialog()
  return function <
    ConfigType extends Record<string, Partial<FieldConfig>>,
  >(args: {
    title?: string
    fields: ConfigType
    defaultValues?: FieldsConfigToValuesType<ConfigType>
    onOk: (value: FieldsConfigToValuesType<ConfigType>) => void | Promise<void>
  }) {
    type T = FieldsConfigToValuesType<ConfigType>
    dialog((resolve) => {
      const [state, setState] = useState<T>(args.defaultValues ?? ({} as T))
      const [error, setError] = useState<EntityError<T>>()
      const errorDialog = useError()
      async function ok() {
        try {
          setError(undefined)
          await args.onOk(state)
          resolve()
        } catch (err) {
          setError(err as EntityError<T>)
          errorDialog({ message: (err as EntityError<T>).message })
        }
      }

      return (
        <div className="gap-4">
          <DialogHeader>
            <DialogTitle>{args.title}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-60 p-4">
            <FormGroup
              fields={args.fields}
              state={state as any}
              setState={setState as any}
              error={error}
              setError={setError}
            />
          </div>
          <DialogFooter className="gap-2 sm:space-x-0 mt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <Button variant="default" onClick={ok}>
              Ok
            </Button>
          </DialogFooter>
        </div>
      )
    })
  }
}
