import { Label } from '../ui/label.tsx'
import { capitalize } from '../../lib/utils.ts'
import { CheckboxInput, NormalInput } from './NormalInput.tsx'
import { useMemo } from 'react'

import { IdSelectValueType, IdValueSelect } from './id-value-select.tsx'
import type { ErrorInfo } from 'remult'

export type FieldConfig = (
  | { type: 'text' | 'number' | 'checkbox' | 'date' }
  | IdSelectValueType
) & {
  caption: string
  key: string
  displayValue: (val: any) => string | Promise<string>
}

export type FieldInGroupProps = {
  field: FieldConfig
  value: string
  setValue: (newValue: string) => void
}

export default function FormGroup(props: {
  fields: Record<string, Partial<FieldConfig>>
  state: Record<string, string>
  setState: (newState: Record<string, string>) => void
  error: ErrorInfo<unknown> | undefined
  setError: (e: ErrorInfo<unknown>) => void
}) {
  const fields = useMemo(() => {
    const result: FieldConfig[] = []
    for (const key in props.fields) {
      if (Object.prototype.hasOwnProperty.call(props.fields, key)) {
        const element = props.fields[key]
        result.push({
          type: 'text',
          caption: capitalize(key),
          key,
          ...element,
        } as any)
      }
    }
    return result
  }, [])

  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => {
        // @ts-expect-error - fieldError is a string
        const fieldError = props.error?.modelState?.[field.key]
        const args: FieldInGroupProps = {
          field,
          value: props.state[field.key] || '',
          setValue: (value) => {
            props.setState({ ...props.state, [field.key]: value })
            if (fieldError) {
              props.setError({
                ...props.error!,
                modelState: {
                  ...props.error!.modelState,
                  [field.key]: undefined,
                },
              })
            }
          },
        }
        function RenderField() {
          if (field.type)
            switch (field.type) {
              case 'selectId':
                return <IdValueSelect {...args} {...field} />
              case 'checkbox':
                return <CheckboxInput {...args} />
              default:
                return <NormalInput {...args} />
            }
        }

        return (
          <div className="grid w-full  items-center gap-1.5" key={field.key}>
            <Label
              htmlFor={field.key}
              className={fieldError ? 'text-destructive' : undefined}
            >
              {field.caption}
            </Label>
            {RenderField()}
            {fieldError && <div className="text-destructive">{fieldError}</div>}
          </div>
        )
      })}
      {/* <pre>{JSON.stringify(props.state, undefined, 2)}</pre> */}
    </div>
  )
}
