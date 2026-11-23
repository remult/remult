import type { AdminDisplayOptions } from '../../core/server/remult-admin'

declare global {
  interface Window {
    optionsFromServer?: Pick<
      AdminDisplayOptions,
      'rootPath' | 'requireAuthToken' | 'disableLiveQuery'
    >
  }
}

export {}
