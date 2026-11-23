import type { EntityFilter } from '../../../../core/index.js'
import type { FieldUIInfo } from '../../../../core/server/remult-admin'

export type FilterOp =
  | 'eq'
  | 'ne'
  | 'contains'
  | 'startsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'in'
  | 'nin'
  | 'empty'
  | 'notEmpty'

export interface FilterChip {
  field: string
  op: FilterOp
  value?: unknown
  value2?: unknown
}

export interface TableQuery {
  filters: FilterChip[]
  sort?: { field: string; dir: 'asc' | 'desc' }
  page: number
}

export const FILTER_OPS: readonly FilterOp[] = [
  'eq',
  'ne',
  'contains',
  'startsWith',
  'gt',
  'gte',
  'lt',
  'lte',
  'between',
  'in',
  'nin',
  'empty',
  'notEmpty',
]

export function operatorsFor(field: FieldUIInfo): FilterOp[] {
  let ops: FilterOp[]
  if (field.relationToOne || field.values.length > 0) ops = ['in', 'nin']
  else if (field.type === 'boolean') ops = ['eq']
  else if (field.type === 'number')
    ops = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between']
  else if (field.type === 'date')
    ops = ['eq', 'gt', 'gte', 'lt', 'lte', 'between']
  else if (field.type === 'json') ops = []
  else ops = ['eq', 'ne', 'contains', 'startsWith']
  return field.allowNull ? [...ops, 'empty', 'notEmpty'] : ops
}

function isTimestamp(f: FieldUIInfo) {
  return f.type === 'date' && f.inputType !== 'date'
}

const REGEX_YMD = /^(\d{4})-(\d{2})-(\d{2})$/

/** Real calendar date, no rollover (2026-02-30 is invalid). */
export function isValidYmd(ymd: unknown): boolean {
  const m = typeof ymd === 'string' ? REGEX_YMD.exec(ymd) : null
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const dt = new Date(Date.UTC(y, mo - 1, d))
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === mo - 1 &&
    dt.getUTCDate() === d
  )
}

function localDay(ymd: string, end: boolean): string {
  const m = REGEX_YMD.exec(ymd)!
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  return (
    end
      ? new Date(y, mo - 1, d, 23, 59, 59, 999)
      : new Date(y, mo - 1, d, 0, 0, 0, 0)
  ).toISOString()
}

function chipToFilter(chip: FilterChip, f: FieldUIInfo): Record<string, any> {
  const key = f.relationToOne ? f.valFieldKey : f.key
  const v = chip.value
  const ts = isTimestamp(f)
  const s = (x: unknown, end = false) => (ts ? localDay(String(x), end) : x)
  switch (chip.op) {
    case 'eq':
      return ts ? { [key]: { $gte: s(v), $lte: s(v, true) } } : { [key]: v }
    case 'ne':
      return { [key]: { $ne: v } }
    case 'contains':
      return { [key]: { $contains: v } }
    case 'startsWith':
      return { [key]: { $startsWith: v } }
    case 'gt':
      return { [key]: { $gt: s(v, true) } }
    case 'gte':
      return { [key]: { $gte: s(v) } }
    case 'lt':
      return { [key]: { $lt: s(v) } }
    case 'lte':
      return { [key]: { $lte: s(v, true) } }
    case 'between':
      return { [key]: { $gte: s(v), $lte: s(chip.value2, true) } }
    case 'in':
      return { [key]: { $in: v } }
    case 'nin':
      return { [key]: { $nin: v } }
    case 'empty':
      return { [key]: null }
    case 'notEmpty':
      return { [key]: { $ne: null } }
  }
}

const isOpObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x)

export function chipsToWhere(
  chips: FilterChip[],
  fields: FieldUIInfo[],
  // reserved: only local TZ is supported for now
  _now: { tz: 'local' } = { tz: 'local' },
): EntityFilter<any> {
  const where: Record<string, any> = {}
  const extra: Record<string, any>[] = []
  for (const chip of chips) {
    const f = fields.find((x) => x.key === chip.field)
    if (!f) continue
    if (
      f.type === 'date' &&
      ![chip.value, chip.value2].every((v) => v === undefined || isValidYmd(v))
    )
      continue
    const part = chipToFilter(chip, f)
    const key = Object.keys(part)[0]
    if (!(key in where)) where[key] = part[key]
    else if (isOpObject(where[key]) && isOpObject(part[key]))
      where[key] = { ...where[key], ...part[key] }
    // two plain-value conditions on one field: AND them
    else extra.push(part)
  }
  return extra.length ? { $and: [where, ...extra] } : where
}
