/** Return this from {@link walkFilter}'s visitor to drop that field key. */
export const omitFilterField = Symbol('omitFilterField')

function isCompoundFilterKey(key: string) {
  return key === '$and' || key === '$or' || key === '$not'
}

// `$and`, `$or`, and `$not` are entered. Every other key is a field, passed to `visit`.
// `visit` returns the value to keep, or `omitFilterField` to drop the key.
export function walkFilter(
  filter: unknown,
  visit: (key: string, value: unknown) => unknown,
): unknown {
  if (Array.isArray(filter)) {
    const result = []
    for (const item of filter) result.push(walkFilter(item, visit))
    return result
  }
  if (!filter || typeof filter !== 'object') return filter
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(filter)) {
    const value = (filter as Record<string, unknown>)[key]
    if (isCompoundFilterKey(key)) {
      result[key] = walkFilter(value, visit)
      continue
    }
    const next = visit(key, value)
    if (next !== omitFilterField) result[key] = next
  }
  return result
}
