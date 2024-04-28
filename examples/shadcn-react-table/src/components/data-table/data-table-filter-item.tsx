import * as React from 'react'
import type { DataTableFilterOption } from '@/types'
import { TrashIcon } from '@radix-ui/react-icons'
import type { Table } from '@tanstack/react-table'

import { dataTableConfig } from '@/config/filter-operators'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { DataTableAdvancedFacetedFilter } from './data-table-advanced-faceted-filter'

interface DataTableFilterItemProps<TData> {
  table: Table<TData>
  selectedOption: DataTableFilterOption<TData>
  selectedOptions: DataTableFilterOption<TData>[]
  setSelectedOptions: React.Dispatch<
    React.SetStateAction<DataTableFilterOption<TData>[]>
  >
  defaultOpen: boolean
}

export function DataTableFilterItem<TData>({
  table,
  selectedOption,
  selectedOptions,
  setSelectedOptions,
  defaultOpen,
}: DataTableFilterItemProps<TData>) {
  const column = table.getColumn(
    selectedOption.key ? String(selectedOption.key) : '',
  )

  const filterValues =
    selectedOptions.find((item) => item.key === column?.id)?.filterValues || []
  const selectedValues = new Set(filterValues)

  const operators =
    selectedOption.options.length > 0
      ? dataTableConfig.selectableOperators
      : dataTableConfig.comparisonOperators

  const [value, setValue] = React.useState(filterValues[0] ?? '')
  const debounceValue = useDebounce(value, 500)
  const [open, setOpen] = React.useState(defaultOpen)
  const [selectedOperator, setSelectedOperator] = React.useState(
    selectedOptions.find((item) => item.key === column?.id)?.filterOperator ??
      operators[0],
  )

  // Update query string
  React.useEffect(() => {
    let filterValue = undefined
    if (filterValues.length > 0)
      filterValue = selectedOperator.process(filterValues)
    else if (debounceValue) {
      filterValue = selectedOperator.process(debounceValue)
    } else if (selectedOperator.applyWhenNoValue) {
      filterValue = selectedOperator.process('')
    }
    column?.setFilterValue(filterValue ? [filterValue] : undefined)
  }, [filterValues, selectedOperator, debounceValue])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-7 gap-0 truncate rounded-full',
            (selectedValues.size > 0 || value.length > 0) && 'bg-muted/50',
          )}
        >
          <span className="font-medium capitalize">
            {selectedOption.caption}
          </span>
          {selectedOption.options.length > 0
            ? selectedValues.size > 0 && (
                <span className="text-muted-foreground">
                  <span className="text-foreground">: </span>
                  {selectedValues.size > 2
                    ? `${selectedValues.size} selected`
                    : selectedOption.options
                        .filter((item) => selectedValues.has(item.id))
                        .map((item) => item.caption)
                        .join(', ')}
                </span>
              )
            : value.length > 0 && (
                <span className="text-muted-foreground">
                  <span className="text-foreground">: </span>
                  {value}
                </span>
              )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 space-y-1.5 p-2" align="start">
        <div className="flex items-center space-x-1 pl-1 pr-0.5">
          <div className="flex flex-1 items-center space-x-1">
            <div className="text-xs capitalize text-muted-foreground">
              {selectedOption.caption}
            </div>
            <Select
              value={selectedOperator?.label}
              onValueChange={(value) =>
                setSelectedOperator(operators.find((c) => c.label === value)!)
              }
            >
              <SelectTrigger className="h-auto w-fit truncate border-none px-2 py-0.5 text-xs hover:bg-muted/50">
                <SelectValue placeholder={selectedOperator?.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {operators.map((item) => (
                    <SelectItem
                      key={item.label}
                      value={item.label}
                      className="py-1"
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Button
            aria-label="Remove filter"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            onClick={() => {
              setSelectedOptions((prev) =>
                prev.filter((item) => item.key !== selectedOption.key),
              )
            }}
          >
            <TrashIcon className="size-4" aria-hidden="true" />
          </Button>
        </div>
        {selectedOption.options.length > 0 ? (
          column && (
            <DataTableAdvancedFacetedFilter
              key={String(selectedOption.key)}
              column={column}
              title={selectedOption.caption}
              options={selectedOption.options}
              selectedValues={selectedValues}
              setSelectedOptions={setSelectedOptions}
            />
          )
        ) : (
          <Input
            placeholder="Type here..."
            className="h-8"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoFocus
          />
        )}
      </PopoverContent>
    </Popover>
  )
}
