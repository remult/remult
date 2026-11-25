import type {
  AdminPermission,
  EntityUIInfo,
} from '../../../../core/server/remult-admin'

const REGEX_WORDS = /[\s._@-]+/

export type AccessState = 'yes' | 'no' | 'row'

export const PREFILTER_HINT =
  'apiPrefilter: the server narrows the rows you get'

export function accessState(p: AdminPermission): AccessState {
  return p === 'row' ? 'row' : p ? 'yes' : 'no'
}

const labels: Record<AccessState, string> = {
  yes: 'Yes',
  no: 'No',
  row: 'Function',
}

const hints: Record<AccessState, string> = {
  yes: 'Allowed',
  no: 'Not allowed',
  row: 'A function decides, row by row',
}

export function accessLabel(s: AccessState): string {
  return labels[s]
}

export function accessHint(s: AccessState): string {
  return hints[s]
}

export type AccessRow = {
  superKey: string
  key: string
  caption: string
  color?: string
  read: AccessState
  create: AccessState
  edit: AccessState
  delete: AccessState
  prefilter: boolean
}

export function accessRow(
  t: Pick<
    EntityUIInfo,
    'superKey' | 'key' | 'caption' | 'color' | 'permissions' | 'apiPrefilter'
  >,
  forbidden: readonly string[],
): AccessRow {
  return {
    superKey: t.superKey,
    key: t.key,
    caption: t.caption,
    color: t.color,
    // listed entities are readable unless a request was refused
    read: forbidden.includes(t.key) ? 'no' : 'yes',
    create: accessState(t.permissions.insert),
    edit: accessState(t.permissions.update),
    delete: accessState(t.permissions.delete),
    prefilter: !!t.apiPrefilter,
  }
}

export function initials(name: string | undefined): string {
  const words = (name ?? '').trim().split(REGEX_WORDS).filter(Boolean)
  if (!words.length) return '?'
  const picked = words.length === 1 ? [words[0]] : [words[0], words.at(-1)!]
  return picked.map((w) => [...w][0].toUpperCase()).join('')
}

const MAX_EXTRAS = 12
const MAX_VALUE = 80
const KNOWN_KEYS = new Set(['id', 'name', 'roles'])

function preview(v: unknown): string {
  let text: string
  if (typeof v === 'string') text = v
  else {
    try {
      text = JSON.stringify(v) ?? String(v)
    } catch {
      // cycles or BigInt: still show something
      text = String(v)
    }
  }
  return text.length > MAX_VALUE ? text.slice(0, MAX_VALUE - 1) + '…' : text
}

/** User keys beyond id/name/roles, as short display strings. */
export function userExtras(user: object | null | undefined): {
  entries: [string, string][]
  more: number
} {
  if (!user) return { entries: [], more: 0 }
  const all = Object.entries(user).filter(([k]) => !KNOWN_KEYS.has(k))
  return {
    entries: all.slice(0, MAX_EXTRAS).map(([k, v]) => [k, preview(v)]),
    more: Math.max(0, all.length - MAX_EXTRAS),
  }
}

export function userRoles(user: { roles?: unknown } | null | undefined) {
  const roles = user?.roles
  return Array.isArray(roles) ? roles.map(String) : []
}
