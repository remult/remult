export function assign<T>(item: T, valuesToSet: Partial<T>): T {
  if (valuesToSet) Object.assign(item as any, valuesToSet)
  return item
}
