import { computed, ref, watch } from 'vue'
import { stepsData } from '../steps/index.js'

export type Framework = 'svelte' | 'vue' | 'react' | 'angular'

export interface UserPreferences {
  framework: Framework
  keyContext?: string
}

const DEFAULT_PREFERENCES: UserPreferences = {
  framework: 'react',
  keyContext: undefined,
}

const STORAGE_KEY = 'user-preferences'

export function useUserPreference() {
  const preferences = ref<UserPreferences>(
    JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') ??
      DEFAULT_PREFERENCES,
  )

  watch(
    preferences,
    (newPreferences) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences))
    },
    { deep: true },
  )

  const framework = computed({
    get: () => preferences.value.framework,
    set: (newFramework: Framework) => {
      const currentKeyContext = preferences.value.keyContext
      preferences.value.framework = newFramework

      const availableFiles = stepsData.flatMap((step) =>
        step.files.filter(
          (file) => file.framework === newFramework || !file.framework,
        ),
      )

      if (
        !availableFiles.some((file) => file.keyContext === currentKeyContext)
      ) {
        preferences.value.keyContext = availableFiles[0]?.keyContext
      }
    },
  })

  const keyContext = computed({
    get: () => preferences.value.keyContext,
    set: (newKeyContext: string) => {
      preferences.value.keyContext = newKeyContext
    },
  })

  return {
    preferences,
    framework,
    keyContext,
  }
}
