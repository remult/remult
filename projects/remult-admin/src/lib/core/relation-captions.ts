import type { FieldRelationToOneInfo } from '../../../../core/server/remult-admin'

/** Target-side key whose value matches the row's `valFieldKey` (the target's id field is not always `id`). */
export function targetKeyOf(rel: Pick<FieldRelationToOneInfo, 'fields'>, valFieldKey: string) {
  const entries = Object.entries(rel.fields)
  return (entries.find(([, source]) => source === valFieldKey) ?? entries[0])?.[0]
}

/** Row value -> caption, for the rows of one page. */
export function relationCaptions(
  rel: Pick<FieldRelationToOneInfo, 'fields' | 'captionField'>,
  valFieldKey: string,
  targets: Record<string, any>[],
): Map<unknown, unknown> {
  const key = targetKeyOf(rel, valFieldKey)
  return new Map(key === undefined ? [] : targets.map((t) => [t[key], t[rel.captionField]]))
}
