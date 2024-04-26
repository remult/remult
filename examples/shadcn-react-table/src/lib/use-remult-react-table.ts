import {
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type RowData,
  type SortingState,
} from '@tanstack/react-table'
import React, { useEffect } from 'react'
import type {
  EntityFilter,
  EntityOrderBy,
  FieldMetadata,
  Repository,
  ValueFilter,
} from 'remult'
export type RemultReactTableProps<entityType> = {
  fixedWhere?: EntityFilter<entityType>
}

export function useRemultReactTableServerSidePagingSortingAndFiltering<
  entityType,
>(repo: Repository<entityType>, props?: RemultReactTableProps<entityType>) {
  const [refresh, reloadData] = React.useState({})
  const [columnFilters, onColumnFiltersChange] =
    React.useState<ColumnFiltersState>([])
  const [data, setData] = React.useState<entityType[]>([])
  const [rowCount, setRowCount] = React.useState(0)
  const [{ pageIndex, pageSize }, onPaginationChange] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    })
  const [sorting, onSortingChange] = React.useState<SortingState>([])
  const where = React.useMemo(() => {
    const where: EntityFilter<entityType> = {}
    for (const { id, value } of columnFilters) {
      //@ts-expect-error typing unknown stuff
      where[id] = value?.[0] as ValueFilter<any>
    }
    return { $and: [where, props?.fixedWhere!] } as EntityFilter<entityType>
  }, [JSON.stringify(columnFilters)])

  useEffect(() => {
    const r = repo
    r.count(where).then(setRowCount)
  }, [where, refresh])
  useEffect(() => {
    const orderBy: EntityOrderBy<entityType> = {}
    for (const sort of sorting) {
      //@ts-expect-error typing unknown stuff
      orderBy[sort.id as keyof entityType] = sort.desc ? 'desc' : 'asc'
    }

    repo
      .find({
        orderBy,
        where,
        limit: pageSize,
        page: pageIndex + 1,
      })
      .then((x) => setData(() => x))
  }, [pageIndex, pageSize, sorting, where, refresh])
  return {
    tableProps: {
      data,
      rowCount,
      state: {
        columnFilters,
        sorting,
        pagination: { pageIndex, pageSize },
      },
      onPaginationChange,
      onSortingChange,
      onColumnFiltersChange,
      manualPagination: true,
      manualSorting: true,
      manualFiltering: true,
    },
    addRow: (row: entityType) => {
      setData((data) => [row, ...data])
      setRowCount(rowCount + 1)
    },
    replaceRow: (originalRow: entityType, newRow: entityType) => {
      setData((data) => data.map((row) => (row === originalRow ? newRow : row)))
    },
    removeRow: (row: entityType) => {
      setData((data) => data.filter((r) => r !== row))
      setRowCount(rowCount - 1)
    },
    reloadData,
  }
}
export function fieldsOf<entityType>(
  repo: Repository<entityType>,
  ...fields: (string & keyof entityType)[]
) {
  return fields
    ? fields.map((key) => repo.fields.find(key))
    : repo.fields.toArray().filter((x) => x.key != 'id')
}

import '@tanstack/react-table'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    field?: FieldMetadata<TValue, TData>
  }
}
