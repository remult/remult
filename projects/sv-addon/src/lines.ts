/** Joins template lines, dropping the ones switched off by a falsy condition. */
export function lines(...parts: Array<string | false | undefined | null>) {
  return parts.filter((p) => typeof p === 'string').join('\n')
}
