import type { FieldUIInfo } from '../../../../core/server/remult-admin'

export type FieldKind =
  | 'relation'
  | 'json'
  | 'enum'
  | 'boolean'
  | 'number'
  | 'date'
  | 'datetime'
  | 'color'
  | 'text'

const REGEX_ISO_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/

export function kindOf(f: FieldUIInfo): FieldKind {
  if (f.relationToOne) return 'relation'
  if (f.type === 'json') return 'json'
  if (f.values.length) return 'enum'
  if (f.type === 'boolean') return 'boolean'
  if (f.type === 'number') return 'number'
  if (f.type === 'date') return f.inputType === 'date' ? 'date' : 'datetime'
  if (f.inputType === 'color') return 'color'
  return 'text'
}

export const isIsoTimestamp = (v: unknown) =>
  typeof v === 'string' && REGEX_ISO_TIMESTAMP.test(v)

const pad = (n: number) => String(n).padStart(2, '0')

/** ISO instant -> `YYYY-MM-DDTHH:mm` in local time, for a datetime-local input. */
export function toLocalInput(v: unknown): string {
  if (v === undefined || v === null || v === '') return ''
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** datetime-local value (local time) -> ISO instant; empty -> null. */
export function fromLocalInput(v: string): string | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}
