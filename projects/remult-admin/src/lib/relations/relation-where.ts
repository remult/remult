import type { EntityFilter } from '../../../../core/index.js'
import type { EntityRelationToManyInfo } from '../../../../core/server/remult-admin'

/**
 * Child rows of one parent row: the relation's own keys plus its `where`.
 * Undefined when a key has no value: an unfiltered child table would list every row.
 */
export function relationWhere(
  rel: Pick<EntityRelationToManyInfo, 'fields' | 'where'>,
  values: Record<string, unknown>,
  fromJson: (json: any) => EntityFilter<any>,
): EntityFilter<any> | undefined {
  const own = Object.fromEntries(
    Object.entries(rel.fields).map(([k, v]) => [k, values[v]]),
  )
  if (Object.values(own).some((v) => v === undefined || v === null))
    return undefined
  const extra = rel.where ? fromJson(rel.where) : {}
  // the relation's own keys win: a child row always belongs to this parent
  return { ...extra, ...own }
}
