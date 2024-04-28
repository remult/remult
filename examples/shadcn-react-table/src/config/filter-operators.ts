import type { ContainsStringValueFilter, ValueFilter } from 'remult'

export type DataTableConfig = typeof dataTableConfig

export type FilterOperator = {
  label: string
  process: (val: any) => any
  applyWhenNoValue?: boolean
}
const selectableOperators = [
  { label: 'Is', process: (val: any) => val },
  {
    label: 'Is not',
    process: (val: any) => ({ $ne: val }) satisfies ValueFilter<any>,
  },
  {
    label: 'Is empty',
    process: (_: any) => null,
    applyWhenNoValue: true,
  },
  {
    label: 'Is not empty',
    process: (_: any) => ({ $ne: null }) satisfies ValueFilter<any>,
    applyWhenNoValue: true,
  },
] satisfies FilterOperator[]
export const dataTableConfig = {
  comparisonOperators: [
    {
      label: 'Contains',
      process: (val: any) =>
        ({ $contains: val }) satisfies ContainsStringValueFilter,
    },
    {
      label: 'Does not contain',
      process: (val: any) =>
        ({ $notContains: val }) satisfies ContainsStringValueFilter,
    },
    ...selectableOperators,
  ],
  selectableOperators,
}
