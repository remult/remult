import type { FieldUIInfo } from '../../../../core/server/remult-admin'
import {
  FILTER_OPS,
  operatorsFor,
  type FilterChip,
  type FilterOp,
  type TableQuery,
} from './filter-model.js'

const URL_OPS = new Set<string>(FILTER_OPS)

function parseValue(
  f: FieldUIInfo,
  raw: string,
): { ok: true; v: unknown } | { ok: false } {
  if (f.type === 'number' && !f.values.length && !f.relationToOne) {
    const n = Number(raw)
    return raw.trim() === '' || Number.isNaN(n)
      ? { ok: false }
      : { ok: true, v: n }
  }
  if (f.type === 'boolean') {
    return raw === 'true' || raw === 'false'
      ? { ok: true, v: raw === 'true' }
      : { ok: false }
  }
  return { ok: true, v: raw }
}

function parseList(raw: string): unknown[] | undefined {
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : undefined
  } catch {
    return undefined
  }
}

function splitKey(key: string, byKey: Map<string, FieldUIInfo>) {
  if (byKey.has(key)) return { field: key, op: 'eq' as FilterOp | 'null' }
  const i = key.lastIndexOf('.')
  if (i < 0) return undefined
  const suffix = key.slice(i + 1)
  const field = key.slice(0, i)
  if (suffix === 'null') return { field, op: 'null' as const }
  // plain `field=v` is eq, `between` is only ever a gte+lte pair
  if (suffix === 'eq' || suffix === 'between' || !URL_OPS.has(suffix))
    return undefined
  return { field, op: suffix as FilterOp }
}

export function parseQuery(
  params: URLSearchParams,
  fields: FieldUIInfo[],
): TableQuery {
  const byKey = new Map(fields.map((f) => [f.key, f]))
  const filters: FilterChip[] = []

  for (const [key, raw] of params) {
    if (key.startsWith('_')) continue
    const parts = splitKey(key, byKey)
    const f = parts && byKey.get(parts.field)
    if (!parts || !f) continue
    const allowed = operatorsFor(f)

    if (parts.op === 'null') {
      const op =
        raw === 'true' ? 'empty' : raw === 'false' ? 'notEmpty' : undefined
      if (op && allowed.includes(op)) filters.push({ field: f.key, op })
      continue
    }
    if (!allowed.includes(parts.op)) continue
    if (parts.op === 'in' || parts.op === 'nin') {
      const list = parseList(raw)
      if (list) filters.push({ field: f.key, op: parts.op, value: list })
      continue
    }
    const parsed = parseValue(f, raw)
    if (parsed.ok) filters.push({ field: f.key, op: parts.op, value: parsed.v })
  }

  // a gte+lte pair on the same field is one between chip
  const merged: FilterChip[] = []
  for (const chip of filters) {
    const f = byKey.get(chip.field)!
    if (chip.op === 'lte' && operatorsFor(f).includes('between')) {
      const gte = merged.find((c) => c.field === chip.field && c.op === 'gte')
      if (gte) {
        gte.op = 'between'
        gte.value2 = chip.value
        continue
      }
    }
    merged.push(chip)
  }

  const q: TableQuery = { filters: merged, page: 1 }
  const sort = params.get('_sort')
  if (sort && byKey.has(sort)) {
    q.sort = {
      field: sort,
      dir: params.get('_order') === 'desc' ? 'desc' : 'asc',
    }
  }
  const page = Number(params.get('_page'))
  if (Number.isInteger(page) && page > 1) q.page = page
  return q
}

const str = (v: unknown) => String(v)

export function serializeQuery(
  q: TableQuery,
  fields: FieldUIInfo[],
): URLSearchParams {
  const out = new URLSearchParams()
  const known = new Set(fields.map((f) => f.key))
  for (const c of q.filters) {
    if (!known.has(c.field)) continue
    switch (c.op) {
      case 'eq':
        out.append(c.field, str(c.value))
        break
      case 'between':
        out.append(`${c.field}.gte`, str(c.value))
        out.append(`${c.field}.lte`, str(c.value2))
        break
      case 'in':
      case 'nin':
        out.append(`${c.field}.${c.op}`, JSON.stringify(c.value ?? []))
        break
      case 'empty':
        out.append(`${c.field}.null`, 'true')
        break
      case 'notEmpty':
        out.append(`${c.field}.null`, 'false')
        break
      default:
        out.append(`${c.field}.${c.op}`, str(c.value))
    }
  }
  if (q.sort && known.has(q.sort.field)) {
    out.append('_sort', q.sort.field)
    out.append('_order', q.sort.dir)
  }
  if (q.page > 1) out.append('_page', String(q.page))
  return out
}
