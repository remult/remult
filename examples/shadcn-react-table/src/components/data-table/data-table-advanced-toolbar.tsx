import * as React from 'react'

import type { DataTableFilterField, DataTableFilterOption } from '@/types'
import { PlusIcon } from '@radix-ui/react-icons'
import type { Table } from '@tanstack/react-table'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DataTableFilterCombobox } from '@/components/data-table/data-table-filter-combobox'
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options'

import { DataTableFilterItem } from './data-table-filter-item'

interface DataTableAdvancedToolbarProps<TData>
  extends React.HTMLAttributes<HTMLDivElement> {
  table: Table<TData>
  filterFields?: DataTableFilterField<TData>[]
}

export function DataTableAdvancedToolbar<TData>({
  table,
  filterFields = [],
  children,
  className,
  ...props
}: DataTableAdvancedToolbarProps<TData>) {
  const options = React.useMemo<DataTableFilterOption<TData>[]>(() => {
    return filterFields.map((field) => {
      return {
        id: crypto.randomUUID(),
        caption: field.caption,
        key: field.key,
        options: field.options ?? [],
      }
    })
  }, [filterFields])

  const [selectedOptions, setSelectedOptions] = React.useState<
    DataTableFilterOption<TData>[]
  >([])

  const [openCombobox, setOpenCombobox] = React.useState(false)

  function onFilterComboboxItemSelect() {
    setOpenCombobox(true)
  }

  return (
    <div
      className={cn(
        'flex w-full flex-col space-y-2.5 overflow-auto p-1',
        className,
      )}
      {...props}
    >
      <div className=" flex items-center gap-2">
        <div className={cn('flex items-center gap-2')}>
          {selectedOptions.map((selectedOption) => (
            <DataTableFilterItem
              key={String(selectedOption.key)}
              table={table}
              selectedOption={selectedOption}
              selectedOptions={selectedOptions}
              setSelectedOptions={setSelectedOptions}
              defaultOpen={openCombobox}
            />
          ))}

          {options.length > 0 && options.length > selectedOptions.length ? (
            <DataTableFilterCombobox
              options={options}
              selectedOptions={selectedOptions}
              setSelectedOptions={setSelectedOptions}
              onSelect={onFilterComboboxItemSelect}
            >
              <Button
                variant="outline"
                size="sm"
                role="combobox"
                className="h-7 rounded-full"
                onClick={() => setOpenCombobox(true)}
              >
                <PlusIcon
                  className="mr-2 size-4 opacity-50"
                  aria-hidden="true"
                />
                Add filter
              </Button>
            </DataTableFilterCombobox>
          ) : null}
        </div>

        <div className="ml-auto"></div>
        {children}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
