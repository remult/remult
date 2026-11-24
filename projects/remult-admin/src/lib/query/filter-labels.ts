import type { FieldUIInfo } from '../../../../core/server/remult-admin'
import { isValidYmd, operatorsFor, type FilterChip, type FilterOp } from './filter-model.js'

/** How many values an operator takes: none, one, two (between) or a list. */
export type Arity = 0 | 1 | 2 | 'list'

/** One entry of the operator menu; boolean `is true` / `is false` are `eq` with a fixed value. */
export type OpChoice = { id: string; op: FilterOp; label: string; arity: Arity; fixed?: boolean }

const REGEX_YMD_PARTS = /^(\d{4})-(\d{2})-(\d{2})$/

/** A plain date field (not a value list or relation stored as a date). */
export const isDate = (f: FieldUIInfo) => f.type === 'date' && !f.values.length && !f.relationToOne
export const isNumber = (f: FieldUIInfo) => f.type === 'number' && !f.values.length && !f.relationToOne

function label(f: FieldUIInfo, op: FilterOp): string {
  if (op === 'in') return 'is any of'
  if (op === 'nin') return 'is none of'
  if (op === 'empty') return 'is empty'
  if (op === 'notEmpty') return 'is not empty'
  if (op === 'between') return 'between'
  if (isDate(f)) {
    const date: Partial<Record<FilterOp, string>> = {
      eq: 'is',
      gt: 'after',
      gte: 'on or after',
      lt: 'before',
      lte: 'on or before',
    }
    if (date[op]) return date[op]
  }
  const other: Partial<Record<FilterOp, string>> = {
    eq: 'is',
    ne: 'is not',
    contains: 'contains',
    startsWith: 'starts with',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
  }
  return other[op] ?? op
}

function arityOf(op: FilterOp): Arity {
  if (op === 'empty' || op === 'notEmpty') return 0
  if (op === 'between') return 2
  if (op === 'in' || op === 'nin') return 'list'
  return 1
}

export function opChoices(f: FieldUIInfo): OpChoice[] {
  const out: OpChoice[] = []
  for (const op of operatorsFor(f)) {
    if (f.type === 'boolean' && op === 'eq') {
      out.push({ id: 'true', op, label: 'is true', arity: 0, fixed: true })
      out.push({ id: 'false', op, label: 'is false', arity: 0, fixed: false })
    } else out.push({ id: op, op, label: label(f, op), arity: arityOf(op) })
  }
  return out
}

/** The menu entry a chip stands for. */
export function choiceOf(f: FieldUIInfo, chip: Pick<FilterChip, 'op' | 'value'>): OpChoice | undefined {
  const all = opChoices(f)
  if (f.type === 'boolean' && chip.op === 'eq') return all.find((c) => c.fixed === chip.value)
  return all.find((c) => c.op === chip.op)
}

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' })

function ymdToDate(ymd: string) {
  const m = REGEX_YMD_PARTS.exec(ymd)!
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
}

/** `2026-11-01` -> `Nov 1, 2026` in the viewer's language. */
export function formatYmd(ymd: unknown): string {
  return isValidYmd(ymd) ? dateFormat.format(ymdToDate(ymd as string)) : String(ymd)
}

function formatYmdRange(a: unknown, b: unknown): string {
  if (!isValidYmd(a) || !isValidYmd(b)) return `${formatYmd(a)} - ${formatYmd(b)}`
  return dateFormat.formatRange(ymdToDate(a as string), ymdToDate(b as string))
}

/** Up to this many names, then `+N`. */
const LIST_MAX = 2

/** Human text of a chip's value(s); undefined for operators without one. */
export function valueText(
  f: FieldUIInfo,
  chip: FilterChip,
  captionOf: (id: unknown) => unknown = () => undefined,
): string | undefined {
  const choice = choiceOf(f, chip)
  const arity = choice?.arity ?? arityOf(chip.op)
  if (arity === 0) return undefined
  if (arity === 'list') {
    const ids = Array.isArray(chip.value) ? chip.value : []
    const names = ids.map((id) => {
      const known = f.values.find((v) => v.id === id)?.caption ?? captionOf(id)
      return known === undefined || known === null || known === '' ? String(id) : String(known)
    })
    if (names.length <= LIST_MAX + 1) return names.join(', ')
    return `${names.slice(0, LIST_MAX).join(', ')} +${names.length - LIST_MAX}`
  }
  if (isDate(f)) return arity === 2 ? formatYmdRange(chip.value, chip.value2) : formatYmd(chip.value)
  if (arity === 2) return `${chip.value} and ${chip.value2}`
  return isNumber(f) ? String(chip.value) : `"${chip.value}"`
}

/** A chip worth sending: every value its operator needs is there. */
export function isComplete(f: FieldUIInfo, chip: FilterChip): boolean {
  const choice = choiceOf(f, chip)
  if (!choice) return false
  const ok = (v: unknown) =>
    v !== undefined && v !== null && v !== '' && (!isDate(f) || isValidYmd(v)) && (!isNumber(f) || Number.isFinite(v))
  if (choice.arity === 0) return true
  if (choice.arity === 'list') return Array.isArray(chip.value) && chip.value.length > 0
  if (choice.arity === 2) return ok(chip.value) && ok(chip.value2)
  return ok(chip.value)
}

/** One chip per field and operator: the new one replaces its twin, in place. */
export function upsertChip(chips: FilterChip[], chip: FilterChip, replacing?: FilterChip): FilterChip[] {
  const same = (c: FilterChip) => c.field === chip.field && c.op === chip.op
  const i = replacing ? chips.indexOf(replacing) : chips.findIndex(same)
  const rest = chips.filter((c, j) => j !== i && !same(c))
  if (i < 0) return [...rest, chip]
  const at = chips.slice(0, i).filter((c) => !same(c)).length
  return [...rest.slice(0, at), chip, ...rest.slice(at)]
}
