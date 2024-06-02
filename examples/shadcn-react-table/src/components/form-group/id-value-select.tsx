import * as React from 'react'

import { CaretSortIcon } from '@radix-ui/react-icons'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
export type ValueListItem = {
  id?: string
  caption?: string
}
import { FieldInGroupProps } from '../form-group/form-group'
export type IdValueSelectProps = {
  getOptions: (search: string) => Promise<ValueListItem[]>
  displayValue: (id: string) => Promise<string>
} & FieldInGroupProps

export function IdValueSelect({
  getOptions,
  displayValue: getIdDescription,
  value,
  setValue,
}: IdValueSelectProps) {
  const [options, setOptions] = React.useState<ValueListItem[]>([])
  const [idDescription, setIdDescription] = React.useState('')
  const [search, setSearch] = React.useState('')
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => {
    if (open) {
      getOptions(search).then(setOptions)
    }
  }, [search, open])
  React.useEffect(() => {
    getIdDescription(value).then(setIdDescription)
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {
          <Button
            variant="outline"
            size="sm"
            role="combobox"
            className="capitalize"
          >
            <CaretSortIcon
              className="mr-2 size-4 shrink-0"
              aria-hidden="true"
            />
            {idDescription}
          </Button>
        }
      </PopoverTrigger>
      <PopoverContent className="w-[12.5rem] p-0" align="end">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search..."
            value={search}
            onInput={(e) => setSearch(e.currentTarget.value)}
          />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={String(option.id)}
                  className="capitalize"
                  value={String(option.id)}
                  onSelect={(currentValue) => {
                    setValue(currentValue)
                    setOpen(false)
                    setSearch('')
                  }}
                >
                  {option.caption}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
export type IdSelectValueType = Pick<
  IdValueSelectProps,
  'getOptions' | 'displayValue'
> & { type: 'selectId' }
