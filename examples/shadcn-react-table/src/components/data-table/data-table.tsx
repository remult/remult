import * as React from 'react'
import {
  flexRender,
  type ColumnDef,
  type Table as TanstackTable,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { DataTablePagination } from './data-table-pagination'
import { getValueList, type Repository } from 'remult'
import { fieldsOf } from '../../lib/use-remult-react-table.ts'
import { DataTableColumnHeader } from './data-table-column-header.tsx'
import { DataTableAdvancedToolbar } from './data-table-advanced-toolbar.tsx'
import type { DataTableFilterField } from '../../types/index.ts'
import { Checkbox } from '../ui/checkbox.tsx'

interface DataTableProps<TData> extends React.PropsWithChildren {
  /**
   * The table instance returned from useDataTable hook with pagination, sorting, filtering, etc.
   * @type TanstackTable<TData>
   */
  table: TanstackTable<TData>

  /**
   * The floating bar to render at the bottom of the table on row selection.
   * @default null
   * @type React.ReactNode | null
   * @example floatingBar={<TasksTableFloatingBar table={table} />}
   */
  floatingBar?: React.ReactNode | null
  filterFields?: DataTableFilterField<TData>[]
}

export function DataTable<TData>({
  table,
  floatingBar = null,
  filterFields,
  children,
}: DataTableProps<TData>) {
  return (
    <div className="w-full space-y-2.5 overflow-auto">
      <DataTableAdvancedToolbar table={table} filterFields={filterFields}>
        {children}
      </DataTableAdvancedToolbar>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-2.5">
        <DataTablePagination table={table} />
        {table.getFilteredSelectedRowModel().rows.length > 0 && floatingBar}
      </div>
    </div>
  )
}

export function selectColumn<entityType>(): ColumnDef<entityType> {
  return {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value: any) =>
          table.toggleAllPageRowsSelected(!!value)
        }
        aria-label="Select all"
        className="translate-y-0.5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: any) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-0.5"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }
}

export function buildColumns<entityType>(
  repo: Repository<entityType>,
  ...fields: (string & keyof entityType)[]
): ColumnDef<entityType, unknown>[] {
  return fieldsOf(repo, ...fields).map((field) => {
    return {
      accessorKey: field.key,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={field.caption} />
      ),
      cell: (info) => (
        <div className="w-20"> {field.displayValue(info.row.original)}</div>
      ),
      meta: {
        field: field,
      },
    }
  })
}

export function buildFilterColumns<entityType>(
  repo: Repository<entityType>,
  ...fields: (string & keyof entityType)[]
): DataTableFilterField<entityType>[] {
  return fieldsOf(repo, ...fields).map((field) => ({
    caption: field.caption,
    key: field.key as keyof entityType,
    placeholder: field.caption,
    options: getValueList(field)?.map((value) =>
      typeof value === 'string'
        ? {
            caption: field.options.displayValue?.(undefined!, value) || value,
            id: value,
          }
        : {
            caption: value.caption,
            id: value.id,
          },
    ),
  }))
}
