import type { FieldRelationToOneInfo } from '../../../../core/server/remult-admin'

/** Target-side key whose value matches the row's `valFieldKey` (the target's id field is not always `id`). */
export function targetKeyOf(rel: Pick<FieldRelationToOneInfo, 'fields'>, valFieldKey: string) {
  const entries = Object.entries(rel.fields)
  return (entries.find(([, source]) => source === valFieldKey) ?? entries[0])?.[0]
}

export const filled = (v: unknown) => v !== undefined && v !== null && v !== ''

/** The caption field, else the first other filled key: the server can hide the caption field on some rows. */
export function captionOf(item: Record<string, any>, captionField: string, fallbackKeys: string[] = []): unknown {
  if (filled(item[captionField])) return item[captionField]
  const k = fallbackKeys.find((x) => x !== captionField && filled(item[x]))
  return k === undefined ? undefined : item[k]
}

/** Row value -> caption, for the rows of one page. */
export function relationCaptions(
  rel: Pick<FieldRelationToOneInfo, 'fields' | 'captionField'>,
  valFieldKey: string,
  targets: Record<string, any>[],
  fallbackKeys: string[] = [],
): Map<unknown, unknown> {
  // one key per value: a compound relation is told apart by this field only, enough while compound ids are not edited here
  const key = targetKeyOf(rel, valFieldKey)
  return new Map(
    key === undefined ? [] : targets.map((t) => [t[key], captionOf(t, rel.captionField, fallbackKeys)]),
  )
}
