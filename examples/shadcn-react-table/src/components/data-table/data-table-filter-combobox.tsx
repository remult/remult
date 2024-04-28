import * as React from 'react'
import type { DataTableFilterOption } from '@/types'
import { CaretSortIcon, ChevronDownIcon, TextIcon } from '@radix-ui/react-icons'

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

interface DataTableFilterComboboxProps<TData> {
  options: DataTableFilterOption<TData>[]
  selectedOptions: DataTableFilterOption<TData>[]
  setSelectedOptions: React.Dispatch<
    React.SetStateAction<DataTableFilterOption<TData>[]>
  >
  onSelect: () => void
  children?: React.ReactNode
}

export function DataTableFilterCombobox<TData>({
  options,
  selectedOptions,
  setSelectedOptions,
  onSelect,
  children,
}: DataTableFilterComboboxProps<TData>) {
  const [value, setValue] = React.useState('')
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ?? (
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
            Filter
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[12.5rem] p-0" align="end">
        <Command>
          <CommandInput placeholder="Filter by..." />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {options
                .filter(
                  (option) =>
                    !selectedOptions.some(
                      (selectedOption) => selectedOption.key === option.key,
                    ),
                )
                .map((option) => (
                  <CommandItem
                    key={String(option.key)}
                    className="capitalize"
                    value={String(option.key)}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? '' : currentValue)
                      setOpen(false)
                      setSelectedOptions((prev) => {
                        return [...prev, { ...option }]
                      })
                      onSelect()
                    }}
                  >
                    {option.options.length > 0 ? (
                      <ChevronDownIcon
                        className="mr-2 size-4"
                        aria-hidden="true"
                      />
                    ) : (
                      <TextIcon className="mr-2 size-4" aria-hidden="true" />
                    )}
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
