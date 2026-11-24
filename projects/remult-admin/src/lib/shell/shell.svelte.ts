import { MediaQuery } from 'svelte/reactivity'
import { hasToken } from '../core/god.svelte.js'

const REGEX_APPLE = /mac|iphone|ipad/i

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

// navigator.platform is deprecated; userAgentData is Chromium only
const platform =
  typeof navigator === 'undefined'
    ? ''
    : ((navigator as Navigator & { userAgentData?: { platform: string } })
        .userAgentData?.platform ?? navigator.userAgent)

export const modKey = REGEX_APPLE.test(platform) ? '⌘' : 'Ctrl'
