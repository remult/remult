import { Checkbox } from '../ui/checkbox.tsx'
import { Input } from '../ui/input.tsx'
import { FieldInGroupProps } from './form-group.tsx'

export function NormalInput({ field, value, setValue }: FieldInGroupProps) {
  return (
    <Input
      id={field.key}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      type={field.type}
    />
  )
}

export function CheckboxInput({ value, setValue }: FieldInGroupProps) {
  return (
    <Checkbox
      checked={value == 'true'}
      onCheckedChange={(e) => setValue(e.toString())}
    />
  )
}
