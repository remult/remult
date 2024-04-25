import { MixIcon, SquareIcon } from '@radix-ui/react-icons'
import type { ContainsStringValueFilter, ValueFilter } from 'remult'

export type DataTableConfig = typeof dataTableConfig

export type FilterOperator = {
  label: string
  process: (val: any) => any
}
const selectableOperators = [
  { label: 'Is', process: (val: any) => val },
  {
    label: 'Is not',
    process: (val: any) => ({ $ne: val } satisfies ValueFilter<any>),
  },
  {
    label: 'Is empty',
    process: (val: any) => null,
  },
  {
    label: 'Is not empty',
    process: (val: any) => ({ $ne: null } satisfies ValueFilter<any>),
  },
] satisfies FilterOperator[]
export const dataTableConfig = {
  comparisonOperators: [
    {
      label: 'Contains',
      process: (val: any) =>
        ({ $contains: val } satisfies ContainsStringValueFilter),
    },
    {
      label: 'Does not contain',
      process: (val: any) =>
        ({ $notContains: val } satisfies ContainsStringValueFilter),
    },
    ...selectableOperators,
  ],
  selectableOperators,
  logicalOperators: [
    {
      label: 'And',
      value: 'and' as const,
      description: 'All conditions must be met',
    },
    {
      label: 'Or',
      value: 'or' as const,
      description: 'At least one condition must be met',
    },
  ],
  featureFlags: [
    {
      label: 'Advanced filter',
      value: 'advancedFilter' as const,
      icon: MixIcon,
      tooltipTitle: 'Toggle advanced filter',
      tooltipDescription: 'A notion like query builder to filter rows.',
    },
    {
      label: 'Floating bar',
      value: 'floatingBar' as const,
      icon: SquareIcon,
      tooltipTitle: 'Toggle floating bar',
      tooltipDescription: 'A floating bar that sticks to the top of the table.',
    },
  ],
}
