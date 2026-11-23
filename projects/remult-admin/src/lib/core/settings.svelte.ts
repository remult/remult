import type { AdminEditMode } from '../../../../core/server/remult-admin'

const KEY = 'RemultAdmin_2026_11'

export type Settings = {
  search: string
  displayCaption: boolean
  numberOfRows: number
  confirmDelete: boolean
  diagramLayout: 'grid-bfs' | 'grid-dfs' | 'line'
  keyForBearerAuth: string
  disableLiveQuery: boolean | undefined
  customHeaders: string
  theme: 'system' | 'light' | 'dark'
  editMode: Record<string, AdminEditMode>
  schemaPositions: Record<string, { x: number; y: number }>
  lastLocation: string
}

export type Session = { bearerAuth: string; forbiddenEntities: string[] }

const settingsDefaults = (): Settings => ({
  search: '',
  displayCaption: true,
  numberOfRows: 25,
  confirmDelete: true,
  diagramLayout: 'grid-dfs',
  keyForBearerAuth: '',
  disableLiveQuery: undefined,
  customHeaders: '',
  theme: 'system',
  editMode: {},
  schemaPositions: {},
  lastLocation: '/',
})

const sessionDefaults = (): Session => ({ bearerAuth: '', forbiddenEntities: [] })

// storage can be missing (tests), blocked (privacy mode) or full: never let it break the app
function read<T extends object>(storage: () => Storage, defaults: T): T {
  try {
    const parsed = JSON.parse(storage().getItem(KEY) ?? 'null')
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
      return { ...defaults, ...parsed }
  } catch {}
  return defaults
}

function write(storage: () => Storage, json: string) {
  try {
    storage().setItem(KEY, json)
  } catch {}
}

export const settings: Settings = $state(read(() => localStorage, settingsDefaults()))
export const session: Session = $state(read(() => sessionStorage, sessionDefaults()))

export function resetSettings(): void {
  Object.assign(settings, settingsDefaults())
}

$effect.root(() => {
  // stringify reads every property through the proxy, so nested changes re-run the effect
  $effect(() => write(() => localStorage, JSON.stringify(settings)))
  $effect(() => write(() => sessionStorage, JSON.stringify(session)))
})
