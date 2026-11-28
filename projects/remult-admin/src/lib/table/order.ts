import type { EntityOrderBy } from '../../../../core/index.js'
import type { FieldUIInfo } from '../../../../core/server/remult-admin'
import type { TableQuery } from '../query/filter-model.js'
import { valueKey } from './format.js'

export type OrderInput = {
  fields: FieldUIInfo[]
  ids: Record<string, true>
  defaultOrderBy?: Record<string, unknown>
  /** Keys the client repo can sort on. */
  known: Set<string>
}

/** The sort the table asks for; ids break ties, so a row never shows on two pages. */
export function orderByFor(
  sort: TableQuery['sort'],
  t: OrderInput,
): EntityOrderBy<any> {
  const idOrder = Object.fromEntries(
    Object.keys(t.ids).map((k) => [k, 'asc' as const]),
  )
  if (sort) {
    const f = t.fields.find((x) => x.key === sort.field)
    // a field the repo can't sort on would turn the whole table into an error
    if (f && t.known.has(valueKey(f)))
      return { [valueKey(f)]: sort.dir, ...idOrder }
  }
  const fromServer = Object.entries(t.defaultOrderBy ?? {}).filter(([k]) =>
    t.known.has(k),
  )
  return (
    fromServer.length
      ? { ...Object.fromEntries(fromServer), ...idOrder }
      : idOrder
  ) as EntityOrderBy<any>
}
