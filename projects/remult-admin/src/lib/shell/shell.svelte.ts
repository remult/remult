import { MediaQuery } from 'svelte/reactivity'
import { hasToken } from '../core/god.svelte.js'

const REGEX_APPLE = /Mac|iPhone|iPad/

class Shell {
  paletteOpen = $state(false)
  settingsOpen = $state(false)
  /** Small screens get the rail, whatever `settings.navCollapsed` says. */
  narrow = new MediaQuery('max-width: 720px')

  get tokenRequired() {
    return !!window.optionsFromServer?.requireAuthToken && !hasToken()
  }
}

export const shell = new Shell()

export function entityHref(superKey: string) {
  return `#/entity/${superKey}`
}

export const modKey = typeof navigator !== 'undefined' && REGEX_APPLE.test(navigator.platform) ? '⌘' : 'Ctrl'
