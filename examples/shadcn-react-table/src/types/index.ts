import type { FilterOperator } from '../config/filter-operators.ts'

export interface SearchParams {
  [key: string]: string | string[] | undefined
}

export interface Option {
  caption: string
  id: string
  count?: number
  icon?: React.ComponentType<{ className?: string }>
}

export interface DataTableFilterField<TData> {
  caption: string
  key: keyof TData
  placeholder?: string
  options?: Option[]
}

export interface DataTableFilterOption<TData> {
  id: string
  caption: string
  key: keyof TData
  options: Option[]
  filterValues?: string[]
  filterOperator?: FilterOperator
}
